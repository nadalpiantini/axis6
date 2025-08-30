/**
 * Chat Analytics Service
 * Provides comprehensive analytics for chat usage, engagement, and insights
 */

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'

export interface ChatAnalytics {
  overview: {
    total_messages: number
    total_rooms: number
    active_participants: number
    messages_today: number
    growth_rate: number
  }
  activity: {
    messages_by_hour: Array<{ hour: number; count: number }>
    messages_by_day: Array<{ date: string; count: number }>
    messages_by_room: Array<{ room_id: string; room_name: string; count: number }>
    most_active_users: Array<{ user_id: string; user_name: string; message_count: number }>
  }
  engagement: {
    avg_messages_per_user: number
    avg_response_time_minutes: number
    most_active_rooms: Array<{ room_id: string; room_name: string; participant_count: number; message_count: number }>
    file_sharing_stats: {
      total_files: number
      files_by_type: Array<{ type: string; count: number }>
      total_size_mb: number
    }
  }
  social: {
    mentions_given: number
    mentions_received: number
    top_mentioners: Array<{ user_id: string; user_name: string; mentions_count: number }>
    top_mentioned: Array<{ user_id: string; user_name: string; mentions_count: number }>
  }
  search: {
    total_searches: number
    avg_results_per_search: number
    most_searched_terms: Array<{ term: string; count: number }>
    search_success_rate: number
  }
}

export interface RoomAnalytics {
  room_id: string
  room_name: string
  overview: {
    total_messages: number
    total_participants: number
    messages_today: number
    avg_messages_per_day: number
    room_age_days: number
  }
  activity: {
    messages_by_day: Array<{ date: string; count: number }>
    messages_by_hour: Array<{ hour: number; count: number }>
    most_active_participants: Array<{ user_id: string; user_name: string; message_count: number }>
    peak_activity_hour: number
  }
  engagement: {
    avg_response_time_minutes: number
    file_attachments_count: number
    mentions_count: number
    active_participants_30d: number
  }
}

export interface UserAnalytics {
  user_id: string
  user_name: string
  overview: {
    total_messages_sent: number
    total_rooms_joined: number
    messages_today: number
    avg_messages_per_day: number
    account_age_days: number
  }
  activity: {
    messages_by_day: Array<{ date: string; count: number }>
    messages_by_hour: Array<{ hour: number; count: number }>
    favorite_rooms: Array<{ room_id: string; room_name: string; message_count: number }>
    most_active_day: string
    most_active_hour: number
  }
  social: {
    mentions_given: number
    mentions_received: number
    files_shared: number
    responses_received: number
    avg_response_time_minutes: number
  }
}

export class ChatAnalyticsService {
  private static instance: ChatAnalyticsService
  private supabase = createClient()
  private cache = new Map<string, { data: any; expires: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): ChatAnalyticsService {
    if (!ChatAnalyticsService.instance) {
      ChatAnalyticsService.instance = new ChatAnalyticsService()
    }
    return ChatAnalyticsService.instance
  }

