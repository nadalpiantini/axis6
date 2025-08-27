'use client'

import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { ArrowLeft, MessageCircle, Users, Lock, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'


type RoomType = 'group' | 'category' | 'support'

export default function NewChatRoomPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<RoomType>('group')
  const [isPrivate, setIsPrivate] = useState(false)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    { id: 1, name: 'Physical', color: 'text-green-400' },
    { id: 2, name: 'Mental', color: 'text-blue-400' },
    { id: 3, name: 'Emotional', color: 'text-red-400' },
    { id: 4, name: 'Social', color: 'text-purple-400' },
    { id: 5, name: 'Spiritual', color: 'text-indigo-400' },
    { id: 6, name: 'Material', color: 'text-orange-400' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!name.trim()) {
      setError('Room name is required')
      return
    }

    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Create the room
      const { data: room, error: roomError } = await supabase
        .from('axis6_chat_rooms')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          type,
          category_id: type === 'category' ? categoryId : null,
          creator_id: user.id,
          is_private: isPrivate
        })
        .select()
        .single()

      if (roomError) {
        throw roomError
      }

      // Add creator as admin participant
      const { error: participantError } = await supabase
        .from('axis6_chat_participants')
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: 'admin'
        })

      if (participantError) {
        throw participantError
      }

      // Send initial system message
      await supabase
        .from('axis6_chat_messages')
        .insert({
          room_id: room.id,
          sender_id: user.id,
          content: `Welcome to ${name}! This room was created for ${
            type === 'category' && categoryId 
              ? `${categories.find(c => c.id === categoryId)?.name} wellness discussions`
              : type === 'support' 
                ? 'getting help and support'
                : 'group discussions'
          }.`,
          message_type: 'system'
        })

      // Navigate to the new room
      router.push(`/chat?room=${room.id}`)
    } catch (err) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Error creating room:', err);
      setError('Failed to create room. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-7 h-7 text-purple-400" />
                  Create New Chat Room
                </h1>
                <p className="text-gray-400 mt-1">
                  Start a new conversation with your wellness community
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Room Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room Name *
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Morning Motivation, Fitness Goals"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this room about?"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 min-h-[100px]"
                maxLength={500}
              />
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['group', 'category', 'support'] as const).map((roomType) => (
                  <button
                    key={roomType}
                    type="button"
                    onClick={() => setType(roomType)}
                    className={`
                      p-3 rounded-lg border transition-all
                      ${type === roomType
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {roomType === 'group' && <Users className="w-5 h-5" />}
                      {roomType === 'category' && <MessageCircle className="w-5 h-5" />}
                      {roomType === 'support' && <MessageCircle className="w-5 h-5" />}
                      <span className="text-sm capitalize">{roomType}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selection (if type is category) */}
            {type === 'category' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryId(category.id)}
                      className={`
                        p-3 rounded-lg border transition-all text-left
                        ${categoryId === category.id
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        }
                      `}
                    >
                      <span className={categoryId === category.id ? 'text-white' : category.color}>
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Privacy
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`
                    p-3 rounded-lg border transition-all
                    ${!isPrivate
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Public</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`
                    p-3 rounded-lg border transition-all
                    ${isPrivate
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Private</span>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {isPrivate 
                  ? 'Only invited members can join this room'
                  : 'Anyone in AXIS6 can discover and join this room'
                }
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={loading || !name.trim()}
              >
                {loading ? 'Creating...' : 'Create Room'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}