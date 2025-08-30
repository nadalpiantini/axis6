'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, Trophy, TrendingUp, Clock } from 'lucide-react'
import { QuickActionComposer } from './QuickActionComposer'
import { format } from 'date-fns'

interface MicroWinsHeroProps {
  currentStreak?: number
  longestStreak?: number
  todayCompleted?: boolean
  onMorningRitual?: () => void
}

export function MicroWinsHero({
  currentStreak = 0,
  longestStreak = 0,
  todayCompleted = false,
  onMorningRitual
}: MicroWinsHeroProps) {
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [isMorningWindow, setIsMorningWindow] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const checkMorningWindow = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const totalMinutes = hours * 60 + minutes

      // Morning window: 4:45 AM - 5:30 AM
      const startMinutes = 4 * 60 + 45 // 4:45 AM
      const endMinutes = 5 * 60 + 30   // 5:30 AM

      setIsMorningWindow(totalMinutes >= startMinutes && totalMinutes <= endMinutes)
      setCurrentTime(now)
    }

    checkMorningWindow()
    const interval = setInterval(checkMorningWindow, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const handleMorningRitual = () => {
    if (isMorningWindow && !todayCompleted) {
      setIsComposerOpen(true)
    }
  }

  return (
    <>
      <Card className="relative overflow-hidden bg-gradient-to-br from-navy-800/50 to-navy-900/50 border-navy-700/50 backdrop-blur-sm">
        <div className="p-8 sm:p-10">
          {/* Conceptual Triad Headers */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
              Micro Wins
              <Sparkles className="inline-block w-6 h-6 ml-2 text-yellow-400 animate-pulse" />
            </h1>
            <h2 className="text-xl sm:text-2xl font-medium text-navy-200 mb-3">
              One Axis at a Time
            </h2>
            <p className="text-base sm:text-lg text-navy-300">
              Tiny Actions. Total Balance.
            </p>
          </div>

          {/* Morning Ritual Button */}
          <div className="mb-6">
            {isMorningWindow ? (
              <Button
                onClick={handleMorningRitual}
                disabled={todayCompleted}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium px-6 py-3 h-auto text-base shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {todayCompleted ? (
                  <>
                    <Trophy className="w-5 h-5 mr-2" />
                    Morning Win Recorded
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 mr-2" />
                    Record Morning Win (Until 5:30 AM)
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setIsComposerOpen(true)}
                className="bg-gradient-to-r from-navy-600 to-navy-700 hover:from-navy-700 hover:to-navy-800 text-white font-medium px-6 py-3 h-auto text-base"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Share Micro Win
              </Button>
            )}

            {!isMorningWindow && (
              <p className="text-sm text-navy-400 mt-2">
                Morning ritual window: 4:45 - 5:30 AM
              </p>
            )}
          </div>

          {/* Streak Status */}
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-navy-700/50">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-navy-400">Current Streak</p>
                <p className="text-xl font-bold text-white">{currentStreak} days</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-navy-700/50">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-navy-400">Longest Streak</p>
                <p className="text-xl font-bold text-white">{longestStreak} days</p>
              </div>
            </div>
          </div>

          {/* Decorative element */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-3xl" />
        </div>
      </Card>

      {/* Quick Action Composer Modal */}
      <QuickActionComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        isMorningWindow={isMorningWindow}
        onSuccess={() => {
          setIsComposerOpen(false)
          // Trigger refresh of streaks and feed
          if (onMorningRitual && isMorningWindow) {
            onMorningRitual()
          }
        }}
      />
    </>
  )
}
