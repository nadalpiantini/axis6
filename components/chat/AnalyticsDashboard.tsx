'use client'

import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { TrendingUp, MessageSquare, Users, Search, Download, Filter, Calendar, Clock, Zap, Heart, FileText, Hash } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { chatAnalyticsService, ChatAnalytics } from '@/lib/services/chat-analytics'
import { cn } from '@/lib/utils'

import { handleError } from '@/lib/error/standardErrorHandler'
interface AnalyticsDashboardProps {
  className?: string
  onClose?: () => void
}

export function AnalyticsDashboard({ className, onClose }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'engagement' | 'social'>('overview')

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await chatAnalyticsService.getChatAnalytics()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const blob = await chatAnalyticsService.exportAnalytics(format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-analytics.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      handleError(error, {
      operation: 'chat_operation', component: 'AnalyticsDashboard',

        userMessage: 'Chat operation failed. Please try again.'

      })
    }
  }

  const formatHourLabel = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const formatDateLabel = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM dd')
    } catch {
      return dateStr
    }
  }

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#84CC16']

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-neutral-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="text-red-400 mb-4">
          <TrendingUp className="h-12 w-12 mx-auto mb-2" />
          <p>{error || 'Failed to load analytics'}</p>
        </div>
        <Button onClick={loadAnalytics} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-700">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-purple-400" />
          <h1 className="text-xl font-semibold text-white">Chat Analytics</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            className="text-neutral-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="text-neutral-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-4 border-b border-neutral-700">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'activity', label: 'Activity', icon: BarChart },
          { id: 'engagement', label: 'Engagement', icon: Heart },
          { id: 'social', label: 'Social', icon: Users }
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(id as any)}
            className={cn(
              "text-neutral-300 hover:text-white",
              activeTab === id && "bg-purple-600/20 text-purple-400"
            )}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                  <h3 className="font-medium text-white">Total Messages</h3>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.overview.total_messages.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    +{analytics.overview.messages_today} today
                  </Badge>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-5 w-5 text-blue-400" />
                  <h3 className="font-medium text-white">Active Rooms</h3>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.overview.total_rooms}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg p-4 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-green-400" />
                  <h3 className="font-medium text-white">Active Users</h3>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.overview.active_participants}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg p-4 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                  <h3 className="font-medium text-white">Growth Rate</h3>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.overview.growth_rate}%</p>
                <p className="text-xs text-neutral-400 mt-1">vs last week</p>
              </div>
            </div>

            {/* Messages by Day Chart */}
            <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                Messages Over Time (30 Days)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.activity.messages_by_day}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '6px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Search Analytics */}
            <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-green-400" />
                Search Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{analytics.search.total_searches}</p>
                  <p className="text-sm text-neutral-400">Total Searches</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{analytics.search.avg_results_per_search.toFixed(1)}</p>
                  <p className="text-sm text-neutral-400">Avg Results</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{analytics.search.search_success_rate.toFixed(1)}%</p>
                  <p className="text-sm text-neutral-400">Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Activity by Hour */}
            <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-400" />
                Activity by Hour (7 Days)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.activity.messages_by_hour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" tickFormatter={formatHourLabel} stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '6px' }}
                      labelFormatter={(label) => `${formatHourLabel(label as number)}`}
                    />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Messages by Room */}
            <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-400" />
                Most Active Rooms
              </h3>
              <div className="space-y-3">
                {analytics.activity.messages_by_room.slice(0, 8).map((room, index) => (
                  <div key={room.room_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-6 h-6 text-xs flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-white">{room.room_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-neutral-700 rounded-full h-2">
                        <div
                          className="h-2 bg-purple-500 rounded-full"
                          style={{
                            width: `${(room.count / Math.max(...analytics.activity.messages_by_room.map(r => r.count))) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-neutral-300 min-w-[3rem] text-right">
                        {room.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Active Users */}
            <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-400" />
                Most Active Users (30 Days)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analytics.activity.most_active_users.slice(0, 8).map((user, index) => (
                  <div key={user.user_id} className="flex items-center gap-3 p-3 bg-neutral-700 rounded-lg">
                    <Badge variant="secondary" className="w-6 h-6 text-xs flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {user.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.user_name}</p>
                      <p className="text-xs text-neutral-400">{user.message_count} messages</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'engagement' && (
          <div className="space-y-6">
            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <h3 className="font-medium text-white">Avg Messages/User</h3>
                </div>
                <p className="text-3xl font-bold text-white">{analytics.engagement.avg_messages_per_user}</p>
              </div>

              <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <h3 className="font-medium text-white">Avg Response Time</h3>
                </div>
                <p className="text-3xl font-bold text-white">{analytics.engagement.avg_response_time_minutes.toFixed(1)}m</p>
              </div>
            </div>

            {/* File Sharing Stats */}
            <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-400" />
                File Sharing Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{analytics.engagement.file_sharing_stats.total_files}</p>
                  <p className="text-sm text-neutral-400">Total Files</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{analytics.engagement.file_sharing_stats.total_size_mb.toFixed(1)}</p>
                  <p className="text-sm text-neutral-400">MB Shared</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{analytics.engagement.file_sharing_stats.files_by_type.length}</p>
                  <p className="text-sm text-neutral-400">File Types</p>
                </div>
              </div>

              {/* File Types Pie Chart */}
              {analytics.engagement.file_sharing_stats.files_by_type.length > 0 && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.engagement.file_sharing_stats.files_by_type}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ type, count }) => `${type}: ${count}`}
                      >
                        {analytics.engagement.file_sharing_stats.files_by_type.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Most Active Rooms by Engagement */}
            <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5 text-purple-400" />
                Most Engaged Rooms
              </h3>
              <div className="space-y-3">
                {analytics.engagement.most_active_rooms.map((room, index) => (
                  <div key={room.room_id} className="p-3 bg-neutral-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{room.room_name}</span>
                      <Badge variant="secondary" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-300">
                      <span>{room.participant_count} participants</span>
                      <span>{room.message_count} messages</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6">
            {/* Social Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg p-6 border border-green-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-6 w-6 text-green-400" />
                  <h3 className="text-lg font-medium text-white">Mentions Given</h3>
                </div>
                <p className="text-3xl font-bold text-white">{analytics.social.mentions_given}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg p-6 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-6 w-6 text-blue-400" />
                  <h3 className="text-lg font-medium text-white">Mentions Received</h3>
                </div>
                <p className="text-3xl font-bold text-white">{analytics.social.mentions_received}</p>
              </div>
            </div>

            {/* Top Mentioners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Top Mentioners
                </h3>
                <div className="space-y-3">
                  {analytics.social.top_mentioners.map((user, index) => (
                    <div key={user.user_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="w-6 h-6 text-xs flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {user.user_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white">{user.user_name}</span>
                      </div>
                      <span className="text-sm text-neutral-300">{user.mentions_count} mentions</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-blue-400" />
                  Most Mentioned
                </h3>
                <div className="space-y-3">
                  {analytics.social.top_mentioned.map((user, index) => (
                    <div key={user.user_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="w-6 h-6 text-xs flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {user.user_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white">{user.user_name}</span>
                      </div>
                      <span className="text-sm text-neutral-300">{user.mentions_count} mentions</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Analytics */}
            <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-400" />
                Most Searched Terms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analytics.search.most_searched_terms.map((term, index) => (
                  <div key={term.term} className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-6 h-6 text-xs flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-white">{term.term}</span>
                    </div>
                    <span className="text-sm text-neutral-300">{term.count} searches</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
