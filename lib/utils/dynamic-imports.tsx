/**
 * Dynamic imports for code splitting and lazy loading
 * Reduces initial bundle size by loading components on demand
 */

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Loading component for lazy-loaded components
const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

/**
 * Heavy components that should be lazy loaded
 */

// Charts and analytics components (only load when viewing stats)
export const AreaChart = dynamic(
  () => import('recharts').then(mod => mod.AreaChart as any),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
)

export const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart as any),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
)

export const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart as any),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
)

export const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer as any),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
)

// Psychology components (only load on profile page)
export const TemperamentQuestionnaire = dynamic(
  () => import('@/components/psychology/TemperamentQuestionnaire').then(
    mod => mod.TemperamentQuestionnaire
  ),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
)

export const EnhancedTemperamentQuestionnaire = dynamic(
  () => import('@/components/psychology/EnhancedTemperamentQuestionnaire').then(
    mod => mod.EnhancedTemperamentQuestionnaire
  ),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
)

export const TemperamentResults = dynamic(
  () => import('@/components/psychology/TemperamentResults').then(
    mod => mod.TemperamentResults
  ),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
)

// AI components will be added when available

// Heavy animation components
export const HexagonChart = dynamic(
  () => import('@/components/axis/HexagonChart').then(
    mod => mod.default
  ),
  { 
    loading: LoadingSpinner,
    ssr: true // Keep SSR for SEO
  }
)

// Export utility for creating dynamic imports
export function createDynamicImport<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
  options?: {
    loading?: () => JSX.Element
    ssr?: boolean
  }
) {
  return dynamic(importFn, {
    loading: options?.loading || LoadingSpinner,
    ssr: options?.ssr ?? false,
  })
}

// Preload function for critical components
export function preloadComponent(componentName: keyof typeof componentMap) {
  const component = componentMap[componentName]
  if (component && typeof component === 'function') {
    component()
  }
}

// Map of components for preloading
const componentMap = {
  AreaChart: () => import('recharts'),
  BarChart: () => import('recharts'),
  LineChart: () => import('recharts'),
  TemperamentQuestionnaire: () => import('@/components/psychology/TemperamentQuestionnaire'),
  HexagonChart: () => import('@/components/axis/HexagonChart'),
}