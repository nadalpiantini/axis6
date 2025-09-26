'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MoreVertical, Users, Hash, Phone, Video, Settings } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { animations } from '@/lib/design-system/theme'
import {
  useChatRoom,
  useChatMessages,
  useSendMessage,
  useTypingIndicator
} from '@/lib/hooks/useChat'
import { ChatRoomWithParticipants, ChatMessageWithSender } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { ChatComposer } from './ChatComposer'
import { ChatHeader } from './ChatHeader'
import { ChatMessageList } from './ChatMessageList'
import { ChatParticipants } from './ChatParticipants'
import { TypingIndicator } from './TypingIndicator'
import { handleError } from '@/lib/error/standardErrorHandler'
interface ChatRoomProps {
  room: ChatRoomWithParticipants
  userId: string
  onClose?: () => void
  className?: string
}
export function ChatRoom({ room, userId, onClose, className }: ChatRoomProps) {
  const [showParticipants, setShowParticipants] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState<ChatMessageWithSender | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Chat hooks
  const {
    isConnected,
    typingUsers,
    onlineUsers,
    sendTyping
  } = useChatRoom(room.id, userId)
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useChatMessages(room.id)
  const sendMessage = useSendMessage(room.id)
  const { startTyping, stopTyping } = useTypingIndicator(room.id)
  // Flatten messages from pages
  const messages = messagesData?.pages.flatMap(page => page.data) || []
  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])
  // Handle message send
  const handleSendMessage = async (content: string, messageType?: 'text' | 'image' | 'file' | 'achievement') => {
    if (!content.trim()) return
    try {
      await sendMessage.mutateAsync({
        content: content.trim(),
        messageType,
        replyToId: replyToMessage?.id
      })
      setReplyToMessage(null)
      stopTyping()
    } catch (error) {
      handleError(error, {
      operation: 'chat_operation', component: 'ChatRoom',
        userMessage: 'Chat operation failed. Please try again.'
      })
    }
  }
  // Handle typing events
  const handleTypingStart = () => {
    startTyping()
  }
  const handleTypingStop = () => {
    stopTyping()
  }
  return (
    <Card
      className={cn(
        "flex flex-col h-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950",
        "border-neutral-800 shadow-2xl",
        className
      )}
    >
      {/* Chat Header */}
      <ChatHeader
        room={room}
        isConnected={isConnected}
        onlineCount={onlineUsers.length}
        onToggleParticipants={() => setShowParticipants(!showParticipants)}
        onClose={onClose}
      />
      <div className="flex-1 flex min-h-0">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Message List */}
          <div className="flex-1 overflow-hidden">
            <ChatMessageList
              messages={messages}
              currentUserId={userId}
              onReply={setReplyToMessage}
              onLoadMore={() => hasNextPage && fetchNextPage()}
              isLoading={isFetchingNextPage}
              hasMore={hasNextPage}
            />
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="px-4 pb-2">
                <TypingIndicator users={typingUsers} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Reply Preview */}
          <AnimatePresence>
            {replyToMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-4 mb-2 p-3 bg-neutral-800/50 rounded-lg border-l-4 border-purple-400"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-purple-400 font-medium">
                      Replying to {replyToMessage.sender.name}
                    </p>
                    <p className="text-sm text-neutral-400 truncate mt-1">
                      {replyToMessage.content}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyToMessage(null)}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Message Composer */}
          <div className="p-4 border-t border-neutral-800">
            <ChatComposer
              onSendMessage={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              isLoading={sendMessage.isPending}
              placeholder={`Message #${room.name}...`}
            />
          </div>
        </div>
        {/* Participants Sidebar */}
        <AnimatePresence>
          {showParticipants && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-neutral-800 overflow-hidden"
            >
              <ChatParticipants
                participants={room.participants}
                onlineUsers={onlineUsers}
                currentUserId={userId}
                roomId={room.id}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute inset-x-0 top-0 bg-yellow-500/90 text-black text-center py-2 text-sm font-medium">
          Reconnecting to chat...
        </div>
      )}
    </Card>
  )
}
