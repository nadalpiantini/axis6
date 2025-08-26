'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/react-query/hooks'
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Award,
  ArrowLeft,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Flame,
  TrendingDown
} from 'lucide-react'
import Link from 'next/link'
import { LogoIcon } from '@/components/ui/Logo'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Cell, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

// Types
interface AnalyticsData {
  overview: {
    period: string
    totalCheckins: number
    daysWithData: number
    totalDays: number
    averageCompletionRate: number
    dataCompleteness: number
  }
  categoryStats: Record<string, {
    count: number
    averageMood: number
    color: string
  }>
  streakAnalysis: {
    currentStreaks: Array<{
      category: string
      current: number
      longest: number
      color: string
    }>
    totalCurrentStreak: number
    longestStreakEver: number
    activeStreaks: number
  }
  dailyStats: Array<{
    date: string
    completion_rate: number
    categories_completed: number
    total_mood: number
  }>
  moodTrend: Array<{
    date: string
    averageMood: number
  }>
  bestDays: Array<{
    date: string
    completion_rate: number
    categories_completed: number
  }>
  worstDays: Array<{
    date: string
    completion_rate: number
    categories_completed: number
  }>
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useUser()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30')

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        period
      })
      
      const response = await fetch(`/api/analytics?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  // Export data
  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          format,
          includeAllData: true
        })
      })
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'axis6-data.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'axis6-data.json'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      setError('Export failed. Please try again.')
    }
  }

  useEffect(() => {
    if (!userLoading && user) {
      fetchAnalytics()
    }
  }, [user, userLoading, period])

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, userLoading, router])

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
          <p className="text-gray-300">Loading your analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <Activity className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Analytics</h2>
            <p className="text-gray-300 mb-4">{error}</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-gray-300">
          <BarChart3 className="w-12 h-12 mx-auto mb-4" />
          <p>No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="analytics-page" className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <StandardHeader
        user={user}
        variant="default"
        title="Analytics"
        subtitle={`Insights for the last ${analytics.overview.period}`}
        showBackButton={true}
        backUrl="/dashboard"
      />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* Controls */}
        <div data-testid="analytics-controls" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <h2 data-testid="analytics-title" className="text-lg font-semibold">Your Analytics</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <select
              data-testid="period-filter"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-400"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            
            <div className="flex items-center gap-2">
              <button
                data-testid="export-csv"
                onClick={() => handleExport('csv')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial justify-center"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                data-testid="export-json"
                onClick={() => handleExport('json')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial justify-center"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Overview Stats */}
        <div data-testid="overview-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div data-testid="total-checkins-card" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
              <h3 className="text-sm sm:text-base font-semibold">Total Check-ins</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-400">{analytics.overview.totalCheckins}</p>
            <p className="text-xs sm:text-sm text-gray-400">
              {Math.round(analytics.overview.totalCheckins / Math.max(analytics.overview.totalDays, 1) * 10) / 10} per day avg
            </p>
          </div>
          
          <div data-testid="active-days-card" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              <h3 className="text-sm sm:text-base font-semibold">Active Days</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-400">
              {analytics.overview.daysWithData}
            </p>
            <p className="text-xs sm:text-sm text-gray-400">
              {analytics.overview.dataCompleteness}% of {analytics.overview.period}
            </p>
          </div>
          
          <div data-testid="completion-rate-card" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              <h3 className="text-sm sm:text-base font-semibold">Completion Rate</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-400">
              {Math.round(analytics.overview.averageCompletionRate * 100)}%
            </p>
            <p className="text-xs sm:text-sm text-gray-400">Average daily completion</p>
          </div>
          
          <div data-testid="current-streak-card" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
              <h3 className="text-sm sm:text-base font-semibold">Current Streak</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-orange-400">
              {analytics.streakAnalysis.totalCurrentStreak}
            </p>
            <p className="text-xs sm:text-sm text-gray-400">
              {analytics.streakAnalysis.activeStreaks} categories active
            </p>
          </div>
        </div>

        {/* Interactive Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Chart 5: Completion Rate Trend */}
          <div data-testid="chart-5" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              Completion Rate Trend
            </h3>
            <div className="recharts-wrapper">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.dailyStats.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={(value) => `${Math.round(value * 100)}%`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value) => [`${Math.round(value * 100)}%`, 'Completion Rate']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completion_rate" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 7: Category Performance Pie Chart */}
          <div data-testid="chart-7" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              Category Performance
            </h3>
            <div className="recharts-wrapper">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value) => [`${value}`, 'Check-ins']}
                    />
                    <Legend />
                    <RechartsPieChart 
                      data={Object.entries(analytics.categoryStats).map(([name, stats]) => ({
                        name,
                        value: stats.count,
                        color: stats.color
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(analytics.categoryStats).map(([name, stats], index) => (
                        <Cell key={`cell-${index}`} fill={stats.color} />
                      ))}
                    </RechartsPieChart>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Chart 10: Daily Stats Over Time */}
          <div data-testid="chart-10" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Daily Activity
            </h3>
            <div className="recharts-wrapper">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.dailyStats.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      fontSize={10}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Bar dataKey="categories_completed" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 11: Mood Trend */}
          <div data-testid="chart-11" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Mood Trend
            </h3>
            <div className="recharts-wrapper">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analytics.moodTrend.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      fontSize={10}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={10} domain={[0, 10]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value) => [`${value}/10`, 'Avg Mood']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="averageMood" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 12: Weekly Performance */}
          <div data-testid="chart-12" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Weekly Progress
            </h3>
            <div className="recharts-wrapper">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.dailyStats.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      fontSize={10}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={10}
                      tickFormatter={(value) => `${Math.round(value * 100)}%`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value) => [`${Math.round(value * 100)}%`, 'Completion']}
                    />
                    <Bar dataKey="completion_rate" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Streak Analysis with Static Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <div data-testid="category-performance" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              Category Summary
            </h3>
            <div className="space-y-4">
              {Object.entries(analytics.categoryStats).map(([category, stats]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: stats.color }}
                    />
                    <span className="font-medium">{category}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{stats.count} check-ins</p>
                    <p className="text-sm text-gray-400">
                      Mood: {Math.round(stats.averageMood * 10) / 10}/10
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div data-testid="streak-analysis" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
              Current Streaks
            </h3>
            <div className="space-y-4">
              {analytics.streakAnalysis.currentStreaks.map((streak, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: streak.color }}
                    />
                    <span className="font-medium">{streak.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-400">{streak.current} days</p>
                    <p className="text-sm text-gray-400">Best: {streak.longest}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Best/Worst Performance */}
        <div data-testid="performance-trends" className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <div data-testid="best-performance" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2 text-green-400">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              Best Performance Days
            </h3>
            <div className="space-y-3">
              {analytics.bestDays.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div>
                    <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-400">
                      {day.categories_completed} categories completed
                    </p>
                  </div>
                  <div className="text-green-400 font-bold">
                    {Math.round(day.completion_rate * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div data-testid="improvement-areas" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2 text-red-400">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
              Areas for Improvement
            </h3>
            <div className="space-y-3">
              {analytics.worstDays.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div>
                    <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-400">
                      {day.categories_completed} categories completed
                    </p>
                  </div>
                  <div className="text-red-400 font-bold">
                    {Math.round(day.completion_rate * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div data-testid="insights-recommendations" className="glass rounded-lg sm:rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            Insights & Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-purple-400">🎯 Your Strengths</h4>
              <ul className="space-y-2 text-gray-300">
                {analytics.overview.averageCompletionRate >= 0.8 && (
                  <li>• Excellent consistency with {Math.round(analytics.overview.averageCompletionRate * 100)}% completion rate</li>
                )}
                {analytics.streakAnalysis.activeStreaks >= 3 && (
                  <li>• Strong momentum with {analytics.streakAnalysis.activeStreaks} active streaks</li>
                )}
                {analytics.overview.dataCompleteness >= 80 && (
                  <li>• Great tracking habits with {analytics.overview.dataCompleteness}% data completeness</li>
                )}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-orange-400">🚀 Growth Opportunities</h4>
              <ul className="space-y-2 text-gray-300">
                {analytics.overview.averageCompletionRate < 0.5 && (
                  <li>• Focus on consistency - aim for 70%+ daily completion</li>
                )}
                {analytics.streakAnalysis.activeStreaks < 2 && (
                  <li>• Build momentum in {6 - analytics.streakAnalysis.activeStreaks} more categories</li>
                )}
                {analytics.overview.dataCompleteness < 60 && (
                  <li>• Track more regularly for better insights</li>
                )}
                <li>• Consider setting daily reminders for your lowest-performing categories</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}