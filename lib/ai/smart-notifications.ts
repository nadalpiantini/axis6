import { addMinutes, format, parseISO, isSameDay, isAfter } from 'date-fns'

import { createClient } from '@/lib/supabase/client'

import { behavioralAnalyzer, UserBehaviorProfile } from './behavioral-analyzer'
import { deepseekClient } from './deepseek'


export interface SmartNotification {
  id: string
  user_id: string
  type: 'reminder' | 'encouragement' | 'milestone' | 'tip' | 'challenge'
  title: string
  message: string
  scheduled_for: string // ISO datetime
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category_focus?: number[] // Specific categories to highlight
  personalization_score: number
  triggers: {
    time_based?: boolean
    behavior_based?: boolean
    milestone_based?: boolean
    contextual?: boolean
  }
  delivery_channels: ('push' | 'email' | 'in_app')[]
  delivered?: boolean
  read?: boolean
  metadata?: {
    streak_day?: number
    completion_rate?: number
    mood_context?: number
    weather_context?: string
    optimal_time?: boolean
  }
}

export interface NotificationRule {
  rule_id: string
  rule_type: 'daily_reminder' | 'streak_maintenance' | 'comeback_encouragement' | 'milestone_celebration' | 'habit_reinforcement'
  conditions: {
    time_window?: { start: number; end: number } // Hours (0-23)
    days_of_week?: number[] // 0-6
    streak_range?: { min: number; max?: number }
    completion_threshold?: number // 0-1
    inactivity_days?: number
    mood_range?: { min: number; max: number }
  }
  message_templates: {
    temperament: string
    templates: Array<{
      title: string
      message: string
      tone: 'encouraging' | 'challenging' | 'informative' | 'celebratory'
    }>
  }[]
  enabled: boolean
  priority: 'low' | 'medium' | 'high'
}

export class SmartNotificationService {
  private supabase = createClient()
  private notificationQueue: Map<string, SmartNotification[]> = new Map()
  private defaultRules: NotificationRule[] = []

  constructor() {
    this.initializeDefaultRules()
  }

