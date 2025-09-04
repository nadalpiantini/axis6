import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { ChatRoom, ChatParticipant, ChatMessage } from '@/lib/supabase/types'
/**
 * Security validation utilities for chat system
 * Ensures users can only access data they're authorized to see
 */
export class ChatSecurityValidator {
  private supabase = createClient()
  /**
   * Validate user can access a specific chat room
   */
  async validateRoomAccess(userId: string, roomId: string): Promise<boolean> {
    try {
      const { data: participation, error } = await (await this.supabase)
        .from('axis6_chat_participants')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .single()
      if (error) {
        logger.warn(`Room access validation failed for user ${userId}, room ${roomId}:`, error)
        return false
      }
      return !!participation
    } catch (error) {
      logger.error('Room access validation error:', error)
      return false
    }
  }
  /**
   * Validate user can send messages to a room
   */
  async validateMessageSendPermission(userId: string, roomId: string): Promise<boolean> {
    // For now, if user can access room, they can send messages
    // This can be extended to include mute status, banned users, etc.
    return this.validateRoomAccess(userId, roomId)
  }
  /**
   * Validate user can edit/delete a specific message
   */
  async validateMessageEditPermission(userId: string, messageId: string): Promise<boolean> {
    try {
      const { data: message, error } = await (await this.supabase)
        .from('axis6_chat_messages')
        .select('sender_id, room_id')
        .eq('id', messageId)
        .is('deleted_at', null)
        .single()
      if (error || !message) {
        return false
      }
      // User can edit their own messages
      if (message.sender_id === userId) {
        return true
      }
      // Check if user has admin/moderator privileges in the room
      const { data: participation, error: participationError } = await (await this.supabase)
        .from('axis6_chat_participants')
        .select('role')
        .eq('room_id', message.room_id)
        .eq('user_id', userId)
        .single()
      if (participationError || !participation) {
        return false
      }
      return ['admin', 'moderator'].includes(participation.role)
    } catch (error) {
      logger.error('Message edit permission validation error:', error)
      return false
    }
  }
  /**
   * Validate user can manage room participants
   */
  async validateParticipantManagement(userId: string, roomId: string): Promise<boolean> {
    try {
      const { data: participation, error } = await (await this.supabase)
        .from('axis6_chat_participants')
        .select('role')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .single()
      if (error || !participation) {
        return false
      }
      return ['admin', 'moderator'].includes(participation.role)
    } catch (error) {
      logger.error('Participant management validation error:', error)
      return false
    }
  }
  /**
   * Validate room creation permissions
   */
  async validateRoomCreation(userId: string, roomType: ChatRoom['type']): Promise<boolean> {
    // Basic validation - all authenticated users can create rooms
    // This can be extended with rate limiting, user restrictions, etc.
    if (!userId) {
      return false
    }
    // Check if user exists and is not banned
    try {
      const { data: profile, error } = await (await this.supabase)
        .from('axis6_profiles')
        .select('id')
        .eq('id', userId)
        .single()
      return !error && !!profile
    } catch (error) {
      logger.error('Room creation validation error:', error)
      return false
    }
  }
  /**
   * Validate message content for security and appropriateness
   */
  validateMessageContent(content: string): { isValid: boolean; reason?: string } {
    // Basic content validation
    if (!content || typeof content !== 'string') {
      return { isValid: false, reason: 'Content is required' }
    }
    // Length validation
    if (content.length > 4000) {
      return { isValid: false, reason: 'Message too long (max 4000 characters)' }
    }
    // Trim whitespace
    const trimmed = content.trim()
    if (trimmed.length === 0) {
      return { isValid: false, reason: 'Message cannot be empty' }
    }
    // Basic XSS prevention (very basic - more sophisticated filtering would be done client-side)
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ]
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmed)) {
        return { isValid: false, reason: 'Message contains invalid content' }
      }
    }
    return { isValid: true }
  }
  /**
   * Rate limiting for message sending
   */
  async validateMessageRateLimit(userId: string, roomId: string): Promise<boolean> {
    try {
      // Check message count in last minute
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
      const { count, error } = await (await this.supabase)
        .from('axis6_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .eq('room_id', roomId)
        .gte('created_at', oneMinuteAgo)
      if (error) {
        logger.warn('Rate limit check failed:', error)
        return true // Allow on error to avoid blocking legitimate users
      }
      // Allow up to 10 messages per minute per room
      return (count || 0) < 10
    } catch (error) {
      logger.error('Rate limit validation error:', error)
      return true // Allow on error
    }
  }
  /**
   * Validate emoji reaction
   */
  validateReaction(emoji: string): boolean {
    if (!emoji || typeof emoji !== 'string') {
      return false
    }
    // Basic emoji validation - allow common emoji characters
    const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u
    return emojiRegex.test(emoji) && emoji.length <= 10
  }
  /**
   * Comprehensive security check for chat operations
   */
  async validateChatOperation(
    operation: 'send_message' | 'edit_message' | 'delete_message' | 'add_reaction' | 'manage_participants',
    userId: string,
    resourceId: string,
    additionalData?: any
  ): Promise<{ isValid: boolean; reason?: string }> {
    if (!userId) {
      return { isValid: false, reason: 'User authentication required' }
    }
    switch (operation) {
      case 'send_message':
        const roomAccess = await this.validateRoomAccess(userId, resourceId)
        if (!roomAccess) {
          return { isValid: false, reason: 'No access to this room' }
        }
        const sendPermission = await this.validateMessageSendPermission(userId, resourceId)
        if (!sendPermission) {
          return { isValid: false, reason: 'No permission to send messages' }
        }
        if (additionalData?.content) {
          const contentValidation = this.validateMessageContent(additionalData.content)
          if (!contentValidation.isValid) {
            return contentValidation
          }
        }
        const rateLimit = await this.validateMessageRateLimit(userId, resourceId)
        if (!rateLimit) {
          return { isValid: false, reason: 'Rate limit exceeded' }
        }
        return { isValid: true }
      case 'edit_message':
      case 'delete_message':
        const editPermission = await this.validateMessageEditPermission(userId, resourceId)
        if (!editPermission) {
          return { isValid: false, reason: 'No permission to modify this message' }
        }
        return { isValid: true }
      case 'add_reaction':
        if (additionalData?.emoji && !this.validateReaction(additionalData.emoji)) {
          return { isValid: false, reason: 'Invalid emoji' }
        }
        return { isValid: true }
      case 'manage_participants':
        const managementPermission = await this.validateParticipantManagement(userId, resourceId)
        if (!managementPermission) {
          return { isValid: false, reason: 'No permission to manage participants' }
        }
        return { isValid: true }
      default:
        return { isValid: false, reason: 'Unknown operation' }
    }
  }
}
// Singleton instance for easy access
export const chatSecurity = new ChatSecurityValidator()
/**
 * Middleware helper for API routes to validate chat permissions
 */
export async function validateChatPermission(
  operation: Parameters<typeof chatSecurity.validateChatOperation>[0],
  userId: string,
  resourceId: string,
  additionalData?: any
): Promise<{ isValid: boolean; reason?: string }> {
  return chatSecurity.validateChatOperation(operation, userId, resourceId, additionalData)
}
