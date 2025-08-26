import { useMemo } from 'react'
import { usePreferencesStore } from '@/lib/stores/useAppStore'

interface AdhdModeConfig {
  enabled: boolean
  className: string
  containerClassName: string
  textClassName: string
  buttonClassName: string
  cardClassName: string
  animationClassName: string
  gridClassName: string
}

// Hook to manage ADHD-friendly styling and behavior
export function useAdhdMode(): AdhdModeConfig {
  const { adhdFocusMode, showAnimations } = usePreferencesStore()

  const config = useMemo((): AdhdModeConfig => {
    if (!adhdFocusMode) {
      return {
        enabled: false,
        className: 'adhd-mode-disabled',
        containerClassName: '',
        textClassName: '',
        buttonClassName: '',
        cardClassName: '',
        animationClassName: showAnimations ? 'animations-enabled' : 'animations-reduced',
        gridClassName: ''
      }
    }

    return {
      enabled: true,
      className: 'adhd-mode-enabled',
      // Container: Single column, larger spacing
      containerClassName: 'adhd-container flex flex-col space-y-6 max-w-2xl mx-auto',
      // Text: Larger, higher contrast
      textClassName: 'adhd-text text-lg sm:text-xl leading-relaxed',
      // Buttons: Larger touch targets, clear focus
      buttonClassName: 'adhd-button min-h-[56px] sm:min-h-[64px] text-lg font-semibold focus:ring-4 focus:ring-purple-500/50',
      // Cards: More padding, clearer separation
      cardClassName: 'adhd-card p-6 sm:p-8 shadow-xl border-2',
      // Animations: Reduced or disabled for focus
      animationClassName: 'animations-minimal',
      // Grid: Force single column
      gridClassName: 'adhd-grid grid-cols-1 gap-6'
    }
  }, [adhdFocusMode, showAnimations])

  return config
}

// Utility function to combine classes with ADHD mode awareness
export function useAdhdClasses(baseClasses: string, adhdOverride?: string): string {
  const { enabled, className } = useAdhdMode()
  
  return useMemo(() => {
    if (!enabled) return baseClasses
    
    // If ADHD override provided, use it
    if (adhdOverride) return `${baseClasses} ${className} ${adhdOverride}`
    
    // Otherwise apply default ADHD-friendly modifications
    const adhdClasses = baseClasses
      .replace(/grid-cols-\d+/, 'grid-cols-1') // Force single column
      .replace(/text-\w+/, 'text-lg') // Increase text size
      .replace(/p-\d+/, 'p-6') // Increase padding
      .replace(/gap-\d+/, 'gap-6') // Increase gaps
      .replace(/min-h-\[\d+px\]/, 'min-h-[64px]') // Larger touch targets
      
    return `${adhdClasses} ${className}`
  }, [baseClasses, adhdOverride, enabled, className])
}

// Hook for conditional rendering based on ADHD mode
export function useAdhdConditional<T>(
  standardValue: T, 
  adhdValue: T
): T {
  const { enabled } = useAdhdMode()
  return enabled ? adhdValue : standardValue
}

// Hook to get ADHD-friendly animation settings
export function useAdhdAnimations() {
  const { enabled } = useAdhdMode()
  const { showAnimations } = usePreferencesStore()
  
  return useMemo(() => ({
    // Disable complex animations in ADHD mode
    enableAnimations: enabled ? false : showAnimations,
    
    // Simplified animation durations
    duration: enabled ? 0.1 : 0.3,
    
    // Reduced spring stiffness for smoother, less jarring motion
    springConfig: enabled 
      ? { type: "tween", duration: 0.2 } 
      : { type: "spring", stiffness: 300, damping: 30 },
      
    // Gentle hover effects instead of scale transforms
    hoverAnimation: enabled
      ? { opacity: 0.8 }
      : { scale: 1.05, opacity: 0.9 }
  }), [enabled, showAnimations])
}

// Hook to get ADHD-friendly content strategy
export function useAdhdContent() {
  const { enabled } = useAdhdMode()
  
  return useMemo(() => ({
    // Hide complex metrics in ADHD mode
    showDetailedMetrics: !enabled,
    
    // Simplified messaging
    messageStyle: enabled ? 'minimal' : 'descriptive',
    
    // Limit displayed items
    itemLimit: enabled ? 3 : 6,
    
    // Single action focus
    singleActionMode: enabled,
    
    // Simplified tooltips
    tooltipStyle: enabled ? 'simple' : 'detailed'
  }), [enabled])
}