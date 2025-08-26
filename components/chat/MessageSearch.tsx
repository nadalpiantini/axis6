'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Clock, Filter, TrendingUp, Calendar, User, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { messageSearchService, SearchResult, SearchOptions, SearchStats } from '@/lib/services/message-search'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { formatDistanceToNow } from 'date-fns'

interface MessageSearchProps {
  className?: string
  onClose?: () => void
  onResultSelect?: (result: SearchResult) => void
}

export function MessageSearch({
  className,
  onClose,
  onResultSelect
}: MessageSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [stats, setStats] = useState<SearchStats | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchOptions>({})
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  
  const debouncedQuery = useDebounce(query, 300)

  // Load search history on mount
  useEffect(() => {
    messageSearchService.loadSearchHistory()
  }, [])

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch(debouncedQuery)
    } else {
      setResults([])
      setStats(null)
    }
  }, [debouncedQuery, filters])

  // Get suggestions when query changes
  useEffect(() => {
    if (query.length >= 2 && query.length < 10) {
      getSuggestions(query)
    } else {
      setSuggestions([])
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true)
    try {
      const { results: searchResults, stats: searchStats } = await messageSearchService.searchMessages(
        searchQuery,
        filters
      )
      setResults(searchResults)
      setStats(searchStats)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
      setStats(null)
    } finally {
      setIsSearching(false)
    }
  }

  const getSuggestions = async (partial: string) => {
    try {
      const suggestions = await messageSearchService.getSearchSuggestions(partial)
      setSuggestions(suggestions)
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      setSuggestions([])
    }
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setSelectedIndex(-1)
  }

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion)
    setSuggestions([])
    searchInputRef.current?.focus()
  }

  const handleResultSelect = (result: SearchResult) => {
    onResultSelect?.(result)
    onClose?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose?.()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const maxIndex = results.length + suggestions.length - 1
      setSelectedIndex(prev => Math.min(prev + 1, maxIndex))
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0) {
        if (selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex])
        } else {
          const resultIndex = selectedIndex - suggestions.length
          if (results[resultIndex]) {
            handleResultSelect(results[resultIndex])
          }
        }
      }
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setStats(null)
    setSuggestions([])
    setSelectedIndex(-1)
    searchInputRef.current?.focus()
  }

  const getSearchHistory = () => {
    return messageSearchService.getSearchHistory().slice(0, 5)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "bg-neutral-800 rounded-lg border border-neutral-700 shadow-2xl",
        "w-full max-w-2xl max-h-[80vh] flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-neutral-700">
        <Search className="h-5 w-5 text-purple-400 flex-shrink-0" />
        
        <div className="relative flex-1">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="Search messages..."
            className={cn(
              "w-full bg-transparent text-white placeholder-neutral-400",
              "text-lg outline-none"
            )}
          />
          
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-700 rounded"
            >
              <X className="h-4 w-4 text-neutral-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "text-neutral-300 hover:text-white",
              showFilters && "bg-neutral-700"
            )}
          >
            <Filter className="h-4 w-4" />
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-neutral-700 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setFilters(prev => ({ ...prev, date_from: new Date(Date.now() - 24 * 60 * 60 * 1000) }))}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Last 24h
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setFilters(prev => ({ ...prev, date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }))}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Last Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setFilters({})}
                >
                  Clear Filters
                </Button>
              </div>
              
              {Object.keys(filters).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.date_from && (
                    <Badge variant="secondary" className="text-xs">
                      From: {filters.date_from.toLocaleDateString()}
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, date_from: undefined }))}
                        className="ml-1 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Search Stats */}
        {stats && (
          <div className="px-4 py-2 border-b border-neutral-700 bg-neutral-900/50">
            <div className="flex items-center justify-between text-sm text-neutral-400">
              <span>
                {stats.total_results} results in {stats.search_time_ms}ms
              </span>
              {stats.rooms_searched > 0 && (
                <span>
                  {stats.rooms_searched} rooms searched
                </span>
              )}
            </div>
          </div>
        )}

        <div ref={resultsRef} className="overflow-y-auto max-h-96">
          {/* Loading */}
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && !isSearching && results.length === 0 && (
            <div className="p-4">
              <h4 className="text-sm font-medium text-neutral-300 mb-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Suggestions
              </h4>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded text-sm",
                      "text-neutral-300 hover:bg-neutral-700 transition-colors",
                      selectedIndex === index && "bg-neutral-700"
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="divide-y divide-neutral-700">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultSelect(result)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-neutral-700 transition-colors",
                    selectedIndex === suggestions.length + index && "bg-neutral-700"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {result.sender.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">
                          {result.sender.name}
                        </span>
                        <span className="text-xs text-neutral-400">
                          in {result.room.name}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {formatDistanceToNow(new Date(result.created_at))} ago
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {(result.match_rank * 100).toFixed(0)}% match
                        </Badge>
                      </div>
                      
                      <div 
                        className="text-sm text-neutral-300 line-clamp-2"
                        dangerouslySetInnerHTML={{ 
                          __html: messageSearchService.highlightSearchTerms(result.content, query) 
                        }}
                      />
                    </div>
                    
                    <div className="flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-neutral-500" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search History */}
          {!query && !isSearching && results.length === 0 && (
            <div className="p-4">
              <h4 className="text-sm font-medium text-neutral-300 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Recent Searches
              </h4>
              <div className="space-y-1">
                {getSearchHistory().map((entry, index) => (
                  <button
                    key={`${entry.query}-${entry.timestamp.getTime()}`}
                    onClick={() => setQuery(entry.query)}
                    className="w-full text-left px-3 py-2 rounded text-sm text-neutral-300 hover:bg-neutral-700 transition-colors flex items-center justify-between"
                  >
                    <span>{entry.query}</span>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span>{entry.results_count} results</span>
                      <span>{formatDistanceToNow(entry.timestamp)} ago</span>
                    </div>
                  </button>
                ))}
                
                {getSearchHistory().length === 0 && (
                  <p className="text-neutral-500 text-sm py-4 text-center">
                    No recent searches
                  </p>
                )}
              </div>
            </div>
          )}

          {/* No Results */}
          {query && !isSearching && results.length === 0 && suggestions.length === 0 && (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-neutral-300 mb-2">
                No results found
              </h3>
              <p className="text-neutral-500 text-sm">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with shortcuts */}
      <div className="px-4 py-2 border-t border-neutral-700 bg-neutral-900/50">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
            <span>Esc Close</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Powered by PostgreSQL FTS</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}