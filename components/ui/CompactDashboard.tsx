'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Calendar, Award, BarChart3 } from 'lucide-react'
import { useState } from 'react'

import { PhysicalIcon, MentalIcon, EmotionalIcon, SocialIcon, SpiritualIcon, MaterialIcon } from '../icons'

import MiniHexagon from './MiniHexagon'
import WellnessScore from './WellnessScore'

interface Category {
  id: number
  slug: string
  name: { es?: string; en?: string } | string
  description: { es?: string; en?: string } | string
  color: string
  icon: string
  position: number
  isCompleted?: boolean
}

interface CompactDashboardProps {
  categories: Category[]
  completedToday: Set<number>
  onToggleCategory: (categoryId: number) => void
  streaks: any[]
  user: any
}

const iconMap: Record<string, React.ReactNode> = {
  'activity': <PhysicalIcon size={20} />,
  'brain': <MentalIcon size={20} />,
  'heart': <EmotionalIcon size={20} />,
  'users': <SocialIcon size={20} />,
  'sparkles': <SpiritualIcon size={20} />,
  'briefcase': <MaterialIcon size={20} />
}

const tabConfig = [
  { id: 'overview', label: 'Vista General', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'activities', label: 'Actividades', icon: <PhysicalIcon size={16} /> },
  { id: 'progress', label: 'Progreso', icon: <Award className="w-4 h-4" /> }
]

export default function CompactDashboard({
  categories,
  completedToday,
  onToggleCategory,
  streaks,
  user: _user
}: CompactDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const getCategoryName = (name: any) => {
    if (typeof name === 'object') {
      return name.es || name.en || 'Sin nombre'
    }
    return name || 'Sin nombre'
  }

  const getCompletionPercentage = () => {
    if (categories.length === 0) return 0
    return Math.round((completedToday.size / categories.length) * 100)
  }

  const getHexagonData = () => {
    const categoryMap: Record<string, number> = {
      physical: 0,
      mental: 0,
      emotional: 0,
      social: 0,
      spiritual: 0,
      material: 0
    }

    categories.forEach(cat => {
      if (completedToday.has(cat.id)) {
        categoryMap[cat.slug] = 100
      }
    })

    return categoryMap
  }

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId)
    if (categoryId !== null) {
      onToggleCategory(categoryId)
    }
  }

  const currentStreak = streaks?.find(s => s.category_id === null)?.current_streak || 0
  const longestStreak = streaks?.find(s => s.category_id === null)?.longest_streak || 0

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Tab Navigation */}
      <div className="mb-4">
        <div className="tab-nav">
          {tabConfig.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="flex items-center gap-2">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Areas */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {/* Main Progress Card */}
            <div className="lg:col-span-2 glass-premium rounded-2xl p-4">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Mini Hexagon */}
                <div className="flex-shrink-0">
                  <MiniHexagon 
                    data={getHexagonData() as any}
                    size={200}
                    onCategoryClick={handleCategoryClick}
                    selectedCategory={selectedCategory}
                  />
                </div>

                {/* Category Grid */}
                <div className="flex-1 w-full">
                  <h3 className="text-lg font-serif font-semibold text-textPrimary mb-3">Check-in Rápido</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(category => {
                      const isCompleted = completedToday.has(category.id)
                      const isSelected = selectedCategory === category.id
                      
                      return (
                        <motion.button
                          key={category.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleCategoryClick(category.id)}
                          className={`
                            relative p-3 rounded-xl transition-all duration-300
                            ${isCompleted 
                              ? 'bg-white/10 border-2' 
                              : 'bg-white/5 border border-white/10 hover:bg-white/8'
                            }
                            ${isSelected ? 'ring-2 ring-white/30' : ''}
                          `}
                          style={{
                            borderColor: isCompleted ? category.color : undefined,
                            background: isCompleted 
                              ? `linear-gradient(135deg, ${category.color}15, transparent)`
                              : undefined
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ 
                                backgroundColor: `${category.color}20`,
                                color: category.color
                              }}
                            >
                              {iconMap[category.icon]}
                            </div>
                            <span className="text-xs font-medium text-textPrimary">
                              {getCategoryName(category.name)}
                            </span>
                            {isCompleted && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="ml-auto"
                              >
                                <svg className="w-4 h-4" style={{ color: category.color }} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-textSecondary">Progreso del día</span>
                  <span className="text-xs font-semibold text-textPrimary">{getCompletionPercentage()}%</span>
                </div>
                <div className="w-full h-2 bg-arena/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, var(--physical), var(--emotional))',
                      width: `${getCompletionPercentage()}%`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${getCompletionPercentage()}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            {/* Wellness Score Card */}
            <div className="glass-premium rounded-2xl p-4">
              <WellnessScore
                score={getCompletionPercentage()}
                currentStreak={currentStreak}
                longestStreak={longestStreak}
                completedToday={completedToday.size}
                totalCategories={categories.length}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'activities' && (
          <motion.div
            key="activities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {categories.map((category, index) => {
              const isCompleted = completedToday.has(category.id)
              const suggestions = [
                "Camina 15 minutos", "Medita 5 minutos", "Escribe 3 gratitudes",
                "Llama a un amigo", "Reflexiona", "Organiza tu espacio"
              ]
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`
                    card-compact cursor-pointer transition-all
                    ${isCompleted ? 'bg-white/8' : 'hover:bg-white/7'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ 
                        backgroundColor: `${category.color}20`,
                        color: category.color
                      }}
                    >
                      {iconMap[category.icon]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white mb-1">
                        {getCategoryName(category.name)}
                      </h4>
                      <p className="text-xs text-gray-400 mb-2">
                        {suggestions[index % suggestions.length]}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-300">
                          5 min
                        </span>
                        {isCompleted && (
                          <span className="text-xs px-2 py-1 rounded-full" 
                            style={{ 
                              backgroundColor: `${category.color}20`,
                              color: category.color
                            }}
                          >
                            Completado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {activeTab === 'progress' && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            {/* Quick Stats */}
            <div className="card-compact">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-physical/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-physical" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Hoy</p>
                  <p className="text-lg font-bold text-white">
                    {completedToday.size}/{categories.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-compact">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-mental/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-mental" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Racha</p>
                  <p className="text-lg font-bold text-white">
                    {currentStreak} días
                  </p>
                </div>
              </div>
            </div>

            <div className="card-compact">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emotional/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emotional" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Mejor</p>
                  <p className="text-lg font-bold text-white">
                    {longestStreak} días
                  </p>
                </div>
              </div>
            </div>

            <div className="card-compact">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-social/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-social" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Balance</p>
                  <p className="text-lg font-bold text-white">
                    {getCompletionPercentage()}%
                  </p>
                </div>
              </div>
            </div>

            {/* Category Progress */}
            <div className="col-span-2 lg:col-span-4 card-compact">
              <h4 className="text-sm font-semibold text-white mb-3">Progreso por Categoría</h4>
              <div className="space-y-2">
                {categories.map(category => {
                  const isCompleted = completedToday.has(category.id)
                  const categoryStreak = streaks?.find(s => s.category_id === category.id)?.current_streak || 0
                  
                  return (
                    <div key={category.id} className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${category.color}20`,
                          color: category.color
                        }}
                      >
                        {isCompleted ? '✓' : ''}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-300">
                            {getCategoryName(category.name)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {categoryStreak} días
                          </span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: category.color,
                              width: isCompleted ? '100%' : '0%'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}