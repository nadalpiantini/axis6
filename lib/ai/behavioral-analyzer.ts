import { addDays, subDays, format, parseISO } from 'date-fns'

import { createClient } from '@/lib/supabase/client'

import { deepseekClient } from './deepseek'

import { handleError } from '@/lib/error/standardErrorHandler'
export interface BehaviorPattern {
  pattern_type: 'checkin_timing' | 'completion_rate' | 'category_preference' | 'streak_behavior' | 'mood_correlation'
  confidence_score: number
  description: string
  insights: string[]
  recommendations: string[]
  triggers: string[]
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional'
}

export interface UserBehaviorProfile {
  user_id: string
  active_hours: Array<{ hour: number; frequency: number }>
  preferred_categories: Array<{ category_id: number; preference_score: number }>
  completion_patterns: {
    best_days: string[] // ['monday', 'tuesday']
    peak_hours: number[] // [8, 9, 18, 19]
    streak_potential: number // 0-1
    consistency_score: number // 0-1
  }
  behavioral_traits: {
    motivation_type: 'intrinsic' | 'extrinsic' | 'mixed'
    goal_orientation: 'process' | 'outcome' | 'balanced'
    social_tendency: 'independent' | 'collaborative' | 'competitive'
    stress_response: 'avoidant' | 'confrontational' | 'adaptive'
  }
  patterns: BehaviorPattern[]
  last_analyzed: string
  analysis_version: string
}

export interface PersonalizedInsight {
  id: string
  type: 'daily' | 'weekly' | 'milestone' | 'recommendation' | 'coaching'
  title: string
  content: string
  action_items: string[]
  priority: 'low' | 'medium' | 'high'
  category_focus?: number[]
  expires_at?: string
  personalization_score: number
}

export class BehavioralAnalyzer {
  private supabase = createClient()
  private analysisCache: Map<string, UserBehaviorProfile> = new Map()

  /**
   * Perform comprehensive behavioral analysis for a user
   */
  async analyzeBehavior(userId: string): Promise<UserBehaviorProfile> {
    try {
      // Check cache first
      const cached = this.analysisCache.get(userId)
      if (cached && this.isCacheValid(cached.last_analyzed)) {
        return cached
      }

      // Gather user data for analysis
      const userData = await this.gatherUserData(userId)

      // Perform pattern analysis
      const patterns = await this.identifyPatterns(userData)

      // Generate behavioral profile
      const profile = await this.generateBehaviorProfile(userId, userData, patterns)

      // Cache the results
      this.analysisCache.set(userId, profile)

      // Store in database
      await this.storeBehaviorProfile(profile)

      return profile
    } catch (error) {
            handleError(error, {

              operation: 'ai_operation',

              component: 'behavioral-analyzer',

              userMessage: 'AI operation failed. Please try again.'

            })
            // TODO: Replace with proper error handling
    // console.error('AI behavioral analyzer operation failed:', error);
    // // TODO: Replace with proper error handling
    // console.error('AI behavioral analyzer operation failed:', error);
      return this.getDefaultProfile(userId)
    }
  }

  /**
   * Generate personalized insights based on behavior analysis
   */
  async generatePersonalizedInsights(
    userId: string,
    profile?: UserBehaviorProfile
  ): Promise<PersonalizedInsight[]> {
    try {
      const behaviorProfile = profile || await this.analyzeBehavior(userId)

      // Get recent activity data
      const recentData = await this.getRecentActivityData(userId)

      // Check if AI features are enabled
      if (!deepseekClient.isAIEnabled()) {
        return this.generateBasicInsights(behaviorProfile, recentData)
      }

      // Generate AI-powered insights
      const aiInsights = await this.generateAIInsights(behaviorProfile, recentData)

      // Store insights in database
      await this.storeInsights(userId, aiInsights)

      return aiInsights
    } catch (error) {
            handleError(error, {

              operation: 'ai_operation',

              component: 'behavioral-analyzer',

              userMessage: 'AI operation failed. Please try again.'

            })
            // TODO: Replace with proper error handling
    // console.error('AI behavioral analyzer operation failed:', error);
    // // TODO: Replace with proper error handling
    // console.error('AI behavioral analyzer operation failed:', error);
      return this.generateBasicInsights(profile || await this.getDefaultProfile(userId))
    }
  }

