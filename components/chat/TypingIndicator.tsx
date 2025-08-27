'use client'

import { motion } from 'framer-motion'
import React from 'react'

import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  users: string[]
  className?: string
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing...`
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`
    } else {
      return `${users[0]} and ${users.length - 1} others are typing...`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        "flex items-center space-x-2 px-3 py-2",
        "bg-neutral-800/50 rounded-lg",
        className
      )}
    >
      {/* Animated Dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-neutral-400 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: index * 0.2
            }}
          />
        ))}
      </div>

      {/* Typing Text */}
      <span className="text-sm text-neutral-400">
        {getTypingText()}
      </span>
    </motion.div>
  )
}