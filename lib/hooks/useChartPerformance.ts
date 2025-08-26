'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { performanceOptimizer } from '@/lib/production/performance-optimizer'

interface PerformanceMetrics {
  renderTime: number
  dataProcessingTime: number
  memoryUsage: number
  chartCount: number
  rerendersCount: number
}

interface ChartPerformanceConfig {
  trackRenders: boolean
  trackMemory: boolean
  trackDataProcessing: boolean
  alertThreshold: number
  enableLogging: boolean
}

export function useChartPerformance(
  chartName: string, 
  config: Partial<ChartPerformanceConfig> = {}
) {
  const defaultConfig: ChartPerformanceConfig = {
    trackRenders: true,
    trackMemory: true,
    trackDataProcessing: true,
    alertThreshold: 100, // 100ms threshold
    enableLogging: process.env.NODE_ENV === 'development'
  }
  
  const settings = { ...defaultConfig, ...config }
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    dataProcessingTime: 0,
    memoryUsage: 0,
    chartCount: 0,
    rerendersCount: 0
  })
  
  const renderStartTime = useRef<number>(0)
  const rerendersCount = useRef<number>(0)
  const isFirstRender = useRef<boolean>(true)

  // Start render measurement
  const startRenderMeasurement = useCallback(() => {
    if (settings.trackRenders) {
      renderStartTime.current = performance.now()
    }
  }, [settings.trackRenders])

  // End render measurement
  const endRenderMeasurement = useCallback(() => {
    if (settings.trackRenders && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        rerendersCount: rerendersCount.current
      }))

      // Alert on slow rendering
      if (renderTime > settings.alertThreshold && settings.enableLogging) {
        console.warn(`🐌 Slow chart render: ${chartName} took ${renderTime.toFixed(2)}ms`)
      }

      renderStartTime.current = 0
    }
  }, [settings.trackRenders, settings.alertThreshold, settings.enableLogging, chartName])

  // Measure data processing performance
  const measureDataProcessing = useCallback(<T,>(
    operation: () => T,
    operationName: string = 'data-processing'
  ): T => {
    if (!settings.trackDataProcessing) return operation()

    const start = performance.now()
    const result = operation()
    const processingTime = performance.now() - start

    setMetrics(prev => ({
      ...prev,
      dataProcessingTime: processingTime
    }))

    if (processingTime > 50 && settings.enableLogging) {
      console.warn(`🐌 Slow data processing: ${chartName}/${operationName} took ${processingTime.toFixed(2)}ms`)
    }

    return result
  }, [settings.trackDataProcessing, settings.enableLogging, chartName])

  // Memory usage monitoring
  const measureMemoryUsage = useCallback(() => {
    if (!settings.trackMemory || !('memory' in performance)) return

    const memory = (performance as any).memory
    if (memory) {
      const memoryUsage = Math.round(memory.usedJSHeapSize / 1048576) // MB

      setMetrics(prev => ({
        ...prev,
        memoryUsage
      }))

      // Alert on high memory usage
      if (memoryUsage > 100 && settings.enableLogging) {
        console.warn(`🧠 High memory usage: ${memoryUsage}MB`)
      }
    }
  }, [settings.trackMemory, settings.enableLogging])

  // Chart loading performance
  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    loadTime: 0,
    error: null as string | null
  })

  const trackChartLoad = useCallback((loadStartTime: number) => {
    const loadTime = performance.now() - loadStartTime
    
    setLoadingState({
      isLoading: false,
      loadTime,
      error: null
    })

    if (loadTime > 200 && settings.enableLogging) {
      console.warn(`📊 Slow chart load: ${chartName} took ${loadTime.toFixed(2)}ms`)
    }
  }, [chartName, settings.enableLogging])

  const trackChartError = useCallback((error: string) => {
    setLoadingState({
      isLoading: false,
      loadTime: 0,
      error
    })

    if (settings.enableLogging) {
      console.error(`📊 Chart error: ${chartName} - ${error}`)
    }
  }, [chartName, settings.enableLogging])

  // Intersection Observer for lazy loading performance
  const [intersectionEntry, setIntersectionEntry] = useState<IntersectionObserverEntry | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIntersectionEntry(entry)
        
        if (entry.isIntersecting && settings.enableLogging) {
          console.log(`👀 Chart entered viewport: ${chartName}`)
        }
      },
      {
        rootMargin: '50px',
        threshold: [0, 0.25, 0.5, 0.75, 1.0]
      }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [chartName, settings.enableLogging])

  // Track re-renders
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    rerendersCount.current += 1
    
    if (settings.enableLogging && rerendersCount.current > 5) {
      console.warn(`🔄 Frequent re-renders: ${chartName} has re-rendered ${rerendersCount.current} times`)
    }
  })

  // Memory monitoring interval
  useEffect(() => {
    if (!settings.trackMemory) return

    const interval = setInterval(measureMemoryUsage, 5000) // Every 5 seconds
    return () => clearInterval(interval)
  }, [settings.trackMemory, measureMemoryUsage])

  // Performance report
  const getPerformanceReport = useCallback(() => {
    return {
      chartName,
      metrics,
      loadingState,
      isInViewport: intersectionEntry?.isIntersecting || false,
      intersectionRatio: intersectionEntry?.intersectionRatio || 0,
      recommendations: generateRecommendations(metrics, settings.alertThreshold)
    }
  }, [chartName, metrics, loadingState, intersectionEntry, settings.alertThreshold])

  return {
    // Performance measurement
    startRenderMeasurement,
    endRenderMeasurement,
    measureDataProcessing,
    measureMemoryUsage,
    
    // Chart loading tracking
    trackChartLoad,
    trackChartError,
    loadingState,
    
    // Viewport tracking
    targetRef,
    isInViewport: intersectionEntry?.isIntersecting || false,
    intersectionRatio: intersectionEntry?.intersectionRatio || 0,
    
    // Metrics and reporting
    metrics,
    getPerformanceReport
  }
}

