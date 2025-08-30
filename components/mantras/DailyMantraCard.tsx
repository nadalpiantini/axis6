'use client'

import { motion } from 'framer-motion'
import { Sparkles, CheckCircle, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

import { handleError } from '@/lib/error/standardErrorHandler'
interface Mantra {
  id: number
  content: {
    es?: string
    en?: string
  }
  category: string
  author?: string
}

export function DailyMantraCard() {
  const [mantra, setMantra] = useState<Mantra | null>(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [language, setLanguage] = useState<'es' | 'en'>('en')

  useEffect(() => {
    fetchDailyMantra()
  }, [])

  const fetchDailyMantra = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/mantras/daily')
      if (response.ok) {
        const data = await response.json()
        setMantra(data.mantra)
        setCompleted(data.completed || false)
      }
            } catch (error) {
          handleError(error, {
      operation: 'mantra_operation', component: 'DailyMantraCard',

            userMessage: 'Failed to load daily mantra. Please try refreshing.'

          })
          // Error logged via handleError
        } finally {
      setLoading(false)
    }
  }

  const markAsComplete = async () => {
    if (!mantra || completed) return

    try {
      const response = await fetch('/api/mantras/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mantraId: mantra.id })
      })

      if (response.ok) {
        setCompleted(true)
      }
    } catch (error) {
      handleError(error, {
      operation: 'mantra_operation', component: 'DailyMantraCard',

        userMessage: 'Failed to load daily mantra. Please try refreshing.'

      })
            // Error logged via handleError
    }
  }

  const getMantraText = () => {
    if (!mantra?.content) return ''
    return mantra.content[language] || mantra.content.en || ''
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-4 sm:p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 bg-white/20 rounded"></div>
          <div className="h-4 bg-white/20 rounded w-24"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-white/20 rounded w-full"></div>
          <div className="h-3 bg-white/20 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!mantra) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl p-4 sm:p-6 transition-all ${
        completed ? 'bg-green-500/10 border-green-500/30' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <h3 className="text-sm font-semibold text-gray-300">Daily Mantra</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
          >
            {language.toUpperCase()}
          </button>
          {completed && (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
        </div>
      </div>

      <blockquote className="text-white/90 text-base sm:text-lg italic mb-3">
        "{getMantraText()}"
      </blockquote>

      {mantra.author && (
        <p className="text-sm text-gray-400 mb-4">
          — {mantra.author}
        </p>
      )}

      {!completed && (
        <button
          onClick={markAsComplete}
          className="w-full py-2 px-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20
                     hover:from-purple-500/30 hover:to-pink-500/30 rounded-lg
                     transition-all flex items-center justify-center gap-2 text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          Mark as Read
        </button>
      )}

      {completed && (
        <div className="text-center text-sm text-green-400">
          ✨ Today's mantra completed!
        </div>
      )}
    </motion.div>
  )
}
