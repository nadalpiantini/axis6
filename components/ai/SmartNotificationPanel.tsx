'use client'

import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  BellRing, 
  Clock, 
  Target, 
  Heart, 
  Lightbulb, 
  Trophy,
  X,
  Check,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Zap,
  TrendingUp
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SmartNotification } from '@/lib/ai/smart-notifications'
import { useAIPersonalization } from '@/lib/hooks/useAIPersonalization'


interface SmartNotificationPanelProps {
  className?: string
  maxNotifications?: number
  showActions?: boolean
}

export function SmartNotificationPanel({ 
  className, 
  maxNotifications = 5,
  showActions = true 
}: SmartNotificationPanelProps) {
  const { 
    notifications, 
    isLoading, 
    error,
    markNotification,
    generateNotifications,
    isGeneratingNotifications,
    hasActiveNotifications,
    hasHighPriorityNotifications,
    getNotificationsByPriority
  } = useAIPersonalization()

  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set())

  const activeNotifications = notifications
    .filter(n => !n.delivered && !dismissedNotifications.has(n.id))
    .slice(0, maxNotifications)

  const handleNotificationAction = async (
    notification: SmartNotification,
    action: 'read' | 'dismiss' | 'thumbs_up' | 'thumbs_down'
  ) => {
    try {
      let markAction: 'mark_read' | 'mark_delivered' | 'dismiss' = 'mark_read'
      let feedback = undefined

      switch (action) {
        case 'read':
          markAction = 'mark_read'
          break
        case 'dismiss':
          markAction = 'dismiss'
          setDismissedNotifications(prev => new Set([...prev, notification.id]))
          break
        case 'thumbs_up':
          markAction = 'mark_read'
          feedback = { type: 'thumbs', thumbs: true, time_to_action: 1 }
          break
        case 'thumbs_down':
          markAction = 'dismiss'
          feedback = { type: 'thumbs', thumbs: false, time_to_action: 1 }
          setDismissedNotifications(prev => new Set([...prev, notification.id]))
          break
      }

      await markNotification(notification.id, markAction, feedback)
    } catch (error) {
      // TODO: Replace with proper error handling
    // console.error('Failed to handle notification action:', error);
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder': return <Bell className="w-4 h-4" />
      case 'encouragement': return <Heart className="w-4 h-4" />
      case 'milestone': return <Trophy className="w-4 h-4" />
      case 'tip': return <Lightbulb className="w-4 h-4" />
      case 'challenge': return <Target className="w-4 h-4" />
      default: return <BellRing className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Smart Notifications
            <Sparkles className="w-4 h-4 text-blue-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border rounded-lg p-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Smart Notifications
              <Sparkles className="w-4 h-4 text-blue-500" />
              {hasHighPriorityNotifications && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  Priority
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              AI-powered personalized reminders and insights
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateNotifications()}
              disabled={isGeneratingNotifications}
            >
              {isGeneratingNotifications ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Generate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs mt-2">No active notifications right now.</p>
            {!hasActiveNotifications && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => generateNotifications()}
                disabled={isGeneratingNotifications}
              >
                Generate New Notifications
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              <AnimatePresence>
                {activeNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge 
                              variant={getPriorityBadgeVariant(notification.priority)} 
                              className="text-xs"
                            >
                              {notification.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {notification.type}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm">{notification.message}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(parseISO(notification.scheduled_for), { addSuffix: true })}
                          </div>
                          {notification.personalization_score && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {Math.round(notification.personalization_score * 100)}% match
                            </div>
                          )}
                        </div>
                        
                        {notification.personalization_score && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Relevance:</span>
                            <div className="flex-1 max-w-24">
                              <Progress 
                                value={notification.personalization_score * 100} 
                                className="h-1.5"
                              />
                            </div>
                          </div>
                        )}
                        
                        {showActions && (
                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleNotificationAction(notification, 'thumbs_up')}
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleNotificationAction(notification, 'thumbs_down')}
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleNotificationAction(notification, 'read')}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              onClick={() => handleNotificationAction(notification, 'dismiss')}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
        
        {notifications.length > maxNotifications && (
          <div className="mt-4 text-center text-xs text-gray-500">
            Showing {Math.min(maxNotifications, activeNotifications.length)} of {notifications.filter(n => !n.delivered).length} active notifications
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function NotificationSummary() {
  const { 
    notifications, 
    getNotificationsByPriority,
    hasActiveNotifications,
    hasHighPriorityNotifications 
  } = useAIPersonalization()

  const activeCount = notifications.filter(n => !n.delivered).length
  const urgentCount = getNotificationsByPriority('urgent').length
  const highCount = getNotificationsByPriority('high').length

  if (!hasActiveNotifications) return null

  return (
    <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          {activeCount} active notification{activeCount !== 1 ? 's' : ''}
        </span>
      </div>
      
      {(urgentCount > 0 || highCount > 0) && (
        <div className="flex items-center gap-2">
          {urgentCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {urgentCount} urgent
            </Badge>
          )}
          {highCount > 0 && (
            <Badge variant="default" className="text-xs">
              {highCount} high priority
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}