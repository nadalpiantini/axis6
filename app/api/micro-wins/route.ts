import { logger } from '@/lib/utils/logger';

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const createMicroWinSchema = z.object({
  axis: z.enum(['physical', 'mental', 'emotional', 'social', 'spiritual', 'material']),
  winText: z.string().min(1).max(140).transform(str => str.trim()),
  minutes: z.number().int().optional().refine(
    val => !val || [5, 10, 15, 25, 45].includes(val),
    { message: 'Minutes must be 5, 10, 15, 25, or 45' }
  ),
  privacy: z.enum(['public', 'followers', 'private']).default('public'),
  isMorning: z.boolean().default(false)
})

const feedQuerySchema = z.object({
  feedType: z.enum(['all', 'following', 'my']).default('all'),
  axis: z.enum(['physical', 'mental', 'emotional', 'social', 'spiritual', 'material']).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0)
})

// POST /api/micro-wins - Record a micro win
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createMicroWinSchema.parse(body)

    // Call RPC function to record micro win
    const { data, error } = await supabase.rpc('record_micro_win', {
      p_user_id: user.id,
      p_axis: validatedData.axis,
      p_win_text: validatedData.winText,
      p_minutes: validatedData.minutes || null,
      p_privacy: validatedData.privacy,
      p_is_morning: validatedData.isMorning
    })

    if (error) {
      logger.error('Error recording micro win:', error)
      
      // Check if it's outside morning window
      if (error.message?.includes('morning window')) {
        return NextResponse.json({ 
          error: 'Morning ritual window is 4:45-5:30 AM',
          details: 'You can still record a regular micro win'
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to record micro win',
        details: error.message 
      }, { status: 500 })
    }

    // Get the result from RPC function
    const result = data?.[0]
    if (!result?.success) {
      return NextResponse.json({ 
        error: result?.message || 'Failed to record micro win'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      winId: result.win_id,
      message: result.message,
      streakUpdated: result.streak_updated
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    logger.error('Micro win creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to record micro win'
    }, { status: 500 })
  }
}

// GET /api/micro-wins - Get micro wins feed
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      feedType: searchParams.get('feedType') || 'all',
      axis: searchParams.get('axis') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    }
    
    const validatedQuery = feedQuerySchema.parse(queryParams)

    // Call RPC function to get feed
    const { data: feedData, error: feedError } = await supabase.rpc('get_micro_wins_feed', {
      p_user_id: user.id,
      p_feed_type: validatedQuery.feedType,
      p_axis: validatedQuery.axis || null,
      p_limit: validatedQuery.limit,
      p_offset: validatedQuery.offset
    })

    if (feedError) {
      logger.error('Error fetching micro wins feed:', feedError)
      return NextResponse.json({ 
        error: 'Failed to fetch feed',
        details: feedError.message 
      }, { status: 500 })
    }

    // Transform data for frontend
    const transformedFeed = feedData?.map((item: any) => ({
      id: item.win_id,
      userId: item.user_id,
      userName: item.user_name,
      axis: item.axis_slug,
      axisColor: item.axis_color,
      winText: item.win_text,
      minutes: item.minutes,
      isMorning: item.is_morning,
      resonanceCount: item.resonance_count,
      createdAt: item.created_at,
      userReacted: item.user_reacted
    })) || []

    return NextResponse.json({
      success: true,
      feed: transformedFeed,
      pagination: {
        offset: validatedQuery.offset,
        limit: validatedQuery.limit,
        hasMore: feedData?.length === validatedQuery.limit
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 })
    }

    logger.error('Micro wins feed error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to fetch feed'
    }, { status: 500 })
  }
}

// PATCH /api/micro-wins/[id]/react - Add reaction to micro win
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get win ID from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const winId = pathSegments[pathSegments.length - 2] // Get ID before /react

    if (!winId) {
      return NextResponse.json({ error: 'Win ID required' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { reactionType = 'hex_star', axisResonance } = body

    // Create or update reaction
    const { error: reactionError } = await supabase
      .from('axis6_micro_reactions')
      .upsert({
        micro_win_id: winId,
        user_id: user.id,
        reaction_type: reactionType,
        axis_resonance: axisResonance
      }, {
        onConflict: 'micro_win_id,user_id,reaction_type'
      })

    if (reactionError) {
      logger.error('Error adding reaction:', reactionError)
      return NextResponse.json({ 
        error: 'Failed to add reaction',
        details: reactionError.message 
      }, { status: 500 })
    }

    // Update resonance count
    const { error: updateError } = await supabase
      .from('axis6_micro_wins')
      .update({ 
        resonance_count: supabase.raw('resonance_count + 1')
      })
      .eq('id', winId)

    if (updateError) {
      logger.error('Error updating resonance count:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Reaction added'
    })

  } catch (error) {
    logger.error('Reaction error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to add reaction'
    }, { status: 500 })
  }
}