// Generate performance recommendations
function generateRecommendations(
  metrics: PerformanceMetrics, 
  threshold: number
): string[] {
  const recommendations: string[] = []

  if (metrics.renderTime > threshold) {
    recommendations.push('Consider reducing chart complexity or using React.memo')
  }

  if (metrics.dataProcessingTime > 50) {
    recommendations.push('Optimize data processing with useMemo or reduce dataset size')
  }

  if (metrics.memoryUsage > 100) {
    recommendations.push('Check for memory leaks or reduce chart instances')
  }

  if (metrics.rerendersCount > 10) {
    recommendations.push('Optimize dependencies to reduce unnecessary re-renders')
  }

  return recommendations
}

// Hook for monitoring multiple charts
export function useChartsPerformance() {
  const [chartsMetrics, setChartsMetrics] = useState<Map<string, PerformanceMetrics>>(new Map())
  const [globalMetrics, setGlobalMetrics] = useState({
    totalCharts: 0,
    averageRenderTime: 0,
    totalMemoryUsage: 0,
    slowCharts: [] as string[]
  })

  const registerChart = useCallback((chartName: string, metrics: PerformanceMetrics) => {
    setChartsMetrics(prev => new Map(prev.set(chartName, metrics)))
  }, [])

  const unregisterChart = useCallback((chartName: string) => {
    setChartsMetrics(prev => {
      const newMap = new Map(prev)
      newMap.delete(chartName)
      return newMap
    })
  }, [])

  // Update global metrics
  useEffect(() => {
    const charts = Array.from(chartsMetrics.values())
    const totalCharts = charts.length
    const averageRenderTime = charts.reduce((sum, m) => sum + m.renderTime, 0) / totalCharts || 0
    const totalMemoryUsage = charts.reduce((sum, m) => sum + m.memoryUsage, 0)
    const slowCharts = Array.from(chartsMetrics.entries())
      .filter(([, metrics]) => metrics.renderTime > 100)
      .map(([name]) => name)

    setGlobalMetrics({
      totalCharts,
      averageRenderTime,
      totalMemoryUsage,
      slowCharts
    })
  }, [chartsMetrics])

  const getGlobalReport = useCallback(() => ({
    globalMetrics,
    chartsMetrics: Object.fromEntries(chartsMetrics),
    recommendations: generateGlobalRecommendations(globalMetrics)
  }), [globalMetrics, chartsMetrics])

  return {
    registerChart,
    unregisterChart,
    globalMetrics,
    getGlobalReport
  }
}

function generateGlobalRecommendations(globals: any): string[] {
  const recommendations: string[] = []

  if (globals.totalCharts > 5) {
    recommendations.push('Consider lazy loading or virtualization for better performance')
  }

  if (globals.averageRenderTime > 100) {
    recommendations.push('Overall chart performance is slow - review optimization strategies')
  }

  if (globals.slowCharts.length > 0) {
    recommendations.push(`Slow charts detected: ${globals.slowCharts.join(', ')}`)
  }

  return recommendations
}

// Performance context for charts
export const ChartPerformanceContext = React.createContext<{
  registerChart: (name: string, metrics: PerformanceMetrics) => void
  unregisterChart: (name: string) => void
  getGlobalReport: () => any
} | null>(null)

import React from 'react'

export function ChartPerformanceProvider({ children }: { children: React.ReactNode }) {
  const { registerChart, unregisterChart, getGlobalReport } = useChartsPerformance()

  return (
    <ChartPerformanceContext.Provider value={{ registerChart, unregisterChart, getGlobalReport }}>
      {children}
    </ChartPerformanceContext.Provider>
  )
}