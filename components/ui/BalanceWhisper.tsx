'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BalanceWhisperProps {
  children: React.ReactNode
  content: string
  axisColor?: string
  delay?: number
  disabled?: boolean
  className?: string
}

// Subtle tooltip component for "balance whispers" 
// Maintains THE RITUAL OS aesthetic with organic styling
export function BalanceWhisper({ 
  children, 
  content, 
  axisColor = '#D4845C',
  delay = 500,
  disabled = false,
  className = ''
}: BalanceWhisperProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleMouseEnter = () => {
    if (disabled) return
    
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const scrollX = window.scrollX
        const scrollY = window.scrollY
        
        // Position tooltip above the trigger element
        setPosition({
          x: rect.left + scrollX + rect.width / 2,
          y: rect.top + scrollY - 10
        })
        
        setIsVisible(true)
      }
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={className}
      >
        {children}
      </div>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ 
              duration: 0.2, 
              ease: "easeOut" 
            }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            {/* Organic tooltip bubble matching THE RITUAL OS aesthetic */}
            <div 
              className="relative bg-white/95 backdrop-blur-md border border-white/40 rounded-2xl px-3 py-2 shadow-lg max-w-xs"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(244,228,222,0.9) 100%)',
              }}
            >
              {/* Subtle glow effect */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-20"
                style={{
                  background: `linear-gradient(135deg, ${axisColor}20 0%, transparent 50%)`,
                }}
              />
              
              {/* Content */}
              <p 
                className="relative text-xs sm:text-sm font-medium leading-relaxed text-center"
                style={{ color: '#6B5B73' }}
              >
                {content}
              </p>
              
              {/* Organic arrow pointing down */}
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(244,228,222,0.9) 100%)',
                  clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Specialized whisper for resonance messages
interface ResonanceWhisperProps {
  children: React.ReactNode
  resonanceCount: number
  axisName: string
  axisColor: string
  userCompleted: boolean
  disabled?: boolean
}

export function ResonanceWhisper({ 
  children, 
  resonanceCount, 
  axisName, 
  axisColor,
  userCompleted,
  disabled 
}: ResonanceWhisperProps) {
  const getWhisperContent = () => {
    if (resonanceCount === 0) {
      return `Be the first to find balance in ${axisName} today`
    }
    
    if (userCompleted && resonanceCount === 1) {
      return `You completed ${axisName} • Others will feel your resonance`
    }
    
    if (userCompleted) {
      return `You and ${resonanceCount - 1} others found balance in ${axisName} today`
    }
    
    const others = resonanceCount === 1 ? '1 person has' : `${resonanceCount} people have`
    return `${others} found balance in ${axisName} today`
  }

  return (
    <BalanceWhisper
      content={getWhisperContent()}
      axisColor={axisColor}
      delay={300}
      disabled={disabled}
    >
      {children}
    </BalanceWhisper>
  )
}

// Whisper specifically for axis completion buttons
export function AxisCompletionWhisper({ 
  children, 
  axisName, 
  axisColor, 
  completed,
  resonanceCount = 0
}: {
  children: React.ReactNode
  axisName: string
  axisColor: string
  completed: boolean
  resonanceCount?: number
}) {
  const getEncouragementMessage = () => {
    if (completed) {
      if (resonanceCount > 0) {
        return `${axisName} completed! Your balance resonates with ${resonanceCount} others`
      }
      return `${axisName} completed! Your inner balance radiates outward`
    }
    
    if (resonanceCount > 0) {
      return `${resonanceCount} others found balance in ${axisName} today. Join the resonance?`
    }
    
    return `Complete ${axisName} to strengthen your balance ritual`
  }

  return (
    <BalanceWhisper
      content={getEncouragementMessage()}
      axisColor={axisColor}
      delay={400}
    >
      {children}
    </BalanceWhisper>
  )
}