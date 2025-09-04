'use client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Target,
  Clock,
  Users,
  Zap,
  Heart,
  RefreshCw,
  ChevronRight,
  Star,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAIRecommendations } from '@/lib/hooks/useAIPersonalization'
import { useCategories } from '@/lib/react-query/hooks/useCategories'
import { getCategoryName } from '@/lib/utils/i18n'
interface PersonalizedRecommendationsProps {
  className?: string
  categoryId?: number
  showGoals?: boolean
}
interface ActivityFilters {
  energy_level?: 'low' | 'medium' | 'high'
  social_preference?: 'solo' | 'small_group' | 'large_group'
  time_available?: 'quick' | 'moderate' | 'extended'
  current_mood?: number
}
export function PersonalizedRecommendations({
  className,
  categoryId,
  showGoals = true
}: PersonalizedRecommendationsProps) {
  const { data: categoriesData } = useCategories()
  const {
    getActivityRecommendations,
    getGoalRecommendations,
    isLoadingActivities,
    isLoadingGoals,
    activityData,
    goalData,
    activityError,
    goalError
  } = useAIRecommendations()
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId?.toString() || '')
  const [filters, setFilters] = useState<ActivityFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const categories = categoriesData || []
  useEffect(() => {
    if (categoryId && categoryId.toString() !== selectedCategory) {
      setSelectedCategory(categoryId.toString())
    }
  }, [categoryId, selectedCategory])
  useEffect(() => {
    // Auto-load recommendations for first category if none selected
    if (!selectedCategory && categories.length > 0) {
      const firstCategory = categories[0]
      setSelectedCategory(firstCategory.id.toString())
      loadActivityRecommendations(firstCategory.id.toString())
    }
  }, [categories, selectedCategory])
  const loadActivityRecommendations = (catId: string) => {
    if (!catId) return
    getActivityRecommendations({
      category_id: catId,
      ...filters
    })
  }
  const loadGoalRecommendations = (timeframe: 'weekly' | 'monthly' = 'weekly') => {
    getGoalRecommendations({ timeframe })
  }
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId)
    loadActivityRecommendations(catId)
  }
  const handleFilterChange = (key: keyof ActivityFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    if (selectedCategory) {
      getActivityRecommendations({
        category_id: selectedCategory,
        ...newFilters
      })
    }
  }
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-green-600 bg-green-100'
    if (difficulty <= 4) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }
  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return 'Easy'
    if (difficulty <= 4) return 'Medium'
    return 'Hard'
  }
  const getEnergyIcon = (level: string) => {
    switch (level) {
      case 'low': return '🌱'
      case 'medium': return '⚡'
      case 'high': return '🔥'
      default: return '✨'
    }
  }
  const getSocialIcon = (social: string) => {
    switch (social) {
      case 'solo': return '🧘'
      case 'small_group': return '👥'
      case 'large_group': return '👫'
      default: return '🤝'
    }
  }
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Activity Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Personalized Activities
          </CardTitle>
          <CardDescription>
            AI-powered activity suggestions based on your personality and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="flex gap-4 items-center">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a wellness area" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {getCategoryName(category, 'en')}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters {showFilters ? '▼' : '▶'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedCategory && loadActivityRecommendations(selectedCategory)}
              disabled={isLoadingActivities || !selectedCategory}
            >
              {isLoadingActivities ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>
          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Energy Level</label>
                  <Select
                    value={filters.energy_level || ''}
                    onValueChange={(value) => handleFilterChange('energy_level', value || undefined)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="low">🌱 Low</SelectItem>
                      <SelectItem value="medium">⚡ Medium</SelectItem>
                      <SelectItem value="high">🔥 High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Social Setting</label>
                  <Select
                    value={filters.social_preference || ''}
                    onValueChange={(value) => handleFilterChange('social_preference', value || undefined)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="solo">🧘 Solo</SelectItem>
                      <SelectItem value="small_group">👥 Small Group</SelectItem>
                      <SelectItem value="large_group">👫 Large Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Time Available</label>
                  <Select
                    value={filters.time_available || ''}
                    onValueChange={(value) => handleFilterChange('time_available', value || undefined)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="quick">🏃 Quick (5-15 min)</SelectItem>
                      <SelectItem value="moderate">⏰ Moderate (15-30 min)</SelectItem>
                      <SelectItem value="extended">⏳ Extended (30+ min)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Current Mood (1-5)</label>
                  <Select
                    value={filters.current_mood?.toString() || ''}
                    onValueChange={(value) => handleFilterChange('current_mood', value ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="1">😢 Low (1)</SelectItem>
                      <SelectItem value="2">😕 Below Average (2)</SelectItem>
                      <SelectItem value="3">😐 Average (3)</SelectItem>
                      <SelectItem value="4">😊 Good (4)</SelectItem>
                      <SelectItem value="5">😄 Great (5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Activity Results */}
          {isLoadingActivities ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : activityError ? (
            <div className="text-center py-8 text-red-600">
              <p className="text-sm">Failed to load recommendations</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => selectedCategory && loadActivityRecommendations(selectedCategory)}
              >
                Try Again
              </Button>
            </div>
          ) : activityData?.data?.activities ? (
            <div className="space-y-4">
              <AnimatePresence>
                {activityData.data.activities.map((activity: any, index: number) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          {activity.name}
                          <div className="flex items-center gap-1">
                            {[...Array(Math.round(activity.temperament_fit_score * 5))].map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                            ))}
                          </div>
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                      </div>
                      <Badge
                        className={`${getDifficultyColor(activity.difficulty)} border-0`}
                      >
                        {getDifficultyLabel(activity.difficulty)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{activity.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{getEnergyIcon(activity.energy_level)}</span>
                        <span className="capitalize">{activity.energy_level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{getSocialIcon(activity.social_aspect)}</span>
                        <span className="capitalize">{activity.social_aspect.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                        <span>{Math.round(activity.temperament_fit_score * 100)}% fit</span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-purple-700 bg-purple-50 p-3 rounded">
                        💡 {activity.personalization_reason}
                      </p>
                    </div>
                    {activity.benefits && activity.benefits.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {activity.benefits.map((benefit: string, benefitIndex: number) => (
                          <Badge key={benefitIndex} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Match Score:</span>
                        <Progress
                          value={activity.temperament_fit_score * 100}
                          className="w-20 h-2"
                        />
                        <span className="text-xs text-gray-600">
                          {Math.round(activity.temperament_fit_score * 100)}%
                        </span>
                      </div>
                      <Button variant="outline" size="sm">
                        Try This <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {activityData.data.meta && (
                <div className="text-center text-xs text-gray-500 pt-4 border-t">
                  Generated in {activityData.data.meta.generation_time_ms}ms •
                  Avg fit: {Math.round(activityData.data.meta.average_fit_score * 100)}% •
                  Based on {activityData.data.meta.temperament_used} temperament
                </div>
              )}
            </div>
          ) : selectedCategory ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No recommendations available</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => loadActivityRecommendations(selectedCategory)}
              >
                Generate Recommendations
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      {/* Goal Recommendations */}
      {showGoals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Personalized Goals
            </CardTitle>
            <CardDescription>
              Smart goal suggestions based on your behavior patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Button
                variant="outline"
                onClick={() => loadGoalRecommendations('weekly')}
                disabled={isLoadingGoals}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Weekly Goals
              </Button>
              <Button
                variant="outline"
                onClick={() => loadGoalRecommendations('monthly')}
                disabled={isLoadingGoals}
              >
                <Award className="w-4 h-4 mr-2" />
                Monthly Goals
              </Button>
            </div>
            {isLoadingGoals ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse border rounded p-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : goalError ? (
              <div className="text-center py-6 text-red-600">
                <p className="text-sm">Failed to load goal recommendations</p>
              </div>
            ) : goalData?.data?.goals && goalData.data.goals.length > 0 ? (
              <div className="space-y-3">
                {goalData.data.goals.map((goal: any, index: number) => (
                  <motion.div
                    key={`${goal.category_id}-${goal.goal_type}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">
                          {goal.goal_type === 'frequency' ? 'Complete' : 'Build'} {goal.target_value} {goal.target_unit.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-gray-600">{goal.reasoning}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          goal.difficulty === 'easy' ? 'secondary' :
                          goal.difficulty === 'medium' ? 'default' : 'destructive'
                        }>
                          {goal.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(goal.success_probability * 100)}% success rate
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Success Probability:</span>
                        <Progress value={goal.success_probability * 100} className="w-24 h-2" />
                        <span className="text-xs text-gray-600">
                          {Math.round(goal.success_probability * 100)}%
                        </span>
                      </div>
                      <Button variant="outline" size="sm">
                        Set This Goal
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No goal recommendations yet</p>
                <p className="text-xs mt-2">Generate some personalized goals based on your patterns!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
