import { NextRequest, NextResponse } from 'next/server'

import { withChatAuth } from '@/lib/middleware/chat-auth'

/**
 * GET /api/chat/mentions
 * Get mentions for the authenticated user
 */
export const GET = withChatAuth(async (context, request) => {
  try {
    const { user } = context
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get user mentions
    const { data: mentions, error } = await supabase.rpc('get_user_mentions', {
      p_user_id: user.id,
      p_limit: Math.min(limit, 100), // Cap at 100
      p_offset: Math.max(offset, 0)
    })

    if (error) {
      console.error('Failed to get user mentions:', error)
      return NextResponse.json(
        { error: 'Failed to get mentions' },
        { status: 500 }
      )
    }

    // Get mention statistics
    const { data: stats } = await supabase.rpc('get_mention_stats', {
      p_user_id: user.id
    })

    return NextResponse.json({
      mentions: mentions || [],
      stats: stats || {},
      pagination: {
        limit,
        offset,
        has_more: mentions?.length === limit
      }
    })

  } catch (error) {
    console.error('Mentions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/chat/mentions
 * Process mentions for a message
 */
export const POST = withChatAuth(async (context, request) => {
  try {
    const { user } = context
    const body = await request.json()
    const { message_id, mentions } = body

    if (!message_id || !Array.isArray(mentions)) {
      return NextResponse.json(
        { error: 'Message ID and mentions array are required' },
        { status: 400 }
      )
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Process mentions
    const { error } = await supabase.rpc('process_message_mentions', {
      p_message_id: message_id,
      p_mentions: mentions
    })

    if (error) {
      console.error('Failed to process mentions:', error)
      return NextResponse.json(
        { error: 'Failed to process mentions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Process mentions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * PUT /api/chat/mentions
 * Mark mentions as read
 */
export const PUT = withChatAuth(async (context, request) => {
  try {
    const { user } = context
    const body = await request.json()
    const { mention_ids } = body

    if (!Array.isArray(mention_ids)) {
      return NextResponse.json(
        { error: 'Mention IDs array is required' },
        { status: 400 }
      )
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Mark mentions as read
    const { data: updatedCount, error } = await supabase.rpc('mark_mentions_read', {
      p_mention_ids: mention_ids
    })

    if (error) {
      console.error('Failed to mark mentions as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark mentions as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated_count: updatedCount || 0
    })

  } catch (error) {
    console.error('Mark mentions read error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})