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
  Loader2
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

import { LogoIcon } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'

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

interface TemperamentQuestionnaireProps {
  userId: string
  onComplete: (result: TemperamentResult) => void
  onClose: () => void
  language?: 'en' | 'es'
}

const temperamentColors = {
  sanguine: '#FF6B6B',    // Warm red/pink - energetic, social
  choleric: '#4ECDC4',    // Teal - ambitious, leadership  
  melancholic: '#45B7D1', // Blue - analytical, thoughtful
  phlegmatic: '#96CEB4'   // Green - peaceful, reliable
}

const temperamentIcons = {
  sanguine: Users,     // Social, people-focused
  choleric: Target,    // Goal-oriented, ambitious
  melancholic: Brain,  // Analytical, thoughtful
  phlegmatic: Heart    // Peaceful, caring
}

const questionTypeIcons = {
  work_style: Brain,
  social: Users,
  decision_making: Target,
  stress_response: Heart,
  goal_setting: Zap
}

export function TemperamentQuestionnaire({ 
  userId, 
  onComplete, 
  onClose, 
  language = 'en' 
}: TemperamentQuestionnaireProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())

  const supabase = createClient()

  // Fetch questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data: questionsData, error } = await supabase
          .from('axis6_temperament_questions')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true })

        if (error) throw error

        setQuestions(questionsData || [])
      } catch (error) {
        // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Error fetching questions:', error);
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [supabase])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleOptionSelect = useCallback(async (optionIndex: number) => {
    if (!currentQuestion) return

    // Store response locally
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }))

    // Store response in database
    try {
      const selectedOption = currentQuestion.options[optionIndex]
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
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Error saving response:', error);
    }
  }, [currentQuestion, userId, sessionId, supabase])

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
    try {
      // Calculate temperament using database function
      const { data: result, error } = await supabase
        .rpc('calculate_temperament_from_responses', {
          p_user_id: userId,
          p_session_id: sessionId
        })

      if (error) throw error

      // Generate personality insights based on temperament
      const insights = generatePersonalityInsights(result.primary_temperament, result.secondary_temperament, result.scores)

      // Save temperament profile
      await supabase
        .from('axis6_temperament_profiles')
        .upsert({
          user_id: userId,
          primary_temperament: result.primary_temperament,
          secondary_temperament: result.secondary_temperament,
          temperament_scores: result.scores,
          personality_insights: insights
        })

      // Initialize personalization settings
      await supabase
        .from('axis6_personalization_settings')
        .upsert({
          user_id: userId,
          preferred_motivation_style: getMotivationStyle(result.primary_temperament),
          temperament_based_suggestions: true
        })

      onComplete(result)
    } catch (error) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Error submitting questionnaire:', error);
    } finally {
      setSubmitting(false)
    }
  }, [userId, sessionId, onComplete, supabase])

  // Generate personality insights based on temperament
  const generatePersonalityInsights = (primary: string, secondary: string, scores: any) => {
    const insights: any = {
      strengths: [],
      challenges: [],
      recommendations: [],
      work_style: '',
      social_style: '',
      decision_style: ''
    }

    // Temperament-specific insights
    const temperamentData = {
      sanguine: {
        strengths: ['enthusiasm', 'creativity', 'social connection', 'optimism'],
        challenges: ['focus', 'follow-through', 'organization'],
        recommendations: ['group activities', 'variety in routines', 'social accountability'],
        work_style: 'Collaborative and energetic, thrives with variety',
        social_style: 'Outgoing and people-focused, enjoys large groups',
        decision_style: 'Intuitive and quick, follows excitement'
      },
      choleric: {
        strengths: ['leadership', 'goal achievement', 'efficiency', 'determination'],
        challenges: ['patience', 'delegation', 'work-life balance'],
        recommendations: ['challenging goals', 'leadership roles', 'competitive activities'],
        work_style: 'Results-oriented and fast-paced, natural leader',
        social_style: 'Direct and task-focused, prefers small groups',
        decision_style: 'Quick and decisive, focuses on outcomes'
      },
      melancholic: {
        strengths: ['analysis', 'quality focus', 'depth', 'reliability'],
        challenges: ['perfectionism', 'overthinking', 'social confidence'],
        recommendations: ['detailed planning', 'solo reflection', 'skill mastery'],
        work_style: 'Methodical and thorough, values quality over speed',
        social_style: 'Thoughtful and reserved, prefers deep connections',
        decision_style: 'Analytical and careful, considers all options'
      },
      phlegmatic: {
        strengths: ['stability', 'diplomacy', 'patience', 'reliability'],
        challenges: ['motivation', 'assertiveness', 'change adaptation'],
        recommendations: ['steady routines', 'supportive environments', 'gradual changes'],
        work_style: 'Steady and reliable, maintains consistent pace',
        social_style: 'Harmonious and supportive, enjoys peaceful interactions',
        decision_style: 'Consensus-seeking and careful, considers impact on others'
      }
    }

    const primaryData = temperamentData[primary as keyof typeof temperamentData]
    const secondaryData = secondary ? temperamentData[secondary as keyof typeof temperamentData] : null

    if (primaryData) {
      insights.strengths = [...primaryData.strengths]
      insights.challenges = [...primaryData.challenges]
      insights.recommendations = [...primaryData.recommendations]
      insights.work_style = primaryData.work_style
      insights.social_style = primaryData.social_style
      insights.decision_style = primaryData.decision_style

      // Blend with secondary if significant
      if (secondaryData && scores[secondary] > 0.3) {
        insights.strengths.push(...secondaryData.strengths.slice(0, 2))
        insights.recommendations.push(...secondaryData.recommendations.slice(0, 2))
      }
    }

    return insights
  }

  const getMotivationStyle = (temperament: string) => {
    const styles = {
      sanguine: 'encouraging',
      choleric: 'challenging', 
      melancholic: 'analytical',
      phlegmatic: 'supportive'
    }
    return styles[temperament as keyof typeof styles] || 'encouraging'
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-sm mx-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Loading Assessment</h3>
            <p className="text-gray-400">Preparing your psychological profile questionnaire...</p>
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
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  Personality Assessment
                </h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Discover your temperament for personalized wellness
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
                    <QuestionIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-xs uppercase tracking-wide text-gray-400">
                    {currentQuestion.question_type.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-white mb-4">
                  {currentQuestion.question_text[language]}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = responses[currentQuestion.id] === index
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
                            <TemperamentIcon 
                              className="w-4 h-4" 
                              style={{ color: temperamentColor }}
                            />
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
                    Analyzing...
                  </>
                ) : (
                  <>
                    Complete Assessment
                    <Check className="w-4 h-4" />
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