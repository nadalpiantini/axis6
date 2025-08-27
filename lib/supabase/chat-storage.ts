/**
 * Chat File Storage Service
 * Handles file uploads, downloads, and management for chat system
 */

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

export interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface ChatAttachment {
  id: string
  message_id: string
  user_id: string
  file_name: string
  file_size: number
  file_type: 'image' | 'video' | 'audio' | 'document' | 'file'
  mime_type: string
  storage_path: string
  upload_status: 'pending' | 'uploaded' | 'processing' | 'ready' | 'error'
  thumbnail_path?: string
  width?: number
  height?: number
  duration?: number
  created_at: string
  updated_at: string
}

export interface FileUploadOptions {
  messageId: string
  onProgress?: (progress: FileUploadProgress) => void
  onComplete?: (attachment: ChatAttachment) => void
  onError?: (error: Error) => void
}

export class ChatStorageService {
  private supabase = createClient()
  private readonly BUCKET_NAME = 'chat-files'
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  
  /**
   * Upload a file to chat storage
   */
  async uploadFile(file: File, options: FileUploadOptions): Promise<ChatAttachment> {
    try {
      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error(`File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`)
      }

      // Validate file type
      if (!this.isAllowedFileType(file.type)) {
        throw new Error(`File type ${file.type} is not allowed`)
      }

      // Initialize upload in database
      const { data: initData, error: initError } = await this.supabase
        .rpc('initialize_file_upload', {
          p_message_id: options.messageId,
          p_file_name: file.name,
          p_file_size: file.size,
          p_mime_type: file.type
        })

      if (initError) {
        logger.error('Failed to initialize file upload:', initError)
        throw new Error('Failed to initialize file upload')
      }

      const { attachment_id, storage_path } = initData as {
        attachment_id: string
        storage_path: string
      }

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(storage_path, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        logger.error('File upload failed:', uploadError)
        
        // Update attachment status to error
        await this.updateAttachmentStatus(attachment_id, 'error')
        throw new Error('File upload failed')
      }

      // Extract file metadata for supported types
      const metadata = await this.extractFileMetadata(file)

      // Finalize upload in database
      const { error: finalizeError } = await this.supabase
        .rpc('finalize_file_upload', {
          p_attachment_id: attachment_id,
          p_width: metadata.width,
          p_height: metadata.height,
          p_duration: metadata.duration
        })

      if (finalizeError) {
        logger.error('Failed to finalize file upload:', finalizeError)
        throw new Error('Failed to finalize file upload')
      }

      // Get the complete attachment record
      const attachment = await this.getAttachment(attachment_id)
      if (!attachment) {
        throw new Error('Failed to retrieve attachment after upload')
      }

      options.onComplete?.(attachment)
      return attachment

    } catch (error) {
      const err = error as Error
      logger.error('File upload error:', err)
      options.onError?.(err)
      throw err
    }
  }

  /**
   * Get attachment by ID
   */
  async getAttachment(attachmentId: string): Promise<ChatAttachment | null> {
    const { data, error } = await this.supabase
      .from('axis6_chat_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single()

    if (error) {
      logger.error('Failed to get attachment:', error)
      return null
    }

    return data
  }

  /**
   * Get attachments for a message
   */
  async getMessageAttachments(messageId: string): Promise<ChatAttachment[]> {
    const { data, error } = await this.supabase
      .from('axis6_chat_attachments')
      .select('*')
      .eq('message_id', messageId)
      .eq('upload_status', 'ready')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Failed to get message attachments:', error)
      return []
    }

    return data || []
  }

  /**
   * Get public URL for a file
   */
  async getFileUrl(storagePath: string): Promise<string | null> {
    try {
      const { data } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(storagePath, 3600) // 1 hour expiry

      return data?.signedUrl || null
    } catch (error) {
      logger.error('Failed to get file URL:', error)
      return null
    }
  }

  /**
   * Delete a file attachment
   */
  async deleteAttachment(attachmentId: string): Promise<boolean> {
    try {
      // Get attachment info
      const attachment = await this.getAttachment(attachmentId)
      if (!attachment) {
        return false
      }

      // Soft delete in database
      const { error: dbError } = await this.supabase
        .from('axis6_chat_attachments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', attachmentId)

      if (dbError) {
        logger.error('Failed to delete attachment from database:', dbError)
        return false
      }

      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .remove([attachment.storage_path])

      if (storageError) {
        logger.warn('Failed to delete file from storage:', storageError)
        // Don't fail the operation - database delete succeeded
      }

      return true
    } catch (error) {
      logger.error('Failed to delete attachment:', error)
      return false
    }
  }

  /**
   * Generate thumbnail for images
   */
  async generateThumbnail(attachmentId: string, maxSize = 300): Promise<string | null> {
    try {
      const attachment = await this.getAttachment(attachmentId)
      if (!attachment || attachment.file_type !== 'image') {
        return null
      }

      const thumbnailPath = attachment.storage_path.replace(
        attachment.file_name,
        `thumb_${maxSize}_${attachment.file_name}`
      )

      // For now, return a transformation URL
      // In production, you might want to generate actual thumbnails
      const { data } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(attachment.storage_path, 3600, {
          transform: {
            width: maxSize,
            height: maxSize,
            resize: 'contain'
          }
        })

      return data?.signedUrl || null
    } catch (error) {
      logger.error('Failed to generate thumbnail:', error)
      return null
    }
  }

  /**
   * Get file storage statistics
   */
  async getStorageStats(roomId?: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_chat_file_stats', { p_room_id: roomId })

      if (error) {
        logger.error('Failed to get storage stats:', error)
        return null
      }

      return data
    } catch (error) {
      logger.error('Failed to get storage stats:', error)
      return null
    }
  }

  /**
   * Private helper methods
   */

  private async updateAttachmentStatus(
    attachmentId: string, 
    status: ChatAttachment['upload_status']
  ): Promise<void> {
    const { error } = await this.supabase
      .from('axis6_chat_attachments')
      .update({ upload_status: status })
      .eq('id', attachmentId)

    if (error) {
      logger.error('Failed to update attachment status:', error)
    }
  }

  private isAllowedFileType(mimeType: string): boolean {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Videos
      'video/mp4', 'video/webm', 'video/quicktime',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
      // Documents
      'application/pdf', 'text/plain', 'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Archives
      'application/zip', 'application/x-zip-compressed'
    ]

    return allowedTypes.includes(mimeType)
  }

  private async extractFileMetadata(file: File): Promise<{
    width?: number
    height?: number
    duration?: number
  }> {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const img = new Image()
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height
          })
        }
        img.onerror = () => resolve({})
        img.src = URL.createObjectURL(file)
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.onloadedmetadata = () => {
          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            duration: Math.floor(video.duration)
          })
        }
        video.onerror = () => resolve({})
        video.src = URL.createObjectURL(file)
      } else if (file.type.startsWith('audio/')) {
        const audio = document.createElement('audio')
        audio.onloadedmetadata = () => {
          resolve({
            duration: Math.floor(audio.duration)
          })
        }
        audio.onerror = () => resolve({})
        audio.src = URL.createObjectURL(file)
      } else {
        resolve({})
      }
    })
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`
  }

  /**
   * Get file type icon
   */
  static getFileTypeIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType === 'application/pdf') return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('sheet')) return '📊'
    if (mimeType.includes('presentation')) return '📽️'
    if (mimeType.includes('zip')) return '🗜️'
    return '📎'
  }
}

// Singleton instance
export const chatStorage = new ChatStorageService()