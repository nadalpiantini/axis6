'use client'

import React from 'react'
import { Crown, Shield, User, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatParticipant } from '@/lib/supabase/types'

interface ParticipantWithProfile extends ChatParticipant {
  profile: {
    id: string
    name: string
  }
}

interface ChatParticipantsProps {
  participants: ParticipantWithProfile[]
  onlineUsers: string[]
  currentUserId: string
  roomId: string
  className?: string
}

export function ChatParticipants({
  participants,
  onlineUsers,
  currentUserId,
  roomId,
  className
}: ChatParticipantsProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-400" />
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-400" />
      default:
        return <User className="h-4 w-4 text-neutral-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-400'
      case 'moderator':
        return 'text-blue-400'
      default:
        return 'text-neutral-400'
    }
  }

  // Sort participants: online admins first, then online mods, then online members, then offline
  const sortedParticipants = [...participants].sort((a, b) => {
    const aOnline = onlineUsers.includes(a.user_id)
    const bOnline = onlineUsers.includes(b.user_id)
    
    // Online users first
    if (aOnline && !bOnline) return -1
    if (!aOnline && bOnline) return 1
    
    // Then by role (admin > moderator > member)
    const roleOrder = { admin: 0, moderator: 1, member: 2 }
    const aRoleOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 2
    const bRoleOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 2
    
    if (aRoleOrder !== bRoleOrder) {
      return aRoleOrder - bRoleOrder
    }
    
    // Finally by name
    return a.profile.name.localeCompare(b.profile.name)
  })

  return (
    <div className={cn("h-full bg-neutral-900/50", className)}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <h3 className="text-lg font-semibold text-white mb-2">
          Participants
        </h3>
        <p className="text-sm text-neutral-400">
          {participants.length} member{participants.length !== 1 ? 's' : ''} • {onlineUsers.length} online
        </p>
      </div>

      {/* Participants List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {sortedParticipants.map((participant) => {
            const isOnline = onlineUsers.includes(participant.user_id)
            const isCurrentUser = participant.user_id === currentUserId

            return (
              <div
                key={participant.id}
                className={cn(
                  "group flex items-center space-x-3 p-2 rounded-lg transition-colors",
                  "hover:bg-neutral-800/50",
                  isCurrentUser && "bg-neutral-800/30"
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-sm font-bold text-white">
                    {participant.profile.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Online Status */}
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-neutral-900",
                    isOnline ? "bg-green-400" : "bg-neutral-600"
                  )} />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isOnline ? "text-white" : "text-neutral-400"
                    )}>
                      {participant.profile.name}
                      {isCurrentUser && (
                        <span className="text-xs text-neutral-500 ml-1">(you)</span>
                      )}
                    </p>
                    
                    {/* Role Icon */}
                    {participant.role !== 'member' && (
                      <div className="flex-shrink-0">
                        {getRoleIcon(participant.role)}
                      </div>
                    )}
                  </div>

                  {/* Role Badge */}
                  {participant.role !== 'member' && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs px-2 py-0 mt-1",
                        getRoleColor(participant.role)
                      )}
                    >
                      {participant.role}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-neutral-400 hover:text-white"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {participants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <User className="h-8 w-8 text-neutral-500 mb-2" />
            <p className="text-sm text-neutral-500">No participants</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}