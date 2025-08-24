import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Category {
  id: number
  slug: string
  name: Record<string, string> // JSONB multilingual data
  description?: Record<string, string>
  color: string
  icon: string
  position: number
  created_at: string
}

async function fetchCategories(): Promise<Category[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('axis6_categories')
    .select('*')
    .order('position')

  if (error) throw error
  
  // Transform the data to ensure proper typing for JSONB fields
  const categories = (data || []).map(category => ({
    ...category,
    name: typeof category.name === 'string' ? JSON.parse(category.name) : category.name,
    description: category.description 
      ? (typeof category.description === 'string' ? JSON.parse(category.description) : category.description)
      : undefined
  })) as Category[]
  
  return categories
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes - categories rarely change
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}