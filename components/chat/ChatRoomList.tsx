'use client'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { Hash, Users, Settings, MessageCircle, Plus } from 'lucide-react'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatRoomWithParticipants } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { getCategoryName } from '@/lib/utils/i18n'
interface ChatRoomListProps {
  rooms: ChatRoomWithParticipants[]
  selectedRoomId?: string
  onSelectRoom: (room: ChatRoomWithParticipants) => void
  onCreateRoom?: () => void
  className?: string
}
export function ChatRoomList({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onCreateRoom,
  className
}: ChatRoomListProps) {
  const getRoomIcon = (type: string, categoryColor?: string) => {
    switch (type) {
      case 'direct':
        return <Users className="h-4 w-4 text-blue-400" />
      case 'category':
        return <Hash className="h-4 w-4" style={{ color: categoryColor || '#9B8AE6' }} />
      case 'group':
        return <Users className="h-4 w-4 text-green-400" />
      case 'support':
        return <Settings className="h-4 w-4 text-orange-400" />
      default:
        return <MessageCircle className="h-4 w-4 text-neutral-400" />
    }
  }
  const getRoomTypeBadge = (type: string) => {
    const badges = {
      direct: { label: 'Direct', color: 'bg-blue-500/20 text-blue-400' },
      category: { label: 'Category', color: 'bg-purple-500/20 text-purple-400' },
      group: { label: 'Group', color: 'bg-green-500/20 text-green-400' },
      support: { label: 'Support', color: 'bg-orange-500/20 text-orange-400' }
    }
    const badge = badges[type as keyof typeof badges]
    if (!badge) return null
    return (
      <Badge
        variant="secondary"
        className={cn("text-xs px-2 py-1", badge.color)}
      >
        {badge.label}
      </Badge>
    )
  }
  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return ''
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }
  // Group rooms by type
  const groupedRooms = rooms.reduce((acc, room) => {
    if (!acc[room.type]) {
      acc[room.type] = []
    }
    acc[room.type].push(room)
    return acc
  }, {} as Record<string, ChatRoomWithParticipants[]>)
  const roomTypeOrder = ['category', 'direct', 'group', 'support']
  const roomTypeLabels = {
    category: 'Category Rooms',
    direct: 'Direct Messages',
    group: 'Group Chats',
    support: 'Support'
  }
  return (
    <div className={cn("h-full bg-neutral-950 border-r border-neutral-800", className)}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">
            Chat Rooms
          </h2>
          {onCreateRoom && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateRoom}
              className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-neutral-400">
          {rooms.length} room{rooms.length !== 1 ? 's' : ''}
        </p>
      </div>
      {/* Room List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {roomTypeOrder.map((roomType) => {
            const typeRooms = groupedRooms[roomType]
            if (!typeRooms || typeRooms.length === 0) return null
            return (
              <div key={roomType} className="mb-6">
                {/* Section Header */}
                <div className="px-2 mb-2">
                  <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                    {roomTypeLabels[roomType as keyof typeof roomTypeLabels]}
                  </h3>
                </div>
                {/* Rooms in this type */}
                <div className="space-y-1">
                  {typeRooms.map((room) => {
                    const isSelected = room.id === selectedRoomId
                    const lastMessage = room.last_message?.[0]
                    return (
                      <motion.button
                        key={room.id}
                        onClick={() => onSelectRoom(room)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all duration-200",
                          "hover:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50",
                          isSelected && "bg-purple-600/20 border border-purple-500/30"
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Room Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {getRoomIcon(room.type, room.category?.color)}
                          </div>
                          {/* Room Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={cn(
                                "font-medium truncate",
                                isSelected ? "text-white" : "text-neutral-200"
                              )}>
                                {room.name}
                              </h4>
                              {getRoomTypeBadge(room.type)}
                            </div>
                            {/* Category Badge */}
                            {room.category && (
                              <div className="mb-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0"
                                  style={{
                                    borderColor: `${room.category.color}40`,
                                    color: room.category.color
                                  }}
                                >
                                  {getCategoryName(room.category, 'en')}
                                </Badge>
                              </div>
                            )}
                            {/* Last Message */}
                            {lastMessage && (
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-neutral-400 truncate flex-1">
                                  <span className="font-medium">
                                    {lastMessage.sender.name}:
                                  </span>{' '}
                                  {lastMessage.content}
                                </p>
                                <span className="text-xs text-neutral-500 ml-2 flex-shrink-0">
                                  {formatLastMessageTime(lastMessage.created_at)}
                                </span>
                              </div>
                            )}
                            {/* Participant Count */}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-neutral-500">
                                {room.participants.length} member{room.participants.length !== 1 ? 's' : ''}
                              </span>
                              {/* Unread indicator (placeholder) */}
                              <div className="w-2 h-2 bg-purple-500 rounded-full opacity-0" />
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {/* Empty State */}
          {rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-12 w-12 text-neutral-500 mb-4" />
              <h3 className="text-lg font-medium text-neutral-300 mb-2">
                No chat rooms yet
              </h3>
              <p className="text-sm text-neutral-500 mb-4">
                Join a room or create your own to start chatting
              </p>
              {onCreateRoom && (
                <Button onClick={onCreateRoom} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
