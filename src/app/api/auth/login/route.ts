import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit, rateLimitConfigs, resetRateLimit } from '@/lib/security/rateLimit'
import { loginSchema, validateRequest } from '@/lib/validation/schemas'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.login)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Validate request body with Zod
    const validation = await validateRequest(request, loginSchema)
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { email, password } = validation.data!

    // Create Supabase client
    const supabase = await createClient()

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Log failed attempt for security monitoring
      logger.security('Failed login attempt', { 
        action: 'login_failed',
        metadata: { email: email.substring(0, 3) + '***' } // Partially mask email
      })
      
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Reset rate limit on successful login
    resetRateLimit(request, data.user?.id)

    // Log successful login for monitoring
    logger.security('Successful login', {
      userId: data.user?.id,
      action: 'login_success'
    })

    return NextResponse.json(
      { 
        message: 'Login exitoso',
        user: {
          id: data.user?.id,
          email: data.user?.email
        }
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Login error', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}