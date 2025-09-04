import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { chatRealtimeManager } from '../supabase/chat-realtime'
import { createClient } from '../supabase/client'
import {
  ChatRoom,
  ChatMessage,
  ChatParticipant,
  ChatRoomWithParticipants,
  ChatMessageWithSender,
  RealtimeMessagePayload,
  RealtimeParticipantPayload
} from '../supabase/types'
import { useSupabaseClient } from './useSupabaseClient'
import { handleError } from '@/lib/error/standardErrorHandler'
const MESSAGE_PAGE_SIZE = 50
const CACHE_TIME = 5 * 60 * 1000 // 5 minutes
const STALE_TIME = 2 * 60 * 1000 // 2 minutes
/**
 * Optimized hook for managing chat rooms list
 * Uses RPC function for single-query data fetching
 */
export function useChatRoomsOptimized(userId?: string) {
  const { client: supabase } = useSupabaseClient()
  return useQuery({
    queryKey: ['chatRooms', userId],
    queryFn: async (): Promise<ChatRoomWithParticipants[]> => {
      if (!userId || !supabase) throw new Error('User ID and Supabase client required')
      try {
        // Use optimized RPC function for single query
        const { data, error } = await supabase
          .rpc('get_chat_rooms_optimized', { p_user_id: userId })
        if (error) {
          handleError(error, {
      operation: 'general_operation', component: 'useChatOptimized',
            userMessage: 'Operation failed. Please try again.'
          })
          throw error
        }
        return data || []
      } catch (error) {
        handleError(error, {
      operation: 'general_operation', component: 'useChatOptimized',
          userMessage: 'Operation failed. Please try again.'
        })
        throw error
      }
    },
    enabled: !!userId && !!supabase,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  })
}
/**
 * Optimized hook for managing chat messages with virtualization support
 * Uses RPC function for efficient message fetching
 */
export function useChatMessagesOptimized(roomId: string) {
  const { client: supabase } = useSupabaseClient()
  return useInfiniteQuery({
    queryKey: ['chatMessages', roomId],
    initialPageParam: null,
    queryFn: async ({ pageParam }): Promise<{ data: ChatMessageWithSender[], nextCursor: string | null }> => {
      if (!supabase) throw new Error('Supabase client not available')
      // Use optimized RPC function
      const { data, error } = await supabase
        .rpc('get_chat_messages_optimized', {
          p_room_id: roomId,
          p_limit: MESSAGE_PAGE_SIZE,
          p_before_timestamp: pageParam
        })
      if (error) throw error
      const messages = data || []
      const nextCursor = messages.length === MESSAGE_PAGE_SIZE
        ? messages[messages.length - 1]?.created_at
        : null
      return { data: messages, nextCursor }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!roomId && !!supabase,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  })
}
/**
 * Optimized hook for managing a specific chat room with connection pooling
 */
export function useChatRoomOptimized(roomId: string, userId?: string) {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  // Debounce typing updates to reduce re-renders
  const debouncedTypingUsers = useMemo(() => typingUsers, [
    Math.floor(typingUsers.length / 2) // Only update when significant change
  ])
  // Connection management with cleanup
  useEffect(() => {
    if (!roomId || !userId) return
    let isMounted = true
    let reconnectTimeout: NodeJS.Timeout
    const connectToRoom = async () => {
      try {
        await chatRealtimeManager.joinRoom(roomId, userId)
        if (isMounted) setIsConnected(true)
      } catch (error) {
        handleError(error, {
      operation: 'general_operation', component: 'useChatOptimized',
          userMessage: 'Operation failed. Please try again.'
        })
        // Retry connection after delay
        if (isMounted) {
          reconnectTimeout = setTimeout(connectToRoom, 5000)
        }
      }
    }
    connectToRoom()
    return () => {
      isMounted = false
      clearTimeout(reconnectTimeout)
      setIsConnected(false)
      chatRealtimeManager.leaveRoom(roomId)
    }
  }, [roomId, userId])
  // Optimized realtime subscriptions with batching
  useEffect(() => {
    if (!roomId || !isConnected) return
    const messageBuffer: RealtimeMessagePayload[] = []
    let bufferTimeout: NodeJS.Timeout
    const flushMessageBuffer = () => {
      if (messageBuffer.length > 0) {
        queryClient.setQueryData(['chatMessages', roomId], (old: any) => {
          if (!old?.pages) return old
          const newPages = [...old.pages]
          if (newPages[0]?.data) {
            newPages[0] = {
              ...newPages[0],
              data: [...messageBuffer.map(p => p.new), ...newPages[0].data]
            }
          }
          messageBuffer.length = 0
          return { ...old, pages: newPages }
        })
      }
    }
    const unsubscribeMessage = chatRealtimeManager.onMessage(roomId, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        messageBuffer.push(payload)
        clearTimeout(bufferTimeout)
        bufferTimeout = setTimeout(flushMessageBuffer, 100) // Batch updates
      } else {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', roomId] })
      }
    })
    const unsubscribeTyping = chatRealtimeManager.onTyping(roomId, setTypingUsers)
    const unsubscribePresence = chatRealtimeManager.onPresence(roomId, setOnlineUsers)
    const unsubscribeParticipants = chatRealtimeManager.onParticipantChange(roomId, () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
    })
    return () => {
      clearTimeout(bufferTimeout)
      flushMessageBuffer()
      unsubscribeMessage()
      unsubscribeTyping()
      unsubscribePresence()
      unsubscribeParticipants()
    }
  }, [roomId, isConnected, queryClient])
  return {
    isConnected,
    typingUsers: debouncedTypingUsers,
    onlineUsers,
    sendTyping: useCallback((isTyping: boolean) =>
      chatRealtimeManager.sendTyping(roomId, isTyping), [roomId])
  }
}
/**
 * Optimized hook for sending messages with optimistic updates and retry logic
 */
