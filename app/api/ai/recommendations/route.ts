import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { activityRecommender } from '@/lib/ai/activity-recommender'
import { behavioralAnalyzer } from '@/lib/ai/behavioral-analyzer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ai/recommendations/activities
 * Get personalized activity recommendations for a category
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    const energyLevel = searchParams.get('energy_level') as 'low' | 'medium' | 'high' | null
    const socialPreference = searchParams.get('social_preference') as 'solo' | 'small_group' | 'large_group' | null
    const timeAvailable = searchParams.get('time_available') as 'quick' | 'moderate' | 'extended' | null
    const currentMood = searchParams.get('current_mood')

    if (!categoryId) {
      return NextResponse.json(
        { error: 'category_id parameter is required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Get category name
    const { data: category, error: categoryError } = await supabase
      .from('axis6_categories')
      .select('name, slug')
      .eq('id', categoryId)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get user's temperament
    const { data: temperament } = await supabase
      .from('axis6_temperament_profiles')
      .select('primary_temperament, secondary_temperament')
      .eq('user_id', user.id)
      .single()

    // Get past activities for this category
    const { data: pastActivities } = await supabase
      .from('axis6_ai_recommendations')
      .select('recommendations')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const categoryName = typeof category.name === 'object' 
      ? (category.name as any).en || category.slug 
      : category.name

    // Build recommendation input
    const recommendationInput = {
      userId: user.id,
      categoryId: parseInt(categoryId),
      categoryName,
      temperament: temperament?.primary_temperament || 'balanced',
      secondaryTemperament: temperament?.secondary_temperament,
      preferences: {
        energy_level: energyLevel || undefined,
        social_preference: socialPreference || undefined,
        time_available: timeAvailable || undefined
      },
      pastActivities: pastActivities?.flatMap(pa => pa.recommendations || []) || [],
      currentMood: currentMood ? parseInt(currentMood) : undefined,
      language: 'en' as const
    }

    // Generate recommendations
    const activities = await activityRecommender.recommendActivities(recommendationInput)
    
    const responseTime = Date.now() - startTime

    // Track usage
    await supabase.rpc('track_ai_feature_usage', {
      target_user_id: user.id,
      feature_name: 'activity_recommendation',
      response_time_ms: responseTime,
      was_successful: activities.length > 0,
      confidence_score: activities.length > 0 
        ? activities.reduce((sum, a) => sum + a.temperament_fit_score, 0) / activities.length
        : null
    })

    return NextResponse.json({
      success: true,
      data: {
        activities,
        category: {
          id: categoryId,
          name: categoryName,
          slug: category.slug
        },
        meta: {
          generation_time_ms: responseTime,
          activities_count: activities.length,
          average_fit_score: activities.length > 0 
            ? activities.reduce((sum, a) => sum + a.temperament_fit_score, 0) / activities.length
            : 0,
          temperament_used: temperament?.primary_temperament || 'balanced'
        }
      }
    })
  } catch (error) {
    console.error('Activity recommendations API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate activity recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/recommendations/goals
 * Get personalized goal recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { timeframe = 'weekly' } = body

    if (!['weekly', 'monthly'].includes(timeframe)) {
      return NextResponse.json(
        { error: 'timeframe must be "weekly" or "monthly"' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Generate personalized goals
    const goals = await behavioralAnalyzer.suggestPersonalizedGoals(user.id, timeframe)
    
    const responseTime = Date.now() - startTime

    // Store goals in database
    const goalRows = goals.map(goal => ({
      user_id: user.id,
      category_id: goal.category_id,
      goal_type: goal.goal_type,
      target_value: goal.target_value,
      target_unit: timeframe === 'weekly' ? 'times_per_week' : 'times_per_month',
      timeframe: timeframe,
      difficulty: goal.difficulty,
      success_probability: goal.success_probability,
      reasoning: goal.reasoning,
      based_on_data: {
        analysis_date: new Date().toISOString(),
        timeframe,
        behavior_analysis_version: '1.0'
      },
      status: 'suggested'
    }))

    const { error: insertError } = await supabase
      .from('axis6_personalized_goals')
      .insert(goalRows)

    if (insertError) {
      console.error('Failed to store goals:', insertError)
      // Continue without failing the request
    }

    // Track usage
    await supabase.rpc('track_ai_feature_usage', {
      target_user_id: user.id,
      feature_name: 'personalized_goals',
      response_time_ms: responseTime,
      was_successful: goals.length > 0,
      confidence_score: goals.length > 0 
        ? goals.reduce((sum, g) => sum + g.success_probability, 0) / goals.length
        : null
    })

    return NextResponse.json({
      success: true,
      data: {
        goals,
        meta: {
          generation_time_ms: responseTime,
          goals_count: goals.length,
          timeframe,
          average_success_probability: goals.length > 0 
            ? goals.reduce((sum, g) => sum + g.success_probability, 0) / goals.length
            : 0
        }
      }
    })
  } catch (error) {
    console.error('Goal recommendations API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate goal recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}