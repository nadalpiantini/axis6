import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// GET /api/resonance/hexagon - Get resonance data for user's hexagon
// Returns anonymous count of others who completed same axes today
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user with better error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Authentication error in hexagon resonance API:', authError)
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: authError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      console.warn('No authenticated user found in hexagon resonance API')
      return NextResponse.json({ 
        error: 'Unauthorized - No user session found',
        details: 'User must be logged in to access resonance data'
      }, { status: 401 })
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
      
      // Return empty resonance data instead of error to prevent UI issues
      return NextResponse.json({
        success: true,
        date: targetDate,
        resonance: [],
        totalResonance: 0,
        error: 'Resonance data temporarily unavailable'
      })
    }

    // Transform data for hexagon visualization
    const hexagonResonance = resonanceData?.map((axis: any) => ({
      axisSlug: axis.axis_slug,
      resonanceCount: axis.resonance_count || 0,
      userCompleted: axis.user_completed || false,
      // Add position data for resonance dots around hexagon
      hasResonance: (axis.resonance_count || 0) > 0
    })) || []

    return NextResponse.json({
      success: true,
      date: targetDate,
      resonance: hexagonResonance,
      totalResonance: hexagonResonance.reduce((sum: number, axis: any) => sum + (axis.resonanceCount || 0), 0)
    })

  } catch (error) {
    console.error('Hexagon resonance API error:', error)
    
    // Return empty resonance data instead of error to prevent UI issues
    return NextResponse.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      resonance: [],
      totalResonance: 0,
      error: 'Resonance data temporarily unavailable'
    })
  }
}