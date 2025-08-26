import { logger } from '@/lib/utils/logger';

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deepseekClient } from '@/lib/ai/deepseek'
import { z } from 'zod'

const requestSchema = z.object({
  previousResponses: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })),
  category: z.string(),
  language: z.enum(['en', 'es']).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = requestSchema.parse(body)

    // Check if AI features are enabled
    if (!deepseekClient.isAIEnabled()) {
      return NextResponse.json(
        { error: 'AI features are currently disabled' },
        { status: 503 }
      )
    }

    // Generate dynamic follow-up question
    const question = await deepseekClient.generateFollowUpQuestion(
      validatedData.previousResponses,
      validatedData.category,
      validatedData.language || 'en'
    )

    return NextResponse.json({
      success: true,
      data: question
    })
  } catch (error) {
    logger.error('Question generation API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    )
  }
}