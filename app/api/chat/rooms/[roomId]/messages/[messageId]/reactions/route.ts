import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

// POST /api/chat/rooms/[roomId]/messages/[messageId]/reactions - Add a reaction
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const supabase = await createClient()
    const params = await context.params
    const { roomId: _roomId, messageId } = params
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Add reaction auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a participant in this room
    const { data: participation, error: participationError } = await supabase
      .from('axis6_chat_participants')
      .select('*')
      .eq('room_id', _roomId)
      .eq('user_id', user.id)
      .single()

    if (participationError || !participation) {
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 })
    }

    // Check if message exists in this room
    const { data: message, error: messageError } = await supabase
      .from('axis6_chat_messages')
      .select('id')
      .eq('id', messageId)
      .eq('room_id', _roomId)
      .is('deleted_at', null)
      .single()

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Parse request body
    const { emoji } = await _request.json()

    // Validate emoji
    if (!emoji || typeof emoji !== 'string' || emoji.length > 10) {
      return NextResponse.json({ 
        error: 'Invalid emoji format' 
      }, { status: 400 })
    }

    // Add or update reaction (upsert)
    const { data: reaction, error: reactionError } = await supabase
      .from('axis6_chat_reactions')
      .upsert({
        message_id: messageId,
        user_id: user.id,
        emoji
      }, {
        onConflict: 'message_id,user_id,emoji'
      })
      .select(`
        *,
        user:axis6_profiles(
          id,
          name
        )
      `)
      .single()

    if (reactionError) {
      logger.error('Error adding reaction:', reactionError)
      return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 })
    }

    return NextResponse.json({ reaction }, { status: 201 })
    
  } catch (error) {
    logger.error('Add reaction API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/chat/rooms/[roomId]/messages/[messageId]/reactions - Remove a reaction
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const supabase = await createClient()
    const params = await context.params
    const { roomId: _roomId, messageId } = params
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Remove reaction auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get emoji from query parameters
    const { searchParams } = new URL(request.url)
    const emoji = searchParams.get('emoji')

    if (!emoji) {
      return NextResponse.json({ 
        error: 'Emoji parameter is required' 
      }, { status: 400 })
    }

    // Remove the specific reaction
    const { error: deleteError } = await supabase
      .from('axis6_chat_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)

    if (deleteError) {
      logger.error('Error removing reaction:', deleteError)
      return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Reaction removed successfully' })
    
  } catch (error) {
    logger.error('Remove reaction API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}