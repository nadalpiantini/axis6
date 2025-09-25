'use client'
import { motion } from 'framer-motion'
import { ReactNode, useRef, useEffect, useState } from 'react'

interface ClickableSVGProps {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
  'data-testid'?: string
  showAnimation?: boolean
}

/**
 * Enhanced wrapper component for making SVG elements clickable in production
 * Handles both click and touch events with visual feedback
 */
export function ClickableSVG({
  children,
  onClick,
  disabled = false,
  className = '',
  showAnimation = true,
  ...props
}: ClickableSVGProps) {
  const ref = useRef<SVGGElement>(null)
  const [isPressed, setIsPressed] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const hasHandledEvent = useRef(false)

  useEffect(() => {
    if (!ref.current || disabled) return
    const element = ref.current
    let touchStarted = false

    // Unified event handler to prevent double clicks
    const handleEvent = (e: Event) => {
      if (disabled || hasHandledEvent.current) return
      
      e.preventDefault()
      e.stopPropagation()
      
      // Prevent duplicate events for 300ms
      hasHandledEvent.current = true
      setTimeout(() => {
        hasHandledEvent.current = false
      }, 300)
      
      // Visual feedback
      setIsPressed(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setIsPressed(false), 150)
      
      // Execute callback
      onClick()
    }

    // Touch handlers simplified
    const handleTouchStart = (e: TouchEvent) => {
      if (disabled || hasHandledEvent.current) return
      touchStarted = true
      e.preventDefault()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStarted || disabled || hasHandledEvent.current) return
      touchStarted = false
      handleEvent(e)
    }

    // Add simplified event listeners
    element.addEventListener('click', handleEvent, { passive: false })
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    // Set pointer events and cursor
    element.style.pointerEvents = disabled ? 'none' : 'auto'
    element.style.cursor = disabled ? 'default' : 'pointer'
    
    // Add ARIA attributes for accessibility
    element.setAttribute('role', 'button')
    element.setAttribute('tabindex', disabled ? '-1' : '0')
    if (disabled) {
      element.setAttribute('aria-disabled', 'true')
    }
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      element.removeEventListener('click', handleEvent)
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onClick, disabled])

  // Animation variants - more subtle to avoid conflicts with hexagon animation
  const variants = showAnimation ? {
    hover: { scale: 1.02, opacity: 1, transition: { duration: 0.2 } },
    pressed: { scale: 0.98, opacity: 1, transition: { duration: 0.1 } },
    disabled: { scale: 1, opacity: 0.5, transition: { duration: 0.2 } },
    default: { scale: 1, opacity: 1, transition: { duration: 0.2 } }
  } : undefined

  return (
    <motion.g
      ref={ref}
      className={className}
      initial="default"
      animate={
        showAnimation ? (
          disabled ? 'disabled' :
          isPressed ? 'pressed' : 'default'
        ) : undefined
      }
      variants={variants}
      style={{ transformOrigin: 'center' }}
      {...props}
    >
      {children}
    </motion.g>
  )
}
