import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// GET /api/resonance/hexagon - Get resonance data for user's hexagon
// Returns anonymous count of others who completed same axes today
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get date parameter (defaults to today)
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const targetDate = dateParam || new Date().toISOString().split('T')[0]

    // Call RPC function to get hexagon resonance data
    const { data: resonanceData, error: resonanceError } = await supabase
      .rpc('get_hexagon_resonance', {
        p_user_id: user.id,
        p_date: targetDate
      })

    if (resonanceError) {
      console.error('Error fetching hexagon resonance:', resonanceError)
      return NextResponse.json({ 
        error: 'Failed to fetch resonance data',
        details: resonanceError.message 
      }, { status: 500 })
    }

    // Transform data for hexagon visualization
    const hexagonResonance = resonanceData?.map((axis: any) => ({
      axisSlug: axis.axis_slug,
      resonanceCount: axis.resonance_count,
      userCompleted: axis.user_completed,
      // Add position data for resonance dots around hexagon
      hasResonance: axis.resonance_count > 0
    })) || []

    return NextResponse.json({
      success: true,
      date: targetDate,
      resonance: hexagonResonance,
      totalResonance: hexagonResonance.reduce((sum: number, axis: any) => sum + axis.resonanceCount, 0)
    })

  } catch (error) {
    console.error('Hexagon resonance API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to process resonance request'
    }, { status: 500 })
  }
}