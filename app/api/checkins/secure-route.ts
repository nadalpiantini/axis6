/**
 * SECURE CHECKINS API ENDPOINT
 * Enhanced with comprehensive security measures
 * Priority: CRITICAL - Core user data protection
 */
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { withApiSecurity } from '@/lib/middleware/auth-security'
import { withEnhancedRateLimit } from '@/lib/security/production-rate-limit'
import { createClient } from '@/lib/supabase/server'
import { validateSecureRequest } from '@/lib/validation/api-schemas'
import { secureCheckinSchema, bulkCheckinSchema } from '@/lib/validation/api-schemas'
// GET /api/checkins - Get user's check-ins with security
export const GET = withApiSecurity(async (request: NextRequest, user: any) => {
  try {
    const supabase = await createClient()
    // Apply rate limiting
    const { response: rateLimitResponse } = await withEnhancedRateLimit(request, 'read', user.id)
    if (rateLimitResponse) return rateLimitResponse
    // Validate query parameters
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const categoryId = searchParams.get('categoryId')
    // Sanitize and validate inputs
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }
    if (categoryId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID format' },
        { status: 400 }
      )
    }
    // Build secure query with user isolation
    let query = supabase
      .from('axis6_checkins')
      .select(`
        id,
        category_id,
        completed_at,
        mood,
        notes,
        created_at,
        updated_at,
        axis6_categories (
          id,
          name,
          slug,
          color,
          icon
        )
      `)
      .eq('user_id', user.id) // CRITICAL: User isolation
      .order('completed_at', { ascending: false })
      .limit(100) // Prevent large data dumps
    // Apply filters securely
    if (date) {
      query = query.eq('completed_at', date)
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    const { data: checkins, error } = await query
    if (error) {
      logger.error('Secure checkins fetch failed', {
        userId: user.id,
        error: error.message,
        filters: { date, categoryId }
      })
      return NextResponse.json(
        { error: 'Failed to fetch check-ins' },
        { status: 500 }
      )
    }
    // Sanitize response data
    const sanitizedCheckins = checkins?.map(checkin => ({
      ...checkin,
      notes: checkin.notes ? String(checkin.notes).substring(0, 1000) : null, // Limit notes length
    })) || []
    return NextResponse.json({
      checkins: sanitizedCheckins,
      count: sanitizedCheckins.length,
      user_id: user.id, // Confirm data ownership
    })
  } catch (error) {
    logger.error('Secure checkins GET error', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}, { requireAuth: true, requireCSRF: false, allowedMethods: ['GET'] })
// POST /api/checkins - Create or toggle check-in with enhanced security
export const POST = withApiSecurity(async (request: NextRequest, user: any) => {
  try {
    const supabase = await createClient()
    // Apply rate limiting for write operations
    const { response: rateLimitResponse } = await withEnhancedRateLimit(request, 'write', user.id)
    if (rateLimitResponse) return rateLimitResponse
    // Validate request body with security checks
    const { data: validatedData, error: validationError, violations } = await validateSecureRequest(
      request,
      secureCheckinSchema
    )
    if (validationError) {
      logger.warn('Checkin validation failed', {
        userId: user.id,
        error: validationError,
        violations
      })
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }
    if (violations && violations.length > 0) {
      logger.error('Security violations in checkin request', {
        userId: user.id,
        violations,
        path: request.nextUrl.pathname,
      })
      return NextResponse.json(
        { error: 'Request blocked due to security violations' },
        { status: 403 }
      )
    }
    const { categoryId, completed, mood, notes } = validatedData!
    // Additional business logic validation
    if (mood && (mood < 1 || mood > 10)) {
      return NextResponse.json(
        { error: 'Mood must be between 1 and 10' },
        { status: 400 }
      )
    }
    // Verify category exists and is active
    const { data: category, error: categoryError } = await supabase
      .from('axis6_categories')
      .select('id, name, is_active')
      .eq('id', categoryId)
      .eq('is_active', true)
      .single()
    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Invalid or inactive category' },
        { status: 400 }
      )
    }
    const today = new Date().toISOString().split('T')[0]
    if (completed) {
      // Use secure UPSERT with proper constraints
      const { data: checkin, error } = await supabase
        .from('axis6_checkins')
        .upsert({
          user_id: user.id, // CRITICAL: Set user_id explicitly
          category_id: categoryId,
          completed_at: today,
          mood: mood || 5,
          notes: notes || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id, category_id, completed_at',
          ignoreDuplicates: false
        })
        .select()
        .single()
      if (error) {
        logger.error('Secure checkin upsert failed', {
          userId: user.id,
          categoryId,
          error: error.message
        })
        return NextResponse.json(
          { error: 'Failed to save check-in' },
          { status: 500 }
        )
      }
      // Update streak calculation securely
      const { error: streakError } = await supabase.rpc('axis6_calculate_streak_optimized', {
        p_user_id: user.id,
        p_category_id: categoryId
      })
      if (streakError) {
        logger.warn('Streak calculation failed', {
          userId: user.id,
          categoryId,
          error: streakError.message
        })
      }
      return NextResponse.json({
        checkin,
        message: 'Check-in completed successfully',
        category: category.name
      })
    } else {
      // Remove check-in securely
      const { error } = await supabase
        .from('axis6_checkins')
        .delete()
        .eq('user_id', user.id) // CRITICAL: User isolation
        .eq('category_id', categoryId)
        .eq('completed_at', today)
      if (error) {
        logger.error('Secure checkin deletion failed', {
          userId: user.id,
          categoryId,
          error: error.message
        })
        return NextResponse.json(
          { error: 'Failed to remove check-in' },
          { status: 500 }
        )
      }
      // Update streak after deletion
      await supabase.rpc('axis6_calculate_streak_optimized', {
        p_user_id: user.id,
        p_category_id: categoryId
      })
      return NextResponse.json({
        message: 'Check-in removed successfully',
        category: category.name
      })
    }
  } catch (error) {
    logger.error('Secure checkins POST error', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}, { requireAuth: true, requireCSRF: true, allowedMethods: ['POST'] })
// PUT /api/checkins - Update existing check-in securely
export const PUT = withApiSecurity(async (request: NextRequest, user: any) => {
  try {
    const supabase = await createClient()
    // Apply rate limiting
    const { response: rateLimitResponse } = await withEnhancedRateLimit(request, 'write', user.id)
    if (rateLimitResponse) return rateLimitResponse
    // Validate request body
    const { data: validatedData, error: validationError } = await validateSecureRequest(
      request,
      secureCheckinSchema
    )
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }
    const { categoryId, mood, notes, date } = validatedData!
    if (!date) {
      return NextResponse.json(
        { error: 'Date is required for updates' },
        { status: 400 }
      )
    }
    // Update with user isolation
    const { data: checkin, error } = await supabase
      .from('axis6_checkins')
      .update({
        mood,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id) // CRITICAL: User isolation
      .eq('category_id', categoryId)
      .eq('completed_at', date)
      .select()
      .single()
    if (error) {
      logger.error('Secure checkin update failed', {
        userId: user.id,
        categoryId,
        date,
        error: error.message
      })
      return NextResponse.json(
        { error: 'Failed to update check-in or unauthorized' },
        { status: 500 }
      )
    }
    return NextResponse.json({
      checkin,
      message: 'Check-in updated successfully'
    })
  } catch (error) {
    logger.error('Secure checkins PUT error', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}, { requireAuth: true, requireCSRF: true, allowedMethods: ['PUT'] })
// DELETE /api/checkins - Delete specific check-in securely
export const DELETE = withApiSecurity(async (request: NextRequest, user: any) => {
  try {
    const supabase = await createClient()
    // Apply rate limiting
    const { response: rateLimitResponse } = await withEnhancedRateLimit(request, 'write', user.id)
    if (rateLimitResponse) return rateLimitResponse
    // Get and validate query parameters
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const date = searchParams.get('date')
    if (!categoryId || !date) {
      return NextResponse.json(
        { error: 'Category ID and date are required' },
        { status: 400 }
      )
    }
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID format' },
        { status: 400 }
      )
    }
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }
    // Delete with user isolation
    const { error } = await supabase
      .from('axis6_checkins')
      .delete()
      .eq('user_id', user.id) // CRITICAL: User isolation
      .eq('category_id', categoryId)
      .eq('completed_at', date)
    if (error) {
      logger.error('Secure checkin deletion failed', {
        userId: user.id,
        categoryId,
        date,
        error: error.message
      })
      return NextResponse.json(
        { error: 'Failed to delete check-in or unauthorized' },
        { status: 500 }
      )
    }
    // Update streak after deletion
    await supabase.rpc('axis6_calculate_streak_optimized', {
      p_user_id: user.id,
      p_category_id: categoryId
    })
    return NextResponse.json({
      message: 'Check-in deleted successfully'
    })
  } catch (error) {
    logger.error('Secure checkins DELETE error', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}, { requireAuth: true, requireCSRF: true, allowedMethods: ['DELETE'] })