  /**
   * Get comprehensive chat analytics for the user
   */
  async getChatAnalytics(): Promise<ChatAnalytics> {
    const cacheKey = 'chat_analytics'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const { data: analytics, error } = await this.supabase.rpc('get_chat_analytics')

      if (error) {
        logger.error('Chat analytics error:', error)
        throw new Error('Failed to get chat analytics')
      }

      const parsedAnalytics = typeof analytics === 'string' ? JSON.parse(analytics) : analytics
      const result = this.formatChatAnalytics(parsedAnalytics)

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      logger.error('Chat analytics service error:', error)
      throw error
    }
  }

  /**
   * Get analytics for a specific room
   */
  async getRoomAnalytics(roomId: string): Promise<RoomAnalytics> {
    const cacheKey = `room_analytics_${roomId}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const { data: analytics, error } = await this.supabase.rpc('get_room_analytics', {
        p_room_id: roomId
      })

      if (error) {
        logger.error('Room analytics error:', error)
        throw new Error('Failed to get room analytics')
      }

      const parsedAnalytics = typeof analytics === 'string' ? JSON.parse(analytics) : analytics
      const result = this.formatRoomAnalytics(parsedAnalytics)

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      logger.error('Room analytics service error:', error)
      throw error
    }
  }

  /**
   * Get analytics for current user
   */
  async getUserAnalytics(): Promise<UserAnalytics> {
    const cacheKey = 'user_analytics'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const { data: analytics, error } = await this.supabase.rpc('get_user_analytics')

      if (error) {
        logger.error('User analytics error:', error)
        throw new Error('Failed to get user analytics')
      }

      const parsedAnalytics = typeof analytics === 'string' ? JSON.parse(analytics) : analytics
      const result = this.formatUserAnalytics(parsedAnalytics)

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      logger.error('User analytics service error:', error)
      throw error
    }
  }

  /**
   * Get real-time activity metrics
   */
  async getRealtimeMetrics(): Promise<{
    active_users_now: number
    messages_last_hour: number
    active_rooms: number
    online_participants: Array<{ user_id: string; user_name: string; last_seen: string }>
  }> {
    try {
      const { data: metrics, error } = await this.supabase.rpc('get_realtime_metrics')

      if (error) {
        logger.error('Realtime metrics error:', error)
        throw new Error('Failed to get realtime metrics')
      }

      const parsedMetrics = typeof metrics === 'string' ? JSON.parse(metrics) : metrics
      return parsedMetrics || {
        active_users_now: 0,
        messages_last_hour: 0,
        active_rooms: 0,
        online_participants: []
      }
    } catch (error) {
      logger.error('Realtime metrics service error:', error)
      throw error
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    try {
      const analytics = await this.getChatAnalytics()

      if (format === 'json') {
        return new Blob(
          [JSON.stringify(analytics, null, 2)],
          { type: 'application/json' }
        )
      }

      // Convert to CSV format
      const csvData = this.convertToCSV(analytics)
      return new Blob([csvData], { type: 'text/csv' })
    } catch (error) {
      logger.error('Export analytics error:', error)
      throw error
    }
  }

  /**
   * Clear analytics cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Private helper methods
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.CACHE_DURATION
    })
  }

  private formatChatAnalytics(raw: any): ChatAnalytics {
    return {
      overview: {
        total_messages: raw?.overview?.total_messages || 0,
        total_rooms: raw?.overview?.total_rooms || 0,
        active_participants: raw?.overview?.active_participants || 0,
        messages_today: raw?.overview?.messages_today || 0,
        growth_rate: raw?.overview?.growth_rate || 0
      },
      activity: {
        messages_by_hour: raw?.activity?.messages_by_hour || [],
        messages_by_day: raw?.activity?.messages_by_day || [],
        messages_by_room: raw?.activity?.messages_by_room || [],
        most_active_users: raw?.activity?.most_active_users || []
      },
      engagement: {
        avg_messages_per_user: raw?.engagement?.avg_messages_per_user || 0,
        avg_response_time_minutes: raw?.engagement?.avg_response_time_minutes || 0,
        most_active_rooms: raw?.engagement?.most_active_rooms || [],
        file_sharing_stats: {
          total_files: raw?.engagement?.file_sharing_stats?.total_files || 0,
          files_by_type: raw?.engagement?.file_sharing_stats?.files_by_type || [],
          total_size_mb: raw?.engagement?.file_sharing_stats?.total_size_mb || 0
        }
      },
      social: {
        mentions_given: raw?.social?.mentions_given || 0,
        mentions_received: raw?.social?.mentions_received || 0,
        top_mentioners: raw?.social?.top_mentioners || [],
        top_mentioned: raw?.social?.top_mentioned || []
      },
      search: {
        total_searches: raw?.search?.total_searches || 0,
        avg_results_per_search: raw?.search?.avg_results_per_search || 0,
        most_searched_terms: raw?.search?.most_searched_terms || [],
        search_success_rate: raw?.search?.search_success_rate || 0
      }
    }
  }

  private formatRoomAnalytics(raw: any): RoomAnalytics {
    return {
      room_id: raw?.room_id || '',
      room_name: raw?.room_name || '',
      overview: {
        total_messages: raw?.overview?.total_messages || 0,
        total_participants: raw?.overview?.total_participants || 0,
        messages_today: raw?.overview?.messages_today || 0,
        avg_messages_per_day: raw?.overview?.avg_messages_per_day || 0,
        room_age_days: raw?.overview?.room_age_days || 0
      },
      activity: {
        messages_by_day: raw?.activity?.messages_by_day || [],
        messages_by_hour: raw?.activity?.messages_by_hour || [],
        most_active_participants: raw?.activity?.most_active_participants || [],
        peak_activity_hour: raw?.activity?.peak_activity_hour || 0
      },
      engagement: {
        avg_response_time_minutes: raw?.engagement?.avg_response_time_minutes || 0,
        file_attachments_count: raw?.engagement?.file_attachments_count || 0,
        mentions_count: raw?.engagement?.mentions_count || 0,
        active_participants_30d: raw?.engagement?.active_participants_30d || 0
      }
    }
  }

  private formatUserAnalytics(raw: any): UserAnalytics {
    return {
      user_id: raw?.user_id || '',
      user_name: raw?.user_name || '',
      overview: {
        total_messages_sent: raw?.overview?.total_messages_sent || 0,
        total_rooms_joined: raw?.overview?.total_rooms_joined || 0,
        messages_today: raw?.overview?.messages_today || 0,
        avg_messages_per_day: raw?.overview?.avg_messages_per_day || 0,
        account_age_days: raw?.overview?.account_age_days || 0
      },
      activity: {
        messages_by_day: raw?.activity?.messages_by_day || [],
        messages_by_hour: raw?.activity?.messages_by_hour || [],
        favorite_rooms: raw?.activity?.favorite_rooms || [],
        most_active_day: raw?.activity?.most_active_day || '',
        most_active_hour: raw?.activity?.most_active_hour || 0
      },
      social: {
        mentions_given: raw?.social?.mentions_given || 0,
        mentions_received: raw?.social?.mentions_received || 0,
        files_shared: raw?.social?.files_shared || 0,
        responses_received: raw?.social?.responses_received || 0,
        avg_response_time_minutes: raw?.social?.avg_response_time_minutes || 0
      }
    }
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion for analytics data
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Messages', data.overview.total_messages],
      ['Total Rooms', data.overview.total_rooms],
      ['Active Participants', data.overview.active_participants],
      ['Messages Today', data.overview.messages_today],
      ['Growth Rate', `${data.overview.growth_rate}%`],
      ['Avg Messages Per User', data.engagement.avg_messages_per_user],
      ['Avg Response Time (min)', data.engagement.avg_response_time_minutes],
      ['Total Files Shared', data.engagement.file_sharing_stats.total_files],
      ['Mentions Given', data.social.mentions_given],
      ['Mentions Received', data.social.mentions_received],
      ['Total Searches', data.search.total_searches]
    ]

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    return csvContent
  }
}

// Export singleton instance
export const chatAnalyticsService = ChatAnalyticsService.getInstance()
