
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

import { smartNotificationService } from '@/lib/ai/smart-notifications'
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ai/smart-notifications
 * Get pending smart notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const includeDelivered = searchParams.get('include_delivered') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch notifications from database
    let query = supabase
      .from('axis6_smart_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(limit)

    if (!includeDelivered) {
      query = query.eq('delivered', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications || [],
        count: notifications?.length || 0
      }
    })
  } catch (error) {
    logger.error('Smart notifications fetch error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/smart-notifications/generate
 * Generate new personalized notifications for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      lookAheadHours = 24,
      force_regenerate = false,
      context = null
    } = body

    const startTime = Date.now()

    let notifications = []

    if (context) {
      // Generate contextual notifications
      notifications = await smartNotificationService.generateContextualNotifications(
        user.id,
        context
      )
    } else {
      // Generate standard personalized notifications
      notifications = await smartNotificationService.generatePersonalizedNotifications(
        user.id,
        lookAheadHours
      )
    }

    const responseTime = Date.now() - startTime

    // Track usage
    await supabase.rpc('track_ai_feature_usage', {
      target_user_id: user.id,
      feature_name: 'smart_notifications',
      response_time_ms: responseTime,
      was_successful: notifications.length > 0,
      confidence_score: notifications.length > 0 
        ? notifications.reduce((sum, n) => sum + n.personalization_score, 0) / notifications.length
        : null
    })

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        meta: {
          generation_time_ms: responseTime,
          notifications_generated: notifications.length,
          average_personalization_score: notifications.length > 0 
            ? notifications.reduce((sum, n) => sum + n.personalization_score, 0) / notifications.length
            : 0,
          lookAheadHours
        }
      }
    })
  } catch (error) {
    logger.error('Smart notifications generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/ai/smart-notifications/:id
 * Mark notification as read or delivered
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      notification_id,
      action, // 'mark_read', 'mark_delivered', 'dismiss'
      feedback = null
    } = body

    if (!notification_id || !action) {
      return NextResponse.json(
        { error: 'notification_id and action are required' },
        { status: 400 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'mark_read':
        updateData = { read: true, read_at: new Date().toISOString() }
        break
      case 'mark_delivered':
        updateData = { delivered: true, delivered_at: new Date().toISOString() }
        break
      case 'dismiss':
        updateData = { read: true, read_at: new Date().toISOString(), delivered: true, delivered_at: new Date().toISOString() }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update notification
    const { error: updateError } = await supabase
      .from('axis6_smart_notifications')
      .update(updateData)
      .eq('id', notification_id)
      .eq('user_id', user.id)

    if (updateError) {
      throw updateError
    }

    // Store feedback if provided
    if (feedback) {
      await supabase
        .from('axis6_ai_feedback')
        .insert({
          user_id: user.id,
          feature_type: 'smart_notification',
          feature_id: notification_id,
          feedback_type: feedback.type || 'implicit',
          rating: feedback.rating,
          thumbs: feedback.thumbs,
          comment: feedback.comment,
          action_taken: action === 'mark_read',
          time_to_action: feedback.time_to_action
        })
    }

    return NextResponse.json({
      success: true,
      message: `Notification ${action} successfully`
    })
  } catch (error) {
    logger.error('Notification update error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}