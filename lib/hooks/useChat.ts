import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
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

const MESSAGE_PAGE_SIZE = 50

/**
 * Hook for managing chat rooms list
 */
export function useChatRooms(userId?: string) {
  const { client: supabase } = useSupabaseClient()

  return useQuery({
    queryKey: ['chatRooms', userId],
    queryFn: async (): Promise<ChatRoomWithParticipants[]> => {
      if (!userId || !supabase) throw new Error('User ID and Supabase client required')

      const { data, error } = await supabase
        .from('axis6_chat_rooms')
        .select(`
          *,
          participants:axis6_chat_participants!inner(
            *,
            profile:axis6_profiles(*)
          ),
          category:axis6_categories(*),
          last_message:axis6_chat_messages(
            *,
            sender:axis6_profiles(*)
          )
        `)
        .eq('participants.user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!userId && !!supabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  })
}

/**
 * Hook for managing a specific chat room
 */
export function useChatRoom(roomId: string, userId?: string) {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  // Join room on mount, leave on unmount
  useEffect(() => {
    if (!roomId || !userId) return

    let isMounted = true

    const connectToRoom = async () => {
      try {
        await chatRealtimeManager.joinRoom(roomId, userId)
        if (isMounted) {
          setIsConnected(true)
        }
      } catch (error) {
        console.error('Failed to join room:', error)
      }
    }

    connectToRoom()

    return () => {
      isMounted = false
      setIsConnected(false)
      chatRealtimeManager.leaveRoom(roomId)
    }
  }, [roomId, userId])

  // Set up realtime subscriptions
  useEffect(() => {
    if (!roomId || !isConnected) return

    const unsubscribeMessage = chatRealtimeManager.onMessage(roomId, (payload) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', roomId] })
      
      if (payload.eventType === 'INSERT' && payload.new) {
        // Optimistically update the messages cache
        queryClient.setQueryData(['chatMessages', roomId], (old: any) => {
          if (!old?.pages) return old
          
          const newPages = [...old.pages]
          if (newPages[0]?.data) {
            newPages[0] = {
              ...newPages[0],
              data: [payload.new, ...newPages[0].data]
            }
          }
          
          return { ...old, pages: newPages }
        })
      }
    })

    const unsubscribeTyping = chatRealtimeManager.onTyping(roomId, setTypingUsers)
    const unsubscribePresence = chatRealtimeManager.onPresence(roomId, setOnlineUsers)
    
    const unsubscribeParticipants = chatRealtimeManager.onParticipantChange(roomId, (payload) => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
    })

    return () => {
      unsubscribeMessage()
      unsubscribeTyping()
      unsubscribePresence()
      unsubscribeParticipants()
    }
  }, [roomId, isConnected, queryClient])

  return {
    isConnected,
    typingUsers,
    onlineUsers,
    sendTyping: (isTyping: boolean) => chatRealtimeManager.sendTyping(roomId, isTyping)
  }
}

/**
 * Hook for managing chat messages with infinite scroll
 */
export function useChatMessages(roomId: string) {
  const { client: supabase } = useSupabaseClient()

  return useInfiniteQuery({
    queryKey: ['chatMessages', roomId],
    queryFn: async ({ pageParam }): Promise<{ data: ChatMessageWithSender[], nextCursor: string | null }> => {
      if (!supabase) throw new Error('Supabase client not available')
      
      let query = supabase
        .from('axis6_chat_messages')
        .select(`
          *,
          sender:axis6_profiles(*),
          reactions:axis6_chat_reactions(
            *,
            user:axis6_profiles(*)
          ),
          reply_to:axis6_chat_messages(
            *,
            sender:axis6_profiles(*)
          )
        `)
        .eq('room_id', roomId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(MESSAGE_PAGE_SIZE)

      if (pageParam) {
        query = query.lt('created_at', pageParam)
      }

      const { data, error } = await query

      if (error) throw error

      const messages = (data || []) as ChatMessageWithSender[]
      const nextCursor = messages.length === MESSAGE_PAGE_SIZE 
        ? messages[messages.length - 1]?.created_at 
        : null

      return { data: messages.reverse(), nextCursor }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!roomId && !!supabase,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: true
  })
}

/**
 * Hook for sending messages with optimistic updates
 */
export function useSendMessage(roomId: string) {
  const queryClient = useQueryClient()

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
      const success = await chatRealtimeManager.sendMessage(roomId, content, messageType, {
        ...metadata,
        reply_to_id: replyToId
      })
      
      if (!success) {
        throw new Error('Failed to send message')
      }
    },
    onSuccess: () => {
      // Messages will be updated via realtime subscription
    },
    onError: (error) => {
      console.error('Failed to send message:', error)
      // Could add toast notification here
    }
  })
}

/**
 * Hook for managing message reactions
 */
export function useMessageReaction(messageId: string) {
  const queryClient = useQueryClient()

  const addReaction = useMutation({
    mutationFn: (emoji: string) => chatRealtimeManager.addReaction(messageId, emoji),
    onSuccess: () => {
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
 * Hook for creating/joining chat rooms
 */
export function useCreateChatRoom() {
  const { client: supabase } = useSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      name, 
      description, 
      type, 
      categoryId, 
      maxParticipants 
    }: {
      name: string
      description?: string
      type: ChatRoom['type']
      categoryId?: number
      maxParticipants?: number
    }) => {
      if (!supabase) throw new Error('Supabase client not available')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: room, error: roomError } = await supabase
        .from('axis6_chat_rooms')
        .insert({
          name,
          description,
          type,
          category_id: categoryId,
          creator_id: user.id,
          max_participants: maxParticipants
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Add creator as admin participant
      const { error: participantError } = await supabase
        .from('axis6_chat_participants')
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: 'admin'
        })

      if (participantError) throw participantError

      return room
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
    }
  })
}

/**
 * Hook for joining/leaving chat rooms
 */
export function useJoinChatRoom() {
  const { client: supabase } = useSupabaseClient()
  const queryClient = useQueryClient()

  const joinRoom = useMutation({
    mutationFn: async (roomId: string) => {
      if (!supabase) throw new Error('Supabase client not available')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('axis6_chat_participants')
        .insert({
          room_id: roomId,
          user_id: user.id,
          role: 'member'
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
    }
  })

  const leaveRoom = useMutation({
    mutationFn: async (roomId: string) => {
      if (!supabase) throw new Error('Supabase client not available')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('axis6_chat_participants')
        .delete()
        .match({ room_id: roomId, user_id: user.id })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
    }
  })

  return {
    joinRoom: joinRoom.mutate,
    leaveRoom: leaveRoom.mutate,
    isJoining: joinRoom.isPending,
    isLeaving: leaveRoom.isPending
  }
}

/**
 * Hook for typing indicator with debouncing
 */
export function useTypingIndicator(roomId: string, delay = 1000) {
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      chatRealtimeManager.sendTyping(roomId, true)
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
    setIsTyping(false)
    chatRealtimeManager.sendTyping(roomId, false)
  }, [roomId])

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