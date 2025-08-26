import { createClient } from './client'

export interface CheckInData {
  user_id: string
  category_id: number
  completed_at: string
  notes?: string
  mood?: number
}

export interface CategoryMap {
  [key: string]: number
}

// Map axis names to database IDs
export const CATEGORY_MAP: CategoryMap = {
  'physical': 1,
  'mental': 2,
  'emotional': 3,
  'social': 4,
  'spiritual': 5,
  'material': 6
}

/**
 * Toggle a check-in for today
 */
export async function toggleCheckIn(categoryKey: string, mood?: number, notes?: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const categoryId = CATEGORY_MAP[categoryKey]
  if (!categoryId) {
    throw new Error(`Invalid category: ${categoryKey}`)
  }

  // Check if already checked in today
  const { data: existingCheckin, error: checkError } = await supabase
    .from('axis6_checkins')
    .select('id')
    .eq('user_id', user.id)
    .eq('category_id', categoryId)
    .eq('completed_at', today)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
    throw checkError
  }

  if (existingCheckin) {
    // Remove check-in
    const { error: deleteError } = await supabase
      .from('axis6_checkins')
      .delete()
      .eq('id', existingCheckin.id)
    
    if (deleteError) throw deleteError
    
    // Recalculate streak
    await recalculateStreak(user.id, categoryId)
    
    return { action: 'removed', completed: false }
  } else {
    // Add check-in
    const { error: insertError } = await supabase
      .from('axis6_checkins')
      .insert({
        user_id: user.id,
        category_id: categoryId,
        completed_at: today,
        notes,
        mood
      })
    
    if (insertError) throw insertError
    
    // Recalculate streak
    await recalculateStreak(user.id, categoryId)
    
    return { action: 'added', completed: true }
  }
}

/**
 * Get today's check-ins for the current user
 */
export async function getTodayCheckIns() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('axis6_checkins')
    .select(`
      id,
      category_id,
      mood,
      notes,
      axis6_categories!inner(slug, name)
    `)
    .eq('user_id', user.id)
    .eq('completed_at', today)

  if (error) throw error

  // Transform to category map
  const checkIns: { [key: string]: boolean } = {}
  
  if (data) {
    data.forEach(checkIn => {
      const category = checkIn.axis6_categories as any
      if (category?.slug) {
        checkIns[category.slug] = true
      }
    })
  }

  return checkIns
}

/**
 * Get streak information for all categories
 */
export async function getStreaks() {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('axis6_streaks')
    .select(`
      current_streak,
      longest_streak,
      axis6_categories!inner(slug, name)
    `)
    .eq('user_id', user.id)

  if (error) throw error

  // Transform to category map
  const streaks: { [key: string]: { current: number, longest: number } } = {}
  
  if (data) {
    data.forEach(streak => {
      const category = streak.axis6_categories as any
      if (category?.slug) {
        streaks[category.slug] = {
          current: streak.current_streak,
          longest: streak.longest_streak
        }
      }
    })
  }

  return streaks
}

/**
 * Recalculate streak for a specific category
 */
async function recalculateStreak(userId: string, categoryId: number) {
  const supabase = createClient()
  
  // Call the PostgreSQL function to recalculate streaks
  const { error } = await supabase.rpc('axis6_calculate_streak', {
    p_user_id: userId,
    p_category_id: categoryId
  })

  if (error) {
    // TODO: Replace with proper error handling
    // console.error('Error recalculating streak:', error);
    // Don't throw - this shouldn't block the check-in
  }
}

/**
 * Get user's completion stats for analytics
 */
export async function getUserStats(days = 30) {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('axis6_daily_stats')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false })

  if (error) throw error

  return data || []
}