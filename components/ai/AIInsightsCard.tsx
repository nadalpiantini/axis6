'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  Target, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  BarChart3,
  Heart,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { PersonalizedInsight } from '@/lib/ai/behavioral-analyzer'
import { useAIPersonalization } from '@/lib/hooks/useAIPersonalization'


interface AIInsightsCardProps {
  className?: string
  showAll?: boolean
  maxInsights?: number
}

export function AIInsightsCard({ className, showAll = false, maxInsights = 3 }: AIInsightsCardProps) {
  const { 
    insights, 
    behaviorProfile, 
    isLoading, 
    error,
    getActiveInsights,
    getInsightsByType 
  } = useAIPersonalization()

  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set())

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Insights
            <Sparkles className="w-4 h-4 text-purple-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            AI Insights Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Unable to load personalized insights. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    )
  }

  const activeInsights = getActiveInsights()
  const displayedInsights = showAll ? activeInsights : activeInsights.slice(0, maxInsights)

  const toggleInsightExpansion = (insightId: string) => {
    const newExpanded = new Set(expandedInsights)
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId)
    } else {
      newExpanded.add(insightId)
    }
    setExpandedInsights(newExpanded)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Clock className="w-4 h-4" />
      case 'weekly': return <TrendingUp className="w-4 h-4" />
      case 'coaching': return <Lightbulb className="w-4 h-4" />
      case 'recommendation': return <Target className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          AI Insights
          <Sparkles className="w-4 h-4 text-purple-500" />
        </CardTitle>
        <CardDescription>
          Personalized insights based on your wellness patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayedInsights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No insights available yet.</p>
            <p className="text-xs mt-2">Keep using AXIS6 to unlock personalized insights!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {displayedInsights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                            {insight.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {insight.type}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600">{insight.content}</p>
                      
                      {insight.action_items && insight.action_items.length > 0 && (
                        <Collapsible
                          open={expandedInsights.has(insight.id)}
                          onOpenChange={() => toggleInsightExpansion(insight.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto font-normal text-purple-600 hover:text-purple-700"
                            >
                              {expandedInsights.has(insight.id) ? (
                                <>
                                  Hide action items <ChevronUp className="w-3 h-3 ml-1" />
                                </>
                              ) : (
                                <>
                                  Show {insight.action_items.length} action item{insight.action_items.length > 1 ? 's' : ''} <ChevronDown className="w-3 h-3 ml-1" />
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-3 space-y-2">
                              {insight.action_items.map((action, actionIndex) => (
                                <div 
                                  key={actionIndex} 
                                  className="flex items-center gap-2 text-sm text-gray-700 bg-purple-50 p-2 rounded"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                  {action}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                      
                      {insight.personalization_score && (
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-gray-500">Relevance:</span>
                          <div className="flex-1 max-w-24">
                            <Progress 
                              value={insight.personalization_score * 100} 
                              className="h-2"
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {Math.round(insight.personalization_score * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {activeInsights.length > maxInsights && !showAll && (
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  View {activeInsights.length - maxInsights} more insights
                </Button>
              </div>
            )}
          </div>
        )}
        
        {behaviorProfile && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Analysis Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Patterns Found:</span>
                <span className="ml-2 font-medium">{behaviorProfile.patterns.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Consistency Score:</span>
                <span className="ml-2 font-medium">
                  {Math.round(behaviorProfile.completion_patterns.consistency_score * 100)}%
                </span>
              </div>
              <div>
                <span className="text-gray-500">Peak Hours:</span>
                <span className="ml-2 font-medium">
                  {behaviorProfile.completion_patterns.peak_hours.slice(0, 2).map(h => `${h}:00`).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Best Days:</span>
                <span className="ml-2 font-medium capitalize">
                  {behaviorProfile.completion_patterns.best_days.slice(0, 2).join(', ')}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function InsightTypeFilter() {
  const { getInsightsByType } = useAIPersonalization()
  const [selectedType, setSelectedType] = useState<string>('all')

  const insightTypes = [
    { value: 'all', label: 'All Insights', icon: Brain },
    { value: 'daily', label: 'Daily', icon: Clock },
    { value: 'weekly', label: 'Weekly', icon: TrendingUp },
    { value: 'coaching', label: 'Coaching', icon: Lightbulb },
    { value: 'recommendation', label: 'Tips', icon: Target }
  ]

  return (
    <div className="flex gap-2 mb-4 overflow-x-auto">
      {insightTypes.map(type => {
        const Icon = type.icon
        const count = type.value === 'all' ? 0 : getInsightsByType(type.value as any).length
        
        return (
          <Button
            key={type.value}
            variant={selectedType === type.value ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={() => setSelectedType(type.value)}
          >
            <Icon className="w-3 h-3" />
            {type.label}
            {count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {count}
              </Badge>
            )}
          </Button>
        )
      })}
    </div>
  )
}