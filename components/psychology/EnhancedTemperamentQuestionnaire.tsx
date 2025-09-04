'use client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Heart,
  Users,
  Target,
  ArrowLeft,
  ArrowRight,
  X,
  Sparkles,
  CheckCircle,
  Loader2,
  Lightbulb
} from 'lucide-react'
import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

// Simple UUID generator for session IDs
const generateSessionId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

interface Question {
  id: string
  text: string
  options: {
    sanguine: string
    choleric: string
    melancholic: string
    phlegmatic: string
  }
  difficulty: 'easy' | 'medium' | 'hard'
  category: 'behavior' | 'social' | 'work' | 'emotional' | 'decision'
  aiGenerated?: boolean
}

interface QuestionnaireProps {
  userId: string
  onComplete: (result: TemperamentResult) => void
  onClose: () => void
  language?: 'en' | 'es'
  useAI?: boolean
}

interface TemperamentResult {
  primary_temperament: string
  secondary_temperament: string
  scores: {
    sanguine: number
    choleric: number
    melancholic: number
    phlegmatic: number
  }
  total_responses: number
}

interface TemperamentResponse {
  questionId: string
  temperament: keyof TemperamentResult['scores']
  difficulty: Question['difficulty']
  responseTime: number
}

const baseQuestions: Question[] = [
  // Easy questions (1-4)
  {
    id: 'q1',
    text: 'At a party, you usually...',
    options: {
      sanguine: 'Mingle with everyone and make new friends',
      choleric: 'Take charge of organizing activities',
      melancholic: 'Have deep conversations with a few people',
      phlegmatic: 'Observe and enjoy the atmosphere quietly'
    },
    difficulty: 'easy',
    category: 'social'
  },
  {
    id: 'q2',
    text: 'When facing a problem, your first instinct is to...',
    options: {
      sanguine: 'Talk it through with friends',
      choleric: 'Take immediate action to solve it',
      melancholic: 'Analyze all possible solutions carefully',
      phlegmatic: 'Wait and see if it resolves itself'
    },
    difficulty: 'easy',
    category: 'behavior'
  },
  {
    id: 'q3',
    text: 'In your free time, you prefer to...',
    options: {
      sanguine: 'Be around people and have fun',
      choleric: 'Work on personal goals and achievements',
      melancholic: 'Engage in creative or intellectual pursuits',
      phlegmatic: 'Relax and enjoy peaceful activities'
    },
    difficulty: 'easy',
    category: 'behavior'
  },
  {
    id: 'q4',
    text: 'Your ideal work environment is...',
    options: {
      sanguine: 'Collaborative and energetic',
      choleric: 'Fast-paced and results-oriented',
      melancholic: 'Structured and detail-focused',
      phlegmatic: 'Stable and harmonious'
    },
    difficulty: 'easy',
    category: 'work'
  },
  // Medium questions (5-8)
  {
    id: 'q5',
    text: 'When you disagree with someone, you tend to...',
    options: {
      sanguine: 'Express your feelings openly and seek compromise',
      choleric: 'State your position firmly and argue your case',
      melancholic: 'Present logical arguments and evidence',
      phlegmatic: 'Avoid confrontation and find peaceful solutions'
    },
    difficulty: 'medium',
    category: 'social'
  },
  {
    id: 'q6',
    text: 'Your approach to planning a vacation is...',
    options: {
      sanguine: 'Research exciting activities and social events',
      choleric: 'Set clear goals and optimize the itinerary',
      melancholic: 'Plan every detail and consider all contingencies',
      phlegmatic: 'Keep it flexible and go with the flow'
    },
    difficulty: 'medium',
    category: 'decision'
  },
  {
    id: 'q7',
    text: 'When learning something new, you prefer to...',
    options: {
      sanguine: 'Learn through group discussions and activities',
      choleric: 'Jump in and learn by doing',
      melancholic: 'Study thoroughly before attempting',
      phlegmatic: 'Take your time and learn at your own pace'
    },
    difficulty: 'medium',
    category: 'behavior'
  },
  {
    id: 'q8',
    text: 'Your emotional response to stress is typically...',
    options: {
      sanguine: 'Seek support and talk through feelings',
      choleric: 'Channel it into productive action',
      melancholic: 'Reflect deeply and analyze the situation',
      phlegmatic: 'Stay calm and wait for it to pass'
    },
    difficulty: 'medium',
    category: 'emotional'
  },
  // Hard questions (9-12) - More nuanced scenarios
  {
    id: 'q9',
    text: 'In a team project where there is conflict about direction...',
    options: {
      sanguine: 'Facilitate team discussions to build consensus and morale',
      choleric: 'Make the decision and rally the team around clear objectives',
      melancholic: 'Research best practices and present a detailed analysis',
      phlegmatic: 'Mediate between viewpoints to find a compromise everyone accepts'
    },
    difficulty: 'hard',
    category: 'work'
  },
  {
    id: 'q10',
    text: 'When you have achieved a significant personal goal, you...',
    options: {
      sanguine: 'Celebrate with others and share your excitement',
      choleric: 'Set the next, more challenging goal immediately',
      melancholic: 'Reflect on the journey and what you learned',
      phlegmatic: 'Feel satisfied and enjoy the accomplishment quietly'
    },
    difficulty: 'hard',
    category: 'emotional'
  },
  {
    id: 'q11',
    text: 'Your philosophy about work-life balance is...',
    options: {
      sanguine: 'Life should be enjoyed - work and play should both be fulfilling',
      choleric: 'Success requires sacrifice - work hard now, enjoy later',
      melancholic: 'Everything has its place - structured time for both work and rest',
      phlegmatic: 'Balance comes naturally - neither should overwhelm the other'
    },
    difficulty: 'hard',
    category: 'decision'
  },
  {
    id: 'q12',
    text: 'When facing a major life decision, your process involves...',
    options: {
      sanguine: 'Talking with trusted friends and following your heart',
      choleric: 'Evaluating options quickly and committing fully to your choice',
      melancholic: 'Extensive research, pro/con lists, and careful deliberation',
      phlegmatic: 'Taking time to consider all angles and sleeping on it'
    },
    difficulty: 'hard',
    category: 'decision'
  }
]

