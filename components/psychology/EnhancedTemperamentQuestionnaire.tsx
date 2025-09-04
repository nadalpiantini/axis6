'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Brain,
  Heart,
  Users,
  Target,
  Zap,
  Loader2,
  Sparkles,
  MessageCircle
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

import { LogoIcon } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'

import { handleError } from '@/lib/error/standardErrorHandler'
interface Question {
  id: string
  question_text: {
    en: string
    es: string
  }
  question_type: 'work_style' | 'social' | 'decision_making' | 'stress_response' | 'goal_setting'
  options: Array<{
    text: {
      en: string
      es: string
    }
    temperament: 'sanguine' | 'choleric' | 'melancholic' | 'phlegmatic'
    weight: number
  }>
  order_index: number
  ai_generated?: boolean
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
  ai_confidence_score?: number
  personality_insights?: any
}

interface EnhancedTemperamentQuestionnaireProps {
  userId: string
  onComplete: (result: TemperamentResult) => void
  onClose: () => void
  language?: 'en' | 'es'
  useAI?: boolean
}

const temperamentColors = {
  sanguine: '#FF6B6B',
  choleric: '#4ECDC4',
  melancholic: '#45B7D1',
  phlegmatic: '#96CEB4'
}

const temperamentIcons = {
  sanguine: Users,
  choleric: Target,
  melancholic: Brain,
  phlegmatic: Heart
}

const questionTypeIcons = {
  work_style: Brain,
  social: Users,
  decision_making: Target,
  stress_response: Heart,
  goal_setting: Zap
}

