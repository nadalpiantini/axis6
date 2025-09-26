'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreVertical, Reply, Trash2, Edit3 } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useIntersection } from '@/lib/hooks/useIntersection'
import { ChatMessageWithSender } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { ChatMessage } from './ChatMessage'
interface ChatMessageListProps {
  messages: ChatMessageWithSender[]
  currentUserId: string
  onReply: (message: ChatMessageWithSender) => void
  onLoadMore: () => void
  isLoading: boolean
  hasMore: boolean
  className?: string
}
export function ChatMessageList({
  messages,
  currentUserId,
  onReply,
  onLoadMore,
  isLoading,
  hasMore,
  className
}: ChatMessageListProps) {
  const topRef = useRef<HTMLDivElement>(null)
  const isIntersecting = useIntersection(topRef, { threshold: 0.1 })
  // Load more messages when scrolling to top
  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      onLoadMore()
    }
  }, [isIntersecting, hasMore, isLoading, onLoadMore])
  return (
    <ScrollArea
      className={cn(
        "flex-1 px-4 py-2",
        "scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-transparent",
        className
      )}
    >
      {/* Load More Indicator */}
      {hasMore && (
        <div ref={topRef} className="flex justify-center py-4">
          {isLoading ? (
            <div className="flex items-center space-x-2 text-sm text-neutral-400">
              <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading messages...</span>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Load previous messages
            </Button>
          )}
        </div>
      )}
      {/* Messages */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const previousMessage = messages[index - 1]
            const isGrouped =
              previousMessage &&
              previousMessage.sender_id === message.sender_id &&
              new Date(message.created_at).getTime() - new Date(previousMessage.created_at).getTime() < 5 * 60 * 1000 // 5 minutes
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  !isGrouped && "mt-6"
                )}
              >
                <ChatMessage
                  message={message}
                  isOwn={message.sender_id === currentUserId}
                  isGrouped={isGrouped}
                  onReply={() => onReply(message)}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
        {/* Empty State */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
              <Reply className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No messages yet
            </h3>
            <p className="text-sm text-neutral-400 max-w-sm">
              Be the first to start the conversation! Send a message to get things rolling.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
