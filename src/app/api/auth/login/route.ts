import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit, rateLimitConfigs, resetRateLimit } from '@/lib/security/rateLimit'
import { validateEmail, validatePassword } from '@/lib/security/validation'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.login)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()
    const { email, password } = body

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      )
    }

    // Validate password (basic check, not full strength validation for login)
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Contraseña inválida' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Log failed attempt for security monitoring
      console.log(`Failed login attempt for email: ${email} at ${new Date().toISOString()}`)
      
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Reset rate limit on successful login
    resetRateLimit(request, data.user?.id)

    // Log successful login for monitoring
    console.log(`Successful login for user: ${data.user?.id} at ${new Date().toISOString()}`)

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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}