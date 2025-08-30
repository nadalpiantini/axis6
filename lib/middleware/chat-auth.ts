import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { chatSecurity } from '@/lib/security/chat-validation'

/**
 * Authentication and authorization middleware for chat API routes
 */

export interface AuthenticatedUser {
  id: string
  email: string
}

export interface ChatAuthContext {
  user: AuthenticatedUser
  roomId?: string
  messageId?: string
  userId?: string // For participant operations
}

/**
 * Extract user from request and validate authentication
 */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      logger.warn('Authentication error:', error)
      return null
    }

    if (!user || !user.email) {
      return null
    }

    return {
      id: user.id,
      email: user.email
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error)
    return null
  }
}

/**
 * Extract room ID from request parameters or body
 */
export function extractRoomId(request: NextRequest, params?: { roomId?: string }): string | null {
  // Try from URL parameters first
  if (params?.roomId) {
    return params.roomId
  }

  // Try from URL path
  const pathSegments = request.nextUrl.pathname.split('/')
  const roomsIndex = pathSegments.findIndex(segment => segment === 'rooms')
  if (roomsIndex !== -1 && roomsIndex + 1 < pathSegments.length) {
    return pathSegments[roomsIndex + 1]
  }

  return null
}

/**
 * Extract message ID from request parameters
 */
export function extractMessageId(request: NextRequest, params?: { messageId?: string }): string | null {
  if (params?.messageId) {
    return params.messageId
  }

  const pathSegments = request.nextUrl.pathname.split('/')
  const messagesIndex = pathSegments.findIndex(segment => segment === 'messages')
  if (messagesIndex !== -1 && messagesIndex + 1 < pathSegments.length) {
    return pathSegments[messagesIndex + 1]
  }

  return null
}

/**
 * Middleware wrapper for chat API routes
 */
export function withChatAuth<T extends any[]>(
  handler: (context: ChatAuthContext, request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T) => {
    // Extract route parameters if available
    const params = args[0] as { params?: { roomId?: string; messageId?: string; userId?: string } }

    // Authenticate user
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract context
    const roomId = extractRoomId(request, params?.params)
    const messageId = extractMessageId(request, params?.params)
    const userId = params?.params?.userId

    const context: ChatAuthContext = {
      user,
      roomId: roomId || undefined,
      messageId: messageId || undefined,
      userId: userId || undefined
    }

    try {
      return await handler(context, request, ...args)
    } catch (error) {
      logger.error('Chat API handler error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Validate room access for authenticated user
 */
export async function validateRoomAccess(userId: string, roomId: string): Promise<boolean> {
  return chatSecurity.validateRoomAccess(userId, roomId)
}

/**
 * Validate message permissions for authenticated user
 */
export async function validateMessagePermission(
  userId: string,
  messageId: string,
  operation: 'read' | 'edit' | 'delete'
): Promise<boolean> {
  if (operation === 'read') {
    // For read operations, we need to check if user has access to the room containing the message
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: message, error } = await supabase
        .from('axis6_chat_messages')
        .select('room_id')
        .eq('id', messageId)
        .single()

      if (error || !message) {
        return false
      }

      return chatSecurity.validateRoomAccess(userId, message.room_id)
    } catch (error) {
      logger.error('Message read permission error:', error)
      return false
    }
  }

  // For edit/delete operations
  return chatSecurity.validateMessageEditPermission(userId, messageId)
}

/**
 * Rate limiting middleware for chat operations
 */
export async function validateChatRateLimit(
  userId: string,
  operation: 'send_message' | 'create_room' | 'join_room',
  resourceId?: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const now = new Date()

    // Define rate limits per operation
    const rateLimits = {
      send_message: { count: 30, windowMs: 60 * 1000 }, // 30 messages per minute
      create_room: { count: 5, windowMs: 60 * 1000 }, // 5 rooms per minute
      join_room: { count: 10, windowMs: 60 * 1000 } // 10 joins per minute
    }

    const limit = rateLimits[operation]
    if (!limit) {
      return { allowed: true }
    }

    const windowStart = new Date(now.getTime() - limit.windowMs)

    // Check rate limit based on operation
    let query
    if (operation === 'send_message' && resourceId) {
      query = supabase
        .from('axis6_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .eq('room_id', resourceId)
        .gte('created_at', windowStart.toISOString())
    } else if (operation === 'create_room') {
      query = supabase
        .from('axis6_chat_rooms')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId)
        .gte('created_at', windowStart.toISOString())
    } else if (operation === 'join_room') {
      query = supabase
        .from('axis6_chat_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('joined_at', windowStart.toISOString())
    }

    if (query) {
      const { count, error } = await query

      if (error) {
        logger.warn(`Rate limit check failed for ${operation}:`, error)
        return { allowed: true } // Allow on error to avoid blocking legitimate users
      }

      if ((count || 0) >= limit.count) {
        const retryAfter = Math.ceil(limit.windowMs / 1000)
        return { allowed: false, retryAfter }
      }
    }

    return { allowed: true }
  } catch (error) {
    logger.error('Rate limit validation error:', error)
    return { allowed: true } // Allow on error
  }
}

/**
 * Enhanced middleware with permission validation
 */
export function withChatPermission<T extends any[]>(
  operation: 'send_message' | 'edit_message' | 'delete_message' | 'manage_participants' | 'access_room',
  handler: (context: ChatAuthContext, request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withChatAuth<T>(async (context, request, ...args) => {
    const { user, roomId, messageId, userId } = context

    // Validate permissions based on operation
    let validation: { isValid: boolean; reason?: string } = { isValid: true }

    switch (operation) {
      case 'access_room':
        if (roomId) {
          const hasAccess = await validateRoomAccess(user.id, roomId)
          if (!hasAccess) {
            validation = { isValid: false, reason: 'No access to this room' }
          }
        }
        break

      case 'send_message':
        if (roomId) {
          validation = await chatSecurity.validateChatOperation(
            'send_message',
            user.id,
            roomId
          )
        }
        break

      case 'edit_message':
      case 'delete_message':
        if (messageId) {
          validation = await chatSecurity.validateChatOperation(
            operation,
            user.id,
            messageId
          )
        }
        break

      case 'manage_participants':
        if (roomId) {
          validation = await chatSecurity.validateChatOperation(
            'manage_participants',
            user.id,
            roomId
          )
        }
        break
    }

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.reason || 'Permission denied' },
        { status: 403 }
      )
    }

    // Check rate limits for applicable operations
    if (['send_message'].includes(operation)) {
      const rateLimit = await validateChatRateLimit(user.id, operation as any, roomId)
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          {
            status: 429,
            headers: rateLimit.retryAfter
              ? { 'Retry-After': rateLimit.retryAfter.toString() }
              : undefined
          }
        )
      }
    }

    return handler(context, request, ...args)
  })
}
