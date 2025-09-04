import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
// GET /api/constellation - Get constellation data for community visualization
// Returns abstract data about community completion patterns without exposing users
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    // Parse query parameters
    const { searchParams } = new URL(_request.url)
    const dateParam = searchParams.get('date')
    const targetDate = dateParam || new Date().toISOString().split('T')[0]
    // Call RPC function to get constellation data
    const { data: constellationData, error: constellationError } = await supabase
      .rpc('get_constellation_data', {
        p_date: targetDate
      })
    if (constellationError) {
      logger.error('Error fetching constellation data:', constellationError)
      return NextResponse.json({
        error: 'Failed to fetch constellation data',
        details: constellationError.message
      }, { status: 500 })
    }
    // Transform data for constellation visualization
    const constellationPoints = constellationData?.map((axis: any, index: number) => {
      // Calculate position in hexagon formation
      const angle = (Math.PI / 3) * index - Math.PI / 2 // Start from top
      const baseRadius = 100 // Base radius for hexagon
      const intensityRadius = baseRadius * (axis.resonance_intensity || 1.0)
      return {
        axisSlug: axis.axis_slug,
        completionCount: axis.completion_count,
        resonanceIntensity: axis.resonance_intensity,
        color: axis.axis_color,
        name: axis.axis_name,
        position: {
          x: 200 + intensityRadius * Math.cos(angle),
          y: 200 + intensityRadius * Math.sin(angle),
          angle: angle * (180 / Math.PI)
        }
      }
    }) || []
    // Calculate overall community metrics
    const totalCompletions = constellationPoints.reduce(
      (sum, point) => sum + (point.completionCount || 0),
      0
    )
    const averageIntensity = constellationPoints.length > 0
      ? constellationPoints.reduce(
          (sum, point) => sum + (point.resonanceIntensity || 1.0),
          0
        ) / constellationPoints.length
      : 1.0
    // Determine constellation "mood" based on completion patterns
    const getConstellationMood = () => {
      if (totalCompletions === 0) return 'quiet'
      if (totalCompletions < 10) return 'peaceful'
      if (totalCompletions < 50) return 'active'
      if (totalCompletions < 100) return 'vibrant'
      return 'energetic'
    }
    return NextResponse.json({
      success: true,
      date: targetDate,
      constellation: {
        points: constellationPoints,
        metrics: {
          totalCompletions,
          averageIntensity,
          activeAxes: constellationPoints.filter(p => p.completionCount > 0).length,
          mood: getConstellationMood()
        },
        // Visualization hints for UI
        visualHints: {
          centerPoint: { x: 200, y: 200 },
          baseRadius: 100,
          maxRadius: baseRadius * Math.max(...constellationPoints.map(p => p.resonanceIntensity)),
          recommendedSize: 400 // SVG viewBox size
        }
      }
    })
  } catch (error) {
    logger.error('Constellation API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to process constellation request'
    }, { status: 500 })
  }
}
