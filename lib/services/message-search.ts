/**
 * Message Search Service
 * Handles full-text search across chat messages with ranking and filtering
 */

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

export interface SearchResult {
  id: string
  room_id: string
  sender_id: string
  content: string
  created_at: string
  match_rank: number
  highlighted_content: string
  room: {
    id: string
    name: string
    type: 'direct' | 'group'
  }
  sender: {
    id: string
    name: string
  }
}

export interface SearchOptions {
  room_id?: string
  sender_id?: string
  date_from?: Date
  date_to?: Date
  limit?: number
  offset?: number
}

export interface SearchStats {
  total_results: number
  search_time_ms: number
  rooms_searched: number
  date_range?: {
    from: string
    to: string
  }
}

export class MessageSearchService {
  private static instance: MessageSearchService
  private supabase = createClient()
  private searchHistory: Array<{ query: string; timestamp: Date; results_count: number }> = []

  static getInstance(): MessageSearchService {
    if (!MessageSearchService.instance) {
      MessageSearchService.instance = new MessageSearchService()
    }
    return MessageSearchService.instance
  }

  /**
   * Search messages using full-text search with PostgreSQL
   */
  async searchMessages(
    query: string,
    options: SearchOptions = {}
  ): Promise<{
    results: SearchResult[]
    stats: SearchStats
  }> {
    const startTime = Date.now()

    if (!query.trim() || query.length < 2) {
      return {
        results: [],
        stats: {
          total_results: 0,
          search_time_ms: 0,
          rooms_searched: 0
        }
      }
    }

    try {
      const { data: results, error } = await this.supabase.rpc('search_messages', {
        search_query: query.trim(),
        p_room_id: options.room_id || null,
        p_sender_id: options.sender_id || null,
        p_date_from: options.date_from?.toISOString() || null,
        p_date_to: options.date_to?.toISOString() || null,
        p_limit: Math.min(options.limit || 50, 100),
        p_offset: Math.max(options.offset || 0, 0)
      })

      if (error) {
        logger.error('Message search failed:', error)
        throw new Error('Search failed')
      }

      const searchTime = Date.now() - startTime

      // Track search in history
      this.addToSearchHistory(query, results?.length || 0)

      const stats: SearchStats = {
        total_results: results?.length || 0,
        search_time_ms: searchTime,
        rooms_searched: new Set(results?.map(r => r.room_id)).size || 0,
        ...(options.date_from && options.date_to && {
          date_range: {
            from: options.date_from.toISOString(),
            to: options.date_to.toISOString()
          }
        })
      }

      logger.info(`Search completed: "${query}" -> ${stats.total_results} results in ${searchTime}ms`)

      return {
        results: results || [],
        stats
      }
    } catch (error) {
      logger.error('Search error:', error)
      return {
        results: [],
        stats: {
          total_results: 0,
          search_time_ms: Date.now() - startTime,
          rooms_searched: 0
        }
      }
    }
  }

  /**
   * Get search suggestions based on recent searches and popular terms
   */
  async getSearchSuggestions(partial: string): Promise<string[]> {
    if (!partial || partial.length < 2) return []

    try {
      const { data: suggestions, error } = await this.supabase.rpc('get_search_suggestions', {
        partial_query: partial.trim().toLowerCase()
      })

      if (error) {
        logger.warn('Search suggestions failed:', error)
        return []
      }

      return suggestions || []
    } catch (error) {
      logger.warn('Search suggestions error:', error)
      return []
    }
  }

  /**
   * Get recent search history for current user
   */
  getSearchHistory(): Array<{ query: string; timestamp: Date; results_count: number }> {
    return this.searchHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10) // Last 10 searches
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = []
    localStorage.removeItem('axis6_search_history')
  }

  /**
   * Add search to history
   */
  private addToSearchHistory(query: string, resultsCount: number): void {
    const searchEntry = {
      query: query.trim(),
      timestamp: new Date(),
      results_count: resultsCount
    }

    // Remove duplicate queries
    this.searchHistory = this.searchHistory.filter(entry => entry.query !== query)

    // Add new search
    this.searchHistory.unshift(searchEntry)

    // Keep only last 20 searches
    this.searchHistory = this.searchHistory.slice(0, 20)

    // Persist to localStorage
    try {
      localStorage.setItem('axis6_search_history', JSON.stringify(this.searchHistory))
    } catch (error) {
      logger.warn('Failed to save search history:', error)
    }
  }

  /**
   * Load search history from localStorage
   */
  loadSearchHistory(): void {
    try {
      const stored = localStorage.getItem('axis6_search_history')
      if (stored) {
        const parsed = JSON.parse(stored)
        this.searchHistory = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }))
      }
    } catch (error) {
      logger.warn('Failed to load search history:', error)
      this.searchHistory = []
    }
  }

  /**
   * Highlight search terms in content
   */
  highlightSearchTerms(content: string, query: string): string {
    if (!query.trim()) return content

    const terms = query.trim().split(/\s+/).filter(term => term.length > 1)
    let highlighted = content

    terms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
    })

    return highlighted
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Get search analytics for current user
   */
  async getSearchAnalytics(): Promise<{
    total_searches: number
    most_searched_terms: Array<{ term: string; count: number }>
    search_frequency_by_day: Array<{ date: string; count: number }>
    average_results_per_search: number
  }> {
    try {
      const { data: analytics, error } = await this.supabase.rpc('get_user_search_analytics')

      if (error) {
        logger.warn('Search analytics failed:', error)
        return {
          total_searches: 0,
          most_searched_terms: [],
          search_frequency_by_day: [],
          average_results_per_search: 0
        }
      }

      return analytics || {
        total_searches: 0,
        most_searched_terms: [],
        search_frequency_by_day: [],
        average_results_per_search: 0
      }
    } catch (error) {
      logger.warn('Search analytics error:', error)
      return {
        total_searches: 0,
        most_searched_terms: [],
        search_frequency_by_day: [],
        average_results_per_search: 0
      }
    }
  }
}

// Export singleton instance
export const messageSearchService = MessageSearchService.getInstance()
