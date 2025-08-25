import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit, rateLimitConfigs } from '@/lib/security/rateLimit'
import { forgotPasswordSchema, validateRequest } from '@/lib/validation/schemas'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  // Apply rate limiting for password reset
  const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.passwordReset)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Validate request body with Zod
    const validation = await validateRequest(request, forgotPasswordSchema)
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { email } = validation.data!

    // Create Supabase client
    const supabase = await createClient()

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6789'}/auth/reset-password`,
    })

    if (error) {
      // Log failed attempt for security monitoring
      logger.warn('Failed password reset attempt', {
        action: 'password_reset_failed',
        metadata: { email: email.substring(0, 3) + '***' }
      })
      
      return NextResponse.json(
        { error: 'Error al enviar el email de recuperación' },
        { status: 500 }
      )
    }

    // Log successful password reset request for monitoring
    logger.info('Password reset email sent', {
      action: 'password_reset_requested',
      metadata: { email: email.substring(0, 3) + '***' }
    })

    return NextResponse.json(
      { 
        message: 'Email de recuperación enviado exitosamente',
        success: true
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Password reset error', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
