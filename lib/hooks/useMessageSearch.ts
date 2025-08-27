import { useState, useEffect } from 'react'

import { messageSearchService, SearchResult, SearchOptions, SearchStats } from '@/lib/services/message-search'

import { useDebounce } from './useDebounce'

export function useMessageSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [stats, setStats] = useState<SearchStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [filters, setFilters] = useState<SearchOptions>({})

  const debouncedQuery = useDebounce(query, 300)

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
    setIsLoading(true)
    setError(null)

    try {
      const { results: searchResults, stats: searchStats } = await messageSearchService.searchMessages(
        searchQuery,
        filters
      )
      setResults(searchResults)
      setStats(searchStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getSuggestions = async (partial: string) => {
    try {
      const suggestions = await messageSearchService.getSearchSuggestions(partial)
      setSuggestions(suggestions)
    } catch (err) {
      console.warn('Failed to get suggestions:', err)
      setSuggestions([])
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setStats(null)
    setError(null)
    setSuggestions([])
  }

  const updateFilters = (newFilters: Partial<SearchOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const getSearchHistory = () => {
    return messageSearchService.getSearchHistory()
  }

  const clearSearchHistory = () => {
    messageSearchService.clearSearchHistory()
  }

  return {
    // State
    query,
    results,
    stats,
    isLoading,
    error,
    suggestions,
    filters,

    // Actions
    setQuery,
    performSearch,
    clearSearch,
    updateFilters,
    getSearchHistory,
    clearSearchHistory,

    // Computed
    hasResults: results.length > 0,
    hasQuery: query.trim().length > 0,
    canSearch: query.trim().length >= 2
  }
}

export function useSearchAnalytics() {
  const [analytics, setAnalytics] = useState<{
    total_searches: number
    most_searched_terms: Array<{ term: string; count: number }>
    search_frequency_by_day: Array<{ date: string; count: number }>
    average_results_per_search: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const analyticsData = await messageSearchService.getSearchAnalytics()
      setAnalytics(analyticsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  return {
    analytics,
    isLoading,
    error,
    reload: loadAnalytics
  }
}