'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ArrowLeft, X, Loader2 } from 'lucide-react'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

interface QuestionnaireProps {
  userId: string
  onComplete: (result: TemperamentResult) => void
  onClose: () => void
  language?: 'en' | 'es'
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

const questions = [
  {
    id: 'q1',
    text: 'At a party, you usually...',
    options: {
      sanguine: 'Mingle with everyone and make new friends',
      choleric: 'Take charge of organizing activities',
      melancholic: 'Have deep conversations with a few people',
      phlegmatic: 'Observe and enjoy the atmosphere quietly'
    }
  },
  {
    id: 'q2',
    text: 'When facing a problem, your first instinct is to...',
    options: {
      sanguine: 'Talk it through with friends',
      choleric: 'Take immediate action to solve it',
      melancholic: 'Analyze all possible solutions carefully',
      phlegmatic: 'Wait and see if it resolves itself'
    }
  },
  {
    id: 'q3',
    text: 'In your free time, you prefer to...',
    options: {
      sanguine: 'Be around people and have fun',
      choleric: 'Work on personal goals and achievements',
      melancholic: 'Engage in creative or intellectual pursuits',
      phlegmatic: 'Relax and enjoy peaceful activities'
    }
  },
  {
    id: 'q4',
    text: 'Your ideal work environment is...',
    options: {
      sanguine: 'Collaborative and energetic',
      choleric: 'Fast-paced and results-oriented',
      melancholic: 'Structured and detail-focused',
      phlegmatic: 'Stable and harmonious'
    }
  },
  {
    id: 'q5',
    text: 'When you disagree with someone, you tend to...',
    options: {
      sanguine: 'Express your feelings openly and seek compromise',
      choleric: 'State your position firmly and argue your case',
      melancholic: 'Present logical arguments and evidence',
      phlegmatic: 'Avoid confrontation and find peaceful solutions'
    }
  },
  {
    id: 'q6',
    text: 'Your approach to planning a vacation is...',
    options: {
      sanguine: 'Research exciting activities and social events',
      choleric: 'Set clear goals and optimize the itinerary',
      melancholic: 'Plan every detail and consider all contingencies',
      phlegmatic: 'Keep it flexible and go with the flow'
    }
  },
  {
    id: 'q7',
    text: 'When learning something new, you prefer to...',
    options: {
      sanguine: 'Learn through group discussions and activities',
      choleric: 'Jump in and learn by doing',
      melancholic: 'Study thoroughly before attempting',
      phlegmatic: 'Take your time and learn at your own pace'
    }
  },
  {
    id: 'q8',
    text: 'Your emotional response to stress is typically...',
    options: {
      sanguine: 'Seek support and talk through feelings',
      choleric: 'Channel it into productive action',
      melancholic: 'Reflect deeply and analyze the situation',
      phlegmatic: 'Stay calm and wait for it to pass'
    }
  },
  {
    id: 'q9',
    text: 'In a team project where there is conflict about direction...',
    options: {
      sanguine: 'Facilitate team discussions to build consensus and morale',
      choleric: 'Make the decision and rally the team around clear objectives',
      melancholic: 'Research best practices and present a detailed analysis',
      phlegmatic: 'Mediate between viewpoints to find a compromise everyone accepts'
    }
  },
  {
    id: 'q10',
    text: 'When you have achieved a significant personal goal, you...',
    options: {
      sanguine: 'Celebrate with others and share your excitement',
      choleric: 'Set the next, more challenging goal immediately',
      melancholic: 'Reflect on the journey and what you learned',
      phlegmatic: 'Feel satisfied and enjoy the accomplishment quietly'
    }
  },
  {
    id: 'q11',
    text: 'Your philosophy about work-life balance is...',
    options: {
      sanguine: 'Life should be enjoyed - work and play should both be fulfilling',
      choleric: 'Success requires sacrifice - work hard now, enjoy later',
      melancholic: 'Everything has its place - structured time for both work and rest',
      phlegmatic: 'Balance comes naturally - neither should overwhelm the other'
    }
  },
  {
    id: 'q12',
    text: 'When facing a major life decision, your process involves...',
    options: {
      sanguine: 'Talking with trusted friends and following your heart',
      choleric: 'Evaluating options quickly and committing fully to your choice',
      melancholic: 'Extensive research, pro/con lists, and careful deliberation',
      phlegmatic: 'Taking time to consider all angles and sleeping on it'
    }
  }
]

export function TemperamentQuestionnaire({
  userId,
  onComplete,
  onClose,
  language = 'en'
}: QuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, keyof TemperamentResult['scores']>>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleAnswer = async (temperament: keyof TemperamentResult['scores']) => {
    const newResponses = { ...responses, [currentQuestion.id]: temperament }
    setResponses(newResponses)

    if (isLastQuestion) {
      await completeAssessment(newResponses)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const completeAssessment = async (finalResponses: Record<string, keyof TemperamentResult['scores']>) => {
    setLoading(true)
    try {
      // Calculate scores
      const scores = Object.values(finalResponses).reduce((acc, temperament) => {
        acc[temperament] = (acc[temperament] || 0) + 1
        return acc
      }, {} as Record<keyof TemperamentResult['scores'], number>)

      // Normalize to percentages
      const totalResponses = Object.values(finalResponses).length
      const normalizedScores = {
        sanguine: (scores.sanguine || 0) / totalResponses,
        choleric: (scores.choleric || 0) / totalResponses,
        melancholic: (scores.melancholic || 0) / totalResponses,
        phlegmatic: (scores.phlegmatic || 0) / totalResponses
      }

      // Find primary and secondary
      const sortedTemperaments = Object.entries(normalizedScores)
        .sort(([,a], [,b]) => b - a)

      const result: TemperamentResult = {
        primary_temperament: sortedTemperaments[0][0],
        secondary_temperament: sortedTemperaments[1][0],
        scores: normalizedScores,
        total_responses: totalResponses
      }

      // Save to database
      await saveResults(result)
      onComplete(result)

    } catch (error) {
      logger.error('Failed to complete assessment:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveResults = async (result: TemperamentResult) => {
    const { error } = await supabase
      .from('axis6_temperament_profiles')
      .upsert({
        user_id: userId,
        primary_temperament: result.primary_temperament,
        secondary_temperament: result.secondary_temperament,
        temperament_scores: result.scores,
        personality_insights: generateBasicInsights(result),
        completed_at: new Date().toISOString(),
        assessment_version: '1.0',
        total_questions: questions.length
      })

    if (error) throw error
  }

  const generateBasicInsights = (result: TemperamentResult) => {
    const insights: Record<string, any> = {
      sanguine: {
        strengths: ['Enthusiastic', 'Social', 'Optimistic'],
        challenges: ['Disorganized', 'Impulsive'],
        work_style: 'Thrives in collaborative environments',
        social_style: 'Natural networker',
        decision_style: 'Emotion and relationship focused'
      },
      choleric: {
        strengths: ['Decisive', 'Goal-oriented', 'Leader'],
        challenges: ['Impatient', 'Domineering'],
        work_style: 'Excels in fast-paced environments',
        social_style: 'Takes charge of groups',
        decision_style: 'Quick and logic-based'
      },
      melancholic: {
        strengths: ['Analytical', 'Detail-oriented', 'Creative'],
        challenges: ['Perfectionist', 'Overthinking'],
        work_style: 'Performs best with structure',
        social_style: 'Prefers deep relationships',
        decision_style: 'Careful analysis based'
      },
      phlegmatic: {
        strengths: ['Diplomatic', 'Patient', 'Reliable'],
        challenges: ['Indecisive', 'Passive'],
        work_style: 'Values stability and harmony',
        social_style: 'Peaceful mediator',
        decision_style: 'Consensus seeking'
      }
    }

    return insights[result.primary_temperament] || insights.melancholic
  }

  const goBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      // Remove the last response
      const newResponses = { ...responses }
      delete newResponses[currentQuestion.id]
      setResponses(newResponses)
    }
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
            </h1>
            <p className="text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
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
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-white mb-6">
              {currentQuestion.text}
            </h2>
            <div className="space-y-3">
              {Object.entries(currentQuestion.options).map(([temperament, option]) => (
                <motion.button
                  key={temperament}
                  onClick={() => handleAnswer(temperament as keyof TemperamentResult['scores'])}
                  disabled={loading}
                  className={cn(
                    "w-full p-4 rounded-xl text-left transition-all border",
                    "hover:border-purple-400 hover:bg-purple-500/10",
                    "border-gray-700 bg-gray-800/50 text-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-700">
          <button
            onClick={goBack}
            disabled={currentQuestionIndex === 0 || loading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              "text-gray-400 hover:text-white hover:bg-gray-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {loading && (
            <div className="flex items-center gap-2 text-purple-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing results...</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}