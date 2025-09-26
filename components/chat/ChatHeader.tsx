'use client'
import { Hash, Users, X, Settings, Phone, Video, Search } from 'lucide-react'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { ChatRoomWithParticipants } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { getCategoryName } from '@/lib/utils/i18n'
interface ChatHeaderProps {
  room: ChatRoomWithParticipants
  isConnected: boolean
  onlineCount: number
  onToggleParticipants: () => void
  onToggleSearch?: () => void
  onClose?: () => void
  className?: string
}
export function ChatHeader({
  room,
  isConnected,
  onlineCount,
  onToggleParticipants,
  onToggleSearch,
  onClose,
  className
}: ChatHeaderProps) {
  const getRoomIcon = () => {
    switch (room.type) {
      case 'direct':
        return <Users className="h-4 w-4" />
      case 'category':
        return <Hash className="h-4 w-4 text-purple-400" />
      case 'group':
        return <Users className="h-4 w-4 text-blue-400" />
      case 'support':
        return <Settings className="h-4 w-4 text-green-400" />
      default:
        return <Hash className="h-4 w-4" />
    }
  }
  const getRoomTypeColor = () => {
    switch (room.type) {
      case 'category':
        return room.category?.color || '#9B8AE6'
      case 'group':
        return '#3B82F6'
      case 'support':
        return '#10B981'
      default:
        return '#8B5CF6'
    }
  }
  const getStatusDot = () => {
    if (!isConnected) {
      return <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
    }
    return <div className="h-2 w-2 rounded-full bg-green-400" />
  }
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-neutral-800",
        "bg-gradient-to-r from-neutral-900 to-neutral-800",
        className
      )}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Room Icon */}
        <div className="flex-shrink-0">
          {getRoomIcon()}
        </div>
        {/* Room Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-white truncate">
              {room.name}
            </h2>
            {room.category && (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-1"
                style={{
                  backgroundColor: `${room.category.color}20`,
                  color: room.category.color,
                  borderColor: `${room.category.color}40`
                }}
              >
                {getCategoryName(room.category, 'en')}
              </Badge>
            )}
          </div>
          {room.description && (
            <p className="text-sm text-neutral-400 truncate mt-1">
              {room.description}
            </p>
          )}
        </div>
      </div>
      {/* Status and Actions */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* Connection Status */}
        <div className="flex items-center space-x-1">
          {getStatusDot()}
          <span className="text-xs text-neutral-400">
            {onlineCount} online
          </span>
        </div>
        {/* Action Buttons */}
        {onToggleSearch && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSearch}
            className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
            title="Search messages"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
        {room.type !== 'direct' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
              disabled
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
              disabled
            >
              <Video className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleParticipants}
          className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
        >
          <Users className="h-4 w-4" />
        </Button>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
