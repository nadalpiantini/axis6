import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

// GET /api/checkins - Get user's check-ins
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url)
    const date = searchParams.get('date')
    const categoryId = searchParams.get('categoryId')

    let query = supabase
      .from('axis6_checkins')
      .select(`
        *,
        axis6_categories (
          id,
          name,
          slug,
          color,
          icon
        )
      `)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })

    // Filter by date if provided
    if (date) {
      query = query.eq('completed_at', date)
    }

    // Filter by category if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: checkins, error } = await query

    if (error) {
      logger.error('Error fetching check-ins', error)
      return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 })
    }

    return NextResponse.json({ checkins })

  } catch (error) {
    logger.error('Check-ins API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/checkins - Create or toggle check-in
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await _request.json()
    const { categoryId, completed, mood, notes } = body

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    const todayStart = `${today}T00:00:00.000Z`
    const todayEnd = `${today}T23:59:59.999Z`

    if (completed) {
      // Check if checkin already exists for today
      const { data: existingCheckin } = await supabase
        .from('axis6_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .gte('completed_at', todayStart)
        .lte('completed_at', todayEnd)
        .single()

      let checkin, error

      if (existingCheckin) {
        // Update existing checkin
        const { data: updatedCheckin, error: updateError } = await supabase
          .from('axis6_checkins')
          .update({
            mood: mood || 5,
            notes: notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCheckin.id)
          .select()
          .single()

        checkin = updatedCheckin
        error = updateError
      } else {
        // Insert new checkin with proper TIMESTAMPTZ
        const { data: newCheckin, error: insertError } = await supabase
          .from('axis6_checkins')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            completed_at: new Date().toISOString(), // Use full timestamp
            mood: mood || 5,
            notes: notes || null,
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        checkin = newCheckin
        error = insertError
      }

      if (error) {
        logger.error('Error creating/updating check-in', error)
        return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 })
      }

      // Update streak using RPC function
      await supabase.rpc('axis6_calculate_streak_optimized', {
        p_user_id: user.id,
        p_category_id: categoryId
      })

      return NextResponse.json({ checkin, message: 'Check-in completed successfully' })

    } else {
      // Remove check-in for today
      const { error } = await supabase
        .from('axis6_checkins')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .gte('completed_at', todayStart)
        .lte('completed_at', todayEnd)

      if (error) {
        logger.error('Error removing check-in', error)
        return NextResponse.json({ error: 'Failed to remove check-in' }, { status: 500 })
      }

      // Update streak
      await supabase.rpc('axis6_calculate_streak_optimized', {
        p_user_id: user.id,
        p_category_id: categoryId
      })

      return NextResponse.json({ message: 'Check-in removed successfully' })
    }

  } catch (error) {
    logger.error('Check-ins POST API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/checkins - Update existing check-in
export async function PUT(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await _request.json()
    const { categoryId, date, mood, notes } = body

    if (!categoryId || !date) {
      return NextResponse.json({ error: 'Category ID and date are required' }, { status: 400 })
    }

    const { data: checkin, error } = await supabase
      .from('axis6_checkins')
      .update({
        mood: mood,
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .eq('completed_at', date)
      .select()
      .single()

    if (error) {
      logger.error('Error updating check-in', error)
      return NextResponse.json({ error: 'Failed to update check-in' }, { status: 500 })
    }

    return NextResponse.json({ checkin, message: 'Check-in updated successfully' })

  } catch (error) {
    logger.error('Check-ins PUT API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/checkins - Delete specific check-in
export async function DELETE(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(_request.url)
    const categoryId = searchParams.get('categoryId')
    const date = searchParams.get('date')

    if (!categoryId || !date) {
      return NextResponse.json({ error: 'Category ID and date are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('axis6_checkins')
      .delete()
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .eq('completed_at', date)

    if (error) {
      logger.error('Error deleting check-in', error)
      return NextResponse.json({ error: 'Failed to delete check-in' }, { status: 500 })
    }

    // Update streak after deletion
    await supabase.rpc('axis6_calculate_streak_optimized', {
      p_user_id: user.id,
      p_category_id: categoryId
    })

    return NextResponse.json({ message: 'Check-in deleted successfully' })

  } catch (error) {
    logger.error('Check-ins DELETE API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