  /**
   * Predict optimal check-in times based on behavior patterns
   */
  async predictOptimalTimes(userId: string): Promise<{
    best_times: Array<{ hour: number; day_of_week: number; probability: number }>
    personalized_reminders: Array<{
      time: string
      message: string
      category_focus?: number[]
    }>
  }> {
    const profile = await this.analyzeBehavior(userId)

    const bestTimes = profile.active_hours
      .filter(ah => ah.frequency > 0.3)
      .map(ah => ({
        hour: ah.hour,
        day_of_week: -1, // All days
        probability: ah.frequency
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5)

    // Generate personalized reminder messages
    const reminders = await this.generatePersonalizedReminders(profile, bestTimes)

    return { best_times: bestTimes, personalized_reminders: reminders }
  }

  /**
   * Analyze goal-setting patterns and suggest optimal goals
   */
  async suggestPersonalizedGoals(
    userId: string,
    timeframe: 'weekly' | 'monthly' = 'weekly'
  ): Promise<Array<{
    category_id: number
    goal_type: 'streak' | 'frequency' | 'completion'
    target_value: number
    difficulty: 'easy' | 'medium' | 'challenging'
    reasoning: string
    success_probability: number
  }>> {
    const profile = await this.analyzeBehavior(userId)
    const historicalData = await this.getHistoricalPerformance(userId, timeframe)

    // Analyze performance patterns
    const goals = profile.preferred_categories.map(cat => {
      const historical = historicalData.find(h => h.category_id === cat.category_id)
      const avgCompletion = historical?.completion_rate || 0.3

      // Calculate suggested target based on historical performance and personality
      let target = Math.round(avgCompletion * (timeframe === 'weekly' ? 7 : 30))
      let difficulty: 'easy' | 'medium' | 'challenging' = 'medium'

      // Adjust based on behavioral traits
      if (profile.behavioral_traits.goal_orientation === 'process') {
        target = Math.max(1, Math.round(target * 0.8)) // Lower but consistent
        difficulty = 'easy'
      } else if (profile.behavioral_traits.goal_orientation === 'outcome') {
        target = Math.round(target * 1.3) // Higher challenge
        difficulty = 'challenging'
      }

      return {
        category_id: cat.category_id,
        goal_type: 'frequency' as const,
        target_value: target,
        difficulty,
        reasoning: this.generateGoalReasoning(profile, cat, historical),
        success_probability: this.calculateSuccessProbability(profile, target, historical)
      }
    })

    return goals.sort((a, b) => b.success_probability - a.success_probability)
  }

  /**
   * Gather comprehensive user data for analysis
   */
  private async gatherUserData(userId: string) {
    const thirtyDaysAgo = subDays(new Date(), 30)

    const [checkins, streaks, temperament, dailyStats] = await Promise.all([
      // Recent check-ins with timestamps
      this.supabase
        .from('axis6_checkins')
        .select('*, created_at, category_id, completed_at, mood')
        .eq('user_id', userId)
        .gte('completed_at', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .order('completed_at', { ascending: false }),

      // Current streaks
      this.supabase
        .from('axis6_streaks')
        .select('*')
        .eq('user_id', userId),

      // Temperament profile
      this.supabase
        .from('axis6_temperament_profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),

      // Daily statistics
      this.supabase
        .from('axis6_daily_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .order('date', { ascending: false })
    ])

    return {
      checkins: checkins.data || [],
      streaks: streaks.data || [],
      temperament: temperament.data,
      dailyStats: dailyStats.data || []
    }
  }

  /**
   * Identify behavioral patterns using ML-style analysis
   */
  private async identifyPatterns(userData: any): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = []
    const { checkins, streaks, dailyStats } = userData

    // 1. Check-in timing patterns
    if (checkins.length > 10) {
      const timingPattern = this.analyzeTimingPatterns(checkins)
      patterns.push(timingPattern)
    }

    // 2. Completion rate patterns
    if (dailyStats.length > 7) {
      const completionPattern = this.analyzeCompletionPatterns(dailyStats)
      patterns.push(completionPattern)
    }

    // 3. Category preference patterns
    if (checkins.length > 15) {
      const preferencePattern = this.analyzeCategoryPreferences(checkins)
      patterns.push(preferencePattern)
    }

    // 4. Streak behavior patterns
    if (streaks.length > 0) {
      const streakPattern = this.analyzeStreakBehavior(streaks, checkins)
      patterns.push(streakPattern)
    }

    // 5. Mood correlation patterns (if mood data exists)
    const moodCheckins = checkins.filter((c: any) => c.mood !== null)
    if (moodCheckins.length > 10) {
      const moodPattern = this.analyzeMoodCorrelations(moodCheckins)
      patterns.push(moodPattern)
    }

    return patterns.filter(p => p.confidence_score > 0.6)
  }

  /**
   * Analyze timing patterns for check-ins
   */
  private analyzeTimingPatterns(checkins: any[]): BehaviorPattern {
    const hourCounts: Record<number, number> = {}
    const dayOfWeekCounts: Record<number, number> = {}

    checkins.forEach(checkin => {
      const date = parseISO(checkin.created_at || checkin.completed_at)
      const hour = date.getHours()
      const dayOfWeek = date.getDay()

      hourCounts[hour] = (hourCounts[hour] || 0) + 1
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1
    })

    // Find peak hours
    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))

    // Find best days
    const bestDays = Object.entries(dayOfWeekCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)])

    const confidence = Math.min(0.95, checkins.length / 30) // Higher confidence with more data

    return {
      pattern_type: 'checkin_timing',
      confidence_score: confidence,
      description: `You typically check in during ${this.formatHours(peakHours)} on ${bestDays.join(', ')}`,
      insights: [
        `Most active during ${this.formatHours(peakHours)}`,
        `Strongest performance on ${bestDays[0]}s`,
        `${Math.round(confidence * 100)}% consistency in timing patterns`
      ],
      recommendations: [
        `Schedule reminders for ${this.formatHours(peakHours.slice(0, 2))}`,
        `Focus on building habits during your peak times`,
        `Consider batch check-ins on ${bestDays[0]}s`
      ],
      triggers: peakHours.map(h => `${h}:00`),
      frequency: confidence > 0.8 ? 'daily' : 'weekly'
    }
  }

