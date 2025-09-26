'use client'
import { useState } from 'react'
import { useUpdateReflection } from '@/lib/hooks/useDayData'
import { toast } from 'sonner'

interface SimpleReflectionProps {
  reflection?: string
  date: Date
}

export function SimpleReflection({ reflection, date }: SimpleReflectionProps) {
  const [text, setText] = useState(reflection || '')
  const [isEditing, setIsEditing] = useState(false)
  const updateReflection = useUpdateReflection()

  const handleSave = async () => {
    try {
      await updateReflection.mutateAsync({ date, text })
      setIsEditing(false)
      toast.success('Reflection saved')
    } catch (error) {
      toast.error('Failed to save reflection')
    }
  }

  const charCount = text.length
  const isOverLimit = charCount > 140

  return (
    <div className="glass rounded-xl p-3 text-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          📝 Daily Reflection
        </h3>
        <div className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-gray-400'}`}>
          {charCount}/140
        </div>
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind today? (140 chars max)"
            className={`w-full bg-white/10 border rounded-lg p-2 text-white placeholder-gray-400 resize-none h-16 text-sm ${
              isOverLimit ? 'border-red-400' : 'border-white/20'
            }`}
            maxLength={160} // Allow slight overflow for UX
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isOverLimit || updateReflection.isPending}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs font-medium transition-colors"
            >
              {updateReflection.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setText(reflection || '')
                setIsEditing(false)
              }}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {text ? (
            <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
          ) : (
            <p className="text-gray-500 italic text-sm">No reflection yet for today...</p>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 rounded text-xs font-medium transition-colors border border-white/20"
          >
            {text ? 'Edit Reflection' : 'Add Reflection'}
          </button>
        </div>
      )}
    </div>
  )
}
