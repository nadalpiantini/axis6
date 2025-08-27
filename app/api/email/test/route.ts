import { NextRequest, NextResponse } from 'next/server'

import { sendEmail } from '@/lib/email/service-simple'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }
    
    const result = await sendEmail({
      to: email,
      type: 'test',
      data: {}
    })
    
    if (result.success) {
      return NextResponse.json({
        message: 'Test email sent successfully!',
        id: result.id
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    logger.error('Test email error', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}