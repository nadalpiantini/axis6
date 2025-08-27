import { logger } from '@/lib/utils/logger';

import { NextRequest, NextResponse } from 'next/server'

import { withChatAuth } from '@/lib/middleware/chat-auth'

/**
 * GET /api/chat/analytics
 * Get comprehensive chat analytics for the authenticated user
 */
export const GET = withChatAuth(async (context, request) => {
  try {
    const { user } = context
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type') // 'overview', 'room', 'user', 'realtime'
    const roomId = searchParams.get('room_id')

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    let data, error

    switch (type) {
      case 'room':
        if (!roomId) {
          return NextResponse.json(
            { error: 'Room ID is required for room analytics' },
            { status: 400 }
          )
        }
        
        const { data: roomData, error: roomError } = await supabase.rpc('get_room_analytics', {
          p_room_id: roomId
        })
        data = roomData
        error = roomError
        break

      case 'user':
        const { data: userData, error: userError } = await supabase.rpc('get_user_analytics')
        data = userData
        error = userError
        break

      case 'realtime':
        const { data: realtimeData, error: realtimeError } = await supabase.rpc('get_realtime_metrics')
        data = realtimeData
        error = realtimeError
        break

      default:
        // Default to comprehensive analytics
        const { data: analyticsData, error: analyticsError } = await supabase.rpc('get_chat_analytics')
        data = analyticsData
        error = analyticsError
        break
    }

    if (error) {
      logger.error('Analytics error:', error)
      return NextResponse.json(
        { error: 'Failed to get analytics' },
        { status: 500 }
      )
    }

    // Parse JSON if it's a string
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data

    return NextResponse.json(parsedData || {})

  } catch (error) {
    logger.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/chat/analytics/export
 * Export analytics data in different formats
 */
export const POST = withChatAuth(async (context, request) => {
  try {
    const { user } = context
    const body = await request.json()
    const { format = 'json' } = body

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: analytics, error } = await supabase.rpc('get_chat_analytics')

    if (error) {
      logger.error('Export analytics error:', error)
      return NextResponse.json(
        { error: 'Failed to export analytics' },
        { status: 500 }
      )
    }

    const parsedAnalytics = typeof analytics === 'string' ? JSON.parse(analytics) : analytics

    if (format === 'csv') {
      // Convert to CSV format
      const headers = ['Metric', 'Value']
      const rows = [
        ['Total Messages', parsedAnalytics?.overview?.total_messages || 0],
        ['Total Rooms', parsedAnalytics?.overview?.total_rooms || 0],
        ['Active Participants', parsedAnalytics?.overview?.active_participants || 0],
        ['Messages Today', parsedAnalytics?.overview?.messages_today || 0],
        ['Growth Rate (%)', parsedAnalytics?.overview?.growth_rate || 0],
        ['Avg Messages Per User', parsedAnalytics?.engagement?.avg_messages_per_user || 0],
        ['Avg Response Time (min)', parsedAnalytics?.engagement?.avg_response_time_minutes || 0],
        ['Total Files Shared', parsedAnalytics?.engagement?.file_sharing_stats?.total_files || 0],
        ['Total File Size (MB)', parsedAnalytics?.engagement?.file_sharing_stats?.total_size_mb || 0],
        ['Mentions Given', parsedAnalytics?.social?.mentions_given || 0],
        ['Mentions Received', parsedAnalytics?.social?.mentions_received || 0],
        ['Total Searches', parsedAnalytics?.search?.total_searches || 0],
        ['Avg Results Per Search', parsedAnalytics?.search?.avg_results_per_search || 0],
        ['Search Success Rate (%)', parsedAnalytics?.search?.search_success_rate || 0]
      ]

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=chat-analytics.csv'
        }
      })
    }

    // Default to JSON export
    return NextResponse.json(parsedAnalytics, {
      headers: {
        'Content-Disposition': 'attachment; filename=chat-analytics.json'
      }
    })

  } catch (error) {
    logger.error('Export analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})