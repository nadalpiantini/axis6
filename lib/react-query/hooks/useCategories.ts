import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { handleError } from '@/lib/error/standardErrorHandler'
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
  // 🛡️ SAFEGUARD: Ensure we don't have more than 6 categories
  const rawData = data || []
  if (rawData.length > 6) {
    }
  // Transform the data to ensure proper typing for JSONB fields
  const categories = rawData.slice(0, 6).map(category => {
    let parsedName = category.name
    let parsedDescription = category.description
    // 🛡️ SAFE JSONB PARSING with error handling
    try {
      if (typeof category.name === 'string') {
        parsedName = JSON.parse(category.name)
      }
    } catch (error) {
      handleError(error, {
      operation: 'parse_category_name_jsonb', component: 'useCategories',
        level: 'warning',
        showToast: false, // Data transformation errors shouldn't show to user
        context: { categoryId: category.id, rawName: category.name }
      })
      // Keep original string value as fallback
      parsedName = category.name
    }
    try {
      if (typeof category.description === 'string') {
        parsedDescription = JSON.parse(category.description)
      }
    } catch (error) {
      handleError(error, {
      operation: 'parse_category_description_jsonb', component: 'useCategories',
        level: 'warning',
        showToast: false, // Data transformation errors shouldn't show to user
        context: { categoryId: category.id, rawDescription: category.description }
      })
      // Keep original string value as fallback
      parsedDescription = category.description
    }
    return {
      ...category,
      name: parsedName,
      description: parsedDescription
    }
  }) as Category[]
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
