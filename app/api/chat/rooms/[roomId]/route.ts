import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

// GET /api/chat/rooms/[roomId] - Get specific chat room details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string  }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await params
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Chat room details auth error:', authError)
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

    // Get room details with participants
    const { data: room, error: roomError } = await supabase
      .from('axis6_chat_rooms')
      .select(`
        *,
        participants:axis6_chat_participants(
          id,
          role,
          joined_at,
          last_seen,
          is_muted,
          notification_settings,
          profile:axis6_profiles(
            id,
            name
          )
        ),
        category:axis6_categories(
          id,
          name,
          slug,
          color,
          icon
        ),
        creator:axis6_profiles(
          id,
          name
        )
      `)
      .eq('id', roomId)
      .single()

    if (roomError) {
      logger.error('Error fetching chat room details:', roomError)
      return NextResponse.json({ error: 'Failed to fetch room details' }, { status: 500 })
    }

    return NextResponse.json({ room })
    
  } catch (error) {
    logger.error('Chat room details API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/chat/rooms/[roomId] - Update chat room
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string  }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await params
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Chat room update auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin privileges
    const { data: participation, error: participationError } = await supabase
      .from('axis6_chat_participants')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single()

    if (participationError || !participation || participation.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const { name, description, isActive, maxParticipants } = await _request.json()

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.is_active = isActive
    if (maxParticipants !== undefined) updateData.max_participants = maxParticipants

    // Update the room
    const { data: room, error: updateError } = await supabase
      .from('axis6_chat_rooms')
      .update(updateData)
      .eq('id', roomId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating chat room:', updateError)
      return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
    }

    return NextResponse.json({ room })
    
  } catch (error) {
    logger.error('Chat room update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/chat/rooms/[roomId] - Delete/deactivate chat room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string  }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await params
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Chat room delete auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the creator or has admin privileges
    const { data: room, error: roomError } = await supabase
      .from('axis6_chat_rooms')
      .select('creator_id')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const { data: participation } = await supabase
      .from('axis6_chat_participants')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single()

    const isCreator = room.creator_id === user.id
    const isAdmin = participation?.role === 'admin'

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Soft delete by setting is_active to false
    const { error: deactivateError } = await supabase
      .from('axis6_chat_rooms')
      .update({ is_active: false })
      .eq('id', roomId)

    if (deactivateError) {
      logger.error('Error deactivating chat room:', deactivateError)
      return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Room deleted successfully' })
    
  } catch (error) {
    logger.error('Chat room delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}