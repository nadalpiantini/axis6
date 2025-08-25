/**
 * Email Testing API Endpoint
 * Allows testing of email configuration and sending test emails
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { withEnhancedRateLimit } from '@/lib/middleware/enhanced-rate-limit'
import { emailService, isEmailConfigured } from '@/lib/email/service'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  // Apply rate limiting for email testing
  const { response: rateLimitResponse, headers } = await withEnhancedRateLimit(
    request,
    'sensitive' // Use sensitive rate limiting for email operations
  )
  
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Check authentication
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // No-op for server requests
          }
        }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { 
          status: 401,
          headers: Object.fromEntries(
            Object.entries(headers).map(([k, v]) => [k, v])
          )
        }
      )
    }

    // Get email configuration status
    const emailConfig = {
      configured: isEmailConfigured(),
      hasApiKey: !!process.env['RESEND_API_KEY'],
      fromEmail: process.env['RESEND_FROM_EMAIL'] || 'noreply@axis6.app',
      environment: process.env['NODE_ENV']
    }

    logger.info('Email configuration status requested', { userId: user.id, config: emailConfig })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email
      },
      configuration: emailConfig,
      availableTypes: [
        'welcome',
        'password-reset', 
        'weekly-stats',
        'test'
      ]
    }, { 
      status: 200,
      headers: Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k, v])
      )
    })

  } catch (error) {
    logger.error('Failed to get email configuration', error as Error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to retrieve email configuration'
      },
      { 
        status: 500,
        headers: Object.fromEntries(
          Object.entries(headers).map(([k, v]) => [k, v])
        )
      }
    )
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting for email sending
  const { response: rateLimitResponse, headers } = await withEnhancedRateLimit(
    request,
    'sensitive' // Very restricted for sending emails
  )
  
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Check authentication
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // No-op for server requests
          }
        }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { 
          status: 401,
          headers: Object.fromEntries(
            Object.entries(headers).map(([k, v]) => [k, v])
          )
        }
      )
    }

    const body = await request.json()
    const { type = 'test', to } = body

    // Use user's email if no recipient specified
    const recipient = to || user.email

    if (!recipient) {
      return NextResponse.json(
        { error: 'No recipient email specified' },
        { 
          status: 400,
          headers: Object.fromEntries(
            Object.entries(headers).map(([k, v]) => [k, v])
          )
        }
      )
    }

    let result

    // Send appropriate email based on type
    switch (type) {
      case 'test':
        result = await emailService.sendTestEmail(recipient)
        break
      
      case 'welcome':
        // Get user profile for name
        const { data: profile } = await supabase
          .from('axis6_profiles')
          .select('full_name, first_name')
          .eq('user_id', user.id)
          .single()

        const name = profile?.full_name || profile?.first_name || user.email?.split('@')[0] || 'Usuario'
        
        result = await emailService.sendWelcome({
          name,
          email: recipient
        })
        break

      default:
        return NextResponse.json(
          { error: `Unsupported email type: ${type}` },
          { 
            status: 400,
            headers: Object.fromEntries(
              Object.entries(headers).map(([k, v]) => [k, v])
            )
          }
        )
    }

    logger.info('Test email sent', { 
      userId: user.id,
      type,
      recipient: recipient.split('@')[1], // Domain only for privacy
      success: result.success
    })

    return NextResponse.json({
      success: result.success,
      emailId: result.id,
      error: result.error || null,
      type,
      recipient: recipient.split('@')[0] + '@***', // Mask email for security
      timestamp: new Date().toISOString()
    }, { 
      status: result.success ? 200 : 500,
      headers: Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k, v])
      )
    })

  } catch (error) {
    logger.error('Failed to send test email', error as Error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to send test email'
      },
      { 
        status: 500,
        headers: Object.fromEntries(
          Object.entries(headers).map(([k, v]) => [k, v])
        )
      }
    )
  }
}

// Only allow GET and POST requests
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}