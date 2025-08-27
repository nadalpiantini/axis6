import { createClient } from '@/lib/supabase/client'

import { deepseekClient } from './deepseek'

export interface PersonalityAnalysisInput {
  userId: string
  sessionId: string
  responses: Array<{
    questionId: string
    questionText: string
    answerText: string
    selectedTemperament?: string
  }>
  language?: 'en' | 'es'
}

export interface EnhancedPersonalityProfile {
  primary_temperament: string
  secondary_temperament: string
  temperament_scores: {
    sanguine: number
    choleric: number
    melancholic: number
    phlegmatic: number
  }
  personality_insights: {
    strengths: string[]
    challenges: string[]
    recommendations: string[]
    work_style: string
    social_style: string
    decision_style: string
    motivation_triggers: string[]
    stress_patterns: string[]
    growth_areas: string[]
    relationship_style: string
    leadership_style: string
    learning_style: string
  }
  ai_confidence_score: number
  analysis_version: string
}

export class PersonalityAnalyzer {
  private supabase = createClient()

  /**
   * Perform enhanced AI-powered personality analysis
   */
  async analyzePersonality(input: PersonalityAnalysisInput): Promise<EnhancedPersonalityProfile> {
    try {
      // Check if AI features are enabled
      if (!deepseekClient.isAIEnabled()) {
        // Fallback to basic analysis
        return this.performBasicAnalysis(input)
      }

      // Prepare responses for AI analysis
      const formattedResponses = input.responses.map(r => ({
        question: r.questionText,
        answer: r.answerText,
        temperament: r.selectedTemperament
      }))

      // Get AI analysis
      const aiAnalysis = await deepseekClient.analyzePersonality(
        formattedResponses,
        input.language || 'en'
      )

      // Enhance with additional insights
      const enhancedInsights = await this.generateAdditionalInsights(
        aiAnalysis,
        input.language || 'en'
      )

      // Combine AI analysis with enhanced insights
      const profile: EnhancedPersonalityProfile = {
        primary_temperament: aiAnalysis.primary_temperament,
        secondary_temperament: aiAnalysis.secondary_temperament,
        temperament_scores: {
          sanguine: aiAnalysis.scores['sanguine'] || 0,
          choleric: aiAnalysis.scores['choleric'] || 0,
          melancholic: aiAnalysis.scores['melancholic'] || 0,
          phlegmatic: aiAnalysis.scores['phlegmatic'] || 0
        },
        personality_insights: {
          ...aiAnalysis.insights,
          ...enhancedInsights
        },
        ai_confidence_score: this.calculateConfidenceScore(aiAnalysis.scores),
        analysis_version: '2.0-ai-enhanced'
      }

      // Store the enhanced profile
      await this.storeEnhancedProfile(input.userId, profile)

      return profile
    } catch (error) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('AI personality analysis failed:', error);
      // Fallback to basic analysis
      return this.performBasicAnalysis(input)
    }
  }

  /**
   * Generate additional personality insights using AI
   */
  private async generateAdditionalInsights(
    baseAnalysis: any,
    language: 'en' | 'es'
  ): Promise<{
    motivation_triggers: string[]
    stress_patterns: string[]
    growth_areas: string[]
    relationship_style: string
    leadership_style: string
    learning_style: string
  }> {
    const prompt = `Based on a ${baseAnalysis.primary_temperament} primary and ${baseAnalysis.secondary_temperament} secondary temperament profile, provide detailed insights about:

1. What motivates this person (3-4 specific triggers)
2. How they typically respond to stress (2-3 patterns)
3. Key areas for personal growth (3-4 areas)
4. Their relationship style (1 paragraph)
5. Their leadership approach (1 paragraph)
6. Their preferred learning style (1 paragraph)

Consider the blend of temperaments and provide nuanced, actionable insights.
Language: ${language === 'es' ? 'Spanish' : 'English'}`

    try {
      const response = await deepseekClient.generateCompletion(
        prompt,
        'You are an expert psychologist providing deep personality insights based on temperament analysis.',
        { temperature: 0.6 }
      )

      // Parse the response into structured format
      return this.parseAdditionalInsights(response)
    } catch (error) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Failed to generate additional insights:', error);
      return this.getDefaultAdditionalInsights(baseAnalysis.primary_temperament)
    }
  }

  /**
   * Parse AI response into structured insights
   */
  private parseAdditionalInsights(response: string): {
    motivation_triggers: string[]
    stress_patterns: string[]
    growth_areas: string[]
    relationship_style: string
    leadership_style: string
    learning_style: string
  } {
    // Extract sections from the response
    const sections = response.split(/\d+\.\s+/)
    
    return {
      motivation_triggers: this.extractListItems(sections[1] || ''),
      stress_patterns: this.extractListItems(sections[2] || ''),
      growth_areas: this.extractListItems(sections[3] || ''),
      relationship_style: this.extractParagraph(sections[4] || ''),
      leadership_style: this.extractParagraph(sections[5] || ''),
      learning_style: this.extractParagraph(sections[6] || '')
    }
  }

  private extractListItems(text: string): string[] {
    const items = text.match(/[-•]\s*([^-•\n]+)/g) || []
    return items.map(item => item.replace(/[-•]\s*/, '').trim()).filter(Boolean).slice(0, 4)
  }

  private extractParagraph(text: string): string {
    return text.split('\n')[0]?.trim() || ''
  }

  /**
   * Calculate confidence score based on temperament score distribution
   */
  private calculateConfidenceScore(scores: Record<string, number>): number {
    const values = Object.values(scores)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min
    
    // Higher range means clearer temperament distinction
    return Math.min(0.95, 0.5 + (range * 0.5))
  }

  /**
   * Store enhanced profile in database
   */
  private async storeEnhancedProfile(
    userId: string,
    profile: EnhancedPersonalityProfile
  ): Promise<void> {
    try {
      await this.supabase
        .from('axis6_temperament_profiles')
        .upsert({
          user_id: userId,
          primary_temperament: profile.primary_temperament,
          secondary_temperament: profile.secondary_temperament,
          temperament_scores: profile.temperament_scores,
          personality_insights: profile.personality_insights,
          ai_confidence_score: profile.ai_confidence_score,
          analysis_version: profile.analysis_version,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Failed to store enhanced profile:', error);
    }
  }

  /**
   * Fallback to basic rule-based analysis
   */
  private async performBasicAnalysis(
    input: PersonalityAnalysisInput
  ): Promise<EnhancedPersonalityProfile> {
    // Count temperament responses
    const temperamentCounts: Record<string, number> = {
      sanguine: 0,
      choleric: 0,
      melancholic: 0,
      phlegmatic: 0
    }

    input.responses.forEach(r => {
      if (r.selectedTemperament) {
        (temperamentCounts as any)[r.selectedTemperament]++
      }
    })

    // Calculate scores
    const total = input.responses.length || 1
    const scores = {
      sanguine: (temperamentCounts['sanguine'] || 0) / total,
      choleric: (temperamentCounts['choleric'] || 0) / total,
      melancholic: (temperamentCounts['melancholic'] || 0) / total,
      phlegmatic: (temperamentCounts['phlegmatic'] || 0) / total
    }

    // Determine primary and secondary
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
    const primary = sorted[0]?.[0] || 'sanguine'
    const secondary = sorted[1]?.[0] || 'phlegmatic'

    return {
      primary_temperament: primary,
      secondary_temperament: secondary,
      temperament_scores: scores,
      personality_insights: this.getBasicInsights(primary, secondary),
      ai_confidence_score: 0.6,
      analysis_version: '1.0-basic'
    }
  }

  /**
   * Get basic insights for fallback
   */
  private getBasicInsights(primary: string, _secondary: string): any {
    const insights = {
      sanguine: {
        strengths: ['enthusiasm', 'creativity', 'social connection', 'optimism'],
        challenges: ['focus', 'follow-through', 'organization'],
        recommendations: ['group activities', 'variety in routines', 'social accountability'],
        work_style: 'Collaborative and energetic',
        social_style: 'Outgoing and people-focused',
        decision_style: 'Intuitive and quick'
      },
      choleric: {
        strengths: ['leadership', 'goal achievement', 'efficiency', 'determination'],
        challenges: ['patience', 'delegation', 'work-life balance'],
        recommendations: ['challenging goals', 'leadership roles', 'competitive activities'],
        work_style: 'Results-oriented and fast-paced',
        social_style: 'Direct and task-focused',
        decision_style: 'Quick and decisive'
      },
      melancholic: {
        strengths: ['analysis', 'quality focus', 'depth', 'reliability'],
        challenges: ['perfectionism', 'overthinking', 'social confidence'],
        recommendations: ['detailed planning', 'solo reflection', 'skill mastery'],
        work_style: 'Methodical and thorough',
        social_style: 'Thoughtful and reserved',
        decision_style: 'Analytical and careful'
      },
      phlegmatic: {
        strengths: ['stability', 'diplomacy', 'patience', 'reliability'],
        challenges: ['motivation', 'assertiveness', 'change adaptation'],
        recommendations: ['steady routines', 'supportive environments', 'gradual changes'],
        work_style: 'Steady and reliable',
        social_style: 'Harmonious and supportive',
        decision_style: 'Consensus-seeking'
      }
    }

    const primaryInsights = insights[primary as keyof typeof insights] || insights.sanguine
    // const secondaryInsights = insights[secondary as keyof typeof insights]

    return {
      ...primaryInsights,
      motivation_triggers: ['achievement', 'recognition', 'growth'],
      stress_patterns: ['withdrawal', 'overthinking'],
      growth_areas: ['emotional intelligence', 'adaptability'],
      relationship_style: 'Supportive and understanding',
      leadership_style: 'Collaborative and inclusive',
      learning_style: 'Visual and hands-on'
    }
  }

  /**
   * Get default additional insights for fallback
   */
  private getDefaultAdditionalInsights(temperament: string): any {
    const defaults = {
      sanguine: {
        motivation_triggers: ['social recognition', 'fun challenges', 'creative freedom', 'team success'],
        stress_patterns: ['becomes scattered', 'seeks distraction', 'emotional volatility'],
        growth_areas: ['focus and discipline', 'deep work skills', 'emotional regulation', 'follow-through'],
        relationship_style: 'Warm, enthusiastic, and socially engaging. Values fun and connection.',
        leadership_style: 'Inspirational and motivating. Leads through enthusiasm and vision.',
        learning_style: 'Interactive, social learning. Prefers variety and hands-on experiences.'
      },
      choleric: {
        motivation_triggers: ['challenging goals', 'competition', 'autonomy', 'measurable results'],
        stress_patterns: ['becomes controlling', 'impatience increases', 'work obsession'],
        growth_areas: ['empathy', 'delegation', 'work-life balance', 'patience'],
        relationship_style: 'Direct, goal-oriented, and efficient. Values respect and achievement.',
        leadership_style: 'Commanding and decisive. Leads through vision and determination.',
        learning_style: 'Fast-paced, practical application. Prefers efficiency and results.'
      },
      melancholic: {
        motivation_triggers: ['quality standards', 'meaningful work', 'deep understanding', 'perfection'],
        stress_patterns: ['analysis paralysis', 'self-criticism', 'withdrawal'],
        growth_areas: ['self-compassion', 'risk-taking', 'social confidence', 'flexibility'],
        relationship_style: 'Deep, meaningful connections. Values loyalty and understanding.',
        leadership_style: 'Thoughtful and systematic. Leads through expertise and planning.',
        learning_style: 'Detailed, systematic learning. Prefers depth over breadth.'
      },
      phlegmatic: {
        motivation_triggers: ['harmony', 'stability', 'appreciation', 'clear expectations'],
        stress_patterns: ['passive resistance', 'procrastination', 'emotional suppression'],
        growth_areas: ['assertiveness', 'initiative', 'conflict resolution', 'energy'],
        relationship_style: 'Calm, supportive, and loyal. Values peace and stability.',
        leadership_style: 'Diplomatic and inclusive. Leads through consensus and support.',
        learning_style: 'Steady, methodical pace. Prefers clear structure and repetition.'
      }
    }

    return defaults[temperament as keyof typeof defaults] || defaults.sanguine
  }
}

// Export singleton instance
export const personalityAnalyzer = new PersonalityAnalyzer()