export function EnhancedTemperamentQuestionnaire({
  userId,
  onComplete,
  onClose,
  language = 'en',
  useAI = false
}: QuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<TemperamentResponse[]>([])
  const [questions, setQuestions] = useState<Question[]>(baseQuestions)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const supabase = createClient()

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  // Generate AI-powered follow-up questions based on previous responses
  const generateAIQuestions = useCallback(async (responses: TemperamentResponse[]) => {
    if (!useAI || responses.length < 6) return []

    try {
      setGenerating(true)
      
      // Analyze response patterns
      const temperamentScores = responses.reduce((acc, response) => {
        acc[response.temperament] = (acc[response.temperament] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const dominantTemperament = Object.entries(temperamentScores)
        .sort(([,a], [,b]) => b - a)[0][0]

      const secondaryTemperament = Object.entries(temperamentScores)
        .sort(([,a], [,b]) => b - a)[1]?.[0]

      // Generate contextual questions based on user's temperament tendency
      const aiQuestions = await generateContextualQuestions(
        dominantTemperament,
        secondaryTemperament,
        responses
      )

      return aiQuestions
    } catch (error) {
      logger.error('Failed to generate AI questions:', error)
      return []
    } finally {
      setGenerating(false)
    }
  }, [useAI])

  const generateContextualQuestions = async (
    primary: string,
    secondary: string,
    existingResponses: TemperamentResponse[]
  ): Promise<Question[]> => {
    // This would typically call an AI service like OpenAI
    // For now, we'll return predefined contextual questions
    const contextualQuestions: Record<string, Question[]> = {
      sanguine: [
        {
          id: 'ai_sanguine_1',
          text: 'When your enthusiasm isn\'t shared by others, you...',
          options: {
            sanguine: 'Find new people who share your energy',
            choleric: 'Push harder to convince them',
            melancholic: 'Question whether your approach is right',
            phlegmatic: 'Accept that not everyone needs to be excited'
          },
          difficulty: 'hard',
          category: 'social',
          aiGenerated: true
        }
      ],
      choleric: [
        {
          id: 'ai_choleric_1',
          text: 'When your direct approach causes conflict, you...',
          options: {
            sanguine: 'Try to smooth things over with humor',
            choleric: 'Stand your ground if you\'re right',
            melancholic: 'Analyze what went wrong in your communication',
            phlegmatic: 'Take a step back and let emotions cool'
          },
          difficulty: 'hard',
          category: 'social',
          aiGenerated: true
        }
      ],
      melancholic: [
        {
          id: 'ai_melancholic_1',
          text: 'When others rush you to make a decision, you...',
          options: {
            sanguine: 'Go with your gut feeling',
            choleric: 'Make a quick decision and adjust later',
            melancholic: 'Insist on time to properly evaluate',
            phlegmatic: 'Ask for their input to help decide'
          },
          difficulty: 'hard',
          category: 'decision',
          aiGenerated: true
        }
      ],
      phlegmatic: [
        {
          id: 'ai_phlegmatic_1',
          text: 'When pressure mounts to take a leadership role, you...',
          options: {
            sanguine: 'Embrace it as a chance to inspire others',
            choleric: 'Take charge and drive results',
            melancholic: 'Accept if you\'re well-prepared for it',
            phlegmatic: 'Prefer to support from behind the scenes'
          },
          difficulty: 'hard',
          category: 'work',
          aiGenerated: true
        }
      ]
    }

    return contextualQuestions[primary] || []
  }

  const handleAnswer = async (temperament: keyof TemperamentResult['scores']) => {
    // Clear any previous errors
    setError(null)
    
    const responseTime = Date.now() - questionStartTime
    const response: TemperamentResponse = {
      questionId: currentQuestion.id,
      temperament,
      difficulty: currentQuestion.difficulty,
      responseTime
    }

    const newResponses = [...responses, response]
    setResponses(newResponses)

    // Generate AI questions after the medium questions (index 7)
    if (useAI && currentQuestionIndex === 7) {
      const aiQuestions = await generateAIQuestions(newResponses)
      if (aiQuestions.length > 0) {
        const updatedQuestions = [...questions]
        // Replace the last few questions with AI-generated ones
        updatedQuestions.splice(-2, 2, ...aiQuestions)
        setQuestions(updatedQuestions)
      }
    }

    if (isLastQuestion) {
      await completeAssessment(newResponses)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setQuestionStartTime(Date.now())
    }
  }

  const completeAssessment = async (finalResponses: TemperamentResponse[]) => {
    setLoading(true)
    try {
      // Calculate scores with weighted difficulty
      const scores = finalResponses.reduce((acc, response) => {
        const weight = {
          easy: 1,
          medium: 1.5,
          hard: 2
        }[response.difficulty]

        acc[response.temperament] = (acc[response.temperament] || 0) + weight
        return acc
      }, {} as Record<keyof TemperamentResult['scores'], number>)

      // Normalize scores to percentages
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
      const normalizedScores = {
        sanguine: (scores.sanguine || 0) / totalScore,
        choleric: (scores.choleric || 0) / totalScore,
        melancholic: (scores.melancholic || 0) / totalScore,
        phlegmatic: (scores.phlegmatic || 0) / totalScore
      }

      // Determine primary and secondary temperaments
      const sortedTemperaments = Object.entries(normalizedScores)
        .sort(([,a], [,b]) => b - a)

      const result: TemperamentResult = {
        primary_temperament: sortedTemperaments[0][0],
        secondary_temperament: sortedTemperaments[1][0],
        scores: normalizedScores,
        total_responses: finalResponses.length
      }

      // Save to database
      try {
        await saveAssessmentResults(result, finalResponses)
        onComplete(result)
      } catch (saveError) {
        logger.error('Failed to save assessment results:', saveError)
        setError('Failed to save your assessment results. Please try again.')
        // Don't call onComplete if save failed
        return
      }

    } catch (error) {
      logger.error('Failed to complete assessment:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveAssessmentResults = async (
    result: TemperamentResult,
    finalResponses: TemperamentResponse[]
  ) => {
    try {
      // Save temperament profile
      const { error: profileError } = await supabase
        .from('axis6_temperament_profiles')
        .upsert({
          user_id: userId,
          primary_temperament: result.primary_temperament,
          secondary_temperament: result.secondary_temperament,
          temperament_scores: result.scores,
          personality_insights: generateInsights(result),
          completed_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      // Check if questions table has data before trying to save responses
      const { data: questionsData, error: questionsCheckError } = await supabase
        .from('axis6_temperament_questions')
        .select('id')
        .limit(1)

      if (questionsCheckError) {
        logger.warn('Could not check questions table:', questionsCheckError)
        // Continue without saving responses
        return
      }

      // Only save responses if questions exist in the database
      if (questionsData && questionsData.length > 0) {
        // For now, skip saving individual responses since question IDs don't match
        // This will be fixed when the questions are properly migrated to the database
        logger.info('Questions table has data, but skipping response save due to ID mismatch')
      } else {
        logger.info('Questions table is empty, skipping response save')
      }

    } catch (error) {
      logger.error('Failed to save assessment results:', error)
      throw error
    }
  }

  const generateInsights = (result: TemperamentResult) => {
    const insights: Record<string, any> = {
      sanguine: {
        strengths: ['Enthusiastic', 'Social', 'Optimistic', 'Charismatic'],
        challenges: ['Disorganized', 'Impulsive', 'Attention-seeking'],
        work_style: 'Thrives in collaborative, people-focused environments',
        social_style: 'Natural networker who energizes group dynamics',
        decision_style: 'Makes decisions based on emotions and social impact'
      },
      choleric: {
        strengths: ['Decisive', 'Goal-oriented', 'Natural leader', 'Efficient'],
        challenges: ['Impatient', 'Domineering', 'Insensitive to others'],
        work_style: 'Excels in fast-paced, results-driven environments',
        social_style: 'Takes charge and drives group action',
        decision_style: 'Makes quick decisions based on logic and efficiency'
      },
      melancholic: {
        strengths: ['Analytical', 'Detail-oriented', 'Creative', 'Reliable'],
        challenges: ['Perfectionist', 'Pessimistic', 'Overthinking'],
        work_style: 'Performs best with structure and attention to detail',
        social_style: 'Prefers deep, meaningful relationships',
        decision_style: 'Carefully analyzes all options before deciding'
      },
      phlegmatic: {
        strengths: ['Diplomatic', 'Patient', 'Reliable', 'Good listener'],
        challenges: ['Indecisive', 'Passive', 'Resistant to change'],
        work_style: 'Values stability and harmony in work environment',
        social_style: 'Peaceful mediator who maintains group harmony',
        decision_style: 'Seeks consensus and avoids hasty decisions'
      }
    }

    return insights[result.primary_temperament] || insights.melancholic
  }

  const goBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      // Remove the last response
      setResponses(prev => prev.slice(0, -1))
      setQuestionStartTime(Date.now())
      // Clear any errors when going back
      setError(null)
    }
  }

  const resetAssessment = () => {
    setCurrentQuestionIndex(0)
    setResponses([])
    setError(null)
    setLoading(false)
    setGenerating(false)
    setQuestionStartTime(Date.now())
  }

  const temperamentColors = {
    sanguine: 'from-red-500 to-pink-500',
    choleric: 'from-teal-500 to-cyan-500',
    melancholic: 'from-blue-500 to-indigo-500',
    phlegmatic: 'from-green-500 to-emerald-500'
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Brain className="w-7 h-7 text-purple-400" />
              Temperament Assessment
              {useAI && <Sparkles className="w-5 h-5 text-yellow-400" />}
            </h1>
            <p className="text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
              {useAI && ' • AI-Enhanced'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <div className="flex items-start gap-3 mb-6">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                    currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  )}>
                    {currentQuestion.difficulty}
                  </div>
                  {currentQuestion.aiGenerated && (
                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI-Generated
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-white mb-6">
                  {currentQuestion.text}
                </h2>
                <div className="space-y-3">
                  {Object.entries(currentQuestion.options).map(([temperament, option]) => (
                    <motion.button
                      key={temperament}
                      onClick={() => handleAnswer(temperament as keyof TemperamentResult['scores'])}
                      disabled={loading || generating}
                      className={cn(
                        "w-full p-4 rounded-xl text-left transition-all border",
                        "hover:border-purple-400 hover:bg-purple-500/10",
                        "border-gray-700 bg-gray-800/50 text-white",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full mt-1.5 bg-gradient-to-r",
                          temperamentColors[temperament as keyof typeof temperamentColors]
                        )} />
                        <span>{option}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-700">
          <button
            onClick={goBack}
            disabled={currentQuestionIndex === 0 || loading || generating}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              "text-gray-400 hover:text-white hover:bg-gray-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            {generating && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating personalized questions...</span>
              </>
            )}
            {useAI && !generating && currentQuestionIndex >= 8 && (
              <>
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span>AI-personalized questions active</span>
              </>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-purple-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing results...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-400">
              <X className="w-4 h-4" />
              <span>{error}</span>
              <button
                onClick={resetAssessment}
                className="ml-2 px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}