'use client'
import { motion } from 'framer-motion'
import { Camera, Upload, X, User, Check, Loader2 } from 'lucide-react'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

interface ProfileImageUploadProps {
  userId: string
  currentImageUrl?: string | null
  onImageUploaded?: (imageUrl: string) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
  success: boolean
}

export function ProfileImageUpload({
  userId,
  currentImageUrl,
  onImageUploaded,
  onError,
  className,
  disabled = false
}: ProfileImageUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    success: false
  })
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Update preview when currentImageUrl changes
  useEffect(() => {
    setPreviewUrl(currentImageUrl || null)
  }, [currentImageUrl])

  const validateImageFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadState(prev => ({ ...prev, error: 'Please select an image file' }))
      return false
    }

    // Check file size (max 5MB for profile images)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadState(prev => ({ ...prev, error: 'Image must be less than 5MB' }))
      return false
    }

    // Check image dimensions
    return new Promise<boolean>((resolve) => {
      const img = new Image()
      img.onload = () => {
        const { width, height } = img
        if (width < 100 || height < 100) {
          setUploadState(prev => ({ ...prev, error: 'Image must be at least 100x100 pixels' }))
          resolve(false)
        } else {
          resolve(true)
        }
      }
      img.onerror = () => {
        setUploadState(prev => ({ ...prev, error: 'Invalid image file' }))
        resolve(false)
      }
      img.src = URL.createObjectURL(file)
    }) as any
  }

  const uploadImage = useCallback(async (file: File) => {
    if (disabled || !userId) return

    // Reset state
    setUploadState({
      uploading: true,
      progress: 0,
      error: null,
      success: false
    })

    try {
      // Validate file first
      if (!validateImageFile(file)) {
        return
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `profile_${userId}_${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting
        })

      if (uploadError) {
        throw uploadError
      }

      setUploadState(prev => ({ ...prev, progress: 50 }))

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL')
      }

      setUploadState(prev => ({ ...prev, progress: 75 }))

      // Update user profile with image URL
      const { error: updateError } = await supabase
        .from('axis6_profiles')
        .upsert({
          id: userId,
          profile_image_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (updateError) {
        logger.error('Failed to update profile with image URL:', updateError)
        throw updateError
      }

      // Success!
      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        success: true
      })

      setPreviewUrl(urlData.publicUrl)
      onImageUploaded?.(urlData.publicUrl)

      // Clear success state after 2 seconds
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, success: false }))
      }, 2000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      logger.error('Profile image upload error:', error)
      
      setUploadState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        success: false
      })
      
      onError?.(errorMessage)
    }
  }, [userId, disabled, onImageUploaded, onError, supabase])

  const handleFileSelect = useCallback(() => {
    if (disabled || uploadState.uploading) return
    fileInputRef.current?.click()
  }, [disabled, uploadState.uploading])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview immediately
    const previewUrl = URL.createObjectURL(file)
    setPreviewUrl(previewUrl)

    // Start upload
    uploadImage(file)

    // Reset input
    e.target.value = ''
  }, [uploadImage])

  const handleRemoveImage = useCallback(async () => {
    if (disabled || uploadState.uploading) return

    try {
      // Update profile to remove image
      const { error } = await supabase
        .from('axis6_profiles')
        .update({
          profile_image_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      setPreviewUrl(null)
      onImageUploaded?.(null as any)
      
    } catch (error) {
      logger.error('Failed to remove profile image:', error)
      onError?.('Failed to remove image')
    }
  }, [userId, disabled, uploadState.uploading, onImageUploaded, onError, supabase])

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploadState.uploading}
      />

      {/* Profile Image Display */}
      <div className="relative">
        <motion.div
          className={cn(
            "w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 bg-gradient-to-br from-purple-500/20 to-pink-500/20",
            "flex items-center justify-center transition-all duration-300",
            uploadState.uploading && "animate-pulse",
            !disabled && !uploadState.uploading && "cursor-pointer hover:border-purple-400/50"
          )}
          onClick={handleFileSelect}
          whileHover={!disabled && !uploadState.uploading ? { scale: 1.02 } : undefined}
          whileTap={!disabled && !uploadState.uploading ? { scale: 0.98 } : undefined}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}

          {/* Upload Overlay */}
          {uploadState.uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-6 h-6 text-white animate-spin mx-auto mb-2" />
                <div className="text-xs text-white font-medium">
                  {Math.round(uploadState.progress)}%
                </div>
              </div>
            </div>
          )}

          {/* Success Overlay */}
          {uploadState.success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-green-500/80 flex items-center justify-center"
            >
              <Check className="w-8 h-8 text-white" />
            </motion.div>
          )}

          {/* Camera Overlay on Hover */}
          {!uploadState.uploading && !disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
        </motion.div>

        {/* Remove Button */}
        {previewUrl && !uploadState.uploading && !disabled && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleFileSelect}
        disabled={disabled || uploadState.uploading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium",
          "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
          "hover:shadow-lg hover:shadow-purple-500/25",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
          uploadState.uploading && "cursor-not-allowed"
        )}
      >
        {uploadState.uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            {previewUrl ? 'Change Photo' : 'Upload Photo'}
          </>
        )}
      </button>

      {/* Error Message */}
      {uploadState.error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
        >
          {uploadState.error}
        </motion.div>
      )}

      {/* Upload Guidelines */}
      <div className="text-xs text-gray-400 text-center max-w-xs">
        <p>Upload a square image for best results.</p>
        <p>Maximum size: 5MB • Minimum: 100x100px</p>
        <p>Supported formats: JPG, PNG, WebP</p>
      </div>
    </div>
  )
}