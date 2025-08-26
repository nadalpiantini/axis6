'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ChatRoomPageProps {
  params: {
    roomId: string
  }
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // For now, redirect to the main chat page with the room selected
    // The main chat page will handle room selection via query params
    router.push(`/chat?room=${params.roomId}`)
  }, [params.roomId, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  )
}