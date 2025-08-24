import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit, rateLimitConfigs } from '@/lib/security/rateLimit'
import { registerSchema, validateRequest } from '@/lib/validation/schemas'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.register)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Validate request body with Zod
    const validation = await validateRequest(request, registerSchema)
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { email, password, name } = validation.data!

    // Create Supabase client
    const supabase = await createClient()

    // Attempt registration
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6789'}/auth/callback`,
      }
    })

    if (error) {
      // Check for specific error types
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Este email ya está registrado' },
          { status: 409 }
        )
      }

      logger.error('Registration error', error)
      return NextResponse.json(
        { error: 'Error al crear la cuenta. Por favor, intenta de nuevo' },
        { status: 400 }
      )
    }

    // Log successful registration for monitoring
    logger.security('New user registered', {
      userId: data.user?.id,
      action: 'registration_success'
    })

    return NextResponse.json(
      { 
        message: 'Cuenta creada exitosamente. Por favor, verifica tu email',
        user: {
          id: data.user?.id,
          email: data.user?.email
        }
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Registration error', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}