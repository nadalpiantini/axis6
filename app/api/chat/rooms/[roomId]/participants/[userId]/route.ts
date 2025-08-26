import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// PUT /api/chat/rooms/[roomId]/participants/[userId] - Update participant role or settings
export async function PUT(
  request: NextRequest,
  { params }: { params: { roomId: string; userId: string } }
) {
  try {
    const supabase = await createClient()
    const { roomId, userId } = params
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Update participant auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user has admin privileges or is updating their own settings
    const { data: currentUserParticipation, error: currentParticipationError } = await supabase
      .from('axis6_chat_participants')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single()

    if (currentParticipationError || !currentUserParticipation) {
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 })
    }

    // Parse request body
    const { role, isMuted, notificationSettings } = await request.json()

    const isSelfUpdate = userId === user.id
    const hasAdminPrivileges = ['admin', 'moderator'].includes(currentUserParticipation.role)

    // For role changes, user must have admin privileges and not be changing their own role
    if (role !== undefined) {
      if (!hasAdminPrivileges || isSelfUpdate) {
        return NextResponse.json({ error: 'Insufficient permissions to change roles' }, { status: 403 })
      }
      
      if (!['admin', 'moderator', 'member'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
    }

    // For other settings, user can update their own or admin can update others
    if (!isSelfUpdate && !hasAdminPrivileges) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if target participant exists
    const { data: targetParticipant, error: targetError } = await supabase
      .from('axis6_chat_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single()

    if (targetError || !targetParticipant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    // Build update object
    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (isMuted !== undefined) updateData.is_muted = isMuted
    if (notificationSettings !== undefined) updateData.notification_settings = notificationSettings

    // Update participant
    const { data: participant, error: updateError } = await supabase
      .from('axis6_chat_participants')
      .update(updateData)
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .select(`
        *,
        profile:axis6_profiles(
          id,
          name
        )
      `)
      .single()

    if (updateError) {
      logger.error('Error updating participant:', updateError)
      return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 })
    }

    return NextResponse.json({ participant })
    
  } catch (error) {
    logger.error('Update participant API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/chat/rooms/[roomId]/participants/[userId] - Remove participant from room
export async function DELETE(
  request: NextRequest,
  { params }: { params: { roomId: string; userId: string } }
) {
  try {
    const supabase = await createClient()
    const { roomId, userId } = params
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Remove participant auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSelfRemoval = userId === user.id

    // Check permissions
    if (!isSelfRemoval) {
      const { data: currentUserParticipation, error: currentParticipationError } = await supabase
        .from('axis6_chat_participants')
        .select('role')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single()

      if (currentParticipationError || !currentUserParticipation || 
          !['admin', 'moderator'].includes(currentUserParticipation.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Check if target participant exists
    const { data: targetParticipant, error: targetError } = await supabase
      .from('axis6_chat_participants')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single()

    if (targetError || !targetParticipant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    // Prevent removing the last admin
    if (targetParticipant.role === 'admin') {
      const { count, error: adminCountError } = await supabase
        .from('axis6_chat_participants')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('role', 'admin')

      if (adminCountError || (count && count <= 1)) {
        return NextResponse.json({ 
          error: 'Cannot remove the last admin from the room' 
        }, { status: 400 })
      }
    }

    // Remove participant
    const { error: removeError } = await supabase
      .from('axis6_chat_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)

    if (removeError) {
      logger.error('Error removing participant:', removeError)
      return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Participant removed successfully' })
    
  } catch (error) {
    logger.error('Remove participant API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}