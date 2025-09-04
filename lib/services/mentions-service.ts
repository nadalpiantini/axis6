/**
 * User Mentions Service
 * Handles @username functionality in chat messages
 */
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'
export interface MentionUser {
  id: string
  name: string
  email?: string
  avatar_url?: string
}
export interface MentionMatch {
  start: number
  end: number
  username: string
  user?: MentionUser
}
export class MentionsService {
  private supabase = createClient()
  private mentionCache = new Map<string, MentionUser[]>()
  private cacheExpiry = 5 * 60 * 1000 // 5 minutes
  /**
   * Search for users by username/name for mentions
   */
  async searchUsers(query: string, roomId: string): Promise<MentionUser[]> {
    try {
      if (query.length < 2) return []
      const cacheKey = `${roomId}-${query.toLowerCase()}`
      const cached = this.mentionCache.get(cacheKey)
      // Return cached results if still valid
      if (cached) {
        return cached
      }
      // Search for users in the room
      const { data: participants, error } = await this.supabase
        .from('axis6_chat_participants')
        .select(`
          user_id,
          axis6_profiles!inner(
            id,
            name
          )
        `)
        .eq('room_id', roomId)
        .is('left_at', null)
        .ilike('axis6_profiles.name', `%${query}%`)
        .limit(10)
      if (error) {
        logger.error('Failed to search users for mentions:', error)
        return []
      }
      const users: MentionUser[] = participants
        ?.map(p => ({
          id: p.user_id,
          name: p.axis6_profiles.name,
        }))
        .filter(Boolean) || []
      // Cache results
      this.mentionCache.set(cacheKey, users)
      setTimeout(() => {
        this.mentionCache.delete(cacheKey)
      }, this.cacheExpiry)
      return users
    } catch (error) {
      logger.error('User search error:', error)
      return []
    }
  }
  /**
   * Parse message text to find @mentions
   */
  parseMentions(text: string): MentionMatch[] {
    const mentionRegex = /@(\w+)/g
    const mentions: MentionMatch[] = []
    let match
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({
        start: match.index,
        end: match.index + match[0].length,
        username: match[1]
      })
    }
    return mentions
  }
  /**
   * Replace @mentions in text with user data
   */
  async resolveMentions(text: string, roomId: string): Promise<{
    text: string
    mentions: MentionMatch[]
  }> {
    try {
      const mentionMatches = this.parseMentions(text)
      if (mentionMatches.length === 0) {
        return { text, mentions: [] }
      }
      // Get unique usernames
      const usernames = [...new Set(mentionMatches.map(m => m.username))]
      // Search for users
      const userPromises = usernames.map(username =>
        this.searchUsers(username, roomId)
      )
      const userResults = await Promise.all(userPromises)
      const userMap = new Map<string, MentionUser>()
      // Build user lookup map
      userResults.forEach((users, index) => {
        const username = usernames[index]
        const bestMatch = users.find(user =>
          user.name.toLowerCase() === username.toLowerCase()
        ) || users[0]
        if (bestMatch) {
          userMap.set(username.toLowerCase(), bestMatch)
        }
      })
      // Resolve mentions with user data
      const resolvedMentions = mentionMatches.map(mention => ({
        ...mention,
        user: userMap.get(mention.username.toLowerCase())
      }))
      return {
        text,
        mentions: resolvedMentions
      }
    } catch (error) {
      logger.error('Failed to resolve mentions:', error)
      return { text, mentions: [] }
    }
  }
  /**
   * Format message text with HTML mentions
   */
  formatMentionsHTML(text: string, mentions: MentionMatch[]): string {
    if (mentions.length === 0) return text
    let formattedText = text
    let offset = 0
    mentions.forEach(mention => {
      if (mention.user) {
        const mentionText = `@${mention.username}`
        const mentionHTML = `<span class="mention" data-user-id="${mention.user.id}" data-username="${mention.user.name}">@${mention.user.name}</span>`
        const start = mention.start + offset
        const end = mention.end + offset
        formattedText = formattedText.slice(0, start) +
                       mentionHTML +
                       formattedText.slice(end)
        offset += mentionHTML.length - mentionText.length
      }
    })
    return formattedText
  }
  /**
   * Extract mentioned user IDs from a message
   */
  extractMentionedUserIds(mentions: MentionMatch[]): string[] {
    return mentions
      .filter(mention => mention.user)
      .map(mention => mention.user!.id)
  }
  /**
   * Create notification for mentioned users
   */
  async notifyMentionedUsers(
    messageId: string,
    roomId: string,
    senderId: string,
    mentionedUserIds: string[]
  ): Promise<void> {
    try {
      if (mentionedUserIds.length === 0) return
      // Remove sender from notifications (don't notify self)
      const recipients = mentionedUserIds.filter(id => id !== senderId)
      if (recipients.length === 0) return
      // Create mention notifications
      const notifications = recipients.map(userId => ({
        user_id: userId,
        type: 'mention' as const,
        title: 'You were mentioned',
        message: 'Someone mentioned you in a chat message',
        data: {
          message_id: messageId,
          room_id: roomId,
          sender_id: senderId
        },
        created_at: new Date().toISOString()
      }))
      const { error } = await this.supabase
        .from('axis6_notifications')
        .insert(notifications)
      if (error) {
        logger.error('Failed to create mention notifications:', error)
      }
    } catch (error) {
      logger.error('Failed to notify mentioned users:', error)
    }
  }
  /**
   * Get user suggestions for autocomplete
   */
  async getUserSuggestions(roomId: string, query = ''): Promise<MentionUser[]> {
    try {
      const { data: participants, error } = await this.supabase
        .from('axis6_chat_participants')
        .select(`
          user_id,
          axis6_profiles!inner(
            id,
            name
          )
        `)
        .eq('room_id', roomId)
        .is('left_at', null)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) {
        logger.error('Failed to get user suggestions:', error)
        return []
      }
      let users = participants?.map(p => ({
        id: p.user_id,
        name: p.axis6_profiles.name,
      })).filter(Boolean) || []
      // Filter by query if provided
      if (query) {
        users = users.filter(user =>
          user.name.toLowerCase().includes(query.toLowerCase())
        )
      }
      return users.slice(0, 10)
    } catch (error) {
      logger.error('Failed to get user suggestions:', error)
      return []
    }
  }
  /**
   * Validate mention permissions
   */
  async canMentionUser(mentionerId: string, mentionedUserId: string, roomId: string): Promise<boolean> {
    try {
      // Check if both users are participants in the room
      const { data: participants, error } = await this.supabase
        .from('axis6_chat_participants')
        .select('user_id')
        .eq('room_id', roomId)
        .in('user_id', [mentionerId, mentionedUserId])
        .is('left_at', null)
      if (error || !participants || participants.length !== 2) {
        return false
      }
      return true
    } catch (error) {
      logger.error('Failed to validate mention permissions:', error)
      return false
    }
  }
}
// Singleton instance
export const mentionsService = new MentionsService()