  /**
   * Analyze completion rate patterns
   */
  private analyzeCompletionPatterns(dailyStats: any[]): BehaviorPattern {
    const completionRates = dailyStats.map(stat => stat.completion_rate || 0)
    const avgCompletion = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
    const consistency = 1 - (Math.sqrt(completionRates.reduce((sum, rate) => sum + Math.pow(rate - avgCompletion, 2), 0) / completionRates.length) / avgCompletion)

    const trends = this.analyzeTrends(completionRates)
    const confidence = Math.min(0.95, dailyStats.length / 14)

    return {
      pattern_type: 'completion_rate',
      confidence_score: confidence,
      description: `Average completion rate of ${Math.round(avgCompletion * 100)}% with ${consistency > 0.7 ? 'high' : 'moderate'} consistency`,
      insights: [
        `Overall completion rate: ${Math.round(avgCompletion * 100)}%`,
        `Consistency score: ${Math.round(consistency * 100)}%`,
        `Trend: ${trends.direction} (${Math.abs(trends.slope) > 0.1 ? 'strong' : 'weak'})`
      ],
      recommendations: this.generateCompletionRecommendations(avgCompletion, consistency, trends),
      triggers: [],
      frequency: consistency > 0.8 ? 'daily' : 'weekly'
    }
  }

  /**
   * Analyze category preferences
   */
  private analyzeCategoryPreferences(checkins: any[]): BehaviorPattern {
    const categoryCount: Record<number, number> = {}

    checkins.forEach(checkin => {
      categoryCount[checkin.category_id] = (categoryCount[checkin.category_id] || 0) + 1
    })

    const total = checkins.length
    const preferences = Object.entries(categoryCount)
      .map(([catId, count]) => ({
        category_id: parseInt(catId),
        percentage: count / total,
        count
      }))
      .sort((a, b) => b.percentage - a.percentage)

    const topCategory = preferences[0]
    const confidence = Math.min(0.95, total / 20)

    return {
      pattern_type: 'category_preference',
      confidence_score: confidence,
      description: `Strong preference for category ${topCategory.category_id} (${Math.round(topCategory.percentage * 100)}% of check-ins)`,
      insights: [
        `Top category represents ${Math.round(topCategory.percentage * 100)}% of activity`,
        `${preferences.filter(p => p.percentage > 0.15).length} categories show regular engagement`,
        `Preference distribution: ${preferences.length > 1 ? (preferences[0].percentage > 0.4 ? 'focused' : 'balanced') : 'single-focus'}`
      ],
      recommendations: [
        preferences[0].percentage > 0.5
          ? 'Consider expanding to other life areas for better balance'
          : 'Great balance across multiple life dimensions',
        'Build on your strongest area while maintaining variety',
        'Use your preferred category as momentum for others'
      ],
      triggers: [],
      frequency: 'weekly'
    }
  }

