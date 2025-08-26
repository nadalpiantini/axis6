import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// GET /api/chat/rooms - Get user's chat rooms
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Chat rooms auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // Filter by room type
    const categoryId = searchParams.get('categoryId') // Filter by category
    
    let query = supabase
      .from('axis6_chat_rooms')
      .select(`
        *,
        participants:axis6_chat_participants!inner(
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
        last_message:axis6_chat_messages(
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
      .eq('participants.user_id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })

    // Filter by type if provided
    if (type && ['direct', 'category', 'group', 'support'].includes(type)) {
      query = query.eq('type', type)
    }

    // Filter by category if provided
    if (categoryId) {
      query = query.eq('category_id', parseInt(categoryId))
    }

    const { data: rooms, error } = await query
    
    if (error) {
      logger.error('Error fetching chat rooms:', error)
      return NextResponse.json({ error: 'Failed to fetch chat rooms' }, { status: 500 })
    }

    return NextResponse.json({ rooms: rooms || [] })
    
  } catch (error) {
    logger.error('Chat rooms API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/chat/rooms - Create a new chat room
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Chat room creation auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { 
      name, 
      description, 
      type, 
      categoryId, 
      maxParticipants,
      inviteUserIds = []
    } = await request.json()

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json({ 
        error: 'Missing required fields: name and type' 
      }, { status: 400 })
    }

    // Validate type
    if (!['direct', 'category', 'group', 'support'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid room type' 
      }, { status: 400 })
    }

    // Create the chat room
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

    if (roomError) {
      logger.error('Error creating chat room:', roomError)
      return NextResponse.json({ 
        error: 'Failed to create chat room' 
      }, { status: 500 })
    }

    // Add creator as admin participant
    const { error: creatorError } = await supabase
      .from('axis6_chat_participants')
      .insert({
        room_id: room.id,
        user_id: user.id,
        role: 'admin'
      })

    if (creatorError) {
      logger.error('Error adding creator to chat room:', creatorError)
      // Still return the room, but log the error
    }

    // Add invited users as members (if any)
    if (inviteUserIds.length > 0) {
      const inviteParticipants = inviteUserIds.map((userId: string) => ({
        room_id: room.id,
        user_id: userId,
        role: 'member'
      }))

      const { error: inviteError } = await supabase
        .from('axis6_chat_participants')
        .insert(inviteParticipants)

      if (inviteError) {
        logger.error('Error inviting users to chat room:', inviteError)
        // Continue anyway, invites can be sent later
      }
    }

    return NextResponse.json({ room }, { status: 201 })
    
  } catch (error) {
    logger.error('Chat room creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}