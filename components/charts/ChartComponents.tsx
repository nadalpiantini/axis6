'use client'
import dynamic from 'next/dynamic'
import React, { Suspense, useMemo } from 'react'
import { performanceUtils } from '@/lib/production/performance-optimizer'
// Dynamic imports with loading states for better performance
const LineChart = dynamic(() =>
  import('recharts').then(mod => ({ default: mod.LineChart })), {
  loading: () => <ChartSkeleton type="line" />,
  ssr: false
})
const BarChart = dynamic(() =>
  import('recharts').then(mod => ({ default: mod.BarChart })), {
  loading: () => <ChartSkeleton type="bar" />,
  ssr: false
})
const PieChart = dynamic(() =>
  import('recharts').then(mod => ({ default: mod.PieChart })), {
  loading: () => <ChartSkeleton type="pie" />,
  ssr: false
})
const ResponsiveContainer = dynamic(() =>
  import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), {
  loading: () => <div className="w-full h-full animate-pulse bg-white/5 rounded" />,
  ssr: false
})
// Import other Recharts components dynamically
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false })
const Legend = dynamic(() => import('recharts').then(mod => ({ default: mod.Legend })), { ssr: false })
const Line = dynamic(() => import('recharts').then(mod => ({ default: mod.Line })), { ssr: false })
const Bar = dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })), { ssr: false })
const Cell = dynamic(() => import('recharts').then(mod => ({ default: mod.Cell })), { ssr: false })
const Pie = dynamic(() => import('recharts').then(mod => ({ default: mod.Pie })), { ssr: false })
// Chart skeleton for loading states
interface ChartSkeletonProps {
  type: 'line' | 'bar' | 'pie'
  height?: number
}
function ChartSkeleton({ type, height = 300 }: ChartSkeletonProps) {
  return (
    <div
      className="w-full animate-pulse bg-gradient-to-br from-white/5 to-white/10 rounded-lg"
      style={{ height }}
    >
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/10 rounded w-1/4" />
        <div className="space-y-2">
          {Array.from({ length: type === 'pie' ? 4 : 6 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-2 bg-white/10 rounded flex-1" />
              {type === 'bar' && <div className="h-6 bg-white/10 rounded w-8" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
// Optimized chart data processing
export const useOptimizedChartData = (data: any[], maxDataPoints = 50) => {
  return useMemo(() => {
    if (!data || data.length <= maxDataPoints) return data
    // Sample data to reduce chart rendering complexity
    const step = Math.ceil(data.length / maxDataPoints)
    return data.filter((_, index) => index % step === 0)
  }, [data, maxDataPoints])
}
// Performance-optimized chart wrapper
interface OptimizedChartProps {
  children: React.ReactNode
  height?: number
  className?: string
  'data-testid'?: string
  priority?: 'high' | 'medium' | 'low'
}
export function OptimizedChart({
  children,
  height = 300,
  className = '',
  'data-testid': testId,
  priority = 'medium'
}: OptimizedChartProps) {
  const [isInView, setIsInView] = React.useState(priority === 'high')
  const chartRef = React.useRef<HTMLDivElement>(null)
  // Intersection Observer for lazy loading
  React.useEffect(() => {
    if (priority === 'high') return // High priority charts render immediately
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px', // Start loading before chart enters viewport
        threshold: 0.1
      }
    )
    if (chartRef.current) {
      observer.observe(chartRef.current)
    }
    return () => observer.disconnect()
  }, [priority])
  return (
    <div
      ref={chartRef}
      className={`recharts-wrapper ${className}`}
      data-testid={testId}
    >
      <div className="chart-container" style={{ height }}>
        {isInView ? (
          <Suspense fallback={<ChartSkeleton type="line" height={height} />}>
            {children}
          </Suspense>
        ) : (
          <ChartSkeleton type="line" height={height} />
        )}
      </div>
    </div>
  )
}
// Optimized Completion Rate Chart
interface CompletionRateChartProps {
  data: Array<{
    date: string
    completion_rate: number
    categories_completed: number
  }>
  height?: number
}
export const CompletionRateChart = React.memo(function CompletionRateChart({
  data,
  height = 300
}: CompletionRateChartProps) {
  const optimizedData = useOptimizedChartData(data, 30) // Limit to 30 data points
  const formatDate = React.useCallback((date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }, [])
  const formatPercentage = React.useCallback((value: number) => {
    return `${Math.round(value * 100)}%`
  }, [])
  return (
    <OptimizedChart height={height} data-testid="chart-5" priority="high">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={optimizedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={formatDate}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={formatPercentage}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px'
            }}
            labelFormatter={formatDate}
            formatter={(value: number) => [formatPercentage(value), 'Completion Rate']}
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
    </OptimizedChart>
  )
})
// Optimized Category Performance Chart
interface CategoryPerformanceChartProps {
  data: Record<string, {
    count: number
    averageMood: number
    color: string
  }>
  height?: number
}
export const CategoryPerformanceChart = React.memo(function CategoryPerformanceChart({
  data,
  height = 300
}: CategoryPerformanceChartProps) {
  const chartData = useMemo(() =>
    Object.entries(data).map(([name, stats]) => ({
      name,
      value: stats.count,
      color: stats.color
    })), [data]
  )
  return (
    <OptimizedChart height={height} data-testid="chart-7" priority="medium">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px'
            }}
            formatter={(value: number) => [`${value}`, 'Check-ins']}
          />
          <Legend />
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </OptimizedChart>
  )
})
// Optimized Daily Activity Chart
interface DailyActivityChartProps {
  data: Array<{
    date: string
    categories_completed: number
  }>
  height?: number
}
export const DailyActivityChart = React.memo(function DailyActivityChart({
  data,
  height = 200
}: DailyActivityChartProps) {
  const optimizedData = useOptimizedChartData(data, 14) // Last 2 weeks
  const formatDate = React.useCallback((date: string) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
  }, [])
  return (
    <OptimizedChart height={height} data-testid="chart-10" priority="low">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={optimizedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            fontSize={10}
            tickFormatter={formatDate}
          />
          <YAxis stroke="#9CA3AF" fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px'
            }}
            labelFormatter={formatDate}
          />
          <Bar dataKey="categories_completed" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </OptimizedChart>
  )
})
// Optimized Mood Trend Chart
interface MoodTrendChartProps {
  data: Array<{
    date: string
    averageMood: number
  }>
  height?: number
}
export const MoodTrendChart = React.memo(function MoodTrendChart({
  data,
  height = 200
}: MoodTrendChartProps) {
  const optimizedData = useOptimizedChartData(data, 14)
  const formatDate = React.useCallback((date: string) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
  }, [])
  return (
    <OptimizedChart height={height} data-testid="chart-11" priority="low">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={optimizedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            fontSize={10}
            tickFormatter={formatDate}
          />
          <YAxis stroke="#9CA3AF" fontSize={10} domain={[0, 10]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px'
            }}
            labelFormatter={formatDate}
            formatter={(value: number) => [`${value}/10`, 'Avg Mood']}
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
    </OptimizedChart>
  )
})
// Optimized Weekly Progress Chart
interface WeeklyProgressChartProps {
  data: Array<{
    date: string
    completion_rate: number
  }>
  height?: number
}
export const WeeklyProgressChart = React.memo(function WeeklyProgressChart({
  data,
  height = 200
}: WeeklyProgressChartProps) {
  const optimizedData = useOptimizedChartData(data, 7)
  const formatDate = React.useCallback((date: string) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
  }, [])
  const formatPercentage = React.useCallback((value: number) => {
    return `${Math.round(value * 100)}%`
  }, [])
  return (
    <OptimizedChart height={height} data-testid="chart-12" priority="low">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={optimizedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            fontSize={10}
            tickFormatter={formatDate}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={10}
            tickFormatter={formatPercentage}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px'
            }}
            formatter={(value: number) => [formatPercentage(value), 'Completion']}
          />
          <Bar dataKey="completion_rate" fill="#F59E0B" />
        </BarChart>
      </ResponsiveContainer>
    </OptimizedChart>
  )
})
// Performance measurement wrapper
export const withChartPerformance = <T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
) => {
  return React.memo((props: T) => {
    const MeasuredComponent = React.useMemo(
      () => performanceUtils.measure(
        () => <WrappedComponent {...props} />,
        `chart_render_${componentName}`
      ),
      [props]
    )
    return MeasuredComponent()
  })
}
