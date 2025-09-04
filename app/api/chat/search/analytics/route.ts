import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server'
import { withChatAuth } from '@/lib/middleware/chat-auth'

/**
 * GET /api/chat/search/analytics
 * Get search analytics for the authenticated user
 */
export const GET = withChatAuth(async (context, _request) => {
  try {
    const { user } = context
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient() // Uses service role for internal operations
    const { data: analytics, error } = await supabase.rpc('get_user_search_analytics')
    if (error) {
      logger.error('Search analytics error:', error)
      return NextResponse.json(
        { error: 'Failed to get search analytics' },
        { status: 500 }
      )
    }
    const parsedAnalytics = typeof analytics === 'string' ? JSON.parse(analytics) : analytics
    return NextResponse.json(parsedAnalytics || {
      total_searches: 0,
      most_searched_terms: [],
      search_frequency_by_day: [],
      average_results_per_search: 0
    })
  } catch (error) {
    logger.error('Search analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
