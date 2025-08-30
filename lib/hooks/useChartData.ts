'use client'

import { useMemo, useCallback } from 'react'

// Optimized data processing for charts
export interface ChartDataProcessor {
  processCompletionData: (data: any[]) => any[]
  processCategoryData: (data: Record<string, any>) => any[]
  processMoodData: (data: any[]) => any[]
  sampleData: (data: any[], maxPoints: number) => any[]
}

export function useChartDataProcessor(): ChartDataProcessor {
  // Remove useCallback wrappers to avoid React error #310
  // These functions are stable and don't need memoization
  const sampleData = (data: any[], maxPoints: number) => {
    if (!data || data.length <= maxPoints) return data

    const step = Math.ceil(data.length / maxPoints)
    return data.filter((_, index) => index % step === 0)
  }

  const processCompletionData = (data: any[]) => {
    if (!data) return []

    return data.map(item => ({
      ...item,
      completion_rate: typeof item.completion_rate === 'number'
        ? Math.max(0, Math.min(1, item.completion_rate))
        : 0,
      date: new Date(item.date).toISOString().split('T')[0] // Normalize date format
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const processCategoryData = (data: Record<string, any>) => {
    if (!data) return []

    return Object.entries(data)
      .filter(([_, stats]) => stats.count > 0)
      .map(([name, stats]) => ({
        name,
        value: stats.count,
        color: stats.color || '#8B5CF6',
        averageMood: Math.round(stats.averageMood * 10) / 10
      }))
      .sort((a, b) => b.value - a.value) // Sort by count descending
  }

  const processMoodData = (data: any[]) => {
    if (!data) return []

    return data.map(item => ({
      ...item,
      averageMood: typeof item.averageMood === 'number'
        ? Math.max(0, Math.min(10, Math.round(item.averageMood * 10) / 10))
        : 0,
      date: new Date(item.date).toISOString().split('T')[0]
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  return {
    processCompletionData,
    processCategoryData,
    processMoodData,
    sampleData
  }
}

// Chart-specific data hooks for optimized processing
export function useCompletionChartData(rawData: any[], maxPoints = 30) {
  const { processCompletionData, sampleData } = useChartDataProcessor()

  return useMemo(() => {
    const processed = processCompletionData(rawData)
    return sampleData(processed, maxPoints)
  }, [rawData, maxPoints, processCompletionData, sampleData])
}

export function useCategoryChartData(rawData: Record<string, any>) {
  const { processCategoryData } = useChartDataProcessor()

  return useMemo(() => {
    return processCategoryData(rawData)
  }, [rawData, processCategoryData])
}

export function useMoodChartData(rawData: any[], maxPoints = 14) {
  const { processMoodData, sampleData } = useChartDataProcessor()

  return useMemo(() => {
    const processed = processMoodData(rawData)
    return sampleData(processed, maxPoints)
  }, [rawData, maxPoints, processMoodData, sampleData])
}

export function useDailyActivityData(rawData: any[], maxPoints = 14) {
  const { sampleData } = useChartDataProcessor()

  return useMemo(() => {
    if (!rawData) return []

    const processed = rawData.map(item => ({
      ...item,
      categories_completed: Math.max(0, Math.min(6, item.categories_completed || 0)),
      date: new Date(item.date).toISOString().split('T')[0]
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return sampleData(processed, maxPoints)
  }, [rawData, maxPoints, sampleData])
}

// Performance monitoring for chart data processing
export function useChartPerformanceMetrics() {
  const startTime = useMemo(() => performance.now(), [])

  const measureProcessing = useCallback((operationName: string, fn: () => any) => {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    const duration = end - start

    // Log slow data processing operations
    if (duration > 10) {
      // Performance warning for slow operations
    }

    return result
  }, [])

  return {
    measureProcessing,
    getProcessingTime: () => performance.now() - startTime
  }
}

// Memory-efficient data caching for charts
const chartDataCache = new Map<string, { data: any; timestamp: number }>()

export function useCachedChartData<T>(key: string, data: T, ttl = 60000): T {
  return useMemo(() => {
    const cached = chartDataCache.get(key)
    const now = Date.now()

    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data
    }

    // Cache new data
    chartDataCache.set(key, { data, timestamp: now })

    // Cleanup old entries
    if (chartDataCache.size > 50) {
      const oldestKeys = Array.from(chartDataCache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)
        .slice(0, 10)
        .map(([key]) => key)

      oldestKeys.forEach(k => chartDataCache.delete(k))
    }

    return data
  }, [key, data, ttl])
}
