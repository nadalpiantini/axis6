import { logger } from '@/lib/utils/logger';

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const createReactionSchema = z.object({
  postId: z.string().uuid(),
  axisType: z.enum(['physical', 'mental', 'emotional', 'social', 'spiritual', 'material'])
})

// POST /api/hex-reactions - Add hex-star reaction to a post
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
    const validatedData = createReactionSchema.parse(body)

    // Check if post exists and is accessible
    const { data: post, error: postError } = await supabase
      .from('axis6_micro_posts')
      .select('id, user_id, privacy, glow_score')
      .eq('id', validatedData.postId)
      .is('deleted_at', null)
      .single()

    if (postError || !post) {
      return NextResponse.json({ 
        error: 'Post not found',
        details: 'Post does not exist or is not accessible'
      }, { status: 404 })
    }

    // Check privacy permissions (simplified for now - public posts only)
    if (post.privacy !== 'public' && post.user_id !== user.id) {
      return NextResponse.json({ 
        error: 'Access denied',
        details: 'You cannot react to this post'
      }, { status: 403 })
    }

    // Create hex reaction (idempotent - one reaction per user per post per axis type)
    const { data: reaction, error: reactionError } = await supabase
      .from('axis6_hex_reactions')
      .upsert({
        post_id: validatedData.postId,
        user_id: user.id,
        axis_type: validatedData.axisType
      }, {
        onConflict: 'post_id,user_id,axis_type'
      })
      .select('id, created_at')
      .single()

    if (reactionError) {
      logger.error('Error creating hex reaction:', reactionError)
      return NextResponse.json({ 
        error: 'Failed to add reaction',
        details: reactionError.message 
      }, { status: 500 })
    }

    // Update glow score on the post
    const { error: updateError } = await supabase
      .from('axis6_micro_posts')
      .update({ 
        glow_score: (post.glow_score || 0) + 1 
      })
      .eq('id', validatedData.postId)

    if (updateError) {
      logger.warn('Failed to update glow score:', updateError)
      // Don't fail the request, just log the warning
    }

    return NextResponse.json({
      success: true,
      reaction: {
        id: reaction.id,
        postId: validatedData.postId,
        axisType: validatedData.axisType,
        createdAt: reaction.created_at
      },
      message: 'Hex-star added!'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    logger.error('Hex reaction creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to add reaction'
    }, { status: 500 })
  }
}

// DELETE /api/hex-reactions - Remove hex-star reaction from a post
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const axisType = searchParams.get('axisType')

    if (!postId || !axisType) {
      return NextResponse.json({ 
        error: 'Missing parameters',
        details: 'postId and axisType are required'
      }, { status: 400 })
    }

    // Validate axis type
    const validAxisTypes = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material']
    if (!validAxisTypes.includes(axisType)) {
      return NextResponse.json({ 
        error: 'Invalid axis type',
        details: `Axis type must be one of: ${validAxisTypes.join(', ')}`
      }, { status: 400 })
    }

    // Remove the reaction
    const { data: deletedReaction, error: deleteError } = await supabase
      .from('axis6_hex_reactions')
      .delete()
      .match({
        post_id: postId,
        user_id: user.id,
        axis_type: axisType
      })
      .select('post_id')

    if (deleteError) {
      logger.error('Error removing hex reaction:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to remove reaction',
        details: deleteError.message 
      }, { status: 500 })
    }

    // Update glow score on the post (decrease by 1)
    if (deletedReaction && deletedReaction.length > 0) {
      const { error: updateError } = await supabase
        .from('axis6_micro_posts')
        .update({ 
          glow_score: Math.max(0, (await supabase
            .from('axis6_micro_posts')
            .select('glow_score')
            .eq('id', postId)
            .single()
          ).data?.glow_score - 1 || 0)
        })
        .eq('id', postId)

      if (updateError) {
        logger.warn('Failed to update glow score:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Hex-star removed'
    })

  } catch (error) {
    logger.error('Hex reaction deletion error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to remove reaction'
    }, { status: 500 })
  }
}