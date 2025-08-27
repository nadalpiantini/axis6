'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ChatRoomPageProps {
  params: Promise<{
    roomId: string
  }>
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // For now, redirect to the main chat page with the room selected
    // The main chat page will handle room selection via query params
    params.then(p => {
      router.push(`/chat?room=${p.roomId}`)
    })
  }, [params, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  )
}