'use client'

import { motion } from 'framer-motion'
import { Search, ArrowLeft, TrendingUp, Calendar } from 'lucide-react'
import React, { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { useMessageSearch, useSearchAnalytics } from '@/lib/hooks/useMessageSearch'
import { SearchResult } from '@/lib/services/message-search'
import { cn } from '@/lib/utils'

import { MessageSearch } from './MessageSearch'
import { SearchResults } from './SearchResults'

interface SearchPageProps {
  onBack?: () => void
  onResultSelect?: (result: SearchResult) => void
  className?: string
}

export function SearchPage({ onBack, onResultSelect, className }: SearchPageProps) {
  const [showMiniSearch, setShowMiniSearch] = useState(false)
  const {
    query,
    results,
    stats,
    isLoading,
    error,
    hasResults,
    hasQuery,
    setQuery,
    clearSearch
  } = useMessageSearch()

  const { analytics } = useSearchAnalytics()

  const handleSearchFocus = () => {
    setShowMiniSearch(true)
  }

  const handleSearchClose = () => {
    setShowMiniSearch(false)
  }

  const handleResultSelect = (result: SearchResult) => {
    setShowMiniSearch(false)
    onResultSelect?.(result)
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-neutral-700">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <Search className="h-5 w-5 text-purple-400" />
          Message Search
        </h1>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-neutral-700">
        <button
          onClick={handleSearchFocus}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
            "bg-neutral-800 hover:bg-neutral-700 transition-colors",
            "text-left border border-neutral-700"
          )}
        >
          <Search className="h-5 w-5 text-neutral-400" />
          <span className="text-neutral-400">
            {hasQuery ? query : "Search messages, files, and mentions..."}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {hasResults ? (
          // Show search results
          <div className="h-full overflow-y-auto p-4">
            <SearchResults
              results={results}
              stats={stats}
              query={query}
              isLoading={isLoading}
              onResultSelect={handleResultSelect}
            />
          </div>
        ) : (
          // Show search overview/analytics
          <div className="h-full overflow-y-auto p-4 space-y-6">
            {/* Quick Stats */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-4 w-4 text-purple-400" />
                    <h3 className="font-medium text-white">Total Searches</h3>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {analytics.total_searches}
                  </p>
                </div>

                <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <h3 className="font-medium text-white">Avg Results</h3>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {analytics.average_results_per_search.toFixed(1)}
                  </p>
                </div>

                <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <h3 className="font-medium text-white">This Week</h3>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {analytics.search_frequency_by_day.reduce((sum, day) => sum + day.count, 0)}
                  </p>
                </div>
              </div>
            )}

            {/* Popular Search Terms */}
            {analytics?.most_searched_terms && analytics.most_searched_terms.length > 0 && (
              <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Most Searched Terms
                </h3>
                <div className="space-y-3">
                  {analytics.most_searched_terms.slice(0, 8).map((term, index) => (
                    <div key={term.term} className="flex items-center justify-between">
                      <button
                        onClick={() => setQuery(term.term)}
                        className="flex items-center gap-3 hover:bg-neutral-700 -mx-2 px-2 py-1 rounded"
                      >
                        <Badge variant="secondary" className="text-xs w-6 justify-center">
                          {index + 1}
                        </Badge>
                        <span className="text-white">{term.term}</span>
                      </button>
                      <Badge variant="outline" className="text-xs">
                        {term.count} searches
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Tips */}
            <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-medium text-white mb-4">
                Search Tips
              </h3>
              <div className="space-y-3 text-sm text-neutral-300">
                <div className="flex gap-3">
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    Tip
                  </Badge>
                  <span>Use quotes for exact phrases: <code className="text-purple-400">"hello world"</code></span>
                </div>
                <div className="flex gap-3">
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    Tip
                  </Badge>
                  <span>Search supports multiple words: <code className="text-purple-400">project meeting notes</code></span>
                </div>
                <div className="flex gap-3">
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    Tip
                  </Badge>
                  <span>Filter by date ranges using the filter button</span>
                </div>
                <div className="flex gap-3">
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    Tip
                  </Badge>
                  <span>Search includes file names and attachments</span>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {!analytics || analytics.total_searches === 0 && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-neutral-300 mb-2">
                  Ready to search
                </h3>
                <p className="text-neutral-500 mb-6">
                  Click the search bar above to start searching through your messages
                </p>
                <Button
                  onClick={handleSearchFocus}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Start Searching
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showMiniSearch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)',
            paddingLeft: 'max(env(safe-area-inset-left, 0px), 1rem)',
            paddingRight: 'max(env(safe-area-inset-right, 0px), 1rem)'
          }}
          onClick={(e) => e.target === e.currentTarget && handleSearchClose()}
        >
          <MessageSearch
            onClose={handleSearchClose}
            onResultSelect={handleResultSelect}
            className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-2xl max-h-[90vh] sm:max-h-[85vh]"
          />
        </motion.div>
      )}
    </div>
  )
}
