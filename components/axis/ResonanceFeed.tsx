'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Brain, Heart, Users, Sparkles, Briefcase, Clock, Star, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

import { handleError } from '@/lib/error/standardErrorHandler'
interface MicroWin {
  id: string
  userId: string
  userName: string
  axis: string
  axisColor: string
  winText: string
  minutes?: number
  isMorning: boolean
  resonanceCount: number
  createdAt: string
  userReacted: boolean
}

interface ResonanceFeedProps {
  focusMode?: boolean // ADHD mode - hide counters
}

const AXIS_ICONS = {
  physical: Activity,
  mental: Brain,
  emotional: Heart,
  social: Users,
  spiritual: Sparkles,
  material: Briefcase
}

const AXIS_COLORS = {
  physical: '#65D39A',
  mental: '#9B8AE6',
  emotional: '#FF8B7D',
  social: '#6AA6FF',
  spiritual: '#4ECDC4',
  material: '#FFD166'
}

export function ResonanceFeed({ focusMode = false }: ResonanceFeedProps) {
  const [feed, setFeed] = useState<MicroWin[]>([])
  const [loading, setLoading] = useState(true)
  const [feedType, setFeedType] = useState<'all' | 'following' | 'my'>('all')
  const [selectedAxis, setSelectedAxis] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const fetchFeed = async (reset = false) => {
    try {
      setLoading(true)
      const offset = reset ? 0 : page * 20

      const params = new URLSearchParams({
        feedType,
        limit: '20',
        offset: offset.toString(),
        ...(selectedAxis && { axis: selectedAxis })
      })

      const response = await fetch(`/api/micro-wins?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch feed')
      }

      setFeed(reset ? data.feed : [...feed, ...data.feed])
      setHasMore(data.pagination.hasMore)
      if (!reset) setPage(page + 1)
    } catch (error) {
      handleError(error, {
      operation: 'general_operation', component: 'ResonanceFeed',

        userMessage: 'Operation failed. Please try again.'

      })
      toast.error('Failed to load feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed(true)
  }, [feedType, selectedAxis])

  const handleReaction = async (winId: string) => {
    try {
      const response = await fetch(`/api/micro-wins/${winId}/react`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: 'hex_star' })
      })

      if (!response.ok) {
        throw new Error('Failed to add reaction')
      }

      // Update local state
      setFeed(feed.map(win =>
        win.id === winId
          ? { ...win, userReacted: true, resonanceCount: win.resonanceCount + 1 }
          : win
      ))

      toast.success('Support added!')
    } catch (error) {
      handleError(error, {
      operation: 'general_operation', component: 'ResonanceFeed',

        userMessage: 'Operation failed. Please try again.'

      })
      toast.error('Failed to add support')
    }
  }

  const MicroWinCard = ({ win }: { win: MicroWin }) => {
    const Icon = AXIS_ICONS[win.axis as keyof typeof AXIS_ICONS]
    const axisColor = AXIS_COLORS[win.axis as keyof typeof AXIS_COLORS]

    return (
      <Card className="p-4 bg-navy-800/50 border-navy-700/50 hover:bg-navy-800/70 transition-colors">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: `${axisColor}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: axisColor }} />
              </div>
              <span className="text-sm font-medium text-white">
                {win.userName}
              </span>
              {win.isMorning && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                  Morning
                </span>
              )}
            </div>
            <span className="text-xs text-navy-400">
              {formatDistanceToNow(new Date(win.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Content */}
          <p className="text-sm text-navy-100 leading-relaxed">
            {win.winText}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {win.minutes && (
                <span className="flex items-center gap-1 text-xs text-navy-400">
                  <Clock className="w-3 h-3" />
                  {win.minutes} min
                </span>
              )}
              {!focusMode && (
                <span className="text-xs text-navy-400">
                  {win.resonanceCount} resonance
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(win.id)}
              disabled={win.userReacted}
              className={`
                h-8 px-3
                ${win.userReacted
                  ? 'text-yellow-400 hover:text-yellow-400'
                  : 'text-navy-400 hover:text-white'
                }
              `}
            >
              <Star className={`w-4 h-4 ${win.userReacted ? 'fill-current' : ''}`} />
              {!focusMode && <span className="ml-1 text-xs">+1</span>}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-white mb-1">
          Tiny Actions. Total Balance.
        </h3>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <Tabs value={feedType} onValueChange={(v) => setFeedType(v as any)}>
          <TabsList className="bg-navy-800 border-navy-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-navy-700">
              All
            </TabsTrigger>
            <TabsTrigger value="following" className="data-[state=active]:bg-navy-700">
              Following
            </TabsTrigger>
            <TabsTrigger value="my" className="data-[state=active]:bg-navy-700">
              My Wins
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Axis Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedAxis === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedAxis(null)}
            className="h-8"
          >
            All Axes
          </Button>
          {Object.entries(AXIS_ICONS).map(([axis, Icon]) => (
            <Button
              key={axis}
              variant={selectedAxis === axis ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedAxis(axis)}
              className="h-8"
            >
              <Icon className="w-3 h-3 mr-1" />
              {axis.charAt(0).toUpperCase() + axis.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {loading && feed.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-navy-400">Loading micro wins...</p>
          </div>
        ) : feed.length === 0 ? (
          <Card className="p-8 bg-navy-800/50 border-navy-700/50 text-center">
            <Sparkles className="w-12 h-12 text-navy-400 mx-auto mb-3" />
            <p className="text-navy-300">Start with your own micro win.</p>
          </Card>
        ) : (
          <>
            {feed.map((win) => (
              <MicroWinCard key={win.id} win={win} />
            ))}

            {hasMore && (
              <Button
                variant="outline"
                onClick={() => fetchFeed()}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
