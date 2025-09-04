import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger';
export async function POST(_request: NextRequest) {
  try {
    const { mantraId } = await _request.json()
    if (!mantraId) {
      return NextResponse.json(
        { error: 'Mantra ID is required' },
        { status: 400 }
      )
    }
    const supabase = await createClient()
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const today = new Date().toISOString().split('T')[0]
    // Update user mantra record
    const { error: updateError } = await supabase
      .from('axis6_user_mantras')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('mantra_id', mantraId)
      .eq('shown_date', today)
    if (updateError) {
      logger.error('Failed to mark mantra as complete:', updateError)
      return NextResponse.json(
        { error: 'Failed to update mantra status' },
        { status: 500 }
      )
    }
    return NextResponse.json({
      success: true,
      message: 'Mantra marked as complete'
    })
  } catch (error) {
    logger.error('Error completing mantra:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
