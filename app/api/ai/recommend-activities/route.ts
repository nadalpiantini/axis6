import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { activityRecommender } from '@/lib/ai/activity-recommender'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger';
const requestSchema = z.object({
  categoryId: z.number(),
  categoryName: z.string(),
  preferences: z.object({
    energy_level: z.enum(['low', 'medium', 'high']).optional(),
    social_preference: z.enum(['solo', 'small_group', 'large_group']).optional(),
    time_available: z.enum(['quick', 'moderate', 'extended']).optional(),
    difficulty_preference: z.number().min(1).max(5).optional()
  }).optional(),
  currentMood: z.number().min(1).max(5).optional(),
  language: z.enum(['en', 'es']).optional()
})
export async function POST(_request: NextRequest) {
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
    // Get user's temperament profile
    const { data: profile } = await supabase
      .from('axis6_temperament_profiles')
      .select('primary_temperament, secondary_temperament')
      .eq('user_id', user.id)
      .single()
    if (!profile) {
      return NextResponse.json(
        { error: 'No temperament profile found. Please complete the assessment first.' },
        { status: 400 }
      )
    }
    // Validate request body
    const body = await _request.json()
    const validatedData = requestSchema.parse(body)
    // Get past activities for context
    const { data: pastActivities } = await supabase
      .from('axis6_checkins')
      .select('notes')
      .eq('user_id', user.id)
      .eq('category_id', validatedData.categoryId)
      .order('completed_at', { ascending: false })
      .limit(10)
    // Generate personalized recommendations
    const recommendations = await activityRecommender.recommendActivities({
      userId: user.id,
      categoryId: validatedData.categoryId,
      categoryName: validatedData.categoryName,
      temperament: profile.primary_temperament,
      secondaryTemperament: profile.secondary_temperament,
      preferences: validatedData.preferences,
      currentMood: validatedData.currentMood,
      language: validatedData.language || 'en',
      pastActivities: pastActivities?.map(a => ({
        name: a.notes || 'Activity',
        completed: true
      })) || []
    })
    return NextResponse.json({
      success: true,
      data: recommendations
    })
  } catch (error) {
    logger.error('Activity recommendation API error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
