'use client'
import { AtSign } from 'lucide-react'
import React from 'react'
import { MentionMatch } from '@/lib/services/mentions-service'
import { cn } from '@/lib/utils'
interface MessageMentionsProps {
  text: string
  mentions: MentionMatch[]
  className?: string
}
/**
 * Component to render message text with highlighted mentions
 */
export function MessageMentions({
  text,
  mentions,
  className
}: MessageMentionsProps) {
  if (mentions.length === 0) {
    return (
      <span className={className}>
        {text}
      </span>
    )
  }
  // Sort mentions by position to process them in order
  const sortedMentions = [...mentions].sort((a, b) => a.start - b.start)
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  sortedMentions.forEach((mention, index) => {
    // Add text before mention
    if (mention.start > lastIndex) {
      parts.push(
        <span key={`text-${index}`}>
          {text.slice(lastIndex, mention.start)}
        </span>
      )
    }
    // Add mention component
    if (mention.user) {
      parts.push(
        <MentionBadge
          key={`mention-${index}`}
          user={mention.user}
          username={mention.username}
        />
      )
    } else {
      // Unresolved mention
      parts.push(
        <span
          key={`mention-${index}`}
          className="text-neutral-400"
        >
          @{mention.username}
        </span>
      )
    }
    lastIndex = mention.end
  })
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key="text-end">
        {text.slice(lastIndex)}
      </span>
    )
  }
  return (
    <span className={className}>
      {parts}
    </span>
  )
}
/**
 * Individual mention badge component
 */
interface MentionBadgeProps {
  user: {
    id: string
    name: string
    email?: string
  }
  username: string
  onClick?: () => void
  className?: string
}
export function MentionBadge({
  user,
  username,
  onClick,
  className
}: MentionBadgeProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick?.()
  }
  return (
    <span
      className={cn(
        "inline-flex items-center space-x-1 px-2 py-0.5 rounded-full",
        "bg-purple-600/20 text-purple-300 border border-purple-500/30",
        "text-sm font-medium cursor-pointer transition-all duration-150",
        "hover:bg-purple-600/30 hover:border-purple-400/50",
        "focus:outline-none focus:ring-2 focus:ring-purple-500/50",
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title={`@${user.name}${user.email ? ` (${user.email})` : ''}`}
    >
      <AtSign className="h-3 w-3" />
      <span>{user.name}</span>
    </span>
  )
}
/**
 * Parse and render message with mentions
 */
interface ParsedMessageProps {
  content: string
  mentions?: MentionMatch[]
  onMentionClick?: (userId: string) => void
  className?: string
}
export function ParsedMessage({
  content,
  mentions = [],
  onMentionClick,
  className
}: ParsedMessageProps) {
  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      <MessageMentions
        text={content}
        mentions={mentions.map(mention => ({
          ...mention,
          user: mention.user ? {
            ...mention.user,
            onClick: () => onMentionClick?.(mention.user!.id)
          } : undefined
        }))}
      />
    </div>
  )
}
