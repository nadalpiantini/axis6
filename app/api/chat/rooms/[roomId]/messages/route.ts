import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

// GET /api/chat/rooms/[roomId]/messages - Get messages for a room with pagination
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await params
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.error('Chat messages auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Check if user is a participant in this room
    const { data: participation, error: participationError } = await supabase
      .from('axis6_chat_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single()
    if (participationError || !participation) {
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 })
    }
    // Get query parameters
    const { searchParams } = new URL(_request.url)
    const cursor = searchParams.get('cursor') // For pagination
    const limit = parseInt(searchParams.get('limit') || '50')
    const messageType = searchParams.get('type') // Filter by message type
    let query = supabase
      .from('axis6_chat_messages')
      .select(`
        *,
        sender:axis6_profiles(
          id,
          name
        ),
        reactions:axis6_chat_reactions(
          id,
          emoji,
          created_at,
          user:axis6_profiles(
            id,
            name
          )
        ),
        reply_to:axis6_chat_messages(
          id,
          content,
          message_type,
          created_at,
          sender:axis6_profiles(
            id,
            name
          )
        )
      `)
      .eq('room_id', roomId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)
    // Add cursor for pagination
    if (cursor) {
      query = query.lt('created_at', cursor)
    }
    // Filter by message type if provided
    if (messageType && ['text', 'image', 'file', 'system', 'achievement'].includes(messageType)) {
      query = query.eq('message_type', messageType)
    }
    const { data: messages, error } = await query
    if (error) {
      logger.error('Error fetching chat messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
    // Determine next cursor for pagination
    const nextCursor = messages && messages.length === limit
      ? messages[messages.length - 1]?.created_at
      : null
    return NextResponse.json({
      messages: messages?.reverse() || [], // Reverse to show oldest first
      nextCursor,
      hasMore: !!nextCursor
    })
  } catch (error) {
    logger.error('Chat messages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
// POST /api/chat/rooms/[roomId]/messages - Send a new message
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await params
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.error('Send message auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Check if user is a participant in this room
    const { data: participation, error: participationError } = await supabase
      .from('axis6_chat_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single()
    if (participationError || !participation) {
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 })
    }
    // Parse request body
    const {
      content,
      messageType = 'text',
      replyToId,
      metadata = {}
    } = await _request.json()
    // Validate required fields
    if (!content?.trim()) {
      return NextResponse.json({
        error: 'Message content cannot be empty'
      }, { status: 400 })
    }
    // Validate message type
    if (!['text', 'image', 'file', 'system', 'achievement'].includes(messageType)) {
      return NextResponse.json({
        error: 'Invalid message type'
      }, { status: 400 })
    }
    // If replying to a message, verify it exists in this room
    if (replyToId) {
      const { data: replyMessage, error: replyError } = await supabase
        .from('axis6_chat_messages')
        .select('id')
        .eq('id', replyToId)
        .eq('room_id', roomId)
        .single()
      if (replyError || !replyMessage) {
        return NextResponse.json({
          error: 'Reply message not found'
        }, { status: 400 })
      }
    }
    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from('axis6_chat_messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        content: content.trim(),
        message_type: messageType,
        reply_to_id: replyToId,
        metadata
      })
      .select(`
        *,
        sender:axis6_profiles(
          id,
          name
        ),
        reply_to:axis6_chat_messages(
          id,
          content,
          message_type,
          sender:axis6_profiles(
            id,
            name
          )
        )
      `)
      .single()
    if (messageError) {
      logger.error('Error sending message:', messageError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }
    // Update room's updated_at timestamp
    const { error: roomUpdateError } = await supabase
      .from('axis6_chat_rooms')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', roomId)
    if (roomUpdateError) {
      logger.error('Error updating room timestamp:', roomUpdateError)
      // Don't fail the request for this
    }
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    logger.error('Send message API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
