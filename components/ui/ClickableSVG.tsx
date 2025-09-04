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
  const [isHovered, setIsHovered] = useState(false)
  useEffect(() => {
    if (!ref.current || disabled) return
    const element = ref.current
    let touchStarted = false
    // Click handler
    const handleClick = (e: Event) => {
      if (disabled) return
      e.preventDefault()
      e.stopPropagation()
      // Visual feedback
      setIsPressed(true)
      setTimeout(() => setIsPressed(false), 150)
      // Execute callback
      onClick()
    }
    // Touch handlers for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (disabled) return
      touchStarted = true
      e.preventDefault()
      setIsPressed(true)
    }
    const handleTouchEnd = (e: TouchEvent) => {
      if (disabled || !touchStarted) return
      e.preventDefault()
      touchStarted = false
      setIsPressed(false)
      onClick()
    }
    // Mouse handlers for hover
    const handleMouseEnter = () => {
      if (!disabled) {
        setIsHovered(true)
        element.style.cursor = 'pointer'
      }
    }
    const handleMouseLeave = () => {
      setIsHovered(false)
      setIsPressed(false)
    }
    // Add all event listeners
    element.addEventListener('click', handleClick, { passive: false })
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
    // Set pointer events and cursor
    element.style.pointerEvents = disabled ? 'none' : 'auto'
    element.style.cursor = disabled ? 'default' : 'pointer'
    // Add ARIA attributes for accessibility
    element.setAttribute('role', 'button')
    element.setAttribute('tabindex', disabled ? '-1' : '0')
    if (disabled) {
      element.setAttribute('aria-disabled', 'true')
    }
    // Keyboard support
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick(e)
      }
    }
    element.addEventListener('keydown', handleKeyDown)
    return () => {
      element.removeEventListener('click', handleClick)
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      element.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClick, disabled])
  // Animation variants
  const variants = showAnimation ? {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    pressed: { scale: 0.95, transition: { duration: 0.1 } },
    disabled: { opacity: 0.5 },
    default: { scale: 1, opacity: 1 }
  } : undefined
  return (
    <motion.g
      ref={ref}
      className={className}
      animate={
        showAnimation ? (
          disabled ? 'disabled' :
          isPressed ? 'pressed' :
          isHovered ? 'hover' : 'default'
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
