'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCategories } from '@/lib/react-query/hooks/useCategories'
import { createClient } from '@/lib/supabase/client'

export interface OnboardingState {
  selectedCategories: number[]
  loading: boolean
  error: string | null
  language: 'es' | 'en'
}

export function useOnboarding() {
  const router = useRouter()
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories()
  
  const [state, setState] = useState<OnboardingState>({
    selectedCategories: [],
    loading: false,
    error: null,
    language: 'es' // Default to Spanish, could be dynamic later
  })

  const toggleCategory = (categoryId: number) => {
    setState(prev => {
      const newSelected = prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : prev.selectedCategories.length < 6
          ? [...prev.selectedCategories, categoryId]
          : prev.selectedCategories
      
      return {
        ...prev,
        selectedCategories: newSelected,
        error: null // Clear any previous errors when user interacts
      }
    })
  }

  const setLanguage = (language: 'es' | 'en') => {
    setState(prev => ({ ...prev, language }))
  }

  const completeOnboarding = async () => {
    if (state.selectedCategories.length !== 6) {
      setState(prev => ({ 
        ...prev, 
        error: 'Debes seleccionar exactamente 6 dimensiones para continuar' 
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Usuario no autenticado')
      }

      // Create or update user profile
      const { error: profileError } = await supabase
        .from('axis6_profiles')
        .upsert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
          onboarded: true,
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        throw new Error('Error al crear el perfil de usuario')
      }

      // Initialize streaks for selected categories
      const { error: streaksError } = await supabase
        .from('axis6_streaks')
        .upsert(
          state.selectedCategories.map(categoryId => ({
            user_id: user.id,
            category_id: categoryId,
            current_streak: 0,
            longest_streak: 0,
            updated_at: new Date().toISOString()
          }))
        )

      if (streaksError) {
        console.warn('Error initializing streaks, but continuing onboarding:', streaksError)
        // Don't block onboarding for streak initialization failures
      }

      // Redirect to dashboard
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Onboarding failed:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error durante el proceso de configuración',
        loading: false 
      }))
    }
  }

  // Helper functions
  const isSelected = (categoryId: number) => state.selectedCategories.includes(categoryId)
  const canComplete = state.selectedCategories.length === 6
  const progress = (state.selectedCategories.length / 6) * 100

  return {
    // Data
    categories: categories || [],
    
    // State
    selectedCategories: state.selectedCategories,
    loading: state.loading,
    error: state.error,
    language: state.language,
    
    // Loading states
    categoriesLoading,
    categoriesError: categoriesError as Error | null,
    
    // Actions
    toggleCategory,
    setLanguage,
    completeOnboarding,
    
    // Helpers
    isSelected,
    canComplete,
    progress,
    selectedCount: state.selectedCategories.length,
    remainingCount: 6 - state.selectedCategories.length,
  }
}