export function EnhancedTemperamentQuestionnaire({
  userId,
  onComplete,
  onClose,
  language = 'en',
  useAI = true
}: EnhancedTemperamentQuestionnaireProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, { index: number; text: string; temperament: string }>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [showAIInsight, setShowAIInsight] = useState(false)
  const [aiInsight, setAiInsight] = useState<string>('')

  const supabase = createClient()

  // Fetch initial questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data: questionsData, error } = await supabase
          .from('axis6_temperament_questions')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true })
          .limit(6) // Start with 6 base questions

        if (error) throw error

        setQuestions(questionsData || [])
      } catch (error) {
        console.error('❌ Failed to load assessment questions:', error)
        handleError(error, {
          operation: 'psychology_assessment_load', 
          component: 'EnhancedTemperamentQuestionnaire',
          userMessage: 'Failed to load assessment questions. Please refresh and try again.',
          userId,
          context: {
            useAI,
            sessionId
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [supabase])

  // Generate dynamic follow-up questions using AI
  const generateFollowUpQuestion = useCallback(async () => {
    if (!useAI || currentQuestionIndex < 3) return // Only generate after 3 questions

    try {
      const previousResponses = Object.entries(responses).map(([questionId, response]) => {
        const question = questions.find(q => q.id === questionId)
        return {
          question: question?.question_text[language] || '',
          answer: response.text
        }
      })

      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousResponses,
          category: questions[currentQuestionIndex]?.question_type || 'general',
          language
        })
      })

      if (response.ok) {
        const { data } = await response.json()

        // Add the AI-generated question to the queue
        const newQuestion: Question = {
          id: `ai-${Date.now()}`,
          question_text: {
            en: data.question,
            es: data.question
          },
          question_type: questions[currentQuestionIndex]?.question_type || 'work_style',
          options: data.options,
          order_index: questions.length,
          ai_generated: true
        }

        setQuestions(prev => [...prev, newQuestion])

        // Show AI insight
        setAiInsight('I\'ve added a follow-up question to better understand your personality.')
        setShowAIInsight(true)
        setTimeout(() => setShowAIInsight(false), 3000)
      }
    } catch (error) {
      console.error('❌ Failed to generate follow-up question:', error)
      handleError(error, {
        operation: 'psychology_assessment_ai_followup', 
        component: 'EnhancedTemperamentQuestionnaire',
        userMessage: 'Failed to generate personalized question. Continuing with standard questions.',
        userId,
        context: {
          sessionId,
          currentQuestionIndex,
          responsesCount: Object.keys(responses).length
        }
      })
    }
  }, [useAI, currentQuestionIndex, responses, questions, language])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / Math.max(questions.length, 10)) * 100

  const handleOptionSelect = useCallback(async (optionIndex: number) => {
    if (!currentQuestion) return

    const selectedOption = currentQuestion.options[optionIndex]

    if (!selectedOption) return

    // Store response locally with more details
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: {
        index: optionIndex,
        text: selectedOption.text[language],
        temperament: selectedOption.temperament
      }
    }))

    // Store response in database
    try {
      await supabase
        .from('axis6_temperament_responses')
        .upsert({
          user_id: userId,
          question_id: currentQuestion.id,
          selected_option_index: optionIndex,
          response_value: selectedOption,
          session_id: sessionId
        })
    } catch (error) {
      console.error('❌ Failed to save response:', error)
      handleError(error, {
        operation: 'psychology_assessment_response', 
        component: 'EnhancedTemperamentQuestionnaire',
        userMessage: 'Failed to save your response. Please try again.',
        userId,
        context: {
          questionId: currentQuestion.id,
          optionIndex,
          sessionId
        }
      })
    }

    // Generate follow-up question if using AI
    if (useAI && (currentQuestionIndex === 2 || currentQuestionIndex === 5)) {
      await generateFollowUpQuestion()
    }
  }, [currentQuestion, userId, sessionId, supabase, language, useAI, currentQuestionIndex, generateFollowUpQuestion])

  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }, [currentQuestionIndex, questions.length])

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }, [currentQuestionIndex])

  const submitQuestionnaire = useCallback(async () => {
    setSubmitting(true)
    setAiAnalyzing(useAI)

    try {
      const responsesCount = Object.keys(responses).length
      console.log('🔄 Starting assessment submission...', { useAI, sessionId, responsesCount })

      // Validate minimum responses
      if (responsesCount < 3) {
        throw new Error('Please answer at least 3 questions before completing the assessment')
      }

      if (useAI) {
        // Use AI-enhanced analysis
        const formattedResponses = Object.entries(responses).map(([questionId, response]) => {
          const question = questions.find(q => q.id === questionId)
          return {
            questionId,
            questionText: question?.question_text[language] || '',
            answerText: response.text,
            selectedTemperament: response.temperament
          }
        })

        console.log('📊 Formatted responses for AI analysis:', formattedResponses.length, 'responses')

        const analysisResponse = await fetch('/api/ai/analyze-personality', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            responses: formattedResponses,
            language
          })
        })

        console.log('📡 AI API response status:', analysisResponse.status, analysisResponse.statusText)

        if (analysisResponse.ok) {
          const responseData = await analysisResponse.json()
          console.log('✅ AI analysis successful:', responseData)
          
          const { data: aiResult } = responseData

          // Convert to expected format
          const result: TemperamentResult = {
            primary_temperament: aiResult.primary_temperament,
            secondary_temperament: aiResult.secondary_temperament,
            scores: aiResult.temperament_scores,
            total_responses: formattedResponses.length,
            ai_confidence_score: aiResult.ai_confidence_score,
            personality_insights: aiResult.personality_insights
          }

          console.log('🎯 Final result prepared:', result.primary_temperament)
          onComplete(result)
        } else {
          const errorData = await analysisResponse.json().catch(() => ({}))
          console.error('❌ AI analysis API error:', errorData)
          throw new Error(`AI analysis failed: ${errorData.error || analysisResponse.statusText}`)
        }
      } else {
        // Fallback to basic calculation
        console.log('📐 Using basic temperament calculation...')
        const { data: result, error } = await supabase
          .rpc('calculate_temperament_from_responses', {
            p_user_id: userId,
            p_session_id: sessionId
          })

        if (error) {
          console.error('❌ Basic calculation failed:', error)
          throw error
        }

        console.log('✅ Basic calculation successful:', result)
        onComplete(result)
      }
    } catch (error) {
      console.error('❌ Failed to save assessment results:', error)
      handleError(error, {
        operation: 'psychology_assessment', 
        component: 'EnhancedTemperamentQuestionnaire',
        userMessage: 'Psychology assessment failed. Please try again.',
        userId,
        context: {
          sessionId,
          useAI,
          responsesCount: Object.keys(responses).length
        }
      })

      // Fallback to basic calculation if AI fails
      try {
        const { data: result, error: fallbackError } = await supabase
          .rpc('calculate_temperament_from_responses', {
            p_user_id: userId,
            p_session_id: sessionId
          })

        if (fallbackError) {
          console.error('❌ Fallback calculation also failed:', fallbackError)
          throw new Error('Both AI and basic analysis failed')
        }

        if (result) {
          onComplete(result)
        }
      } catch (fallbackError) {
        console.error('❌ Complete failure in assessment:', fallbackError)
        handleError(fallbackError, {
          operation: 'psychology_assessment_fallback', 
          component: 'EnhancedTemperamentQuestionnaire',
          userMessage: 'Assessment calculation failed. Please try again.',
          userId,
          context: { sessionId, originalError: error instanceof Error ? error.message : String(error) }
        })
      }
    } finally {
      setSubmitting(false)
      setAiAnalyzing(false)
    }
  }, [userId, sessionId, onComplete, supabase, useAI, responses, questions, language])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-sm mx-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {useAI ? 'Preparing AI-Enhanced Assessment' : 'Loading Assessment'}
            </h3>
            <p className="text-gray-400">
              {useAI
                ? 'Initializing personalized psychological profiling...'
                : 'Preparing your questionnaire...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return null
  }

  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const hasSelectedOption = responses[currentQuestion.id] !== undefined
  const QuestionIcon = questionTypeIcons[currentQuestion.question_type]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <LogoIcon size="sm" className="h-8" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                  {useAI && (
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  )}
                  {useAI ? 'AI-Enhanced Assessment' : 'Personality Assessment'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  {useAI
                    ? 'Adaptive questions powered by AI'
                    : 'Discover your temperament for personalized wellness'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* AI Insight Toast */}
          <AnimatePresence>
            {showAIInsight && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 p-2 bg-purple-500/20 rounded-lg flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-300">{aiInsight}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Question Content */}
        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Question */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    {QuestionIcon ? (
                      <QuestionIcon className="w-5 h-5 text-purple-400" />
                    ) : (
                      <div className="w-5 h-5 flex items-center justify-center text-purple-400 text-xs">
                        Q
                      </div>
                    )}
                  </div>
                  <span className="text-xs uppercase tracking-wide text-gray-400">
                    {currentQuestion.question_type.replace('_', ' ')}
                  </span>
                  {currentQuestion.ai_generated && (
                    <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                      AI Generated
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-white mb-4">
                  {currentQuestion.question_text[language]}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = responses[currentQuestion.id]?.index === index
                  const temperamentColor = temperamentColors[option.temperament]
                  const TemperamentIcon = temperamentIcons[option.temperament]

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleOptionSelect(index)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full text-left p-4 rounded-xl transition-all border-2 ${
                        isSelected
                          ? 'bg-white/10 border-purple-500/50'
                          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={`p-1.5 rounded-lg ${isSelected ? 'opacity-100' : 'opacity-60'}`}
                            style={{ backgroundColor: `${temperamentColor}20` }}
                          >
                            {TemperamentIcon ? (
                              <TemperamentIcon
                                className="w-4 h-4"
                                style={{ color: temperamentColor }}
                              />
                            ) : (
                              <div className="w-4 h-4 flex items-center justify-center text-xs">
                                {option.temperament.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className={`text-sm sm:text-base ${
                            isSelected ? 'text-white' : 'text-gray-300'
                          }`}>
                            {option.text[language]}
                          </span>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="p-1 bg-purple-500 rounded-full"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={submitQuestionnaire}
                disabled={!hasSelectedOption || submitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {aiAnalyzing ? 'AI Analyzing...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    Complete Assessment
                    {useAI && <Sparkles className="w-4 h-4" />}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goToNextQuestion}
                disabled={!hasSelectedOption}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
