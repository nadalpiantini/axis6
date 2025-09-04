'use client'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Sparkles,
  TrendingUp,
  Bell,
  Target,
  Clock,
  RefreshCw,
  Zap,
  Heart,
  BarChart3,
  Settings,
  Lightbulb,
  Award,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAIPersonalization } from '@/lib/hooks/useAIPersonalization'
import { AIInsightsCard } from './AIInsightsCard'
import { PersonalizedRecommendations } from './PersonalizedRecommendations'
import { SmartNotificationPanel, NotificationSummary } from './SmartNotificationPanel'
import { handleError } from '@/lib/error/standardErrorHandler'
interface AIDashboardProps {
  className?: string
  defaultTab?: string
}
export function AIDashboard({ className, defaultTab = 'overview' }: AIDashboardProps) {
  const {
    behaviorProfile,
    insights,
    notifications,
    optimalTimes,
    personalizedReminders,
    isLoading,
    error,
    refreshAIData,
    hasActiveNotifications,
    hasHighPriorityNotifications,
    behaviorAnalysisAge,
    optimalTimeScore,
    generateNotifications,
    getActiveInsights,
    getInsightsByType
  } = useAIPersonalization()
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshAIData()
    } catch (error) {
      handleError(error, {
      operation: 'ai_operation', component: 'AIDashboard',
        userMessage: 'AI operation failed. Please try again.'
      })} finally {
      setIsRefreshing(false)
    }
  }
  const generateQuickInsights = () => {
    generateNotifications({ lookAheadHours: 48, force_regenerate: true })
  }
  if (error && !behaviorProfile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            AI Dashboard Unavailable
          </CardTitle>
          <CardDescription>
            Unable to load AI personalization features. Please check your connection and try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Status and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Wellness Coach
            <Sparkles className="w-5 h-5 text-purple-500" />
          </h1>
          <p className="text-gray-600 mt-1">
            Your personalized wellness intelligence system
          </p>
        </div>
        <div className="flex items-center gap-3">
          {behaviorProfile && (
            <div className="text-right text-sm text-gray-500">
              <div>Last analysis: {behaviorAnalysisAge ? `${behaviorAnalysisAge}h ago` : 'recent'}</div>
              <div>Confidence: {Math.round((optimalTimeScore || 0) * 100)}%</div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={generateQuickInsights}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            Quick Insights
          </Button>
        </div>
      </div>
      {/* Active Notifications Summary */}
      <NotificationSummary />
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
            {getActiveInsights().length > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">
                {getActiveInsights().length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
            {hasHighPriorityNotifications && (
              <Badge variant="destructive" className="text-xs ml-1 animate-pulse">
                Priority
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab
            behaviorProfile={behaviorProfile}
            insights={insights}
            notifications={notifications}
            optimalTimes={optimalTimes}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="insights" className="space-y-6">
          <AIInsightsCard showAll maxInsights={10} />
        </TabsContent>
        <TabsContent value="notifications" className="space-y-6">
          <SmartNotificationPanel maxNotifications={10} showActions />
        </TabsContent>
        <TabsContent value="recommendations" className="space-y-6">
          <PersonalizedRecommendations showGoals />
        </TabsContent>
      </Tabs>
    </div>
  )
}
function OverviewTab({
  behaviorProfile,
  insights,
  notifications,
  optimalTimes,
  isLoading
}: any) {
  if (isLoading && !behaviorProfile) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  const activeInsights = insights?.filter((i: any) => !i.expires_at || new Date(i.expires_at) > new Date()) || []
  const activeNotifications = notifications?.filter((n: any) => !n.delivered) || []
  const highPriorityNotifications = activeNotifications.filter((n: any) => n.priority === 'high' || n.priority === 'urgent')
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Brain}
          title="AI Confidence"
          value={behaviorProfile ? `${Math.round((behaviorProfile.patterns?.length || 0) * 10 + 60)}%` : 'N/A'}
          description="Pattern recognition accuracy"
          color="purple"
        />
        <MetricCard
          icon={Lightbulb}
          title="Active Insights"
          value={activeInsights.length}
          description="Personalized recommendations"
          color="yellow"
        />
        <MetricCard
          icon={Bell}
          title="Smart Alerts"
          value={activeNotifications.length}
          description={`${highPriorityNotifications.length} high priority`}
          color={highPriorityNotifications.length > 0 ? "red" : "blue"}
        />
        <MetricCard
          icon={Clock}
          title="Optimal Times"
          value={optimalTimes?.length || 0}
          description="Peak performance windows"
          color="green"
        />
      </div>
      {/* Behavioral Profile Summary */}
      {behaviorProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Your Behavioral Profile
            </CardTitle>
            <CardDescription>
              AI analysis of your wellness patterns and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Motivation Style</h4>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="capitalize text-sm">
                    {behaviorProfile.behavioral_traits?.motivation_type || 'Mixed'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Goal Orientation</h4>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className="capitalize text-sm">
                    {behaviorProfile.behavioral_traits?.goal_orientation || 'Balanced'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Peak Hours</h4>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">
                    {behaviorProfile.completion_patterns?.peak_hours?.slice(0, 2).map((h: number) => `${h}:00`).join(', ') || 'Analyzing...'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Consistency</h4>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">
                    {Math.round((behaviorProfile.completion_patterns?.consistency_score || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-3">Recent Patterns Detected</h4>
              <div className="space-y-2">
                {behaviorProfile.patterns?.slice(0, 3).map((pattern: any, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{pattern.description}</span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {Math.round(pattern.confidence_score * 100)}%
                    </Badge>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">Keep using AXIS6 to unlock pattern insights!</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Insights */}
        <div className="lg:col-span-2">
          <AIInsightsCard maxInsights={3} />
        </div>
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              AI-powered wellness tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Target className="w-4 h-4 mr-3" />
              Get Activity Suggestions
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-3" />
              Set Smart Goals
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Clock className="w-4 h-4 mr-3" />
              Find Optimal Times
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Bell className="w-4 h-4 mr-3" />
              Setup Smart Reminders
            </Button>
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Next Optimal Time</h4>
              {optimalTimes && optimalTimes.length > 0 ? (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {optimalTimes[0].hour}:00
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(optimalTimes[0].probability * 100)}% match
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Best time for your wellness check-in
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Complete a few check-ins to discover your optimal times!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
function MetricCard({
  icon: Icon,
  title,
  value,
  description,
  color = 'blue'
}: {
  icon: any
  title: string
  value: string | number
  description: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50'
  }
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
