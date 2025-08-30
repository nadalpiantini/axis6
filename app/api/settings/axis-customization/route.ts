import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/error/standardErrorHandler'

interface AxisCustomization {
  id: string | number
  name: string
  slug: string
  color: string
  icon: string
  dailyGoal: number
  showInQuickActions: boolean
  priority: number
}

interface WellnessPreferences {
  hexagon_size: 'small' | 'medium' | 'large'
  show_community_pulse: boolean
  show_resonance: boolean
  default_view: 'hexagon' | 'list' | 'grid'
  axis_customizations: Record<string, AxisCustomization>
}

// GET: Fetch wellness preferences and axis customizations
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

    // Get wellness preferences
    const { data: wellnessPrefs, error: wellnessError } = await supabase
      .from('axis6_wellness_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get categories for default axis settings
    const { data: categories, error: categoriesError } = await supabase
      .from('axis6_categories')
      .select('*')
      .order('id')

    if (categoriesError) {
      throw categoriesError
    }

    // Generate default axis customizations if no preferences exist
    const defaultAxisCustomizations: Record<string, AxisCustomization> = {}
    categories?.forEach((cat, index) => {
      defaultAxisCustomizations[cat.slug] = {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
        icon: cat.icon,
        dailyGoal: 1,
        showInQuickActions: index < 3, // Show first 3 in quick actions
        priority: index + 1
      }
    })

    const preferences: WellnessPreferences = {
      hexagon_size: 'medium',
      show_community_pulse: true,
      show_resonance: true,
      default_view: 'hexagon',
      axis_customizations: defaultAxisCustomizations,
      ...wellnessPrefs
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Axis customization fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch axis customization settings' },
      { status: 500 }
    )
  }
}

// PUT: Update axis customization settings
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
    const { 
      hexagon_size, 
      show_community_pulse, 
      show_resonance, 
      default_view, 
      axis_customizations 
    } = body

    // Validate input
    if (!hexagon_size || !default_view) {
      return NextResponse.json(
        { error: 'Missing required preferences data' },
        { status: 400 }
      )
    }

    // Update wellness preferences
    const { data, error } = await supabase
      .from('axis6_wellness_preferences')
      .upsert({
        user_id: user.id,
        // Store custom fields in a JSONB column for flexibility
        custom_settings: {
          hexagon_size,
          show_community_pulse,
          show_resonance,
          default_view,
          axis_customizations
        },
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Also update quick actions in user preferences
    if (axis_customizations) {
      const quickActions = Object.values(axis_customizations)
        .filter((axis: any) => axis.showInQuickActions)
        .map((axis: any) => ({
          action: 'checkin',
          category: axis.slug,
          enabled: true,
          priority: axis.priority
        }))
        .sort((a: any, b: any) => a.priority - b.priority)

      await supabase
        .from('axis6_user_preferences')
        .upsert({
          user_id: user.id,
          quick_actions: quickActions,
          updated_at: new Date().toISOString()
        })
    }

    return NextResponse.json({ 
      preferences: data,
      message: 'Axis customization settings updated successfully' 
    })
  } catch (error) {
    handleError(error, {
      operation: 'update_axis_customization',
      component: 'api_route',
      userMessage: 'Failed to update axis customization settings'
    })
    
    return NextResponse.json(
      { error: 'Failed to update axis customization settings' },
      { status: 500 }
    )
  }
}