import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit, rateLimitConfigs } from '@/lib/security/rateLimit'
import { validateEmail, validatePassword, validateTextInput } from '@/lib/security/validation'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.register)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()
    const { email, password, confirmPassword, name } = body

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      )
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      )
    }

    // Validate name if provided
    if (name) {
      const nameValidation = validateTextInput(name, {
        minLength: 2,
        maxLength: 100,
        alphanumericOnly: false,
        allowSpaces: true
      })
      if (!nameValidation.isValid) {
        return NextResponse.json(
          { error: `Nombre: ${nameValidation.error}` },
          { status: 400 }
        )
      }
    }

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

      console.error('Registration error:', error)
      return NextResponse.json(
        { error: 'Error al crear la cuenta. Por favor, intenta de nuevo' },
        { status: 400 }
      )
    }

    // Log successful registration for monitoring
    console.log(`New user registered: ${data.user?.id} at ${new Date().toISOString()}`)

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
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}