import { NextRequest, NextResponse } from 'next/server'
import { withChatAuth } from '@/lib/middleware/chat-auth'

/**
 * GET /api/chat/search
 * Search chat messages using full-text search
 */
export const GET = withChatAuth(async (context, request) => {
  try {
    const { user } = context
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q')?.trim()
    const roomId = searchParams.get('room_id')
    const senderId = searchParams.get('sender_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        stats: {
          total_results: 0,
          search_time_ms: 0,
          rooms_searched: 0
        }
      })
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const startTime = Date.now()

    // Call the search RPC function
    const { data: results, error } = await supabase.rpc('search_messages', {
      search_query: query,
      p_room_id: roomId || null,
      p_sender_id: senderId || null,
      p_date_from: dateFrom ? new Date(dateFrom).toISOString() : null,
      p_date_to: dateTo ? new Date(dateTo).toISOString() : null,
      p_limit: Math.min(limit, 100),
      p_offset: Math.max(offset, 0)
    })

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    const searchTime = Date.now() - startTime
    const parsedResults = Array.isArray(results) ? results : JSON.parse(results || '[]')

    const stats = {
      total_results: parsedResults.length,
      search_time_ms: searchTime,
      rooms_searched: new Set(parsedResults.map((r: any) => r.room_id)).size,
      ...(dateFrom && dateTo && {
        date_range: {
          from: dateFrom,
          to: dateTo
        }
      })
    }

    return NextResponse.json({
      results: parsedResults,
      stats
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * GET /api/chat/search/suggestions
 * Get search suggestions based on partial query
 */
export const POST = withChatAuth(async (context, request) => {
  try {
    const { user } = context
    const body = await request.json()
    const { partial } = body

    if (!partial || partial.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: suggestions, error } = await supabase.rpc('get_search_suggestions', {
      partial_query: partial
    })

    if (error) {
      console.error('Search suggestions error:', error)
      return NextResponse.json({ suggestions: [] })
    }

    const parsedSuggestions = Array.isArray(suggestions) ? suggestions : JSON.parse(suggestions || '[]')

    return NextResponse.json({
      suggestions: parsedSuggestions
    })

  } catch (error) {
    console.error('Search suggestions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})