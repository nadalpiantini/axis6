import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { personalityAnalyzer } from '@/lib/ai/personality-analyzer'
import { z } from 'zod'

const requestSchema = z.object({
  sessionId: z.string(),
  responses: z.array(z.object({
    questionId: z.string(),
    questionText: z.string(),
    answerText: z.string(),
    selectedTemperament: z.string().optional()
  })),
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

    // Perform AI-enhanced personality analysis
    const analysis = await personalityAnalyzer.analyzePersonality({
      userId: user.id,
      sessionId: validatedData.sessionId,
      responses: validatedData.responses,
      language: validatedData.language || 'en'
    })

    // Return enhanced analysis
    return NextResponse.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    console.error('Personality analysis API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze personality' },
      { status: 500 }
    )
  }
}