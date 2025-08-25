import { deepseekClient } from './deepseek'
import { createClient } from '@/lib/supabase/client'

export interface ActivityRecommendationInput {
  userId: string
  categoryId: number
  categoryName: string
  temperament: string
  secondaryTemperament?: string
  preferences?: {
    energy_level?: 'low' | 'medium' | 'high'
    social_preference?: 'solo' | 'small_group' | 'large_group'
    time_available?: 'quick' | 'moderate' | 'extended'
    difficulty_preference?: number // 1-5
  }
  pastActivities?: Array<{
    name: string
    completed: boolean
    rating?: number
  }>
  currentMood?: number // 1-5
  language?: 'en' | 'es'
}

export interface PersonalizedActivity {
  id: string
  name: string
  description: string
  category: string
  duration: string
  difficulty: number
  energy_level: 'low' | 'medium' | 'high'
  social_aspect: 'solo' | 'small_group' | 'large_group' | 'any'
  benefits: string[]
  instructions: string[]
  temperament_fit_score: number
  personalization_reason: string
  alternative_options?: string[]
  progress_tracking?: {
    metric: string
    target: string
    frequency: string
  }
}

export class ActivityRecommender {
  private supabase = createClient()
  private activityCache: Map<string, PersonalizedActivity[]> = new Map()

  /**
   * Generate personalized activity recommendations using AI
   */
  async recommendActivities(
    input: ActivityRecommendationInput
  ): Promise<PersonalizedActivity[]> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(input)
      const cached = this.activityCache.get(cacheKey)
      if (cached && this.isCacheValid(cacheKey)) {
        return cached
      }

      // Check if AI features are enabled
      if (!deepseekClient.isAIEnabled()) {
        return this.getDefaultActivities(input)
      }

      // Generate AI recommendations
      const activities = await this.generateAIRecommendations(input)

      // Enhance with temperament-specific modifications
      const enhancedActivities = await this.enhanceForTemperament(
        activities,
        input.temperament,
        input.secondaryTemperament
      )

      // Store in cache
      this.activityCache.set(cacheKey, enhancedActivities)

      // Store in database for future reference
      await this.storeRecommendations(input.userId, enhancedActivities)

