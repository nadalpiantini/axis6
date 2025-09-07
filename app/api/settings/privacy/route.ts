import { logger } from '@/lib/utils/logger';

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/error/standardErrorHandler'
interface PrivacySettings {
  profile_visibility: 'public' | 'friends' | 'private'
  stats_sharing: boolean
  achievement_sharing: boolean
  ai_analytics_enabled: boolean
  behavioral_tracking_enabled: boolean
  ai_coaching_enabled: boolean
  personalized_content: boolean
  data_retention_days: number
  export_frequency: 'never' | 'weekly' | 'monthly' | 'quarterly'
  third_party_sharing: boolean
  usage_analytics: boolean
  research_participation: boolean
}
// GET: Fetch privacy settings
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
      .from('axis6_privacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    // Return defaults if no privacy settings found
    if (!data) {
      const defaultSettings: PrivacySettings = {
        profile_visibility: 'private',
        stats_sharing: false,
        achievement_sharing: true,
        ai_analytics_enabled: true,
        behavioral_tracking_enabled: true,
        ai_coaching_enabled: true,
        personalized_content: true,
        data_retention_days: 365,
        export_frequency: 'monthly',
        third_party_sharing: false,
        usage_analytics: true,
        research_participation: false
      }
      return NextResponse.json({ settings: defaultSettings })
    }
    return NextResponse.json({ settings: data })
  } catch (error) {
    logger.error('Privacy settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch privacy settings' },
      { status: 500 }
    )
  }
}
// PUT: Update privacy settings
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
    const { settings } = body
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings data is required' },
        { status: 400 }
      )
    }
    // Validate data retention days (minimum 30 days)
    if (settings.data_retention_days && settings.data_retention_days < 30) {
      return NextResponse.json(
        { error: 'Data retention must be at least 30 days' },
        { status: 400 }
      )
    }
    // Log privacy setting changes for audit
    await supabase.rpc('axis6_log_security_event', {
      target_user_id: user.id,
      event_type: 'settings_change',
      details: { 
        settings_type: 'privacy',
        changes: Object.keys(settings)
      },
      risk_level: 'low'
    })
    // Upsert privacy settings
    const { data, error } = await supabase
      .from('axis6_privacy_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) {
      throw error
    }
    return NextResponse.json({ 
      settings: data,
      message: 'Privacy settings updated successfully' 
    })
  } catch (error) {
    handleError(error, {
      operation: 'update_privacy_settings',
      component: 'api_route',
      userMessage: 'Failed to update privacy settings'
    })
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    )
  }
}
// POST: Get privacy score calculation
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
    const { data: settings, error } = await supabase
      .from('axis6_privacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    // Calculate privacy score (0-100)
    let score = 0
    const factors = [
      !settings?.behavioral_tracking_enabled,
      !settings?.ai_analytics_enabled,
      settings?.profile_visibility === 'private',
      !settings?.third_party_sharing,
      !settings?.usage_analytics,
      settings?.data_retention_days <= 90,
      !settings?.research_participation,
      !settings?.stats_sharing,
      settings?.export_frequency !== 'never'
    ]
    score = Math.round((factors.filter(Boolean).length / factors.length) * 100)
    // Generate recommendations
    const recommendations = []
    if (settings?.usage_analytics) {
      recommendations.push('Consider disabling usage analytics for better privacy')
    }
    if (settings?.profile_visibility !== 'private') {
      recommendations.push('Set profile visibility to private for maximum privacy')
    }
    if (settings?.third_party_sharing) {
      recommendations.push('Disable third-party data sharing')
    }
    if (settings?.behavioral_tracking_enabled) {
      recommendations.push('Turn off behavioral tracking if privacy is your top concern')
    }
    return NextResponse.json({ 
      privacyScore: score,
      recommendations,
      factors: factors.length
    })
  } catch (error) {
    handleError(error, {
      operation: 'calculate_privacy_score',
      component: 'api_route',
      userMessage: 'Failed to calculate privacy score'
    })
    return NextResponse.json(
      { error: 'Failed to calculate privacy score' },
      { status: 500 }
    )
  }
}