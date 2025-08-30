import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js'

import { createClient } from './client'
import { createAuthenticatedChannel, realtimeManager } from './realtime-manager'
import { handleError } from '@/lib/error/standardErrorHandler'
import {
  ChatMessage,
  ChatParticipant,
  RealtimeMessagePayload,
  RealtimeParticipantPayload,
  ChatUIState
} from './types'

interface ChatRealtimeState {
  connectedRooms: Set<string>
  typingUsers: Map<string, Set<string>> // roomId -> set of user IDs
  onlineUsers: Map<string, Set<string>> // roomId -> set of user IDs
  lastActivity: Map<string, Date> // userId -> last activity
}

class ChatRealtimeManager {
  private state: ChatRealtimeState = {
    connectedRooms: new Set(),
    typingUsers: new Map(),
    onlineUsers: new Map(),
    lastActivity: new Map()
  }

  private channels: Map<string, RealtimeChannel> = new Map()
  private messageCallbacks: Map<string, (payload: RealtimeMessagePayload) => void> = new Map()
  private typingCallbacks: Map<string, (typingUsers: string[]) => void> = new Map()
  private presenceCallbacks: Map<string, (onlineUsers: string[]) => void> = new Map()
  private participantCallbacks: Map<string, (payload: RealtimeParticipantPayload) => void> = new Map()

  private supabase = createClient()
  private typingTimeout = 3000 // 3 seconds
  private heartbeatInterval = 30000 // 30 seconds
  private heartbeatTimer?: NodeJS.Timeout

  /**
   * Join a chat room and set up all realtime subscriptions
   */
  async joinRoom(roomId: string, userId: string): Promise<void> {
    if (this.state.connectedRooms.has(roomId)) {
      return
    }

    try {
      const { channel, subscribe, unsubscribe } = await createAuthenticatedChannel(
        `chat_room_${roomId}`,
        userId,
        (connected) => {
          if (!connected) {
            this.state.connectedRooms.delete(roomId)
          }
        }
      )

      this.channels.set(roomId, channel)

      // Set up message subscription
      channel
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'axis6_chat_messages', filter: `room_id=eq.${roomId}` },
          (payload) => {
            const messagePayload: RealtimeMessagePayload = {
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new as ChatMessage,
              old: payload.old as ChatMessage
            }
            this.messageCallbacks.get(roomId)?.(messagePayload)
          }
        )

