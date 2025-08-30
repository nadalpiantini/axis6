'use client'

import { formatDistanceToNow, format } from 'date-fns'
import { motion } from 'framer-motion'
import { Search, MessageSquare, Calendar, User, Filter, ArrowUpDown } from 'lucide-react'
import React, { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { SearchResult, SearchStats } from '@/lib/services/message-search'
import { cn } from '@/lib/utils'

interface SearchResultsProps {
  results: SearchResult[]
  stats: SearchStats | null
  query: string
  isLoading?: boolean
  onResultSelect?: (result: SearchResult) => void
  className?: string
}

type SortOption = 'relevance' | 'date_desc' | 'date_asc'

export function SearchResults({
  results,
  stats,
  query,
  isLoading = false,
  onResultSelect,
  className
}: SearchResultsProps) {
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [groupByRoom, setGroupByRoom] = useState(false)

  const sortedResults = React.useMemo(() => {
    const sorted = [...results].sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.match_rank - a.match_rank
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return 0
      }
    })

    if (groupByRoom) {
      const grouped = sorted.reduce((acc, result) => {
        const roomId = result.room.id
        if (!acc[roomId]) {
          acc[roomId] = []
        }
        acc[roomId].push(result)
        return acc
      }, {} as Record<string, SearchResult[]>)

      return Object.entries(grouped).flatMap(([roomId, roomResults]) => roomResults)
    }

    return sorted
  }, [results, sortBy, groupByRoom])

  const groupedResults = React.useMemo(() => {
    if (!groupByRoom) return null

    return sortedResults.reduce((acc, result) => {
      const roomId = result.room.id
      if (!acc[roomId]) {
        acc[roomId] = {
          room: result.room,
          results: []
        }
      }
      acc[roomId].results.push(result)
      return acc
    }, {} as Record<string, { room: SearchResult['room']; results: SearchResult[] }>)
  }, [sortedResults, groupByRoom])

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result)
  }

  const highlightQuery = (text: string) => {
    if (!query.trim()) return text

    const terms = query.trim().split(/\s+/).filter(term => term.length > 1)
    let highlighted = text

    terms.forEach(term => {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
    })

    return highlighted
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-neutral-400">Searching messages...</p>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Search className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-300 mb-2">
          No messages found
        </h3>
        <p className="text-neutral-500">
          Try adjusting your search terms or using different keywords
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Stats and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {stats && (
            <div className="text-sm text-neutral-400">
              <span className="font-medium text-white">{stats.total_results}</span> results
              {stats.search_time_ms > 0 && (
                <span> in {stats.search_time_ms}ms</span>
              )}
              {stats.rooms_searched > 0 && (
                <span> across {stats.rooms_searched} rooms</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGroupByRoom(!groupByRoom)}
            className={cn(
              "text-neutral-300 hover:text-white",
              groupByRoom && "bg-neutral-700"
            )}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Group by Room
          </Button>

          <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortBy('relevance')}
              className={cn(
                "text-xs px-2 py-1",
                sortBy === 'relevance' && "bg-neutral-700 text-white"
              )}
            >
              Relevance
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortBy('date_desc')}
              className={cn(
                "text-xs px-2 py-1",
                sortBy === 'date_desc' && "bg-neutral-700 text-white"
              )}
            >
              Newest
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortBy('date_asc')}
              className={cn(
                "text-xs px-2 py-1",
                sortBy === 'date_asc' && "bg-neutral-700 text-white"
              )}
            >
              Oldest
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {groupByRoom && groupedResults ? (
        // Grouped by room view
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([roomId, { room, results: roomResults }]) => (
            <div key={roomId} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-700">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                <h3 className="font-medium text-white">{room.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {roomResults.length} results
                </Badge>
              </div>

              <div className="space-y-2">
                {roomResults.map((result, index) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    query={query}
                    onClick={handleResultClick}
                    highlightQuery={highlightQuery}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Linear view
        <div className="space-y-2">
          {sortedResults.map((result, index) => (
            <SearchResultItem
              key={result.id}
              result={result}
              query={query}
              onClick={handleResultClick}
              highlightQuery={highlightQuery}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface SearchResultItemProps {
  result: SearchResult
  query: string
  onClick: (result: SearchResult) => void
  highlightQuery: (text: string) => string
}

function SearchResultItem({ result, query, onClick, highlightQuery }: SearchResultItemProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick(result)}
      className="w-full text-left p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 hover:border-neutral-600 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {result.sender.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-white">
              {result.sender.name}
            </span>
            <span className="text-sm text-neutral-400">
              in {result.room.name}
            </span>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Calendar className="h-3 w-3" />
              <span title={format(new Date(result.created_at), 'PPpp')}>
                {formatDistanceToNow(new Date(result.created_at))} ago
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {(result.match_rank * 100).toFixed(0)}% match
            </Badge>
          </div>

          <div
            className="text-sm text-neutral-300 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: highlightQuery(result.content)
            }}
          />
        </div>

        <div className="flex-shrink-0">
          <ArrowUpDown className="h-4 w-4 text-neutral-500" />
        </div>
      </div>
    </motion.button>
  )
}
