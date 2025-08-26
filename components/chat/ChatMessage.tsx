'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MoreVertical, Reply, Trash2, Edit3, Heart, ThumbsUp, Smile } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChatMessageWithSender } from '@/lib/supabase/types'
import { useMessageReaction } from '@/lib/hooks/useChat'
import { FileAttachment } from './FileUpload'
import { chatStorage, ChatAttachment } from '@/lib/supabase/chat-storage'

interface ChatMessageProps {
  message: ChatMessageWithSender
  isOwn: boolean
  isGrouped?: boolean
  onReply: () => void
  className?: string
}

export function ChatMessage({
  message,
  isOwn,
  isGrouped = false,
  onReply,
  className
}: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const { addReaction, removeReaction, isLoading: isReactionLoading } = useMessageReaction(message.id)

  // Load attachments if message has them
  useEffect(() => {
    if (message.has_attachments) {
      setLoadingAttachments(true)
      chatStorage.getMessageAttachments(message.id)
        .then(setAttachments)
        .finally(() => setLoadingAttachments(false))
    }
  }, [message.id, message.has_attachments])

  // Group reactions by emoji
  const reactionGroups = message.reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction)
    return acc
  }, {} as Record<string, typeof message.reactions>)

  const handleReaction = (emoji: string) => {
    const existingReaction = message.reactions.find(r => r.user.id === message.sender_id && r.emoji === emoji)
    
    if (existingReaction) {
      removeReaction(emoji)
    } else {
      addReaction(emoji)
    }
  }

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  const getMessageTypeIcon = () => {
    switch (message.message_type) {
      case 'achievement':
        return '🏆'
      case 'system':
        return 'ℹ️'
      case 'image':
        return '🖼️'
      case 'file':
        return '📎'
      default:
        return null
    }
  }

  const getMessageBubbleStyles = () => {
    if (isOwn) {
      return cn(
        "bg-gradient-to-br from-purple-600 to-purple-700",
        "text-white ml-auto max-w-[75%]"
      )
    }
    
    return cn(
      "bg-neutral-800 text-white mr-auto max-w-[75%]",
      "border border-neutral-700"
    )
  }

  return (
    <div
      className={cn(
        "group relative",
        isOwn ? "flex justify-end" : "flex justify-start",
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={cn(
        "relative flex flex-col",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender Info (only show if not grouped or not own message) */}
        {!isGrouped && !isOwn && (
          <div className="flex items-center space-x-2 mb-1 px-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs font-bold text-white">
              {message.sender.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-neutral-300">
              {message.sender.name}
            </span>
            <span className="text-xs text-neutral-500">
              {formatTime(message.created_at)}
            </span>
          </div>
        )}

        {/* Reply Context */}
        {message.reply_to && (
          <div className={cn(
            "mb-2 p-2 rounded-md bg-neutral-800/50 border-l-2 border-neutral-600",
            "text-xs text-neutral-400 max-w-md",
            isOwn ? "ml-auto" : "mr-auto"
          )}>
            <p className="font-medium text-neutral-300">
              {message.reply_to.sender.name}
            </p>
            <p className="truncate">
              {message.reply_to.content}
            </p>
          </div>
        )}

        {/* Message Bubble */}
        <div className={cn(
          "relative px-4 py-2 rounded-2xl shadow-sm",
          getMessageBubbleStyles()
        )}>
          {/* Message Type Icon */}
          {getMessageTypeIcon() && (
            <span className="inline-block mr-2 text-sm">
              {getMessageTypeIcon()}
            </span>
          )}

          {/* Message Content */}
          {message.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* File Attachments */}
          {(message.has_attachments || attachments.length > 0) && (
            <div className="mt-2 space-y-2">
              {loadingAttachments ? (
                <div className="flex items-center space-x-2 text-xs text-neutral-400">
                  <div className="w-3 h-3 border border-neutral-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading attachments...</span>
                </div>
              ) : (
                attachments.map((attachment) => (
                  <FileAttachment
                    key={attachment.id}
                    attachment={attachment}
                    showRemove={false}
                    className="max-w-xs"
                  />
                ))
              )}
            </div>
          )}

          {/* Edited Indicator */}
          {message.edited_at && (
            <span className="text-xs opacity-60 ml-2">
              (edited)
            </span>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: showActions ? 1 : 0,
              scale: showActions ? 1 : 0.8
            }}
            className={cn(
              "absolute top-0 transform -translate-y-full flex items-center space-x-1",
              "bg-neutral-800 rounded-lg border border-neutral-700 px-1 py-1 shadow-lg",
              isOwn ? "right-0" : "left-0"
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction('👍')}
              disabled={isReactionLoading}
              className="h-6 w-6 p-0 text-neutral-400 hover:text-white"
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction('❤️')}
              disabled={isReactionLoading}
              className="h-6 w-6 p-0 text-neutral-400 hover:text-white"
            >
              <Heart className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReply}
              className="h-6 w-6 p-0 text-neutral-400 hover:text-white"
            >
              <Reply className="h-3 w-3" />
            </Button>
            {isOwn && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-neutral-400 hover:text-white"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            )}
          </motion.div>
        </div>

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 px-3">
            {Object.entries(reactionGroups).map(([emoji, reactions]) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => handleReaction(emoji)}
                disabled={isReactionLoading}
                className={cn(
                  "h-6 px-2 py-1 rounded-full bg-neutral-800 border border-neutral-700",
                  "text-xs hover:bg-neutral-700 transition-colors",
                  "flex items-center space-x-1"
                )}
              >
                <span>{emoji}</span>
                <span className="text-neutral-400">{reactions.length}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Timestamp (for grouped messages) */}
        {isGrouped && isOwn && (
          <span className="text-xs text-neutral-500 mt-1 px-3">
            {formatTime(message.created_at)}
          </span>
        )}
      </div>
    </div>
  )
}