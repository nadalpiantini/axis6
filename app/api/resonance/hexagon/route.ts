import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/resonance/hexagon - Get resonance data for user's hexagon
// Returns anonymous count of others who completed same axes today
export async function GET(request: NextRequest) {
  try {
    // Get date parameter first (to use in empty responses)
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const targetDate = dateParam || new Date().toISOString().split('T')[0]

    // Create Supabase client
    const supabase = await createClient()
    
    // Get authenticated user with enhanced error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Authentication error in hexagon resonance API:', {
        error: authError.message,
        code: authError.name,
        timestamp: new Date().toISOString()
      })
      
      // Return empty data instead of 401 to prevent UI issues
      return NextResponse.json({
        success: true,
        date: targetDate,
        resonance: [],
        totalResonance: 0,
        message: 'Authentication failed - returning empty resonance data'
      })
    }
    
    if (!user) {
      console.warn('No authenticated user found in hexagon resonance API', {
        timestamp: new Date().toISOString()
      })
      
      // Return empty data instead of 401 to prevent UI issues
      return NextResponse.json({
        success: true,
        date: targetDate,
        resonance: [],
        totalResonance: 0,
        message: 'No authenticated user - returning empty resonance data'
      })
    }
    
    console.info('Hexagon resonance API - User authenticated successfully:', {
      userId: user.id,
      userEmail: user.email || 'no-email',
      timestamp: new Date().toISOString()
    })



    // Call RPC function to get hexagon resonance data with enhanced error handling
    console.info('Calling get_hexagon_resonance RPC function:', {
      userId: user.id,
      targetDate,
      timestamp: new Date().toISOString()
    })
    
    const { data: resonanceData, error: resonanceError } = await supabase
      .rpc('get_hexagon_resonance', {
        p_user_id: user.id,
        p_date: targetDate
      })

    if (resonanceError) {
      console.error('Error fetching hexagon resonance:', {
        error: resonanceError.message,
        code: resonanceError.code,
        hint: resonanceError.hint,
        details: resonanceError.details,
        userId: user.id,
        targetDate,
        timestamp: new Date().toISOString()
      })
      
      // Check if it's a function not found error
      if (resonanceError.code === '42883') {
        console.error('get_hexagon_resonance function does not exist in database')
        return NextResponse.json({
          success: true,
          date: targetDate,
          resonance: [],
          totalResonance: 0,
          error: 'Resonance feature not available - function missing'
        })
      }
      
      // Return empty resonance data instead of error to prevent UI issues
      return NextResponse.json({
        success: true,
        date: targetDate,
        resonance: [],
        totalResonance: 0,
        error: 'Resonance data temporarily unavailable'
      })
    }
    
    console.info('Successfully fetched hexagon resonance data:', {
      userId: user.id,
      recordCount: resonanceData?.length || 0,
      timestamp: new Date().toISOString()
    })

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