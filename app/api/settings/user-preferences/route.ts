import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/error/standardErrorHandler'
// GET: Fetch user preferences
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data, error } = await supabase
      .from('axis6_user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    // Return defaults if no preferences found
    if (!data) {
      return NextResponse.json({
        preferences: {
          theme_preference: 'temperament_based',
          language: 'en',
          timezone: 'America/Santo_Domingo',
          dashboard_layout: 'hexagon',
          default_landing_page: '/dashboard',
          display_density: 'comfortable',
          accessibility_options: {
            high_contrast: false,
            large_text: false,
            reduced_motion: false,
            screen_reader: false
          },
          quick_actions: []
        }
      })
    }
    return NextResponse.json({ preferences: data })
  } catch (error) {
    logger.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    )
  }
}
// PUT: Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { preferences } = body
    // Validate required fields
    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences data is required' },
        { status: 400 }
      )
    }
    // Upsert preferences
    const { data, error } = await supabase
      .from('axis6_user_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) {
      throw error
    }
    return NextResponse.json({ 
      preferences: data,
      message: 'Preferences updated successfully' 
    })
  } catch (error) {
    handleError(error, {
      operation: 'update_user_preferences',
      component: 'api_route',
      userMessage: 'Failed to update preferences'
    })
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    )
  }
}
// POST: Initialize default preferences for new user
export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Initialize all user settings using the database function
    const { error: initError } = await supabase.rpc('axis6_initialize_user_settings', {
      target_user_id: user.id
    })
    if (initError) {
      throw initError
    }
    return NextResponse.json({ 
      message: 'User settings initialized successfully' 
    })
  } catch (error) {
    handleError(error, {
      operation: 'initialize_user_settings',
      component: 'api_route',
      userMessage: 'Failed to initialize user settings'
    })
    return NextResponse.json(
      { error: 'Failed to initialize user settings' },
      { status: 500 }
    )
  }
}