  /**
   * Generate personalized notifications for a user
   */
  async generatePersonalizedNotifications(
    userId: string,
    lookAheadHours: number = 24
  ): Promise<SmartNotification[]> {
    try {
      // Get user behavior profile
      const profile = await behavioralAnalyzer.analyzeBehavior(userId)
      
      // Get user's temperament for message personalization
      const temperament = await this.getUserTemperament(userId)
      
      // Get recent activity context
      const context = await this.getRecentActivityContext(userId)
      
      // Generate time-based notifications
      const timeBasedNotifications = await this.generateTimeBasedNotifications(
        userId, profile, temperament, lookAheadHours
      )
      
      // Generate behavior-based notifications
      const behaviorBasedNotifications = await this.generateBehaviorBasedNotifications(
        userId, profile, context, temperament
      )
      
      // Generate milestone notifications
      const milestoneNotifications = await this.generateMilestoneNotifications(
        userId, context, temperament
      )
      
      // Combine and prioritize
      const allNotifications = [
        ...timeBasedNotifications,
        ...behaviorBasedNotifications,
        ...milestoneNotifications
      ]
      
      // Apply intelligent filtering and scheduling
      const optimizedNotifications = await this.optimizeNotificationSchedule(
        allNotifications, profile
      )
      
      // Store notifications for delivery
      await this.storeNotifications(optimizedNotifications)
      
      return optimizedNotifications
    } catch (error) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Smart notification generation failed:', error);
      return this.generateFallbackNotifications(userId)
    }
  }

  /**
   * Generate AI-powered contextual notifications
   */
  async generateContextualNotifications(
    userId: string,
    context: {
      current_streak?: number
      last_activity?: string
      completion_rate_7d?: number
      mood_trend?: 'improving' | 'stable' | 'declining'
      time_of_day?: 'morning' | 'afternoon' | 'evening'
      day_of_week?: string
    }
  ): Promise<SmartNotification[]> {
    if (!deepseekClient.isAIEnabled()) {
      return this.generateBasicContextualNotifications(userId, context)
    }

    try {
      const temperament = await this.getUserTemperament(userId)
      const profile = await behavioralAnalyzer.analyzeBehavior(userId)
      
      // Build AI prompt for contextual notifications
      const prompt = this.buildContextualNotificationPrompt(context, temperament, profile)
      
      const response = await deepseekClient.generateCompletion(
        prompt,
        'You are an expert wellness coach creating personalized, contextually-aware notifications that motivate and guide users.',
        { temperature: 0.8 }
      )

      return this.parseAINotificationResponse(userId, response, context)
    } catch (error) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('AI contextual notifications failed:', error);
      return this.generateBasicContextualNotifications(userId, context)
    }
  }

  /**
   * Generate adaptive reminders based on user patterns
   */
  async generateAdaptiveReminders(userId: string): Promise<SmartNotification[]> {
    const profile = await behavioralAnalyzer.analyzeBehavior(userId)
    const optimalTimes = await behavioralAnalyzer.predictOptimalTimes(userId)
    
    const reminders: SmartNotification[] = []

    // Generate reminders for optimal times
    for (const timeSlot of optimalTimes.best_times.slice(0, 3)) {
      const scheduledTime = new Date()
      scheduledTime.setHours(timeSlot.hour, 0, 0, 0)
      
      // If time has passed today, schedule for tomorrow
      if (scheduledTime <= new Date()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }

      const reminder = await this.createAdaptiveReminder(
        userId, profile, timeSlot, scheduledTime
      )
      
      reminders.push(reminder)
    }

    return reminders
  }

  /**
   * Generate time-based notifications
   */
  private async generateTimeBasedNotifications(
    userId: string,
    profile: UserBehaviorProfile,
    temperament: any,
    lookAheadHours: number
  ): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = []
    const now = new Date()
    const lookAheadUntil = addMinutes(now, lookAheadHours * 60)

    // Generate notifications for peak activity hours
    for (const activeHour of profile.active_hours.filter(ah => ah.frequency > 0.25)) {
      const notificationTime = new Date()
      notificationTime.setHours(activeHour.hour, 0, 0, 0)
      
      // Schedule for next occurrence
      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1)
      }
      
      if (notificationTime <= lookAheadUntil) {
        const notification = await this.createTimeBasedNotification(
          userId, activeHour, notificationTime, temperament, profile
        )
        notifications.push(notification)
      }
    }

    return notifications
  }

  /**
   * Generate behavior-based notifications
   */
  private async generateBehaviorBasedNotifications(
    userId: string,
    profile: UserBehaviorProfile,
    context: any,
    temperament: any
  ): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = []

    // Streak maintenance notifications
    if (context.activeStreaks?.length > 0) {
      const streakNotification = await this.createStreakMaintenanceNotification(
        userId, context.activeStreaks, temperament, profile
      )
      notifications.push(streakNotification)
    }

    // Low activity recovery notifications
    if (context.daysSinceLastActivity > 1) {
      const recoveryNotification = await this.createRecoveryNotification(
        userId, context.daysSinceLastActivity, temperament, profile
      )
      notifications.push(recoveryNotification)
    }

    // Category balance notifications
    const imbalancedCategories = this.detectCategoryImbalance(profile, context)
    if (imbalancedCategories.length > 0) {
      const balanceNotification = await this.createBalanceNotification(
        userId, imbalancedCategories, temperament, profile
      )
      notifications.push(balanceNotification)
    }

    return notifications
  }

  /**
   * Generate milestone notifications
   */
  private async generateMilestoneNotifications(
    userId: string,
    context: any,
    temperament: any
  ): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = []

    // Streak milestones (every 7 days)
    if (context.longestStreak && context.longestStreak % 7 === 0 && context.longestStreak > 0) {
      notifications.push(await this.createMilestoneNotification(
        userId, 'streak', context.longestStreak, temperament
      ))
    }

    // Completion rate milestones
    if (context.weeklyCompletionRate && context.weeklyCompletionRate >= 0.8) {
      notifications.push(await this.createMilestoneNotification(
        userId, 'completion', Math.round(context.weeklyCompletionRate * 100), temperament
      ))
    }

    return notifications
  }

  /**
   * Create adaptive reminder based on user patterns
   */
  private async createAdaptiveReminder(
    userId: string,
    profile: UserBehaviorProfile,
    timeSlot: any,
    scheduledTime: Date
  ): Promise<SmartNotification> {
    const message = this.generateAdaptiveMessage(profile, timeSlot)
    const topCategories = profile.preferred_categories.slice(0, 2).map(cat => cat.category_id)

    return {
      id: `adaptive-${Date.now()}-${Math.random()}`,
      user_id: userId,
      type: 'reminder',
      title: '🎯 Your Optimal Time',
      message,
      scheduled_for: scheduledTime.toISOString(),
      priority: timeSlot.probability > 0.7 ? 'high' : 'medium',
      category_focus: topCategories,
      personalization_score: Math.min(0.95, timeSlot.probability + 0.2),
      triggers: {
        time_based: true,
        behavior_based: true
      },
      delivery_channels: ['push', 'in_app'],
      metadata: {
        optimal_time: true,
        completion_rate: profile.completion_patterns.consistency_score
      }
    }
  }

  /**
   * Create time-based notification
   */
  private async createTimeBasedNotification(
    userId: string,
    activeHour: any,
    scheduledTime: Date,
    temperament: any,
    profile: UserBehaviorProfile
  ): Promise<SmartNotification> {
    const message = this.generatePersonalizedMessage(
      'time_reminder', 
      temperament?.primary_temperament || 'balanced',
      {
        hour: activeHour.hour,
        frequency: activeHour.frequency,
        consistency: profile.completion_patterns.consistency_score
      }
    )

    return {
      id: `time-${Date.now()}-${activeHour.hour}`,
      user_id: userId,
      type: 'reminder',
      title: this.getTimeBasedTitle(activeHour.hour),
      message,
      scheduled_for: scheduledTime.toISOString(),
      priority: activeHour.frequency > 0.5 ? 'high' : 'medium',
      personalization_score: activeHour.frequency,
      triggers: { time_based: true },
      delivery_channels: ['push', 'in_app']
    }
  }

  /**
   * Create streak maintenance notification
   */
  private async createStreakMaintenanceNotification(
    userId: string,
    activeStreaks: any[],
    temperament: any,
    profile: UserBehaviorProfile
  ): Promise<SmartNotification> {
    const longestStreak = Math.max(...activeStreaks.map(s => s.current_streak))
    const message = this.generatePersonalizedMessage(
      'streak_maintenance',
      temperament?.primary_temperament || 'balanced',
      { streak: longestStreak, count: activeStreaks.length }
    )

    return {
      id: `streak-${Date.now()}`,
      user_id: userId,
      type: 'encouragement',
      title: `🔥 ${longestStreak} Day Streak!`,
      message,
      scheduled_for: addMinutes(new Date(), 15).toISOString(),
      priority: longestStreak > 7 ? 'high' : 'medium',
      personalization_score: 0.9,
      triggers: { behavior_based: true },
      delivery_channels: ['push', 'in_app'],
      metadata: { streak_day: longestStreak }
    }
  }

  /**
   * Create recovery notification for inactive users
   */
  private async createRecoveryNotification(
    userId: string,
    daysSince: number,
    temperament: any,
    profile: UserBehaviorProfile
  ): Promise<SmartNotification> {
    const message = this.generatePersonalizedMessage(
      'comeback_encouragement',
      temperament?.primary_temperament || 'balanced',
      { days: daysSince, bestTime: profile.active_hours[0]?.hour || 9 }
    )

    return {
      id: `recovery-${Date.now()}`,
      user_id: userId,
      type: 'encouragement',
      title: '🌟 We Miss You!',
      message,
      scheduled_for: addMinutes(new Date(), 30).toISOString(),
      priority: daysSince > 3 ? 'high' : 'medium',
      personalization_score: 0.8,
      triggers: { behavior_based: true },
      delivery_channels: ['push', 'in_app', 'email']
    }
  }

  /**
   * Create category balance notification
   */
  private async createBalanceNotification(
    userId: string,
    imbalancedCategories: number[],
    temperament: any,
    profile: UserBehaviorProfile
  ): Promise<SmartNotification> {
    const message = this.generatePersonalizedMessage(
      'balance_reminder',
      temperament?.primary_temperament || 'balanced',
      { categories: imbalancedCategories, strong: profile.preferred_categories[0]?.category_id }
    )

    return {
      id: `balance-${Date.now()}`,
      user_id: userId,
      type: 'tip',
      title: '⚖️ Balance Your Wellness',
      message,
      scheduled_for: addMinutes(new Date(), 60).toISOString(),
      priority: 'medium',
      category_focus: imbalancedCategories,
      personalization_score: 0.7,
      triggers: { behavior_based: true },
      delivery_channels: ['in_app']
    }
  }

  /**
   * Create milestone celebration notification
   */
  private async createMilestoneNotification(
    userId: string,
    type: 'streak' | 'completion',
    value: number,
    temperament: any
  ): Promise<SmartNotification> {
    const message = this.generatePersonalizedMessage(
      'milestone_celebration',
      temperament?.primary_temperament || 'balanced',
      { type, value }
    )

    return {
      id: `milestone-${type}-${Date.now()}`,
      user_id: userId,
      type: 'milestone',
      title: type === 'streak' ? `🏆 ${value} Day Milestone!` : `🎯 ${value}% Completion!`,
      message,
      scheduled_for: new Date().toISOString(),
      priority: 'high',
      personalization_score: 0.95,
      triggers: { milestone_based: true },
      delivery_channels: ['push', 'in_app']
    }
  }

  /**
   * Generate personalized message based on temperament and context
   */
  private generatePersonalizedMessage(
    messageType: string,
    temperament: string,
    context: any
  ): string {
    const templates = {
      time_reminder: {
        sanguine: [
          "🌟 Time to shine! Your energy is perfect for some wellness action!",
          "🎉 Your peak time is here - let's make it fun and meaningful!",
          "✨ Ready to turn your wellness into a celebration? Now's your time!"
        ],
        choleric: [
          "⚡ Your power hour is here! Time to crush those wellness goals!",
          "🎯 Peak performance time - let's make it count and win the day!",
          "🔥 Your winning window is open - seize this moment for victory!"
        ],
        melancholic: [
          "🌸 Your thoughtful moment has arrived - time for meaningful self-care.",
          "📚 Perfect time for deep, intentional wellness practices.",
          "🎭 Quality over quantity - your mindful wellness time is now."
        ],
        phlegmatic: [
          "🌿 Your peaceful moment is here - gentle progress awaits.",
          "☕ Comfort time! Let's take care of yourself at your own pace.",
          "🤗 Your steady, reliable wellness time - small steps, big results."
        ],
        balanced: [
          "🎯 Your optimal time is here - ready for some wellness magic?",
          "⭐ Perfect timing for your personal growth journey!",
          "🌱 Your wellness window is open - let's make it count!"
        ]
      },
      streak_maintenance: {
        sanguine: [
          `🔥 ${context.streak} days strong! You're absolutely crushing it - keep the party going!`,
          `🎊 Amazing ${context.streak}-day streak! Your energy is contagious - don't stop now!`
        ],
        choleric: [
          `⚡ ${context.streak} days conquered! You're dominating - push for more!`,
          `🏆 ${context.streak}-day winning streak! Victory is in your DNA - maintain dominance!`
        ],
        melancholic: [
          `🌟 ${context.streak} days of thoughtful commitment. Your dedication is inspiring.`,
          `📈 ${context.streak} days of quality progress - your consistency speaks volumes.`
        ],
        phlegmatic: [
          `🌿 ${context.streak} peaceful days of progress. Your steady approach is working beautifully.`,
          `☕ ${context.streak} days of gentle consistency - you're doing this perfectly.`
        ],
        balanced: [
          `🔥 ${context.streak} days strong! Your consistency is your superpower!`,
          `⭐ ${context.streak}-day streak - you're building something amazing!`
        ]
      },
      comeback_encouragement: {
        sanguine: [
          `🌈 Hey champion! It's been ${context.days} days - ready to bring back that amazing energy?`,
          `🎪 Missing your spark! Let's turn today into a wellness celebration!`
        ],
        choleric: [
          `⚡ Warrior, it's time! ${context.days} days is enough - let's reclaim your momentum!`,
          `🎯 Your goals are waiting! Time to show them who's boss again!`
        ],
        melancholic: [
          `🌸 Taking time to reflect is natural. When you're ready, your wellness journey awaits.`,
          `📖 Every chapter has pauses. Ready to write your next wellness story?`
        ],
        phlegmatic: [
          `🤗 No pressure, just gentle reminder - your wellness space is here when you're ready.`,
          `🌿 Small steps are still steps. Even 5 minutes can restart your journey.`
        ],
        balanced: [
          `🌟 Life happens! Ready to ease back into your wellness routine?`,
          `💪 Every comeback starts with one small step - you've got this!`
        ]
      }
    }

    const temperamentTemplates = templates[messageType as keyof typeof templates]?.[temperament as keyof typeof templates.time_reminder] || 
                                templates[messageType as keyof typeof templates]?.balanced || []
    
    const template = temperamentTemplates[Math.floor(Math.random() * temperamentTemplates.length)]
    return template || "Time for your wellness check-in! 🌟"
  }

  /**
   * Generate adaptive message for optimal timing
   */
  private generateAdaptiveMessage(profile: UserBehaviorProfile, timeSlot: any): string {
    const hour = timeSlot.hour
    const probability = timeSlot.probability
    
    let timeContext = ''
    if (hour < 10) timeContext = 'morning energy'
    else if (hour < 14) timeContext = 'midday focus'
    else if (hour < 18) timeContext = 'afternoon momentum'
    else timeContext = 'evening reflection'

    const confidence = probability > 0.8 ? 'This is your absolute peak time!' 
                     : probability > 0.6 ? 'This is one of your stronger times.'
                     : 'This time works well for you.'

    return `Your ${timeContext} is perfect for wellness! ${confidence} Based on your patterns, you're ${Math.round(probability * 100)}% more likely to follow through now. 🎯`
  }

  /**
   * Detect category imbalance
   */
  private detectCategoryImbalance(profile: UserBehaviorProfile, context: any): number[] {
    const threshold = 0.15 // Less than 15% attention is considered imbalanced
    return profile.preferred_categories
      .filter(cat => cat.preference_score < threshold)
      .map(cat => cat.category_id)
  }

  /**
   * Get time-based title for notifications
   */
  private getTimeBasedTitle(hour: number): string {
    if (hour < 10) return '🌅 Morning Wellness'
    if (hour < 14) return '☀️ Midday Check-in'
    if (hour < 18) return '🌤️ Afternoon Boost'
    return '🌙 Evening Reflection'
  }

  /**
   * Build contextual notification prompt for AI
   */
  private buildContextualNotificationPrompt(context: any, temperament: any, profile: UserBehaviorProfile): string {
    return `
    Create 2-3 personalized wellness notifications based on this user context:

    **User Context:**
    - Current streak: ${context.current_streak || 0} days
    - Last activity: ${context.last_activity || 'unknown'}
    - 7-day completion rate: ${Math.round((context.completion_rate_7d || 0.5) * 100)}%
    - Mood trend: ${context.mood_trend || 'stable'}
    - Time: ${context.time_of_day || 'day'} on ${context.day_of_week || 'weekday'}

    **Personality:**
    - Primary temperament: ${temperament?.primary_temperament || 'balanced'}
    - Motivation style: ${profile.behavioral_traits.motivation_type}
    - Goal orientation: ${profile.behavioral_traits.goal_orientation}

    **Behavioral Patterns:**
    - Most active hours: ${profile.active_hours.slice(0, 3).map(ah => ah.hour).join(', ')}
    - Consistency score: ${Math.round(profile.completion_patterns.consistency_score * 100)}%

    Generate notifications in this format:
    
    **Notification 1:**
    Type: [reminder/encouragement/tip/challenge]
    Title: [Engaging title with emoji]
    Message: [Personalized message 1-2 sentences]
    Priority: [low/medium/high]
    
    **Notification 2:**
    [Same format]

    Guidelines:
    - Match the temperament's communication style
    - Reference specific context elements
    - Be encouraging but not overwhelming
    - Include actionable suggestions
    - Use appropriate emojis
    `
  }

  /**
   * Parse AI response into notifications
   */
  private parseAINotificationResponse(
    userId: string,
    response: string,
    context: any
  ): SmartNotification[] {
    const notifications: SmartNotification[] = []
    const sections = response.split(/\*\*Notification \d+:\*\*/)
    
    sections.slice(1).forEach((section, index) => {
      const lines = section.split('\n').filter(line => line.trim())
      
      let type: any = 'reminder'
      let title = `Wellness Reminder ${index + 1}`
      let message = 'Time for your wellness check-in!'
      let priority: any = 'medium'

      lines.forEach(line => {
        const trimmedLine = line.trim()
        if (trimmedLine.startsWith('Type:')) {
          type = trimmedLine.replace('Type:', '').trim().toLowerCase()
        } else if (trimmedLine.startsWith('Title:')) {
          title = trimmedLine.replace('Title:', '').trim()
        } else if (trimmedLine.startsWith('Message:')) {
          message = trimmedLine.replace('Message:', '').trim()
        } else if (trimmedLine.startsWith('Priority:')) {
          priority = trimmedLine.replace('Priority:', '').trim().toLowerCase()
        }
      })

      notifications.push({
        id: `ai-${Date.now()}-${index}`,
        user_id: userId,
        type: ['reminder', 'encouragement', 'tip', 'challenge', 'milestone'].includes(type) ? type : 'reminder',
        title,
        message,
        scheduled_for: addMinutes(new Date(), (index + 1) * 30).toISOString(),
        priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
        personalization_score: 0.85 + (Math.random() * 0.15),
        triggers: { contextual: true },
        delivery_channels: ['push', 'in_app']
      })
    })

    return notifications
  }

  /**
   * Generate basic contextual notifications when AI is unavailable
   */
  private generateBasicContextualNotifications(
    userId: string,
    context: any
  ): SmartNotification[] {
    const notifications: SmartNotification[] = []
    const now = new Date()

    // Streak-based notification
    if (context.current_streak && context.current_streak > 0) {
      notifications.push({
        id: `basic-streak-${Date.now()}`,
        user_id: userId,
        type: 'encouragement',
        title: `🔥 ${context.current_streak} Day Streak!`,
        message: `You're on fire! Don't break your ${context.current_streak}-day streak - keep the momentum going!`,
        scheduled_for: addMinutes(now, 15).toISOString(),
        priority: 'high',
        personalization_score: 0.7,
        triggers: { behavior_based: true },
        delivery_channels: ['push', 'in_app']
      })
    }

    // Low completion rate encouragement
    if (context.completion_rate_7d && context.completion_rate_7d < 0.5) {
      notifications.push({
        id: `basic-encouragement-${Date.now()}`,
        user_id: userId,
        type: 'encouragement',
        title: '🌱 Small Steps, Big Growth',
        message: 'Every wellness journey has ups and downs. Ready to take one small step forward today?',
        scheduled_for: addMinutes(now, 30).toISOString(),
        priority: 'medium',
        personalization_score: 0.6,
        triggers: { behavior_based: true },
        delivery_channels: ['in_app']
      })
    }

    return notifications
  }

  /**
   * Optimize notification schedule to avoid notification fatigue
   */
  private async optimizeNotificationSchedule(
    notifications: SmartNotification[],
    profile: UserBehaviorProfile
  ): Promise<SmartNotification[]> {
    // Sort by priority and personalization score
    const sorted = notifications.sort((a, b) => {
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 }
      const scoreA = priorityWeight[a.priority] * 0.3 + a.personalization_score * 0.7
      const scoreB = priorityWeight[b.priority] * 0.3 + b.personalization_score * 0.7
      return scoreB - scoreA
    })

    // Limit notifications per day based on user behavior
    const maxDaily = profile.completion_patterns.consistency_score > 0.8 ? 4 : 2
    const optimized = sorted.slice(0, maxDaily)

    // Spread notifications throughout optimal hours
    const optimalHours = profile.active_hours
      .filter(ah => ah.frequency > 0.2)
      .map(ah => ah.hour)
      .slice(0, optimized.length)

    optimized.forEach((notification, index) => {
      if (optimalHours[index] !== undefined) {
        const scheduledTime = parseISO(notification.scheduled_for)
        scheduledTime.setHours(optimalHours[index], 0, 0, 0)
        
        // Ensure future time
        if (scheduledTime <= new Date()) {
          scheduledTime.setDate(scheduledTime.getDate() + 1)
        }
        
        notification.scheduled_for = scheduledTime.toISOString()
        notification.metadata = {
          ...notification.metadata,
          optimal_time: true
        }
      }
    })

    return optimized
  }

  /**
   * Generate fallback notifications when main system fails
   */
  private generateFallbackNotifications(userId: string): SmartNotification[] {
    const now = new Date()
    
    return [{
      id: `fallback-${Date.now()}`,
      user_id: userId,
      type: 'reminder',
      title: '🌟 Wellness Check-in',
      message: 'Time for your daily wellness check-in. Every small step counts!',
      scheduled_for: addMinutes(now, 60).toISOString(),
      priority: 'medium',
      personalization_score: 0.5,
      triggers: { time_based: true },
      delivery_channels: ['in_app']
    }]
  }

  /**
   * Store notifications in database for delivery
   */
  private async storeNotifications(notifications: SmartNotification[]): Promise<void> {
    try {
      const notificationRows = notifications.map(notification => ({
        id: notification.id,
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        scheduled_for: notification.scheduled_for,
        priority: notification.priority,
        category_focus: notification.category_focus,
        personalization_score: notification.personalization_score,
        triggers: notification.triggers,
        delivery_channels: notification.delivery_channels,
        metadata: notification.metadata,
        created_at: new Date().toISOString(),
        delivered: false
      }))

      await this.supabase
        .from('axis6_smart_notifications')
        .insert(notificationRows)
    } catch (error) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Failed to store notifications:', error);
    }
  }

  /**
   * Get user's temperament profile
   */
  private async getUserTemperament(userId: string) {
    try {
      const { data } = await this.supabase
        .from('axis6_temperament_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      return data
    } catch (error) {
      return null
    }
  }

  /**
   * Get recent activity context for notifications
   */
  private async getRecentActivityContext(userId: string) {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [checkins, streaks, dailyStats] = await Promise.all([
      this.supabase
        .from('axis6_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', format(sevenDaysAgo, 'yyyy-MM-dd')),
      
      this.supabase
        .from('axis6_streaks')
        .select('*')
        .eq('user_id', userId),
      
      this.supabase
        .from('axis6_daily_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('date', format(sevenDaysAgo, 'yyyy-MM-dd'))
    ])

    const recentCheckins = checkins.data || []
    const allStreaks = streaks.data || []
    const recentStats = dailyStats.data || []

    // Calculate context metrics
    const activeStreaks = allStreaks.filter(s => s.current_streak > 0)
    const longestStreak = Math.max(...allStreaks.map(s => s.longest_streak), 0)
    const daysSinceLastActivity = recentCheckins.length > 0 ? 0 : this.calculateDaysSinceLastActivity(userId)
    const weeklyCompletionRate = recentStats.length > 0 
      ? recentStats.reduce((sum, stat) => sum + (stat.completion_rate || 0), 0) / recentStats.length
      : 0

    return {
      recentCheckins,
      activeStreaks,
      longestStreak,
      daysSinceLastActivity,
      weeklyCompletionRate
    }
  }

  /**
   * Calculate days since last activity
   */
  private async calculateDaysSinceLastActivity(userId: string): Promise<number> {
    try {
      const { data } = await this.supabase
        .from('axis6_checkins')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1)
      
      if (!data || data.length === 0) return 30 // Default for new users
      
      const lastActivity = parseISO(data[0].completed_at)
      const daysDiff = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      
      return daysDiff
    } catch (error) {
      return 30
    }
  }

  /**
   * Initialize default notification rules
   */
  private initializeDefaultRules(): void {
    this.defaultRules = [
      {
        rule_id: 'daily_reminder',
        rule_type: 'daily_reminder',
        conditions: {
          time_window: { start: 8, end: 20 },
          days_of_week: [1, 2, 3, 4, 5] // Weekdays
        },
        message_templates: [
          {
            temperament: 'sanguine',
            templates: [{
              title: '🌟 Time to Shine!',
              message: 'Your wellness journey awaits - let\'s make it fun!',
              tone: 'encouraging'
            }]
          },
          {
            temperament: 'choleric',
            templates: [{
              title: '⚡ Crush Your Goals!',
              message: 'Time to dominate your wellness objectives!',
              tone: 'challenging'
            }]
          }
        ],
        enabled: true,
        priority: 'medium'
      }
    ]
  }
}

// Export singleton instance
export const smartNotificationService = new SmartNotificationService()