import { z } from 'zod'

// Environment variables validation
const envSchema = z.object({
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_API_URL: z.string().url().default('https://api.deepseek.com/v1'),
  AI_FEATURES_ENABLED: z.string().transform(v => v === 'true').default('false'),
  AI_CACHE_TTL: z.string().transform(Number).default('3600')
})

// Parse and validate environment variables
const getConfig = () => {
  try {
    const apiKey = process.env['DEEPSEEK_API_KEY']
    const aiEnabled = apiKey ? (process.env['AI_FEATURES_ENABLED'] || 'true') : 'false'
    
    return envSchema.parse({
      DEEPSEEK_API_KEY: apiKey,
      DEEPSEEK_API_URL: process.env['DEEPSEEK_API_URL'] || 'https://api.deepseek.com/v1',
      AI_FEATURES_ENABLED: aiEnabled,
      AI_CACHE_TTL: process.env['AI_CACHE_TTL'] || '3600'
    })
  } catch (error) {
    // Return safe defaults when configuration fails
    return {
      DEEPSEEK_API_KEY: undefined,
      DEEPSEEK_API_URL: 'https://api.deepseek.com/v1',
      AI_FEATURES_ENABLED: false,
      AI_CACHE_TTL: 3600
    }
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class DeepSeekClient {
  private apiKey?: string
  private apiUrl: string
  private isEnabled: boolean
  private cacheMap: Map<string, { data: any; timestamp: number }> = new Map()
  private cacheTTL: number

  constructor() {
    const config = getConfig()
    this.apiKey = config.DEEPSEEK_API_KEY
    this.apiUrl = config.DEEPSEEK_API_URL
    this.isEnabled = config.AI_FEATURES_ENABLED && !!config.DEEPSEEK_API_KEY
    this.cacheTTL = config.AI_CACHE_TTL * 1000 // Convert to milliseconds
    
    if (!this.apiKey && process.env.NODE_ENV !== 'production') {
      }
  }

  private getCacheKey(messages: ChatMessage[], temperature?: number): string {
    return JSON.stringify({ messages, temperature })
  }

  private getFromCache(key: string): any | null {
    const cached = this.cacheMap.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.cacheTTL) {
      this.cacheMap.delete(key)
      return null
    }

    return cached.data
  }

  private setCache(key: string, data: any): void {
    this.cacheMap.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  async chat(
    messages: ChatMessage[],
    options: {
      model?: string
      temperature?: number
      max_tokens?: number
      stream?: boolean
    } = {}
  ): Promise<DeepSeekResponse> {
    if (!this.isEnabled || !this.apiKey) {
      throw new Error('DeepSeek AI features are disabled or not configured')
    }

    // Check cache first
    const cacheKey = this.getCacheKey(messages, options.temperature)
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: options.model || 'deepseek-chat',
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 2000,
          stream: options.stream ?? false
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`DeepSeek API error: ${response.status} - ${error}`)
      }

      const data = await response.json() as DeepSeekResponse

      // Cache successful responses
      this.setCache(cacheKey, data)

      return data
    } catch (error) {
      // TODO: Replace with proper error handling
    // console.error('DeepSeek API call failed:', error);
      throw error
    }
  }

  async generateCompletion(
    prompt: string,
    systemPrompt?: string,
    options?: {
      temperature?: number
      max_tokens?: number
    }
  ): Promise<string> {
    const messages: ChatMessage[] = []
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      })
    }
    
    messages.push({
      role: 'user',
      content: prompt
    })

    const response = await this.chat(messages, options)
    return response.choices[0]?.message?.content || ''
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: z.ZodType<T>,
    systemPrompt?: string
  ): Promise<T> {
    const structuredSystemPrompt = `${systemPrompt || ''}
    
You must respond with valid JSON that matches this schema:
${JSON.stringify(schema._def, null, 2)}

Important: Return ONLY the JSON object, no additional text or formatting.`

    const completion = await this.generateCompletion(
      prompt,
      structuredSystemPrompt,
      { temperature: 0.3 } // Lower temperature for structured output
    )

    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedResponse = completion
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const parsed = JSON.parse(cleanedResponse)
      return schema.parse(parsed)
    } catch (error) {
      // TODO: Replace with proper error handling
    // console.error('Failed to parse structured output:', error);
      throw new Error('Failed to generate valid structured output')
    }
  }

  // Specialized method for personality analysis
  async analyzePersonality(
    responses: Array<{
      question: string
      answer: string
      temperament?: string
    }>,
    language: 'en' | 'es' = 'en'
  ): Promise<{
    primary_temperament: string
    secondary_temperament: string
    scores: Record<string, number>
    insights: {
      strengths: string[]
      challenges: string[]
      recommendations: string[]
      work_style: string
      social_style: string
      decision_style: string
    }
  }> {
    const systemPrompt = `You are an expert psychologist specializing in the four temperaments (Sanguine, Choleric, Melancholic, Phlegmatic) personality assessment system.
    
Analyze the user's questionnaire responses and provide a comprehensive personality profile.
Consider cultural context for ${language === 'es' ? 'Spanish-speaking' : 'English-speaking'} users.
Be insightful, empathetic, and provide actionable recommendations.`

    const prompt = `Based on the following questionnaire responses, provide a detailed personality analysis:

${responses.map((r, i) => `Q${i + 1}: ${r.question}\nA: ${r.answer}\n${r.temperament ? `(Indicates: ${r.temperament})` : ''}`).join('\n\n')}

Provide a comprehensive analysis including:
1. Primary and secondary temperaments with percentage scores
2. Key personality strengths (at least 4)
3. Areas for growth (at least 3)
4. Personalized recommendations for wellness activities (at least 5)
5. Work style description
6. Social interaction style
7. Decision-making approach

Language: ${language === 'es' ? 'Spanish' : 'English'}`

    const schema = z.object({
      primary_temperament: z.enum(['sanguine', 'choleric', 'melancholic', 'phlegmatic']),
      secondary_temperament: z.enum(['sanguine', 'choleric', 'melancholic', 'phlegmatic']),
      scores: z.object({
        sanguine: z.number().min(0).max(1),
        choleric: z.number().min(0).max(1),
        melancholic: z.number().min(0).max(1),
        phlegmatic: z.number().min(0).max(1)
      }),
      insights: z.object({
        strengths: z.array(z.string()).min(4),
        challenges: z.array(z.string()).min(3),
        recommendations: z.array(z.string()).min(5),
        work_style: z.string(),
        social_style: z.string(),
        decision_style: z.string()
      })
    })

    return this.generateStructuredOutput(prompt, schema, systemPrompt)
  }

  // Generate dynamic follow-up questions
  async generateFollowUpQuestion(
    previousResponses: Array<{ question: string; answer: string }>,
    category: string,
    language: 'en' | 'es' = 'en'
  ): Promise<{
    question: string
    options: Array<{
      text: string
      temperament: string
      weight: number
    }>
  }> {
    const systemPrompt = `You are creating psychological assessment questions for the four temperaments system.
Generate insightful follow-up questions based on previous responses to better understand the user's personality.
Focus on the ${category} aspect of their life.`

    const prompt = `Based on these previous responses:
${previousResponses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n')}

Generate a follow-up question for the ${category} category that will help refine the personality assessment.
The question should be in ${language === 'es' ? 'Spanish' : 'English'}.
Provide 4 answer options, each aligned with a different temperament.`

    const schema = z.object({
      question: z.string(),
      options: z.array(z.object({
        text: z.string(),
        temperament: z.enum(['sanguine', 'choleric', 'melancholic', 'phlegmatic']),
        weight: z.number().min(0.5).max(1.0)
      })).length(4)
    })

    return this.generateStructuredOutput(prompt, schema, systemPrompt)
  }

  // Generate personalized activity recommendations
  async generateActivityRecommendations(
    temperament: string,
    category: string,
    preferences: {
      energy_level?: 'low' | 'medium' | 'high'
      social_preference?: 'solo' | 'small_group' | 'large_group'
      time_available?: 'quick' | 'moderate' | 'extended'
    },
    language: 'en' | 'es' = 'en'
  ): Promise<Array<{
    name: string
    description: string
    duration: string
    difficulty: number
    benefits: string[]
  }>> {
    const systemPrompt = `You are a wellness expert creating personalized activity recommendations.
Consider the user's ${temperament} temperament and tailor activities to their personality style.
Activities should be practical, engaging, and aligned with the ${category} wellness dimension.`

    const prompt = `Generate 5 personalized ${category} activities for someone with a ${temperament} temperament.

Preferences:
- Energy Level: ${preferences.energy_level || 'medium'}
- Social Setting: ${preferences.social_preference || 'any'}
- Time Available: ${preferences.time_available || 'moderate'}

Make recommendations culturally appropriate for ${language === 'es' ? 'Spanish-speaking' : 'English-speaking'} users.
Each activity should be unique and specifically beneficial for this temperament type.`

    const schema = z.array(z.object({
      name: z.string(),
      description: z.string(),
      duration: z.string(),
      difficulty: z.number().min(1).max(5),
      benefits: z.array(z.string()).min(2).max(4)
    })).length(5)

    return this.generateStructuredOutput(prompt, schema, systemPrompt)
  }

  // Check if AI features are enabled
  isAIEnabled(): boolean {
    return this.isEnabled
  }
}

// Export singleton instance
export const deepseekClient = new DeepSeekClient()