import { createClient } from './client'
import { createClient as createServerClient } from './server'
import type { Database } from './types'

type Category = Database['public']['Tables']['axis6_categories']['Row']
type Checkin = Database['public']['Tables']['axis6_checkins']['Row']
type Streak = Database['public']['Tables']['axis6_streaks']['Row']
type DailyStat = Database['public']['Tables']['axis6_daily_stats']['Row']
type Profile = Database['public']['Tables']['axis6_profiles']['Row']

// Get all categories
export async function getCategories(isServer = false) {
  const supabase = isServer ? await createServerClient() : createClient()
  
  const { data, error } = await supabase
    .from('axis6_categories')
    .select('*')
    .order('position')
  
  if (error) throw error
  return data as Category[]
}

// Get today's checkins for a user
export async function getTodayCheckins(userId: string, isServer = false) {
  const supabase = isServer ? await createServerClient() : createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('axis6_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('completed_at', today)
  
  if (error) throw error
  return data as Checkin[]
}

// Toggle a checkin for a category
export async function toggleCheckin(
  userId: string, 
  categoryId: string, 
  isServer = false
) {
  const supabase = isServer ? await createServerClient() : createClient()
  const today = new Date().toISOString().split('T')[0]
  
  // Check if checkin exists
  const { data: existing } = await supabase
    .from('axis6_checkins')
    .select('id')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('completed_at', today)
    .single()
  
  if (existing) {
    // Remove checkin
    const { error } = await supabase
      .from('axis6_checkins')
      .delete()
      .eq('id', existing.id)
    
    if (error) throw error
  } else {
    // Add checkin
    const { error } = await supabase
      .from('axis6_checkins')
      .insert({
        user_id: userId,
        category_id: categoryId,
        completed_at: today
      })
    
    if (error) throw error
  }
  
  // Update streak
  await supabase.rpc('axis6_calculate_streak', {
    p_user_id: userId,
    p_category_id: categoryId
  })
  
  return !existing
}

// Get streaks for a user
export async function getUserStreaks(userId: string, isServer = false) {
  const supabase = isServer ? await createServerClient() : createClient()
  
  const { data, error } = await supabase
    .from('axis6_streaks')
    .select('*')
    .eq('user_id', userId)
  
  if (error) throw error
  return data as Streak[]
}

// Get user profile
export async function getUserProfile(userId: string, isServer = false) {
  const supabase = isServer ? await createServerClient() : createClient()
  
  const { data, error } = await supabase
    .from('axis6_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) throw error
  return data as Profile
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'name' | 'timezone'>>,
  isServer = false
) {
  const supabase = isServer ? await createServerClient() : createClient()
  
  const { data, error } = await supabase
    .from('axis6_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data as Profile
}

// Get daily stats for a date range
export async function getDailyStats(
  userId: string,
  startDate: string,
  endDate: string,
  isServer = false
) {
  const supabase = isServer ? await createServerClient() : createClient()
  
  const { data, error } = await supabase
    .from('axis6_daily_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
  
  if (error) throw error
  return data as DailyStat[]
}