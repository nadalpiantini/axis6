'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { MessageCircle, Plus } from 'lucide-react'
import { ChatRoomList } from '@/components/chat/ChatRoomList'
import { ChatRoom } from '@/components/chat/ChatRoom'
import { Button } from '@/components/ui/button'
import { useChatRooms } from '@/lib/hooks/useChat'
import { ChatRoomWithParticipants } from '@/lib/supabase/types'

export default function ChatPage() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomWithParticipants | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      setUserId(session.user.id)
    }
    getUser()
  }, [supabase, router])

  // Use the chat rooms hook
  const { data: rooms, isLoading, error } = useChatRooms(userId || undefined)

  const handleCreateRoom = () => {
    router.push('/chat/new')
  }

  const handleRoomSelect = (room: ChatRoomWithParticipants) => {
    setSelectedRoom(room)
  }

  const handleCloseRoom = () => {
    setSelectedRoom(null)
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Error loading chat rooms</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-purple-600 hover:bg-purple-700"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Room List Sidebar */}
      <div className={`${
        selectedRoom ? 'hidden md:flex' : 'flex'
      } flex-col w-full md:w-80 bg-gray-900 border-r border-gray-800`}>
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-purple-400" />
              Chat
            </h1>
            <Button
              onClick={handleCreateRoom}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {rooms && rooms.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No chat rooms yet</p>
              <Button
                onClick={handleCreateRoom}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Create your first room
              </Button>
            </div>
          ) : (
            <ChatRoomList
              rooms={rooms || []}
              selectedRoomId={selectedRoom?.id}
              onSelectRoom={handleRoomSelect}
              onCreateRoom={handleCreateRoom}
            />
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${
        selectedRoom ? 'flex' : 'hidden md:flex'
      } flex-1 flex flex-col bg-gray-900`}>
        {selectedRoom ? (
          <ChatRoom
            room={selectedRoom}
            userId={userId}
            onClose={handleCloseRoom}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-300 mb-2">
                Welcome to AXIS6 Chat
              </h2>
              <p className="text-gray-500 max-w-md">
                Connect with your wellness community. Select a room to start chatting or create a new one.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}