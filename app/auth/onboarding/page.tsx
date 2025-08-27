'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, AlertCircle, Loader2, CheckCircle } from 'lucide-react'

import { CategoryCard } from '@/components/onboarding/CategoryCard'
import { LogoFull } from '@/components/ui/Logo'
import { useOnboarding } from '@/lib/hooks/useOnboarding'

export default function OnboardingPage() {
  const {
    categories,
    loading,
    error,
    categoriesLoading,
    categoriesError,
    toggleCategory,
    completeOnboarding,
    isSelected,
    canComplete,
    progress,
    selectedCount,
    remainingCount
  } = useOnboarding()

  // English content only
  const content = {
    title: 'Customize Your AXIS6',
    subtitle: 'Select the 6 dimensions you want to balance in your life',
    selected: 'selected',
    beginJourney: 'Begin My Journey',
    settingUp: 'Setting up...',
    perfect: 'Perfect! You\'ve selected your 6 dimensions',
    remaining: remainingCount > 0 ? `Select ${remainingCount} more` : '',
    loadingCategories: 'Loading dimensions...',
    errorTitle: 'Error loading categories'
  }

  // Loading state
  if (categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <LogoFull size="lg" className="mb-6" priority />
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">{content.loadingCategories}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (categoriesError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md">
          <LogoFull size="lg" className="mb-6" priority />
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">{content.errorTitle}</h2>
          <p className="text-gray-400 mb-6">{categoriesError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        {/* Header with Language Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-6">
            <LogoFull size="lg" priority />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            {content.title}
          </h1>
          <p className="text-gray-400 mb-6">
            {content.subtitle}
          </p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{selectedCount}</span>
              <span className="text-gray-400">/ 6 {content.selected}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            
            {remainingCount > 0 && (
              <span className="text-sm text-yellow-400">
                {content.remaining}
              </span>
            )}
          </div>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={isSelected(category.id)}
              onClick={() => toggleCategory(category.id)}
              language="en"
              animationDelay={index}
            />
          ))}
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <button
            onClick={completeOnboarding}
            disabled={!canComplete || loading}
            className={`
              px-8 py-4 rounded-xl font-semibold text-white flex items-center gap-2 
              transition-all duration-300 min-w-[200px]
              ${canComplete && !loading
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
              }
            `}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {content.settingUp}
              </>
            ) : (
              <>
                {content.beginJourney}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {canComplete && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 mt-6 text-green-400"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{content.perfect}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}