      // Set up participant subscription
      channel
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'axis6_chat_participants', filter: `room_id=eq.${roomId}` },
          (payload) => {
            const participantPayload: RealtimeParticipantPayload = {
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new as ChatParticipant,
              old: payload.old as ChatParticipant
            }
            this.participantCallbacks.get(roomId)?.(participantPayload)
          }
        )

      // Set up presence tracking for online users
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const onlineUsers = new Set<string>()

          for (const userId in state) {
            if (state[userId]?.length > 0) {
              onlineUsers.add(userId)
            }
          }

          this.state.onlineUsers.set(roomId, onlineUsers)
          this.presenceCallbacks.get(roomId)?.(Array.from(onlineUsers))
        })

      // Set up typing indicators
      channel
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          this.handleTypingEvent(roomId, payload.userId, payload.isTyping)
        })

      // Subscribe to the channel
      await subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.state.connectedRooms.add(roomId)

          // Track presence
          channel.track({
            user_id: userId,
            online_at: new Date().toISOString()
          })

          }
      })

      // Start heartbeat for this room
      this.startHeartbeat(userId)

    } catch (error) {
      handleError(error, {
      operation: 'chat_operation', component: 'chat-realtime',

        userMessage: 'Chat operation failed. Please try again.'

      })
      throw error
    }
  }

  /**
   * Leave a chat room and clean up subscriptions
   */
  async leaveRoom(roomId: string): Promise<void> {
    const channel = this.channels.get(roomId)
    if (!channel) return

    try {
      await this.supabase.removeChannel(channel)

      this.channels.delete(roomId)
      this.state.connectedRooms.delete(roomId)
      this.state.typingUsers.delete(roomId)
      this.state.onlineUsers.delete(roomId)
      this.messageCallbacks.delete(roomId)
      this.typingCallbacks.delete(roomId)
      this.presenceCallbacks.delete(roomId)
      this.participantCallbacks.delete(roomId)

      } catch (error) {
      handleError(error, {
      operation: 'chat_operation', component: 'chat-realtime',

        userMessage: 'Chat operation failed. Please try again.'

      })
    }
  }

  /**
   * Send a message via optimistic update pattern
   */
  async sendMessage(roomId: string, content: string, messageType: ChatMessage['message_type'] = 'text', metadata?: any): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await this.supabase
        .from('axis6_chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content,
          message_type: messageType,
          metadata: metadata || {}
        })

      if (error) {
        handleError(error, {
      operation: 'chat_operation', component: 'chat-realtime',

          userMessage: 'Chat operation failed. Please try again.'

        })
        return false
      }

      return true
    } catch (error) {
      handleError(error, {
      operation: 'chat_operation', component: 'chat-realtime',

        userMessage: 'Chat operation failed. Please try again.'

      })
      return false
    }
  }

  /**
   * Send typing indicator
   */
  async sendTyping(roomId: string, isTyping: boolean): Promise<void> {
    const channel = this.channels.get(roomId)
    if (!channel) return

    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return

    try {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping }
      })
    } catch (error) {
      }
  }

  /**
   * Add emoji reaction to a message
   */
  async addReaction(messageId: string, emoji: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await this.supabase
        .from('axis6_chat_reactions')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          emoji
        })

      return !error
    } catch (error) {
      handleError(error, {
      operation: 'chat_operation', component: 'chat-realtime',

        userMessage: 'Chat operation failed. Please try again.'

      })
      return false
    }
  }

  /**
   * Remove emoji reaction from a message
   */
  async removeReaction(messageId: string, emoji: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await this.supabase
        .from('axis6_chat_reactions')
        .delete()
        .match({ message_id: messageId, user_id: user.id, emoji })

      return !error
    } catch (error) {
      handleError(error, {
      operation: 'chat_operation', component: 'chat-realtime',

        userMessage: 'Chat operation failed. Please try again.'

      })
      return false
    }
  }

  /**
   * Subscribe to message events for a room
   */
  onMessage(roomId: string, callback: (payload: RealtimeMessagePayload) => void): () => void {
    this.messageCallbacks.set(roomId, callback)

    return () => {
      this.messageCallbacks.delete(roomId)
    }
  }

  /**
   * Subscribe to typing events for a room
   */
  onTyping(roomId: string, callback: (typingUsers: string[]) => void): () => void {
    this.typingCallbacks.set(roomId, callback)

    return () => {
      this.typingCallbacks.delete(roomId)
    }
  }

  /**
   * Subscribe to presence events for a room
   */
  onPresence(roomId: string, callback: (onlineUsers: string[]) => void): () => void {
    this.presenceCallbacks.set(roomId, callback)

    return () => {
      this.presenceCallbacks.delete(roomId)
    }
  }

  /**
   * Subscribe to participant events for a room
   */
  onParticipantChange(roomId: string, callback: (payload: RealtimeParticipantPayload) => void): () => void {
    this.participantCallbacks.set(roomId, callback)

    return () => {
      this.participantCallbacks.delete(roomId)
    }
  }

  /**
   * Handle typing events with timeout
   */
  private handleTypingEvent(roomId: string, userId: string, isTyping: boolean): void {
    const typingUsers = this.state.typingUsers.get(roomId) || new Set()

    if (isTyping) {
      typingUsers.add(userId)

      // Set timeout to remove typing indicator
      setTimeout(() => {
        typingUsers.delete(userId)
        this.state.typingUsers.set(roomId, typingUsers)
        this.typingCallbacks.get(roomId)?.(Array.from(typingUsers))
      }, this.typingTimeout)
    } else {
      typingUsers.delete(userId)
    }

    this.state.typingUsers.set(roomId, typingUsers)
    this.typingCallbacks.get(roomId)?.(Array.from(typingUsers))
  }

  /**
   * Start heartbeat to maintain presence
   */
  private startHeartbeat(userId: string): void {
    if (this.heartbeatTimer) return

    this.heartbeatTimer = setInterval(() => {
      this.state.lastActivity.set(userId, new Date())

      // Update presence in all connected rooms
      for (const roomId of this.state.connectedRooms) {
        const channel = this.channels.get(roomId)
        if (channel) {
          channel.track({
            user_id: userId,
            online_at: new Date().toISOString()
          })
        }
      }
    }, this.heartbeatInterval)
  }

  /**
   * Stop heartbeat and cleanup
   */
  cleanup(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }

    // Leave all rooms
    for (const roomId of this.state.connectedRooms) {
      this.leaveRoom(roomId)
    }
  }

  /**
   * Get current state for debugging
   */
  getState(): ChatRealtimeState {
    return {
      connectedRooms: new Set(this.state.connectedRooms),
      typingUsers: new Map(this.state.typingUsers),
      onlineUsers: new Map(this.state.onlineUsers),
      lastActivity: new Map(this.state.lastActivity)
    }
  }

  /**
   * Check if connected to a room
   */
  isConnectedToRoom(roomId: string): boolean {
    return this.state.connectedRooms.has(roomId)
  }

  /**
   * Get typing users for a room
   */
  getTypingUsers(roomId: string): string[] {
    return Array.from(this.state.typingUsers.get(roomId) || [])
  }

  /**
   * Get online users for a room
   */
  getOnlineUsers(roomId: string): string[] {
    return Array.from(this.state.onlineUsers.get(roomId) || [])
  }
}

// Global instance
export const chatRealtimeManager = new ChatRealtimeManager()

// Cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    chatRealtimeManager.cleanup()
  })
}
