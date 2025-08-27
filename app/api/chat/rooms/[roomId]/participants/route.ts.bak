import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

// GET /api/chat/rooms/[roomId]/participants - Get room participants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await params
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Get participants auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a participant in this room
    const { data: userParticipation, error: participationError } = await supabase
      .from('axis6_chat_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single()

    if (participationError || !userParticipation) {
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 })
    }

    // Get all participants
    const { data: participants, error } = await supabase
      .from('axis6_chat_participants')
      .select(`
        *,
        profile:axis6_profiles(
          id,
          name
        )
      `)
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true })

    if (error) {
      logger.error('Error fetching participants:', error)
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
    }

    return NextResponse.json({ participants: participants || [] })
    
  } catch (error) {
    logger.error('Get participants API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/chat/rooms/[roomId]/participants - Add participant to room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const supabase = await createClient()
    const { roomId } = await params
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Add participant auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin privileges in this room
    const { data: userParticipation, error: participationError } = await supabase
      .from('axis6_chat_participants')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single()

    if (participationError || !userParticipation || !['admin', 'moderator'].includes(userParticipation.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const { userId, role = 'member' } = await request.json()

    // Validate user ID
    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 })
    }

    // Validate role
    if (!['admin', 'moderator', 'member'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role' 
      }, { status: 400 })
    }

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from('axis6_profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check room capacity
    const { data: room, error: roomError } = await supabase
      .from('axis6_chat_rooms')
      .select('max_participants')
      .eq('id', roomId)
      .single()

    if (roomError) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.max_participants) {
      const { count, error: countError } = await supabase
        .from('axis6_chat_participants')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)

      if (countError || (count && count >= room.max_participants)) {
        return NextResponse.json({ error: 'Room is full' }, { status: 400 })
      }
    }

    // Add participant
    const { data: participant, error: addError } = await supabase
      .from('axis6_chat_participants')
      .insert({
        room_id: roomId,
        user_id: userId,
        role
      })
      .select(`
        *,
        profile:axis6_profiles(
          id,
          name
        )
      `)
      .single()

    if (addError) {
      if (addError.code === '23505') { // Duplicate key
        return NextResponse.json({ error: 'User is already a participant' }, { status: 409 })
      }
      logger.error('Error adding participant:', addError)
      return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 })
    }

    return NextResponse.json({ participant }, { status: 201 })
    
  } catch (error) {
    logger.error('Add participant API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}