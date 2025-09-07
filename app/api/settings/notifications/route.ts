import { logger } from '@/lib/utils/logger';

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/error/standardErrorHandler'
interface NotificationPreference {
  notification_type: string
  delivery_channels: string[]
  enabled: boolean
  frequency: 'high' | 'optimal' | 'low' | 'off'
  priority_filter: 'all' | 'high' | 'medium' | 'critical'
  quiet_hours: {
    enabled: boolean
    start: string
    end: string
  }
  optimal_timing: boolean
  category_focus?: number[]
  temperament_based: boolean
}
// GET: Fetch notification preferences
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data, error } = await supabase
      .from('axis6_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
    if (error) {
      throw error
    }
    // Transform database format to UI format
    const preferences: Record<string, NotificationPreference> = {}
    if (data && data.length > 0) {
      data.forEach((pref) => {
        preferences[pref.notification_type] = {
          notification_type: pref.notification_type,
          delivery_channels: pref.delivery_channels || ['in_app'],
          enabled: pref.enabled,
          frequency: pref.frequency || 'optimal',
          priority_filter: pref.priority_filter || 'medium',
          quiet_hours: pref.quiet_hours || { enabled: false, start: '22:00', end: '07:00' },
          optimal_timing: pref.optimal_timing !== false,
          category_focus: pref.category_focus,
          temperament_based: pref.temperament_based !== false
        }
      })
    } else {
      // Return default preferences if none exist
      const defaultTypes = [
        'daily_reminder', 'streak_milestone', 'achievement', 
        'ai_insight', 'goal_progress', 'category_focus'
      ]
      defaultTypes.forEach((type) => {
        preferences[type] = {
          notification_type: type,
          delivery_channels: ['in_app'],
          enabled: true,
          frequency: 'optimal',
          priority_filter: 'medium',
          quiet_hours: { enabled: true, start: '22:00', end: '07:00' },
          optimal_timing: true,
          temperament_based: true
        }
      })
    }
    return NextResponse.json({ preferences })
  } catch (error) {
    logger.error('Notification preferences fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}
// PUT: Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { preferences } = body
    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences data is required' },
        { status: 400 }
      )
    }
    // Transform UI format to database format and upsert each preference
    const upsertPromises = Object.values(preferences).map((pref: any) => {
      return supabase
        .from('axis6_notification_preferences')
        .upsert({
          user_id: user.id,
          notification_type: pref.notification_type,
          delivery_channels: pref.delivery_channels,
          enabled: pref.enabled,
          frequency: pref.frequency,
          priority_filter: pref.priority_filter,
          quiet_hours: pref.quiet_hours,
          optimal_timing: pref.optimal_timing,
          category_focus: pref.category_focus,
          temperament_based: pref.temperament_based,
          updated_at: new Date().toISOString()
        })
    })
    const results = await Promise.all(upsertPromises)
    // Check for any errors
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      throw new Error(`Failed to update some preferences: ${errors.map(e => e.error?.message).join(', ')}`)
    }
    return NextResponse.json({ 
      message: 'Notification preferences updated successfully',
      count: results.length
    })
  } catch (error) {
    handleError(error, {
      operation: 'update_notification_preferences',
      component: 'api_route',
      userMessage: 'Failed to update notification preferences'
    })
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
// POST: Initialize default notification preferences for new user
export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const defaultTypes = [
      'daily_reminder', 'streak_milestone', 'achievement', 
      'ai_insight', 'goal_progress', 'category_focus'
    ]
    const defaultPreferences = defaultTypes.map(type => ({
      user_id: user.id,
      notification_type: type,
      delivery_channels: ['in_app'],
      enabled: true,
      frequency: 'optimal',
      priority_filter: 'medium',
      quiet_hours: { enabled: true, start: '22:00', end: '07:00' },
      optimal_timing: true,
      temperament_based: true
    }))
    const { error } = await supabase
      .from('axis6_notification_preferences')
      .insert(defaultPreferences)
    if (error) {
      throw error
    }
    return NextResponse.json({ 
      message: 'Default notification preferences initialized successfully',
      count: defaultPreferences.length
    })
  } catch (error) {
    handleError(error, {
      operation: 'initialize_notification_preferences',
      component: 'api_route',
      userMessage: 'Failed to initialize notification preferences'
    })
    return NextResponse.json(
      { error: 'Failed to initialize notification preferences' },
      { status: 500 }
    )
  }
}