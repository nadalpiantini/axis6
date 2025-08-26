import { logger } from '@/lib/utils/logger';

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { behavioralAnalyzer } from '@/lib/ai/behavioral-analyzer'
import { smartNotificationService } from '@/lib/ai/smart-notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ai/optimal-times
 * Predict optimal check-in times for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const startTime = Date.now()

    // Predict optimal times
    const optimalTimes = await behavioralAnalyzer.predictOptimalTimes(user.id)
    
    const responseTime = Date.now() - startTime

    // Track usage
    await supabase.rpc('track_ai_feature_usage', {
      target_user_id: user.id,
      feature_name: 'optimal_time_prediction',
      response_time_ms: responseTime,
      was_successful: optimalTimes.best_times.length > 0,
      confidence_score: optimalTimes.best_times.length > 0 
        ? optimalTimes.best_times.reduce((sum, t) => sum + t.probability, 0) / optimalTimes.best_times.length
        : null
    })

    return NextResponse.json({
      success: true,
      data: {
        optimal_times: optimalTimes.best_times,
        personalized_reminders: optimalTimes.personalized_reminders,
        meta: {
          analysis_time_ms: responseTime,
          time_slots_found: optimalTimes.best_times.length,
          average_probability: optimalTimes.best_times.length > 0 
            ? optimalTimes.best_times.reduce((sum, t) => sum + t.probability, 0) / optimalTimes.best_times.length
            : 0
        }
      }
    })
  } catch (error) {
    logger.error('Optimal times prediction API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to predict optimal times',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/optimal-times/reminders
 * Generate adaptive reminders based on optimal times
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
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
      enable_reminders = true,
      preferred_hours = null, // User can override with preferred hours
      reminder_types = ['daily_checkin', 'streak_maintenance']
    } = body

    const startTime = Date.now()

    // Generate adaptive reminders
    const reminders = await smartNotificationService.generateAdaptiveReminders(user.id)
    
    // If user provided preferred hours, filter reminders
    let filteredReminders = reminders
    if (preferred_hours && Array.isArray(preferred_hours)) {
      filteredReminders = reminders.filter(reminder => {
        const reminderHour = new Date(reminder.scheduled_for).getHours()
        return preferred_hours.includes(reminderHour)
      })
    }

    const responseTime = Date.now() - startTime

    // Store adaptive reminders in database if enabled
    if (enable_reminders && filteredReminders.length > 0) {
      const reminderRows = filteredReminders.map(reminder => {
        const scheduledTime = new Date(reminder.scheduled_for)
        return {
          user_id: user.id,
          type: 'daily_checkin',
          optimal_time_hour: scheduledTime.getHours(),
          optimal_days_of_week: [1, 2, 3, 4, 5, 6, 7], // All days
          message_template: reminder.message,
          personalization_tokens: {
            user_id: user.id,
            personalization_score: reminder.personalization_score,
            optimal_time: reminder.metadata?.optimal_time || false
          },
          is_active: true
        }
      })

      // Clear existing reminders first
      await supabase
        .from('axis6_adaptive_reminders')
        .delete()
        .eq('user_id', user.id)

      // Insert new reminders
      const { error: insertError } = await supabase
        .from('axis6_adaptive_reminders')
        .insert(reminderRows)

      if (insertError) {
        logger.error('Failed to store adaptive reminders:', insertError)
      }
    }

    // Track usage
    await supabase.rpc('track_ai_feature_usage', {
      target_user_id: user.id,
      feature_name: 'adaptive_reminders',
      response_time_ms: responseTime,
      was_successful: filteredReminders.length > 0,
      confidence_score: filteredReminders.length > 0 
        ? filteredReminders.reduce((sum, r) => sum + r.personalization_score, 0) / filteredReminders.length
        : null
    })

    return NextResponse.json({
      success: true,
      data: {
        reminders: filteredReminders,
        settings: {
          enabled: enable_reminders,
          reminder_types,
          preferred_hours: preferred_hours || 'auto-detected'
        },
        meta: {
          generation_time_ms: responseTime,
          reminders_generated: filteredReminders.length,
          average_personalization_score: filteredReminders.length > 0 
            ? filteredReminders.reduce((sum, r) => sum + r.personalization_score, 0) / filteredReminders.length
            : 0
        }
      }
    })
  } catch (error) {
    logger.error('Adaptive reminders API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate adaptive reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}