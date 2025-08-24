import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resetPasswordSchema, validateRequest } from '@/lib/validation/schemas'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // Validate request body with Zod
    const validation = await validateRequest(request, resetPasswordSchema)
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { password, accessToken, refreshToken } = validation.data!

    // Create Supabase client
    const supabase = await createClient()

    // Set the session using the tokens from the email link
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError || !sessionData.user) {
      logger.security('Invalid reset tokens used', {
        action: 'invalid_reset_token'
      })
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
      console.error('Password update error', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la contraseña' },
        { status: 500 }
      )
    }

    // Log successful password reset for monitoring
    logger.security('Password successfully reset', {
      userId: sessionData.user.id,
      action: 'password_reset_success'
    })

    return NextResponse.json(
      { 
        message: 'Contraseña actualizada exitosamente',
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
