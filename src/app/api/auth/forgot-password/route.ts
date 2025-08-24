import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit, rateLimitConfigs } from '@/lib/security/rateLimit'
import { validateEmail } from '@/lib/security/validation'

export async function POST(request: NextRequest) {
  // Apply rate limiting for password reset
  const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.passwordReset)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6789'}/auth/reset-password`,
    })

    if (error) {
      // Log failed attempt for security monitoring
      console.log(`Failed password reset attempt for email: ${email} at ${new Date().toISOString()}`)
      
      return NextResponse.json(
        { error: 'Error al enviar el email de recuperación' },
        { status: 500 }
      )
    }

    // Log successful password reset request for monitoring
    console.log(`Password reset email sent for: ${email} at ${new Date().toISOString()}`)

    return NextResponse.json(
      { 
        message: 'Email de recuperación enviado exitosamente',
        success: true
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
