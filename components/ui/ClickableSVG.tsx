'use client'

import { ReactNode, MouseEvent, useRef, useEffect } from 'react'

interface ClickableSVGProps {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
  'data-testid'?: string
}

/**
 * A wrapper component for making SVG elements clickable in production
 * Works around React/SVG event handling issues in production builds
 */
export function ClickableSVG({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  ...props 
}: ClickableSVGProps) {
  const ref = useRef<SVGGElement>(null)
  
  useEffect(() => {
    if (!ref.current || disabled) return
    
    const element = ref.current
    const handleClick = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      onClick()
    }
    
    // Use native event listener for better compatibility
    element.addEventListener('click', handleClick)
    element.style.cursor = 'pointer'
    
    return () => {
      element.removeEventListener('click', handleClick)
    }
  }, [onClick, disabled])
  
  return (
    <g 
      ref={ref}
      className={className}
      {...props}
    >
      {children}
    </g>
  )
}