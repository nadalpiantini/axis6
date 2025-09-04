import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
// GET /api/categories - Get categories (with optional user customization)
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    // Get user from session (optional for categories)
    const { data: { user } } = await supabase.auth.getUser()
    // Get query parameters
    const { searchParams } = new URL(_request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const userCustomizedOnly = searchParams.get('userOnly') === 'true'
    let query = supabase
      .from('axis6_categories')
      .select('*')
      .order('sort_order', { ascending: true })
    // Filter active categories unless specifically requested
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }
    const { data: categories, error } = await query
    if (error) {
      logger.error('Error fetching categories', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
    // If user is logged in, get their customized categories or check-in status
    let userCategories = categories
    if (user) {
      // Get user's check-ins for today to show completion status
      const today = new Date().toISOString().split('T')[0]
      const { data: todayCheckins } = await supabase
        .from('axis6_checkins')
        .select('category_id, mood, notes')
        .eq('user_id', user.id)
        .eq('completed_at', today)
      const completedCategoryIds = new Set(todayCheckins?.map(c => c.category_id) || [])
      const checkinMap = new Map(todayCheckins?.map(c => [c.category_id, c]) || [])
      userCategories = categories.map(category => ({
        ...category,
        completed: completedCategoryIds.has(category.id),
        todayCheckin: checkinMap.get(category.id) || null
      }))
      // If user wants only their customized categories, filter further
      if (userCustomizedOnly) {
        // This would require a user_categories table for custom selections
        // For now, return all active categories
      }
    }
    return NextResponse.json({ categories: userCategories })
  } catch (error) {
    logger.error('Categories API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
// POST /api/categories - Create custom category (if supported)
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await _request.json()
    const { name, description, color, icon, isPersonal = true } = body
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }
    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const { data: category, error } = await supabase
      .from('axis6_categories')
      .insert({
        name: typeof name === 'string' ? { en: name } : name,
        slug,
        description: typeof description === 'string' ? { en: description } : description,
        color: color || '#6366f1',
        icon: icon || 'circle',
        is_active: true,
        is_default: false,
        created_by: isPersonal ? user.id : null,
        sort_order: 999 // Custom categories go at the end
      })
      .select()
      .single()
    if (error) {
      logger.error('Error creating category', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
    return NextResponse.json({ category, message: 'Category created successfully' })
  } catch (error) {
    logger.error('Categories POST API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
// PUT /api/categories/[id] - Update category (for personal categories only)
export async function PUT(_request: NextRequest) {
  try {
    const supabase = await createClient()
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await _request.json()
    const { categoryId, name, description, color, icon, isActive } = body
    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }
    // Only allow updating personal categories
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData['name'] = typeof name === 'string' ? { en: name } : name
    if (description !== undefined) updateData['description'] = typeof description === 'string' ? { en: description } : description
    if (color !== undefined) updateData['color'] = color
    if (icon !== undefined) updateData['icon'] = icon
    if (isActive !== undefined) updateData['is_active'] = isActive
    updateData['updated_at'] = new Date().toISOString()
    const { data: category, error } = await supabase
      .from('axis6_categories')
      .update(updateData)
      .eq('id', categoryId)
      .eq('created_by', user.id) // Only allow updating own categories
      .select()
      .single()
    if (error) {
      logger.error('Error updating category', error)
      return NextResponse.json({ error: 'Failed to update category or not authorized' }, { status: 500 })
    }
    return NextResponse.json({ category, message: 'Category updated successfully' })
  } catch (error) {
    logger.error('Categories PUT API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
// DELETE /api/categories/[id] - Delete personal category
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
    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }
    // Check if category has any check-ins
    const { data: checkins } = await supabase
      .from('axis6_checkins')
      .select('id')
      .eq('category_id', categoryId)
      .eq('user_id', user.id)
      .limit(1)
    if (checkins && checkins.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete category with existing check-ins. Consider deactivating instead.'
      }, { status: 400 })
    }
    const { error } = await supabase
      .from('axis6_categories')
      .delete()
      .eq('id', categoryId)
      .eq('created_by', user.id) // Only allow deleting own categories
    if (error) {
      logger.error('Error deleting category', error)
      return NextResponse.json({ error: 'Failed to delete category or not authorized' }, { status: 500 })
    }
    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    logger.error('Categories DELETE API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
