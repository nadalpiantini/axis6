import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/error/standardErrorHandler'

interface SecuritySettings {
  two_factor_enabled: boolean
  two_factor_method?: 'totp' | 'sms' | 'email'
  backup_codes_generated: boolean
  session_timeout: number
  concurrent_sessions_limit: number
  trusted_devices: string[]
  login_notifications_enabled: boolean
  security_alerts_enabled: boolean
  password_changed_at?: string
  last_security_check?: string
  security_questions_set: boolean
}

// GET: Fetch security settings
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
      .from('axis6_security_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Return defaults if no security settings found
    if (!data) {
      const defaultSettings: SecuritySettings = {
        two_factor_enabled: false,
        backup_codes_generated: false,
        session_timeout: 7200, // 2 hours
        concurrent_sessions_limit: 5,
        trusted_devices: [],
        login_notifications_enabled: true,
        security_alerts_enabled: true,
        security_questions_set: false
      }

      return NextResponse.json({ settings: defaultSettings })
    }

    // Don't return sensitive data like trusted device fingerprints
    const safeSettings = {
      ...data,
      trusted_devices: data.trusted_devices ? data.trusted_devices.length : 0
    }

    return NextResponse.json({ settings: safeSettings })
  } catch (error) {
    console.error('Security settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security settings' },
      { status: 500 }
    )
  }
}

// PUT: Update security settings
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

    // Validate session timeout (minimum 5 minutes)
    if (settings.session_timeout && settings.session_timeout < 300) {
      return NextResponse.json(
        { error: 'Session timeout must be at least 5 minutes (300 seconds)' },
        { status: 400 }
      )
    }

    // Validate concurrent sessions limit
    if (settings.concurrent_sessions_limit && settings.concurrent_sessions_limit < 1) {
      return NextResponse.json(
        { error: 'Concurrent sessions limit must be at least 1' },
        { status: 400 }
      )
    }

    // Log security setting changes for audit
    await supabase.rpc('axis6_log_security_event', {
      target_user_id: user.id,
      event_type: 'settings_change',
      details: { 
        settings_type: 'security',
        changes: Object.keys(settings),
        two_factor_change: settings.two_factor_enabled !== undefined
      },
      risk_level: 'medium' // Security changes are medium risk
    })

    // Update last security check timestamp
    const updatedSettings = {
      ...settings,
      last_security_check: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Upsert security settings
    const { data, error } = await supabase
      .from('axis6_security_settings')
      .upsert({
        user_id: user.id,
        ...updatedSettings
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Don't return sensitive data
    const safeData = {
      ...data,
      trusted_devices: data.trusted_devices ? data.trusted_devices.length : 0
    }

    return NextResponse.json({ 
      settings: safeData,
      message: 'Security settings updated successfully' 
    })
  } catch (error) {
    handleError(error, {
      operation: 'update_security_settings',
      component: 'api_route',
      userMessage: 'Failed to update security settings'
    })
    
    return NextResponse.json(
      { error: 'Failed to update security settings' },
      { status: 500 }
    )
  }
}

// GET security audit logs
export async function DELETE() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recent security audit events for the user
    const { data: auditLogs, error } = await supabase
      .from('axis6_security_audit')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    // Calculate security score based on settings and recent activity
    const { data: settings } = await supabase
      .from('axis6_security_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let securityScore = 0
    if (settings) {
      // Calculate score based on security measures
      if (settings.two_factor_enabled) securityScore += 25
      if (settings.backup_codes_generated) securityScore += 10
      if (settings.session_timeout <= 3600) securityScore += 15 // 1 hour or less
      if (settings.login_notifications_enabled) securityScore += 10
      if (settings.security_alerts_enabled) securityScore += 10
      if (settings.concurrent_sessions_limit <= 3) securityScore += 10
      if (settings.security_questions_set) securityScore += 10

      // Additional points for recent security activity
      const recentChecks = auditLogs?.filter(log => 
        log.event_type === 'security_check' && 
        new Date(log.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0
      
      if (recentChecks > 0) securityScore += 10
    }

    return NextResponse.json({ 
      auditLogs: auditLogs || [],
      securityScore: Math.min(securityScore, 100)
    })
  } catch (error) {
    handleError(error, {
      operation: 'get_security_audit',
      component: 'api_route',
      userMessage: 'Failed to fetch security audit data'
    })
    
    return NextResponse.json(
      { error: 'Failed to fetch security audit data' },
      { status: 500 }
    )
  }
}