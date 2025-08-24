import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validatePassword } from '@/lib/security/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, accessToken, refreshToken } = body

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Tokens de autenticación requeridos' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Set the session using the tokens from the email link
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError || !sessionData.user) {
      console.log(`Invalid reset tokens used at ${new Date().toISOString()}`)
      return NextResponse.json(
        { error: 'Enlace de restablecimiento inválido o expirado' },
        { status: 400 }
      )
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la contraseña' },
        { status: 500 }
      )
    }

    // Log successful password reset for monitoring
    console.log(`Password successfully reset for user: ${sessionData.user.id} at ${new Date().toISOString()}`)

    return NextResponse.json(
      { 
        message: 'Contraseña actualizada exitosamente',
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