  /**
   * Analyze streak behavior patterns
   */
  private analyzeStreakBehavior(streaks: any[], checkins: any[]): BehaviorPattern {
    const totalStreaks = streaks.reduce((sum, streak) => sum + streak.longest_streak, 0)
    const avgStreak = totalStreaks / streaks.length
    const currentStreaks = streaks.reduce((sum, streak) => sum + streak.current_streak, 0)
    const streakMaintenance = currentStreaks > 0 ? currentStreaks / totalStreaks : 0

    const confidence = Math.min(0.95, checkins.length / 25)

    return {
      pattern_type: 'streak_behavior',
      confidence_score: confidence,
      description: `Average streak of ${Math.round(avgStreak)} days with ${Math.round(streakMaintenance * 100)}% maintenance rate`,
      insights: [
        `Best historical streak: ${Math.max(...streaks.map(s => s.longest_streak))} days`,
        `Current active streaks: ${streaks.filter(s => s.current_streak > 0).length}`,
        `Streak maintenance: ${Math.round(streakMaintenance * 100)}%`
      ],
      recommendations: [
        avgStreak < 3 ? 'Focus on building daily consistency' : 'Leverage your streak-building ability',
        streakMaintenance < 0.3 ? 'Work on maintaining momentum' : 'Great at keeping streaks alive',
        'Use streak visualization for motivation'
      ],
      triggers: [],
      frequency: 'daily'
    }
  }

  /**
   * Analyze mood correlation patterns
   */
  private analyzeMoodCorrelations(moodCheckins: any[]): BehaviorPattern {
    const moodData = moodCheckins.map(c => ({
      mood: c.mood,
      hour: parseISO(c.created_at || c.completed_at).getHours(),
      category: c.category_id
    }))

    const avgMood = moodData.reduce((sum, data) => sum + data.mood, 0) / moodData.length
    const moodByHour: Record<number, number[]> = {}

    moodData.forEach(data => {
      if (!moodByHour[data.hour]) moodByHour[data.hour] = []
      moodByHour[data.hour].push(data.mood)
    })

    // Find best mood hours
    const bestHours = Object.entries(moodByHour)
      .map(([hour, moods]) => ({
        hour: parseInt(hour),
        avgMood: moods.reduce((sum, m) => sum + m, 0) / moods.length
      }))
      .filter(h => h.avgMood > avgMood)
      .sort((a, b) => b.avgMood - a.avgMood)

    const confidence = Math.min(0.95, moodCheckins.length / 15)

    return {
      pattern_type: 'mood_correlation',
      confidence_score: confidence,
      description: `Average mood of ${avgMood.toFixed(1)}/5 with peak mood during ${this.formatHours(bestHours.slice(0, 2).map(h => h.hour))}`,
      insights: [
        `Overall mood trend: ${avgMood > 3.5 ? 'positive' : avgMood > 2.5 ? 'neutral' : 'challenging'}`,
        `Best mood times: ${this.formatHours(bestHours.slice(0, 3).map(h => h.hour))}`,
        `Mood consistency: ${this.calculateMoodConsistency(moodData)}%`
      ],
      recommendations: [
        'Schedule important activities during high-mood times',
        'Use mood tracking to identify patterns',
        avgMood < 3 ? 'Consider focusing on mood-boosting activities' : 'Maintain your positive momentum'
      ],
      triggers: bestHours.slice(0, 2).map(h => `${h.hour}:00`),
      frequency: 'daily'
    }
  }

  /**
   * Generate behavioral profile from patterns and data
   */
  private async generateBehaviorProfile(
    userId: string,
    userData: any,
    patterns: BehaviorPattern[]
  ): Promise<UserBehaviorProfile> {
    const { checkins, streaks, temperament } = userData

    // Calculate active hours
    const activeHours = this.calculateActiveHours(checkins)

    // Calculate preferred categories
    const preferredCategories = this.calculatePreferredCategories(checkins)

    // Analyze completion patterns
    const completionPatterns = this.analyzeCompletionPatternDetails(userData)

    // Determine behavioral traits
    const behavioralTraits = await this.determineBehavioralTraits(patterns, temperament)

    return {
      user_id: userId,
      active_hours: activeHours,
      preferred_categories: preferredCategories,
      completion_patterns: completionPatterns,
      behavioral_traits: behavioralTraits,
      patterns,
      last_analyzed: new Date().toISOString(),
      analysis_version: '1.0-ai-enhanced'
    }
  }

