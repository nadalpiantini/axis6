import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

// PUT /api/chat/rooms/[roomId]/messages/[messageId] - Edit a message
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId, messageId } = await params

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.error('Edit message auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if message exists and user is the sender
    const { data: message, error: messageError } = await supabase
      .from('axis6_chat_messages')
      .select('*')
      .eq('id', messageId)
      .eq('room_id', roomId)
      .eq('sender_id', user.id)
      .is('deleted_at', null)
      .single()

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 })
    }

    // Parse request body
    const { content } = await request.json()

    // Validate content
    if (!content?.trim()) {
      return NextResponse.json({
        error: 'Message content cannot be empty'
      }, { status: 400 })
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from('axis6_chat_messages')
      .update({
        content: content.trim(),
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
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
        )
      `)
      .single()

    if (updateError) {
      logger.error('Error updating message:', updateError)
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    return NextResponse.json({ message: updatedMessage })

  } catch (error) {
    logger.error('Edit message API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/chat/rooms/[roomId]/messages/[messageId] - Delete a message
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId, messageId } = await params

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.error('Delete message auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if message exists and user has permission to delete
    const { data: message, error: messageError } = await supabase
      .from('axis6_chat_messages')
      .select(`
        *,
        room:axis6_chat_rooms(creator_id)
      `)
      .eq('id', messageId)
      .eq('room_id', roomId)
      .is('deleted_at', null)
      .single()

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check if user can delete (sender or room creator or admin)
    const isSender = message.sender_id === user.id
    const isRoomCreator = message.room?.creator_id === user.id

    // Check if user is admin
    let isAdmin = false
    if (!isSender && !isRoomCreator) {
      const { data: participation } = await supabase
        .from('axis6_chat_participants')
        .select('role')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single()

      isAdmin = participation?.role === 'admin'
    }

    if (!isSender && !isRoomCreator && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Soft delete the message
    const { error: deleteError } = await supabase
      .from('axis6_chat_messages')
      .update({
        deleted_at: new Date().toISOString(),
        content: '[Message deleted]'
      })
      .eq('id', messageId)

    if (deleteError) {
      logger.error('Error deleting message:', deleteError)
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Message deleted successfully' })

  } catch (error) {
    logger.error('Delete message API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
