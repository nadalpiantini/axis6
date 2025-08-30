import { logger } from '@/lib/utils/logger';

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const createPostSchema = z.object({
  categoryId: z.number().int().positive(),
  content: z.string().min(1).max(140),
  minutes: z.number().int().min(0).max(600).optional(),
  privacy: z.enum(['public', 'followers', 'private']).default('public')
})

const feedQuerySchema = z.object({
  axis: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
  privacy: z.enum(['public', 'followers', 'all']).default('public')
})

// POST /api/micro-posts - Create a micro post
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await _request.json()
    const validatedData = createPostSchema.parse(body)

    // Get category info for axis slug
    const { data: category, error: categoryError } = await supabase
      .from('axis6_categories')
      .select('id, slug, name, color')
      .eq('id', validatedData.categoryId)
      .single()

    if (categoryError || !category) {
      return NextResponse.json({
        error: 'Invalid category',
        details: 'Category not found'
      }, { status: 400 })
    }

    // Create micro post
    const { data: post, error: postError } = await supabase
      .from('axis6_micro_posts')
      .insert({
        user_id: user.id,
        category_id: validatedData.categoryId,
        content: validatedData.content.trim(),
        minutes: validatedData.minutes,
        privacy: validatedData.privacy
      })
      .select(`
        id,
        content,
        minutes,
        privacy,
        glow_score,
        created_at,
        category_id
      `)
      .single()

    if (postError) {
      logger.error('Error creating micro post:', postError)
      return NextResponse.json({
        error: 'Failed to create post',
        details: postError.message
      }, { status: 500 })
    }

    // Return created post with category info
    return NextResponse.json({
      success: true,
      post: {
        ...post,
        category: {
          slug: category.slug,
          name: category.name,
          color: category.color
        },
        author: {
          id: user.id,
          email: user.email
        }
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    logger.error('Micro post creation error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to create post'
    }, { status: 500 })
  }
}

// GET /api/micro-posts - Get micro posts feed
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Parse query parameters
    const { searchParams } = new URL(_request.url)
    const queryParams = {
      axis: searchParams.get('axis') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      privacy: (searchParams.get('privacy') || 'public') as 'public' | 'followers' | 'all'
    }

    const validatedQuery = feedQuerySchema.parse(queryParams)

    // Build query
    let query = supabase
      .from('axis6_micro_posts')
      .select(`
        id,
        content,
        minutes,
        privacy,
        glow_score,
        created_at,
        category_id,
        axis6_categories!inner (
          id,
          slug,
          name,
          color
        ),
        axis6_profiles!inner (
          id,
          name
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(validatedQuery.offset, validatedQuery.offset + validatedQuery.limit - 1)

    // Filter by axis if specified
    if (validatedQuery.axis) {
      query = query.eq('axis6_categories.slug', validatedQuery.axis)
    }

    // Apply privacy filter
    if (validatedQuery.privacy === 'public') {
      query = query.eq('privacy', 'public')
    }

    const { data: posts, error: postsError } = await query

    if (postsError) {
      logger.error('Error fetching micro posts:', postsError)
      return NextResponse.json({
        error: 'Failed to fetch posts',
        details: postsError.message
      }, { status: 500 })
    }

    // Transform data for frontend
    const transformedPosts = posts?.map((post: any) => ({
      id: post.id,
      content: post.content,
      minutes: post.minutes,
      privacy: post.privacy,
      glowScore: post.glow_score,
      createdAt: post.created_at,
      category: {
        id: post.category_id,
        slug: post.axis6_categories.slug,
        name: post.axis6_categories.name,
        color: post.axis6_categories.color
      },
      author: {
        id: post.axis6_profiles.id,
        name: post.axis6_profiles.name
      }
    })) || []

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      pagination: {
        offset: validatedQuery.offset,
        limit: validatedQuery.limit,
        hasMore: posts?.length === validatedQuery.limit
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 })
    }

    logger.error('Micro posts feed error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch posts feed'
    }, { status: 500 })
  }
}
