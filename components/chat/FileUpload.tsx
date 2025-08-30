'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, File, Image, Video, Music, FileText, Archive, Download, ZoomIn } from 'lucide-react'
import React, { useCallback, useState, useRef } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/progress'
import { logger } from '@/lib/logger'
import { chatStorage, ChatAttachment, FileUploadProgress } from '@/lib/supabase/chat-storage'
import { cn } from '@/lib/utils'

import { ImageLightbox } from './ImageLightbox'

interface FileUploadProps {
  messageId: string
  onFileUploaded?: (attachment: ChatAttachment) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  attachment?: ChatAttachment
  error?: string
}

export function FileUpload({
  messageId,
  onFileUploaded,
  onError,
  className,
  disabled = false
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />
    if (mimeType.includes('zip')) return <Archive className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled) return

    const fileArray = Array.from(files)

    // Validate files
    const validFiles = fileArray.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        onError?.(`File ${file.name} exceeds 50MB limit`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Create uploading file entries
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'uploading'
    }))

    setUploadingFiles(prev => [...prev, ...newUploadingFiles])

    // Start uploads
    for (const uploadingFile of newUploadingFiles) {
      try {
        const attachment = await chatStorage.uploadFile(uploadingFile.file, {
          messageId,
          onProgress: (progress: FileUploadProgress) => {
            setUploadingFiles(prev =>
              prev.map(f =>
                f.id === uploadingFile.id
                  ? { ...f, progress: progress.percentage }
                  : f
              )
            )
          },
          onComplete: (attachment: ChatAttachment) => {
            setUploadingFiles(prev =>
              prev.map(f =>
                f.id === uploadingFile.id
                  ? { ...f, status: 'completed', attachment, progress: 100 }
                  : f
              )
            )
            onFileUploaded?.(attachment)
          },
          onError: (error: Error) => {
            setUploadingFiles(prev =>
              prev.map(f =>
                f.id === uploadingFile.id
                  ? { ...f, status: 'error', error: error.message }
                  : f
              )
            )
            onError?.(error.message)
          }
        })
      } catch (error) {
        logger.error('File upload failed:', error)
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === uploadingFile.id
              ? { ...f, status: 'error', error: (error as Error).message }
              : f
          )
        )
      }
    }
  }, [messageId, onFileUploaded, onError, disabled])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
      // Reset input
      e.target.value = ''
    }
  }, [handleFiles])

  const removeUploadingFile = useCallback((id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  return (
    <div className={cn("space-y-2", className)}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
      />

      {/* Drop Zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200",
          "hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50",
          dragActive
            ? "border-purple-500 bg-purple-500/10"
            : "border-neutral-600 bg-neutral-800/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDrag}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
      >
        <div className="p-6 text-center">
          <Upload className={cn(
            "mx-auto h-8 w-8 mb-2 transition-colors",
            dragActive ? "text-purple-400" : "text-neutral-400"
          )} />
          <p className="text-sm text-neutral-300 mb-2">
            Drag and drop files here, or{' '}
            <button
              type="button"
              onClick={handleFileSelect}
              disabled={disabled}
              className="text-purple-400 hover:text-purple-300 underline"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-neutral-500">
            Supports images, videos, audio, documents, and archives up to 50MB
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadingFiles.map((uploadingFile) => (
          <motion.div
            key={uploadingFile.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-neutral-800 rounded-lg p-3"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getFileIcon(uploadingFile.file.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-neutral-200 truncate">
                    {uploadingFile.file.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        uploadingFile.status === 'completed' ? 'default' :
                        uploadingFile.status === 'error' ? 'destructive' :
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {uploadingFile.status === 'completed' ? 'Complete' :
                       uploadingFile.status === 'error' ? 'Error' :
                       'Uploading'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadingFile(uploadingFile.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>{chatStorage.constructor.formatFileSize(uploadingFile.file.size)}</span>
                  {uploadingFile.status === 'uploading' && (
                    <span>{uploadingFile.progress.toFixed(0)}%</span>
                  )}
                </div>

                {uploadingFile.status === 'uploading' && (
                  <Progress
                    value={uploadingFile.progress}
                    className="mt-2 h-1"
                  />
                )}

                {uploadingFile.status === 'error' && uploadingFile.error && (
                  <p className="mt-1 text-xs text-red-400">
                    {uploadingFile.error}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Quick Upload Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleFileSelect}
        disabled={disabled}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        Choose Files
      </Button>
    </div>
  )
}

/**
 * File Attachment Display Component
 */
interface FileAttachmentProps {
  attachment: ChatAttachment
  onRemove?: () => void
  showRemove?: boolean
  onClick?: () => void
  className?: string
}

export function FileAttachment({
  attachment,
  onRemove,
  showRemove = false,
  onClick,
  className
}: FileAttachmentProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)

  // Load file URL for display
  React.useEffect(() => {
    if (attachment.file_type === 'image') {
      setLoading(true)

      // Load both full size and thumbnail
      Promise.all([
        chatStorage.getFileUrl(attachment.storage_path),
        chatStorage.generateThumbnail(attachment.id, 300)
      ]).then(([fullUrl, thumbUrl]) => {
        setImageUrl(fullUrl)
        setThumbnailUrl(thumbUrl || fullUrl)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [attachment])

  const handleDownload = async () => {
    try {
      const url = await chatStorage.getFileUrl(attachment.storage_path)
      if (url) {
        const link = document.createElement('a')
        link.href = url
        link.download = attachment.file_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      logger.error('Failed to download file:', error)
    }
  }

  const handleImageClick = () => {
    if (onClick) {
      onClick()
    } else if (attachment.file_type === 'image') {
      setShowLightbox(true)
    }
  }

  return (
    <>
      <div className={cn(
        "bg-neutral-800 rounded-lg overflow-hidden",
        attachment.file_type === 'image' ? "p-0" : "p-3",
        "max-w-sm cursor-pointer transition-all duration-200 hover:bg-neutral-700",
        className
      )}>
        {attachment.file_type === 'image' && (thumbnailUrl || imageUrl) ? (
          <div className="space-y-0">
            <div className="relative group" onClick={handleImageClick}>
              {loading ? (
                <div className="w-full h-48 bg-neutral-700 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <img
                    src={thumbnailUrl || imageUrl}
                    alt={attachment.file_name}
                    className={cn(
                      "w-full rounded-t-lg object-cover transition-transform duration-200",
                      "group-hover:scale-105",
                      attachment.height && attachment.width
                        ? attachment.height > attachment.width
                          ? "max-h-80"
                          : "max-h-48"
                        : "max-h-48"
                    )}
                    loading="lazy"
                    style={{
                      aspectRatio: attachment.width && attachment.height
                        ? `${attachment.width}/${attachment.height}`
                        : 'auto'
                    }}
                  />
                  {/* Image overlay with info */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-t-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-black/60 rounded-full p-2">
                        <ZoomIn className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {showRemove && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove?.()
                  }}
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-80 hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 truncate font-medium">
                  {attachment.file_name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500 mt-1">
                <span>
                  {attachment.width && attachment.height && (
                    <>{attachment.width} × {attachment.height} • </>
                  )}
                  {chatStorage.constructor.formatFileSize(attachment.file_size)}
                </span>
              </div>
            </div>
          </div>
        ) : (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getFileIcon(attachment.mime_type)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-200 truncate">
              {attachment.file_name}
            </p>
            <p className="text-xs text-neutral-400">
              {chatStorage.constructor.formatFileSize(attachment.file_size)}
            </p>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-6 w-6 p-0"
            >
              <Upload className="h-3 w-3" />
            </Button>
            {showRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {attachment.file_type === 'image' && imageUrl && (
        <ImageLightbox
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          attachment={attachment}
          imageUrl={imageUrl}
        />
      )}
    </>
  )

  function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-400" />
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4 text-purple-400" />
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4 text-green-400" />
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4 text-red-400" />
    if (mimeType.includes('zip')) return <Archive className="h-4 w-4 text-orange-400" />
    return <File className="h-4 w-4 text-neutral-400" />
  }
}
