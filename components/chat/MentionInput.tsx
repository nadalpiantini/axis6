'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AtSign, User } from 'lucide-react'
import React, { useState, useRef, useEffect, useCallback } from 'react'

import { useDebounce } from '@/lib/hooks/useDebounce'
import { mentionsService, MentionUser } from '@/lib/services/mentions-service'
import { cn } from '@/lib/utils'

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onMentionSelect?: (user: MentionUser, range: { start: number; end: number }) => void
  roomId: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

interface MentionSuggestion {
  user: MentionUser
  score: number
}

export function MentionInput({
  value,
  onChange,
  onMentionSelect,
  roomId,
  placeholder = "Type a message...",
  className,
  disabled = false
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionRange, setMentionRange] = useState<{ start: number; end: number } | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(mentionQuery, 300)

  // Search for users when mention query changes
  useEffect(() => {
    if (debouncedQuery && mentionRange && roomId) {
      mentionsService.searchUsers(debouncedQuery, roomId)
        .then(users => {
          const scoredSuggestions = users.map(user => ({
            user,
            score: calculateRelevanceScore(user, debouncedQuery)
          })).sort((a, b) => b.score - a.score)
          
          setSuggestions(scoredSuggestions)
          setShowSuggestions(scoredSuggestions.length > 0)
          setSelectedIndex(0)
        })
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [debouncedQuery, mentionRange, roomId])

  // Calculate relevance score for user suggestions
  const calculateRelevanceScore = (user: MentionUser, query: string): number => {
    const name = user.name.toLowerCase()
    const q = query.toLowerCase()
    
    if (name === q) return 100
    if (name.startsWith(q)) return 80
    if (name.includes(q)) return 60
    
    // Fuzzy matching
    let score = 0
    let queryIndex = 0
    
    for (let i = 0; i < name.length && queryIndex < q.length; i++) {
      if (name[i] === q[queryIndex]) {
        score += 10
        queryIndex++
      }
    }
    
    return queryIndex === q.length ? score : 0
  }

  // Handle text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart
    
    onChange(newValue)
    
    // Check for mentions
    const mentionMatch = findActiveMention(newValue, cursorPosition)
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch.query)
      setMentionRange(mentionMatch.range)
    } else {
      setMentionQuery('')
      setMentionRange(null)
      setShowSuggestions(false)
    }
  }

  // Find active @mention at cursor position
  const findActiveMention = (text: string, cursorPos: number): { query: string; range: { start: number; end: number } } | null => {
    const beforeCursor = text.slice(0, cursorPos)
    const afterCursor = text.slice(cursorPos)
    
    // Find the last @ before cursor
    const lastAtIndex = beforeCursor.lastIndexOf('@')
    if (lastAtIndex === -1) return null
    
    // Check if there's a space before @ (or it's at start)
    const beforeAt = beforeCursor[lastAtIndex - 1]
    if (beforeAt && beforeAt !== ' ' && beforeAt !== '\n') return null
    
    // Find the end of the mention (space, newline, or end of text)
    const afterAtText = beforeCursor.slice(lastAtIndex + 1) + afterCursor
    const endMatch = afterAtText.match(/^(\w*)/)
    
    if (!endMatch) return null
    
    const query = endMatch[1]
    const endIndex = lastAtIndex + 1 + query.length
    
    // Only show suggestions if cursor is within the mention
    if (cursorPos < lastAtIndex + 1 || cursorPos > endIndex) return null
    
    return {
      query,
      range: { start: lastAtIndex, end: endIndex }
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
        
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleMentionSelect(suggestions[selectedIndex].user)
        }
        break
        
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  // Handle mention selection
  const handleMentionSelect = useCallback((user: MentionUser) => {
    if (!mentionRange) return
    
    const newValue = 
      `${value.slice(0, mentionRange.start)  
      }@${user.name} ${  
      value.slice(mentionRange.end)}`
    
    onChange(newValue)
    
    // Reset mention state
    setShowSuggestions(false)
    setMentionQuery('')
    setMentionRange(null)
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionRange.start + user.name.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
    
    // Notify parent
    onMentionSelect?.(user, {
      start: mentionRange.start,
      end: mentionRange.start + user.name.length + 1
    })
  }, [mentionRange, value, onChange, onMentionSelect])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)  }px`
    }
  }, [value])

  return (
    <div className={cn("relative", className)}>
      {/* Main textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full min-h-[40px] max-h-[120px] resize-none",
          "bg-transparent border-0 p-0 focus:ring-0 outline-none",
          "text-white placeholder:text-neutral-500",
          "scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-transparent",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        rows={1}
      />

      {/* Mention suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={cn(
              "absolute bottom-full left-0 mb-2 min-w-[200px] max-w-[300px]",
              "bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl",
              "py-1 z-50"
            )}
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-neutral-700">
              <div className="flex items-center space-x-2 text-xs text-neutral-400">
                <AtSign className="h-3 w-3" />
                <span>Mention someone</span>
              </div>
            </div>

            {/* User suggestions */}
            <div className="max-h-[200px] overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.user.id}
                  onClick={() => handleMentionSelect(suggestion.user)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 text-left",
                    "hover:bg-neutral-700 transition-colors duration-150",
                    "focus:outline-none focus:bg-neutral-700",
                    selectedIndex === index && "bg-neutral-700"
                  )}
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-sm font-bold text-white">
                      {suggestion.user.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {suggestion.user.name}
                    </p>
                    {suggestion.user.email && (
                      <p className="text-xs text-neutral-400 truncate">
                        {suggestion.user.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <User className="h-4 w-4 text-neutral-500" />
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-neutral-700">
              <p className="text-xs text-neutral-500">
                ↑↓ to navigate • Enter to select • Esc to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}