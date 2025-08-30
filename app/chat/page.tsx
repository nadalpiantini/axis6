'use client'

import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { ChatRoom } from '@/components/chat/ChatRoom'
import { ChatRoomList } from '@/components/chat/ChatRoomList'
import { Button } from '@/components/ui/Button'
import { useChatRooms } from '@/lib/hooks/useChat'
import { ChatRoomWithParticipants } from '@/lib/supabase/types'

export default function ChatPage() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomWithParticipants | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // Get user ID with better error handling
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) {
          handleError(error, {

            operation: 'unknown_operation',

            component: 'page',

            userMessage: 'Something went wrong. Please try again.'

          })
    // // TODO: Replace with proper error handling
    // console.error('Auth error:', error);
          router.push('/auth/login')
          return
        }
        setUserId(session.user.id)
      } catch (error) {
        handleError(error, {

          operation: 'unknown_operation',

          component: 'page',

          userMessage: 'Something went wrong. Please try again.'

        })
    // // TODO: Replace with proper error handling
    // console.error('Failed to get session:', error);
        router.push('/auth/login')
      }
    }
    getUser()
  }, [supabase, router])

  // Use the chat rooms hook with emergency fallback
  const { data: rooms, isLoading, error } = useChatRooms(userId || undefined)

  // Emergency: If we have repeated errors, force a page reload to stop infinite loops
  const [errorCount, setErrorCount] = useState(0)
  useEffect(() => {
    if (error) {
      setErrorCount(prev => prev + 1)
      if (errorCount > 3) {
        handleError(error, {

          operation: 'unknown_operation',

          component: 'page',

          userMessage: 'Something went wrong. Please try again.'

        })
    // // TODO: Replace with proper error handling
    // console.error('Too many errors, forcing page reload to prevent infinite loops');
        window.location.reload()
      }
    } else {
      setErrorCount(0)
    }
  }, [error, errorCount])

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
    handleError(error, {

      operation: 'unknown_operation',

      component: 'page',

      userMessage: 'Something went wrong. Please try again.'

    })
    // // TODO: Replace with proper error handling
    // console.error('Chat error:', error);
    // Check if it's a database table missing error
    const isDatabaseError = error.message?.includes('relation') && error.message?.includes('does not exist')
    // Check if it's a 400 error indicating malformed query
    const is400Error = error.message?.includes('400') || error.status === 400
    // Check if it's a 500 error indicating server issues
    const is500Error = error.message?.includes('500') || error.status === 500
    // Check if it's an authentication error
    const isAuthError = error.message?.includes('session') || error.message?.includes('auth') || error.status === 401

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          {isDatabaseError ? (
            <>
              <h2 className="text-xl font-semibold text-gray-200 mb-2">Chat Coming Soon</h2>
              <p className="text-gray-400 mb-4">
                The chat feature is being set up. Please check back shortly.
              </p>
              <div className="bg-gray-800 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-400 mb-2">For administrators:</p>
                <p className="text-xs text-gray-500">
                  Database tables need to be deployed. Run the chat enhancement SQL script in Supabase.
                </p>
              </div>
            </>
          ) : isAuthError ? (
            <>
              <h2 className="text-xl font-semibold text-gray-200 mb-2">Authentication Required</h2>
              <p className="text-gray-400 mb-4">
                Please sign in again to access the chat system.
              </p>
              <Button
                onClick={() => router.push('/auth/login')}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Sign In
              </Button>
            </>
          ) : is500Error ? (
            <>
              <h2 className="text-xl font-semibold text-gray-200 mb-2">Server Error</h2>
              <p className="text-gray-400 mb-4">
                We're experiencing server issues. Our team has been notified and is working on a fix.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Try Again
              </Button>
            </>
          ) : is400Error ? (
            <>
              <h2 className="text-xl font-semibold text-gray-200 mb-2">Chat Temporarily Unavailable</h2>
              <p className="text-gray-400 mb-4">
                We're experiencing technical difficulties with the chat system. This has been automatically reported.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Try Again
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-400">Error loading chat rooms</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Retry
              </Button>
            </>
          )}
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