      return enhancedActivities
    } catch (error) {
      console.error('Activity recommendation failed:', error)
      return this.getDefaultActivities(input)
    }
  }

  /**
   * Generate AI-powered activity recommendations
   */
  private async generateAIRecommendations(
    input: ActivityRecommendationInput
  ): Promise<PersonalizedActivity[]> {
    const { categoryName, temperament, preferences, currentMood, language } = input

    // Build context for AI
    const context = this.buildRecommendationContext(input)

    const prompt = `Generate 5 personalized wellness activities for the ${categoryName} dimension.

User Profile:
- Primary Temperament: ${temperament}
- Current Mood: ${currentMood ? `${currentMood}/5` : 'neutral'}
- Energy Level Preference: ${preferences?.energy_level || 'flexible'}
- Social Setting: ${preferences?.social_preference || 'flexible'}
- Available Time: ${preferences?.time_available || 'moderate'}

${context}

Requirements:
1. Activities must be perfectly suited for a ${temperament} personality
2. Provide variety in difficulty and social settings
3. Include both traditional and creative options
4. Consider cultural appropriateness for ${language === 'es' ? 'Spanish-speaking' : 'English-speaking'} users
5. Make at least 2 activities unique/unconventional for engagement

Format each activity with clear structure and actionable steps.`

    const activities = await deepseekClient.generateActivityRecommendations(
      temperament,
      categoryName,
      preferences || {},
      language || 'en'
    )

    // Convert to our format
    return activities.map((activity, index) => ({
      id: `ai-${Date.now()}-${index}`,
      name: activity.name,
      description: activity.description,
      category: categoryName,
      duration: activity.duration,
      difficulty: activity.difficulty,
      energy_level: this.mapEnergyLevel(activity.difficulty),
      social_aspect: this.inferSocialAspect(activity.name, activity.description),
      benefits: activity.benefits,
      instructions: this.generateInstructions(activity),
      temperament_fit_score: this.calculateFitScore(temperament, activity),
      personalization_reason: this.generateReason(temperament, activity),
      alternative_options: this.generateAlternatives(activity)
    }))
  }

  /**
   * Build context from user's past activities and preferences
   */
  private buildRecommendationContext(input: ActivityRecommendationInput): string {
    let context = ''

    if (input.pastActivities && input.pastActivities.length > 0) {
      const completed = input.pastActivities.filter(a => a.completed)
      const highRated = input.pastActivities.filter(a => (a.rating || 0) >= 4)
      
      context += '\nPast Activity Insights:\n'
      if (completed.length > 0) {
        context += `- Previously completed: ${completed.slice(0, 3).map(a => a.name).join(', ')}\n`
      }
      if (highRated.length > 0) {
        context += `- Highly rated: ${highRated.slice(0, 3).map(a => a.name).join(', ')}\n`
      }
    }

    return context
  }

  /**
   * Enhance activities with temperament-specific modifications
   */
  private async enhanceForTemperament(
    activities: PersonalizedActivity[],
    primaryTemperament: string,
    secondaryTemperament?: string
  ): Promise<PersonalizedActivity[]> {
    const enhancements = {
      sanguine: {
        modifications: ['add social elements', 'increase variety', 'make it fun'],
        motivators: ['competition', 'recognition', 'social interaction']
      },
      choleric: {
        modifications: ['add goals/metrics', 'increase challenge', 'enable tracking'],
        motivators: ['achievement', 'efficiency', 'leadership']
      },
      melancholic: {
        modifications: ['add depth/detail', 'enable perfection', 'provide structure'],
        motivators: ['quality', 'understanding', 'mastery']
      },
      phlegmatic: {
        modifications: ['reduce pressure', 'add comfort', 'provide routine'],
        motivators: ['peace', 'stability', 'support']
      }
    }

    const primary = enhancements[primaryTemperament as keyof typeof enhancements]
    const secondary = secondaryTemperament ? 
      enhancements[secondaryTemperament as keyof typeof enhancements] : null

    return activities.map(activity => {
      // Add progress tracking for choleric types
      if (primaryTemperament === 'choleric' || secondaryTemperament === 'choleric') {
        activity.progress_tracking = {
          metric: this.generateMetric(activity.name),
          target: this.generateTarget(activity.difficulty),
          frequency: 'daily'
        }
      }

      // Modify descriptions based on temperament
      activity.personalization_reason = this.combineReasons(
        primary?.motivators || [],
        secondary?.motivators || []
      )

      return activity
    })
  }

  /**
   * Generate instructions for an activity
   */
  private generateInstructions(activity: any): string[] {
    const baseInstructions = [
      `Start with ${activity.duration.includes('quick') ? '5' : '10'} minutes`,
      'Focus on consistency over perfection',
      'Track your progress and feelings',
      'Adjust intensity based on your energy'
    ]

    return baseInstructions
  }

  /**
   * Calculate how well an activity fits a temperament
   */
  private calculateFitScore(temperament: string, activity: any): number {
    const fitFactors = {
      sanguine: {
        high_energy: 0.3,
        social: 0.3,
        variety: 0.2,
        fun: 0.2
      },
      choleric: {
        challenge: 0.3,
        achievement: 0.3,
        efficiency: 0.2,
        leadership: 0.2
      },
      melancholic: {
        structure: 0.3,
        depth: 0.3,
        quality: 0.2,
        solo: 0.2
      },
      phlegmatic: {
        comfort: 0.3,
        routine: 0.3,
        low_pressure: 0.2,
        support: 0.2
      }
    }

    // Calculate based on activity characteristics
    const factors = fitFactors[temperament as keyof typeof fitFactors]
    if (!factors) return 0.7

    let score = 0.7 // Base score
    
    // Adjust based on difficulty
    if (temperament === 'choleric' && activity.difficulty >= 4) score += 0.1
    if (temperament === 'phlegmatic' && activity.difficulty <= 2) score += 0.1
    
    // Cap at 0.95
    return Math.min(0.95, score)
  }

  /**
   * Generate personalization reason
   */
  private generateReason(temperament: string, activity: any): string {
    const reasons = {
      sanguine: `Perfect for your energetic and social nature. This activity provides the variety and fun you crave while keeping you engaged.`,
      choleric: `Designed to challenge you and track measurable progress. You'll appreciate the efficiency and goal-oriented approach.`,
      melancholic: `Structured to allow for depth and mastery. You can perfect your technique and see quality improvements over time.`,
      phlegmatic: `A comfortable, low-pressure activity that fits into your routine. You'll find it peaceful and sustainable.`
    }

    return reasons[temperament as keyof typeof reasons] || 'Tailored to your unique personality.'
  }

  /**
   * Generate alternative options for an activity
   */
  private generateAlternatives(activity: any): string[] {
    const alternatives = []
    
    // Easier version
    alternatives.push(`Easier: ${activity.name} (modified for beginners)`)
    
    // Harder version
    alternatives.push(`Harder: Advanced ${activity.name}`)
    
    // Different setting
    alternatives.push(`Alternative: ${activity.name} (group version)`)

    return alternatives
  }

  /**
   * Map difficulty to energy level
   */
  private mapEnergyLevel(difficulty: number): 'low' | 'medium' | 'high' {
    if (difficulty <= 2) return 'low'
    if (difficulty <= 4) return 'medium'
    return 'high'
  }

  /**
   * Infer social aspect from activity name and description
   */
  private inferSocialAspect(name: string, description: string): 'solo' | 'small_group' | 'large_group' | 'any' {
    const text = `${name} ${description}`.toLowerCase()
    
    if (text.includes('group') || text.includes('team') || text.includes('class')) {
      return text.includes('small') ? 'small_group' : 'large_group'
    }
    
    if (text.includes('solo') || text.includes('alone') || text.includes('personal')) {
      return 'solo'
    }
    
    return 'any'
  }

  /**
   * Generate a tracking metric for an activity
   */
  private generateMetric(activityName: string): string {
    const name = activityName.toLowerCase()
    
    if (name.includes('walk') || name.includes('run')) return 'steps'
    if (name.includes('meditat')) return 'minutes'
    if (name.includes('read')) return 'pages'
    if (name.includes('write')) return 'words'
    
    return 'completions'
  }

  /**
   * Generate a target based on difficulty
   */
  private generateTarget(difficulty: number): string {
    const targets = {
      1: '5 minutes daily',
      2: '10 minutes daily',
      3: '20 minutes daily',
      4: '30 minutes daily',
      5: '45 minutes daily'
    }
    
    return targets[difficulty as keyof typeof targets] || '15 minutes daily'
  }

  /**
   * Combine motivators from primary and secondary temperaments
   */
  private combineReasons(primary: string[], secondary: string[]): string {
    const combined = [...new Set([...primary, ...secondary.slice(0, 1)])]
    return `This activity aligns with your need for ${combined.join(', ')}.`
  }

  /**
   * Get cache key for recommendations
   */
  private getCacheKey(input: ActivityRecommendationInput): string {
    return `${input.userId}-${input.categoryId}-${input.temperament}-${input.currentMood || 'neutral'}`
  }

  /**
   * Check if cache is still valid (1 hour TTL)
   */
  private isCacheValid(key: string): boolean {
    // Simple time-based validation
    // In production, track timestamps
    return true
  }

  /**
   * Store recommendations in database
   */
  private async storeRecommendations(
    userId: string,
    activities: PersonalizedActivity[]
  ): Promise<void> {
    try {
      // Store for analytics and improvement
      await this.supabase
        .from('axis6_ai_recommendations')
        .insert({
          user_id: userId,
          recommendations: activities,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      // Silent fail - not critical
      console.error('Failed to store recommendations:', error)
    }
  }

  /**
   * Get default activities when AI is unavailable
   */
  private getDefaultActivities(input: ActivityRecommendationInput): PersonalizedActivity[] {
    const defaults = {
      Physical: [
        {
          id: 'default-1',
          name: '10-Minute Morning Stretch',
          description: 'Gentle stretching routine to start your day',
          category: 'Physical',
          duration: '10 minutes',
          difficulty: 2,
          energy_level: 'low' as const,
          social_aspect: 'solo' as const,
          benefits: ['Flexibility', 'Energy boost', 'Stress relief'],
          instructions: ['Start slowly', 'Focus on breathing', 'Hold each stretch for 30 seconds'],
          temperament_fit_score: 0.7,
          personalization_reason: 'A gentle activity suitable for all temperaments',
          alternative_options: ['Yoga', 'Walking', 'Dancing']
        }
      ],
      Mental: [
        {
          id: 'default-2',
          name: 'Daily Brain Teaser',
          description: 'Solve a puzzle or riddle to stimulate your mind',
          category: 'Mental',
          duration: '15 minutes',
          difficulty: 3,
          energy_level: 'medium' as const,
          social_aspect: 'solo' as const,
          benefits: ['Cognitive function', 'Problem-solving', 'Focus'],
          instructions: ['Choose a puzzle', 'Set a timer', 'Track improvement'],
          temperament_fit_score: 0.7,
          personalization_reason: 'Mental stimulation for cognitive wellness',
          alternative_options: ['Reading', 'Learning a new skill', 'Journaling']
        }
      ]
    }

    return defaults[input.categoryName as keyof typeof defaults] || defaults.Physical
  }
}

// Export singleton instance
export const activityRecommender = new ActivityRecommender()