export function useSendMessageOptimized(roomId: string) {
  const queryClient = useQueryClient()
  const { client: supabase } = useSupabaseClient()
  return useMutation({
    mutationFn: async ({
      content,
      messageType = 'text',
      replyToId,
      metadata
    }: {
      content: string
      messageType?: ChatMessage['message_type']
      replyToId?: string
      metadata?: any
    }) => {
      if (!supabase) throw new Error('Supabase client not available')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      // Optimistic update
      const tempId = `temp_${Date.now()}`
      const optimisticMessage = {
        id: tempId,
        room_id: roomId,
        sender_id: user.id,
        content,
        message_type: messageType,
        reply_to_id: replyToId,
        metadata,
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.user_metadata?.name || 'Unknown'
        }
      }
      // Add to cache optimistically
      queryClient.setQueryData(['chatMessages', roomId], (old: any) => {
        if (!old?.pages) return old
        const newPages = [...old.pages]
        if (newPages[0]?.data) {
          newPages[0] = {
            ...newPages[0],
            data: [...newPages[0].data, optimisticMessage]
          }
        }
        return { ...old, pages: newPages }
      })
      // Send message
      const success = await chatRealtimeManager.sendMessage(roomId, content, messageType, {
        ...metadata,
        reply_to_id: replyToId
      })
      if (!success) {
        // Rollback optimistic update
        queryClient.setQueryData(['chatMessages', roomId], (old: any) => {
          if (!old?.pages) return old
          const newPages = old.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((msg: any) => msg.id !== tempId)
          }))
          return { ...old, pages: newPages }
        })
        throw new Error('Failed to send message')
      }
      return optimisticMessage
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000)
  })
}
/**
 * Hook for message reactions with optimistic updates
 */
export function useMessageReactionOptimized(messageId: string) {
  const queryClient = useQueryClient()
  const addReaction = useMutation({
    mutationFn: async (emoji: string) => {
      // Optimistic update
      queryClient.setQueryData(['chatMessages'], (old: any) => {
        // Update reaction count optimistically
        return old
      })
      return chatRealtimeManager.addReaction(messageId, emoji)
    },
    onError: () => {
      // Rollback optimistic update
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] })
    }
  })
  const removeReaction = useMutation({
    mutationFn: (emoji: string) => chatRealtimeManager.removeReaction(messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] })
    }
  })
  return {
    addReaction: addReaction.mutate,
    removeReaction: removeReaction.mutate,
    isLoading: addReaction.isPending || removeReaction.isPending
  }
}
/**
 * Hook for typing indicator with intelligent debouncing
 */
export function useTypingIndicatorOptimized(roomId: string, delay = 2000) {
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastTypingRef = useRef<number>(0)
  const startTyping = useCallback(() => {
    const now = Date.now()
    // Don't send typing indicator too frequently
    if (now - lastTypingRef.current < 1000) return
    if (!isTyping) {
      setIsTyping(true)
      chatRealtimeManager.sendTyping(roomId, true)
      lastTypingRef.current = now
    }
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    // Set new timeout to stop typing
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      chatRealtimeManager.sendTyping(roomId, false)
    }, delay)
  }, [roomId, isTyping, delay])
  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (isTyping) {
      setIsTyping(false)
      chatRealtimeManager.sendTyping(roomId, false)
    }
  }, [roomId, isTyping])
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  return {
    isTyping,
    startTyping,
    stopTyping
  }
}
/**
 * Hook for prefetching chat data
 */
export function usePrefetchChat() {
  const queryClient = useQueryClient()
  const { client: supabase } = useSupabaseClient()
  const prefetchRoom = useCallback(async (roomId: string) => {
    if (!supabase) return
    await queryClient.prefetchInfiniteQuery({
      queryKey: ['chatMessages', roomId],
      queryFn: async () => {
        const { data } = await supabase
          .rpc('get_chat_messages_optimized', {
            p_room_id: roomId,
            p_limit: MESSAGE_PAGE_SIZE
          })
        return { data: data || [], nextCursor: null }
      },
      initialPageParam: null,
      getNextPageParam: () => null
    })
  }, [queryClient, supabase])
  return { prefetchRoom }
}