  /**
   * Calculate active hours from check-in data
   */
  private calculateActiveHours(checkins: any[]): Array<{ hour: number; frequency: number }> {
    const hourCounts: Record<number, number> = {}
    const total = checkins.length

    checkins.forEach(checkin => {
      const date = parseISO(checkin.created_at || checkin.completed_at)
      const hour = date.getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      frequency: (hourCounts[hour] || 0) / total
    })).filter(ah => ah.frequency > 0)
  }

  /**
   * Calculate preferred categories from check-in data
   */
  private calculatePreferredCategories(checkins: any[]): Array<{ category_id: number; preference_score: number }> {
    const categoryCount: Record<number, number> = {}
    const total = checkins.length

    checkins.forEach(checkin => {
      categoryCount[checkin.category_id] = (categoryCount[checkin.category_id] || 0) + 1
    })

    return Object.entries(categoryCount)
      .map(([catId, count]) => ({
        category_id: parseInt(catId),
        preference_score: count / total
      }))
      .sort((a, b) => b.preference_score - a.preference_score)
  }

  /**
   * Analyze detailed completion patterns
   */
  private analyzeCompletionPatternDetails(userData: any) {
    const { checkins, dailyStats } = userData

    // Analyze by day of week
    const dayOfWeekCounts: Record<number, number> = {}
    checkins.forEach((checkin: any) => {
      const date = parseISO(checkin.created_at || checkin.completed_at)
      const dayOfWeek = date.getDay()
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1
    })

    const bestDays = Object.entries(dayOfWeekCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][parseInt(day)])

    // Calculate peak hours
    const peakHours = this.calculateActiveHours(checkins)
      .filter(ah => ah.frequency > 0.2)
      .map(ah => ah.hour)
      .slice(0, 4)

    // Calculate streak potential and consistency
    const completionRates = dailyStats.map((stat: any) => stat.completion_rate || 0)
    const avgCompletion = completionRates.reduce((sum: number, rate: number) => sum + rate, 0) / completionRates.length
    const streakPotential = avgCompletion * 0.8 + (completionRates.filter((rate: number) => rate > 0.8).length / completionRates.length) * 0.2

    return {
      best_days: bestDays,
      peak_hours: peakHours,
      streak_potential: streakPotential || 0.5,
      consistency_score: this.calculateConsistencyScore(completionRates) || 0.5
    }
  }

  /**
   * Determine behavioral traits from patterns and temperament
   */
  private async determineBehavioralTraits(patterns: BehaviorPattern[], temperament: any) {
    // Default traits based on patterns
    const traits = {
      motivation_type: 'mixed' as const,
      goal_orientation: 'balanced' as const,
      social_tendency: 'independent' as const,
      stress_response: 'adaptive' as const
    }

    // Adjust based on temperament if available
    if (temperament) {
      const primary = temperament.primary_temperament

      switch (primary) {
        case 'sanguine':
          traits.social_tendency = 'independent'
          traits.motivation_type = 'mixed'
          break
        case 'choleric':
          traits.goal_orientation = 'balanced'
          traits.motivation_type = 'mixed'
          traits.social_tendency = 'independent'
          break
        case 'melancholic':
          traits.goal_orientation = 'balanced'
          traits.stress_response = 'adaptive'
          break
        case 'phlegmatic':
          traits.social_tendency = 'independent'
          traits.stress_response = 'adaptive'
          break
      }
    }

    // Fine-tune based on behavioral patterns
    const streakPattern = patterns.find(p => p.pattern_type === 'streak_behavior')
    if (streakPattern && streakPattern.confidence_score > 0.8) {
      traits.goal_orientation = 'balanced' // Good at building habits
    }

    return traits
  }

  /**
   * Generate AI-powered personalized insights
   */
  private async generateAIInsights(
    profile: UserBehaviorProfile,
    recentData: any
  ): Promise<PersonalizedInsight[]> {
    const prompt = this.buildInsightsPrompt(profile, recentData)

    try {
      const response = await deepseekClient.generateCompletion(
        prompt,
        'You are an expert wellness coach and behavioral analyst. Generate personalized insights based on user behavior patterns.',
        { temperature: 0.7 }
      )

      return this.parseInsightsResponse(response)
    } catch (error) {
      handleError(error, {
      operation: 'ai_operation',
      component: 'behavioral-analyzer',
      userMessage: 'AI operation failed. Please try again.'
    })
    return this.generateBasicInsights(profile, recentData)
    }
  }

  /**
   * Build prompt for AI insights generation
   */
  private buildInsightsPrompt(profile: UserBehaviorProfile, recentData: any): string {
    return `
    Analyze this user's behavior profile and generate 3-5 personalized insights:

    **User Profile:**
    - Most active during: ${profile.active_hours.filter(ah => ah.frequency > 0.2).map(ah => `${ah.hour}:00`).join(', ')}
    - Preferred categories: ${profile.preferred_categories.slice(0, 3).map(cat => `Category ${cat.category_id} (${Math.round(cat.preference_score * 100)}%)`).join(', ')}
    - Completion patterns: ${JSON.stringify(profile.completion_patterns)}
    - Behavioral traits: ${JSON.stringify(profile.behavioral_traits)}

    **Recent Activity:**
    - Recent check-ins: ${recentData?.recentCheckins?.length || 0}
    - Recent completion rate: ${recentData?.recentCompletionRate || 'N/A'}
    - Current streaks: ${recentData?.activeStreaks || 0}

    **Behavioral Patterns:**
    ${profile.patterns.map(p => `- ${p.pattern_type}: ${p.description} (confidence: ${Math.round(p.confidence_score * 100)}%)`).join('\n')}

    Generate insights in this format:
    1. **Daily Insight**: [Observation about today/recent behavior]
       - Action: [Specific actionable advice]
       - Priority: [low/medium/high]

    2. **Weekly Pattern**: [Weekly trend observation]
       - Action: [Weekly strategy suggestion]
       - Priority: [low/medium/high]

    3. **Coaching Tip**: [Behavioral coaching based on personality]
       - Action: [Personalized development suggestion]
       - Priority: [low/medium/high]

    Keep insights encouraging, specific, and actionable. Focus on strengths while gently addressing improvement areas.
    `
  }

  /**
   * Parse AI response into structured insights
   */
  private parseInsightsResponse(response: string): PersonalizedInsight[] {
    const insights: PersonalizedInsight[] = []
    const sections = response.split(/\d+\.\s\*\*/)

    sections.slice(1).forEach((section, index) => {
      const lines = section.split('\n').filter(line => line.trim())
      if (lines.length < 2) return

      const titleMatch = lines[0].match(/([^*]+)/)
      const title = titleMatch ? titleMatch[1].replace(':', '').trim() : `Insight ${index + 1}`

      const content = lines[1]?.trim() || ''
      const actionLine = lines.find(line => line.includes('Action:'))
      const priorityLine = lines.find(line => line.includes('Priority:'))

      const action = actionLine ? actionLine.replace(/.*Action:\s*/, '').trim() : ''
      const priority = priorityLine ? priorityLine.replace(/.*Priority:\s*/, '').toLowerCase() as 'low' | 'medium' | 'high' : 'medium'

      insights.push({
        id: `ai-${Date.now()}-${index}`,
        type: index === 0 ? 'daily' : index === 1 ? 'weekly' : 'coaching',
        title,
        content,
        action_items: action ? [action] : [],
        priority,
        personalization_score: 0.8 + (Math.random() * 0.2) // 0.8-1.0
      })
    })

    return insights
  }

  /**
   * Generate basic insights when AI is not available
   */
  private generateBasicInsights(
    profile: UserBehaviorProfile,
    recentData?: any
  ): PersonalizedInsight[] {
    const insights: PersonalizedInsight[] = []

    // Peak time insight
    const peakHour = profile.active_hours.reduce((max, ah) =>
      ah.frequency > max.frequency ? ah : max, profile.active_hours[0]
    )

    if (peakHour) {
      insights.push({
        id: `basic-timing-${Date.now()}`,
        type: 'daily',
        title: 'Optimize Your Peak Time',
        content: `You're most active around ${peakHour.hour}:00. This is your golden hour for building habits!`,
        action_items: [`Set reminders for ${peakHour.hour}:00 to maximize your natural energy`],
        priority: 'high',
        personalization_score: 0.7
      })
    }

    // Category balance insight
    const topCategory = profile.preferred_categories[0]
    if (topCategory && topCategory.preference_score > 0.4) {
      insights.push({
        id: `basic-balance-${Date.now()}`,
        type: 'weekly',
        title: 'Expand Your Wellness Focus',
        content: `You show strong engagement in one area (${Math.round(topCategory.preference_score * 100)}% of activity). Consider exploring other dimensions for better balance.`,
        action_items: ['Try activities in your less-visited categories', 'Aim for at least 2-3 different areas per week'],
        priority: 'medium',
        personalization_score: 0.6
      })
    }

    // Consistency insight
    if (profile.completion_patterns.consistency_score < 0.6) {
      insights.push({
        id: `basic-consistency-${Date.now()}`,
        type: 'coaching',
        title: 'Build Consistency Gradually',
        content: 'Focus on small, achievable daily actions rather than big changes. Consistency beats intensity.',
        action_items: ['Start with just one daily check-in', 'Celebrate small wins', 'Use your best days as momentum'],
        priority: 'high',
        personalization_score: 0.8
      })
    }

    return insights
  }

  /**
   * Generate personalized reminder messages
   */
  private async generatePersonalizedReminders(
    profile: UserBehaviorProfile,
    bestTimes: Array<{ hour: number; day_of_week: number; probability: number }>
  ): Promise<Array<{
    time: string
    message: string
    category_focus?: number[]
  }>> {
    const messages = []
    const topCategories = profile.preferred_categories.slice(0, 3).map(cat => cat.category_id)

    for (const time of bestTimes.slice(0, 3)) {
      let message = ''

      // Personalize based on behavioral traits
      switch (profile.behavioral_traits.motivation_type) {
        case 'intrinsic':
          message = "Time to invest in yourself! Your wellness journey continues."
          break
        case 'extrinsic':
          message = "Your wellness community is counting on you! Make it happen."
          break
        default:
          message = "Perfect time for your wellness check-in! You've got this."
      }

      // Add time-specific context
      if (time.hour < 10) {
        message = `🌅 ${  message.replace("Perfect time", "Great morning")}`
      } else if (time.hour > 18) {
        message = `🌙 ${  message.replace("Perfect time", "Evening reflection time")}`
      }

      messages.push({
        time: `${time.hour.toString().padStart(2, '0')}:00`,
        message,
        category_focus: topCategories
      })
    }

    return messages
  }

  // Helper methods
  private formatHours(hours: number[]): string {
    return hours.map(h => `${h.toString().padStart(2, '0')}:00`).join(', ')
  }

  private analyzeTrends(data: number[]): { direction: 'improving' | 'declining' | 'stable'; slope: number } {
    if (data.length < 2) return { direction: 'stable', slope: 0 }

    const n = data.length
    const sumX = n * (n - 1) / 2
    const sumY = data.reduce((sum, val) => sum + val, 0)
    const sumXY = data.reduce((sum, val, i) => sum + i * val, 0)
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

    return {
      direction: slope > 0.05 ? 'improving' : slope < -0.05 ? 'declining' : 'stable',
      slope
    }
  }

  private generateCompletionRecommendations(avgCompletion: number, consistency: number, trends: any): string[] {
    const recommendations = []

    if (avgCompletion < 0.5) {
      recommendations.push('Start with 1-2 easy wins daily to build momentum')
      recommendations.push('Focus on your strongest time of day')
    } else if (avgCompletion > 0.8) {
      recommendations.push('Great consistency! Consider adding challenging goals')
      recommendations.push('Share your success strategy with the community')
    }

    if (consistency < 0.6) {
      recommendations.push('Reduce variability by creating standard routines')
      recommendations.push('Use habit stacking to link new behaviors to existing ones')
    }

    if (trends.direction === 'declining') {
      recommendations.push('Identify what changed recently and adjust accordingly')
      recommendations.push('Consider simplifying your approach temporarily')
    } else if (trends.direction === 'improving') {
      recommendations.push('Maintain current momentum - you\'re on the right track!')
    }

    return recommendations
  }

  private calculateMoodConsistency(moodData: any[]): number {
    const moods = moodData.map(d => d.mood)
    const avg = moods.reduce((sum, mood) => sum + mood, 0) / moods.length
    const variance = moods.reduce((sum, mood) => sum + Math.pow(mood - avg, 2), 0) / moods.length
    return Math.round((1 - Math.sqrt(variance) / 5) * 100) // Convert to percentage
  }

  private calculateConsistencyScore(data: number[]): number {
    if (data.length === 0) return 0
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    return Math.max(0, 1 - Math.sqrt(variance))
  }

  private generateGoalReasoning(profile: UserBehaviorProfile, category: any, historical: any): string {
    const performance = historical?.completion_rate || 0.3
    const trait = profile.behavioral_traits.goal_orientation

    if (trait === 'process') {
      return `Based on your process-focused approach and ${Math.round(performance * 100)}% historical performance`
    } else if (trait === 'outcome') {
      return `Challenging goal aligned with your results-oriented mindset and proven ${Math.round(performance * 100)}% capability`
    } else {
      return `Balanced target considering your ${Math.round(performance * 100)}% completion rate and steady progress style`
    }
  }

  private calculateSuccessProbability(profile: UserBehaviorProfile, target: number, historical: any): number {
    const baseRate = historical?.completion_rate || 0.3
    const consistency = profile.completion_patterns.consistency_score
    const preference = profile.preferred_categories.find(cat => cat.category_id === historical?.category_id)?.preference_score || 0.2

    return Math.min(0.95, baseRate * 0.5 + consistency * 0.3 + preference * 0.2)
  }

  private async getRecentActivityData(userId: string) {
    const sevenDaysAgo = subDays(new Date(), 7)

    const [recentCheckins, recentStats] = await Promise.all([
      this.supabase
        .from('axis6_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', format(sevenDaysAgo, 'yyyy-MM-dd')),

      this.supabase
        .from('axis6_daily_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('date', format(sevenDaysAgo, 'yyyy-MM-dd'))
    ])

    const stats = recentStats.data || []
    const checkins = recentCheckins.data || []
    const activeStreaks = checkins.filter((c: any) => c.completed_at === format(new Date(), 'yyyy-MM-dd')).length

    return {
      recentCheckins: checkins,
      recentCompletionRate: stats.length > 0
        ? stats.reduce((sum: number, stat: any) => sum + (stat.completion_rate || 0), 0) / stats.length
        : null,
      activeStreaks
    }
  }

  private async getHistoricalPerformance(userId: string, timeframe: 'weekly' | 'monthly') {
    const daysBack = timeframe === 'weekly' ? 21 : 90 // 3 weeks or 3 months of data
    const startDate = subDays(new Date(), daysBack)

    const { data } = await this.supabase
      .from('axis6_checkins')
      .select('category_id, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', format(startDate, 'yyyy-MM-dd'))

    if (!data || data.length === 0) return []

    // Group by category and calculate completion rates
    const categoryStats: Record<number, { count: number; total_days: number }> = {}
    const totalDays = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    data.forEach((checkin: any) => {
      const catId = checkin.category_id
      if (!categoryStats[catId]) {
        categoryStats[catId] = { count: 0, total_days: totalDays }
      }
      categoryStats[catId].count += 1
    })

    return Object.entries(categoryStats).map(([catId, stats]) => ({
      category_id: parseInt(catId),
      completion_rate: stats.count / stats.total_days
    }))
  }

  private isCacheValid(lastAnalyzed: string): boolean {
    const cacheAge = new Date().getTime() - new Date(lastAnalyzed).getTime()
    const maxAge = 4 * 60 * 60 * 1000 // 4 hours
    return cacheAge < maxAge
  }

  private async storeBehaviorProfile(profile: UserBehaviorProfile): Promise<void> {
    try {
      await this.supabase
        .from('axis6_user_behavior_profiles')
        .upsert({
          user_id: profile.user_id,
          active_hours: profile.active_hours,
          preferred_categories: profile.preferred_categories,
          completion_patterns: profile.completion_patterns,
          behavioral_traits: profile.behavioral_traits,
          patterns: profile.patterns,
          last_analyzed: profile.last_analyzed,
          analysis_version: profile.analysis_version,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      // TODO: Replace with proper error handling
      // console.error('AI behavioral analyzer operation failed:', error);
    }
  }

  private async storeInsights(userId: string, insights: PersonalizedInsight[]): Promise<void> {
    try {
      const insightRows = insights.map(insight => ({
        user_id: userId,
        insight_type: insight.type,
        title: insight.title,
        content: insight.content,
        action_items: insight.action_items,
        priority: insight.priority,
        category_focus: insight.category_focus,
        expires_at: insight.expires_at,
        personalization_score: insight.personalization_score,
        created_at: new Date().toISOString()
      }))

      await this.supabase
        .from('axis6_ai_insights')
        .insert(insightRows)
    } catch (error) {
      // TODO: Replace with proper error handling
      // console.error('AI behavioral analyzer operation failed:', error);
    }
  }

  private getDefaultProfile(userId: string): UserBehaviorProfile {
    return {
      user_id: userId,
      active_hours: [
        { hour: 8, frequency: 0.3 },
        { hour: 12, frequency: 0.2 },
        { hour: 18, frequency: 0.4 }
      ],
      preferred_categories: [
        { category_id: 1, preference_score: 0.4 },
        { category_id: 2, preference_score: 0.3 },
        { category_id: 3, preference_score: 0.3 }
      ],
      completion_patterns: {
        best_days: ['monday', 'tuesday', 'wednesday'],
        peak_hours: [8, 12, 18],
        streak_potential: 0.5,
        consistency_score: 0.5
      },
      behavioral_traits: {
        motivation_type: 'mixed',
        goal_orientation: 'balanced',
        social_tendency: 'independent',
        stress_response: 'adaptive'
      },
      patterns: [],
      last_analyzed: new Date().toISOString(),
      analysis_version: '1.0-basic'
    }
  }
}

// Export singleton instance
export const behavioralAnalyzer = new BehavioralAnalyzer()
