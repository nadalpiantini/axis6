'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Image, Smile, Plus, X } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'

import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/textarea'
import { mentionsService, MentionUser } from '@/lib/services/mentions-service'
import { ChatAttachment } from '@/lib/supabase/chat-storage'
import { cn } from '@/lib/utils'
import { handleError, handleFileError } from '@/lib/error/standardErrorHandler'

import { FileUpload, FileAttachment } from './FileUpload'
import { MentionInput } from './MentionInput'

interface ChatComposerProps {
  onSendMessage: (
    content: string,
    messageType?: 'text' | 'image' | 'file' | 'achievement',
    attachments?: ChatAttachment[]
  ) => void
  onTypingStart: () => void
  onTypingStop: () => void
  isLoading: boolean
  placeholder?: string
  messageId?: string // Required for file uploads
  roomId?: string // Required for mentions
  className?: string
}

export function ChatComposer({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  isLoading,
  placeholder = "Type a message...",
  messageId,
  roomId,
  className
}: ChatComposerProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [mentions, setMentions] = useState<any[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)  }px`
    }
  }, [message])

  // Handle typing events
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Trigger typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      onTypingStart()
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      onTypingStop()
    }, 1000)
  }

  // Handle mentions
  const handleMentionSelect = (user: MentionUser, range: { start: number; end: number }) => {
    // Track mentions for notification purposes
    setMentions(prev => [...prev, user])
  }

  // Handle file uploads
  const handleFileUploaded = (attachment: ChatAttachment) => {
    setAttachments(prev => [...prev, attachment])
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId))
  }

  const handleImageSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*'
      fileInputRef.current.click()
    }
  }

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = '*'
      fileInputRef.current.click()
    }
  }

  // Handle send message
  const handleSend = async () => {
    const trimmedMessage = message.trim()
    const hasContent = trimmedMessage || attachments.length > 0

    if (!hasContent || isLoading) return

    // Process mentions if room ID is available
    let processedMessage = trimmedMessage
    if (roomId && trimmedMessage.includes('@')) {
      try {
        const mentionResult = await mentionsService.resolveMentions(trimmedMessage, roomId)
        processedMessage = mentionResult.text

        // Store resolved mentions for notifications
        const mentionedUserIds = mentionsService.extractMentionedUserIds(mentionResult.mentions)
        // These can be passed to the parent component for notification handling
      } catch (error) {
        handleError(error, {
      operation: 'process_mentions', component: 'ChatComposer',
          level: 'warning',
          userMessage: 'Mentions may not work properly',
          showToast: false, // Don't interrupt chat flow
          context: { messageLength: trimmedMessage.length }
        })
      }
    }

    const messageType = attachments.length > 0 ? 'file' : 'text'
    onSendMessage(processedMessage || '', messageType, attachments)

    setMessage('')
    setAttachments([])
    setMentions([])
    setIsTyping(false)
    setShowFileUpload(false)
    onTypingStop()

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const canSend = (message.trim() || attachments.length > 0) && !isLoading

  return (
    <div className={cn("space-y-3", className)}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && messageId) {
            // Trigger file upload logic here
            setShowFileUpload(true)
          }
        }}
      />

      {/* File Upload Panel */}
      <AnimatePresence>
        {showFileUpload && messageId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-neutral-800/50 rounded-lg border border-neutral-700 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-neutral-200">
                Attach Files
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <FileUpload
              messageId={messageId}
              onFileUploaded={handleFileUploaded}
              onError={(error) => {
                handleFileError(error, {
                  operationType: 'upload',
                  component: 'ChatComposer',
                  userMessage: 'File upload failed. Please try a smaller file.'
                })
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-neutral-300">
              Attachments ({attachments.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <FileAttachment
                  key={attachment.id}
                  attachment={attachment}
                  onRemove={() => handleRemoveAttachment(attachment.id)}
                  showRemove={true}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Composer */}
      <div
        className={cn(
          "relative flex items-end space-x-2",
          "bg-neutral-900/50 rounded-lg border border-neutral-700",
          "p-3 transition-all duration-200",
          "focus-within:border-purple-500 focus-within:bg-neutral-800/50"
        )}
      >
        {/* Attachment Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFileUpload(!showFileUpload)}
          className="h-8 w-8 p-0 text-neutral-400 hover:text-white flex-shrink-0"
          disabled={isLoading || !messageId}
        >
          <Plus className="h-4 w-4" />
        </Button>

        {/* Text Input with Mentions */}
        <div className="flex-1 min-w-0">
          {roomId ? (
            <MentionInput
              value={message}
              onChange={setMessage}
              onMentionSelect={handleMentionSelect}
              roomId={roomId}
              placeholder={placeholder}
              disabled={isLoading}
              className="w-full"
            />
          ) : (
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className={cn(
                "min-h-[40px] max-h-[120px] resize-none",
                "bg-transparent border-0 p-0 focus:ring-0",
                "text-white placeholder:text-neutral-500",
                "scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-transparent"
              )}
              rows={1}
            />
          )}
        </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
          disabled={isLoading}
        >
          <Smile className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleImageSelect}
          className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
          disabled={isLoading || !messageId}
        >
          <Image className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleFileSelect}
          className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
          disabled={isLoading || !messageId}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Send Button */}
        <motion.div
          animate={{
            scale: canSend ? 1 : 0.9,
            opacity: canSend ? 1 : 0.5
          }}
          transition={{ duration: 0.15 }}
        >
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="sm"
            className={cn(
              "h-8 w-8 p-0 ml-2 rounded-full",
              "bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700",
              "text-white transition-all duration-200",
              canSend && "shadow-lg shadow-purple-600/25"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-900/50 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      </div>
    </div>
  )
}
