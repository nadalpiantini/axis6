import { NextRequest, NextResponse } from 'next/server'

import { emailService } from '@/lib/email/service'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

// POST /api/email - Send various types of emails
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from session for authenticated endpoints
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const body = await _request.json()
    const { type, data, skipAuth = false } = body

    // Some email types don't require authentication (like password reset)
    if (!skipAuth && (authError || !user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    switch (type) {
      case 'welcome':
        if (!data.name || !data.email) {
          return NextResponse.json({ 
            error: 'Missing required fields: name, email' 
          }, { status: 400 })
        }
        
        const welcomeResult = await emailService.sendWelcome({
          name: data.name,
          email: data.email
        })
        
        if (!welcomeResult.success) {
          return NextResponse.json({ 
            error: 'Failed to send welcome email', 
            details: welcomeResult.error 
          }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Welcome email sent successfully',
          id: welcomeResult.id 
        })

      case 'password-reset':
        if (!data.name || !data.email || !data.resetUrl) {
          return NextResponse.json({ 
            error: 'Missing required fields: name, email, resetUrl' 
          }, { status: 400 })
        }
        
        const resetResult = await emailService.sendPasswordReset({
          name: data.name,
          email: data.email,
          resetUrl: data.resetUrl
        })
        
        if (!resetResult.success) {
          return NextResponse.json({ 
            error: 'Failed to send password reset email', 
            details: resetResult.error 
          }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Password reset email sent successfully',
          id: resetResult.id 
        })

      case 'weekly-stats':
        if (!user) {
          return NextResponse.json({ error: 'Authentication required for weekly stats' }, { status: 401 })
        }

        // Get user profile for name
        const { data: profile } = await supabase
          .from('axis6_profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (!data.weeklyStats) {
          return NextResponse.json({ 
            error: 'Missing required field: weeklyStats' 
          }, { status: 400 })
        }
        
        const statsResult = await emailService.sendWeeklyStats({
          name: profile?.full_name || user.email?.split('@')[0] || 'Usuario',
          email: user.email!,
          weeklyStats: data.weeklyStats
        })
        
        if (!statsResult.success) {
          return NextResponse.json({ 
            error: 'Failed to send weekly stats email', 
            details: statsResult.error 
          }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Weekly stats email sent successfully',
          id: statsResult.id 
        })

      case 'test':
        if (!data.to) {
          return NextResponse.json({ 
            error: 'Missing required field: to' 
          }, { status: 400 })
        }
        
        const testResult = await emailService.sendTestEmail(data.to)
        
        if (!testResult.success) {
          return NextResponse.json({ 
            error: 'Failed to send test email', 
            details: testResult.error 
          }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Test email sent successfully',
          id: testResult.id 
        })

      default:
        return NextResponse.json({ 
          error: `Unknown email type: ${type}` 
        }, { status: 400 })
    }

  } catch (error: any) {
    logger.error('Email API error', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// GET /api/email/config - Get email configuration status
export async function GET() {
  try {
    const { getEmailConfig } = await import('@/lib/email/service')
    const config = getEmailConfig()
    
    return NextResponse.json({
      configured: config.configured,
      fromEmail: config.fromEmail,
      hasApiKey: config.apiKey
    })

  } catch (error: any) {
    logger.error('Email config error', error)
    return NextResponse.json({ 
      error: 'Failed to get email configuration' 
    }, { status: 500 })
  }
}