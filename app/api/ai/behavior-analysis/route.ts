import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { behavioralAnalyzer } from '@/lib/ai/behavioral-analyzer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ai/behavior-analysis
 * Perform behavioral analysis for the current user
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

    const startTime = Date.now()

    // Perform behavioral analysis
    const profile = await behavioralAnalyzer.analyzeBehavior(user.id)
    
    const responseTime = Date.now() - startTime

    // Track usage
    await supabase.rpc('track_ai_feature_usage', {
      target_user_id: user.id,
      feature_name: 'behavioral_analysis',
      response_time_ms: responseTime,
      was_successful: true,
      confidence_score: profile.patterns.length > 0 
        ? profile.patterns.reduce((sum, p) => sum + p.confidence_score, 0) / profile.patterns.length
        : null
    })

    return NextResponse.json({
      success: true,
      data: {
        profile,
        meta: {
          analysis_time_ms: responseTime,
          patterns_found: profile.patterns.length,
          confidence_level: profile.patterns.length > 0 
            ? profile.patterns.reduce((sum, p) => sum + p.confidence_score, 0) / profile.patterns.length
            : 0
        }
      }
    })
  } catch (error) {
    console.error('Behavior analysis API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze behavior',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/behavior-analysis/insights
 * Generate personalized insights based on behavior analysis
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
    const { include_profile } = body

    const startTime = Date.now()

    // Generate personalized insights
    let profile = null
    if (include_profile) {
      profile = await behavioralAnalyzer.analyzeBehavior(user.id)
    }
    
    const insights = await behavioralAnalyzer.generatePersonalizedInsights(user.id, profile || undefined)
    
    const responseTime = Date.now() - startTime

    // Track usage
    await supabase.rpc('track_ai_feature_usage', {
      target_user_id: user.id,
      feature_name: 'personalized_insights',
      response_time_ms: responseTime,
      was_successful: insights.length > 0,
      confidence_score: insights.length > 0 
        ? insights.reduce((sum, i) => sum + i.personalization_score, 0) / insights.length
        : null
    })

    return NextResponse.json({
      success: true,
      data: {
        insights,
        profile: include_profile ? profile : null,
        meta: {
          generation_time_ms: responseTime,
          insights_count: insights.length,
          average_personalization_score: insights.length > 0 
            ? insights.reduce((sum, i) => sum + i.personalization_score, 0) / insights.length
            : 0
        }
      }
    })
  } catch (error) {
    console.error('Insights generation API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}