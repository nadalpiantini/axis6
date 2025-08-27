'use client'

import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Sparkles, 
  Clock, 
  Target, 
  Heart, 
  Users, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Zap,
  Calendar,
  Star
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { activityRecommender } from '@/lib/ai/activity-recommender'
import { behavioralAnalyzer } from '@/lib/ai/behavioral-analyzer'
import { personalityAnalyzer } from '@/lib/ai/personality-analyzer'
import { useCategories } from '@/lib/react-query/hooks/useCategories'


interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<any>
  isComplete: boolean
  aiEnhanced?: boolean
}

interface AIOnboardingState {
  currentStep: number
  steps: OnboardingStep[]
  userData: {
    temperament?: any
    preferences?: any
    goals?: any
    initialRecommendations?: any
  }
  isGeneratingInsights: boolean
  insights: string[]
}

export function AIEnhancedOnboarding({ onComplete }: { onComplete: () => void }) {
  const [state, setState] = useState<AIOnboardingState>({
    currentStep: 0,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to AXIS6',
        description: 'AI-powered wellness tracking designed for you',
        component: WelcomeStep,
        isComplete: false
      },
      {
        id: 'personality',
        title: 'Discover Your Wellness Style',
        description: 'AI personality analysis for personalized recommendations',
        component: PersonalityStep,
        isComplete: false,
        aiEnhanced: true
      },
      {
        id: 'preferences',
        title: 'Set Your Preferences',
        description: 'Customize your wellness journey',
        component: PreferencesStep,
        isComplete: false
      },
      {
        id: 'goals',
        title: 'AI-Powered Goal Setting',
        description: 'Smart goals based on your personality and preferences',
        component: GoalsStep,
        isComplete: false,
        aiEnhanced: true
      },
      {
        id: 'recommendations',
        title: 'Your Personalized Dashboard',
        description: 'AI-curated activities and insights just for you',
        component: RecommendationsStep,
        isComplete: false,
        aiEnhanced: true
      }
    ],
    userData: {},
    isGeneratingInsights: false,
    insights: []
  })

  const supabase = createClient()

  const goToNextStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.steps.length - 1)
    }))
  }

  const goToPrevStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0)
    }))
  }

  const completeCurrentStep = (data?: any) => {
    setState(prev => {
      const newSteps = [...prev.steps]
      newSteps[prev.currentStep] = { ...newSteps[prev.currentStep], isComplete: true }
      
      const newUserData = data ? { ...prev.userData, ...data } : prev.userData
      
      return {
        ...prev,
        steps: newSteps,
        userData: newUserData
      }
    })
  }

  const generateAIInsights = async () => {
    setState(prev => ({ ...prev, isGeneratingInsights: true }))
    
    try {
      const insights: string[] = []
      
      if (state.userData.temperament) {
        insights.push(
          `Based on your ${state.userData.temperament.primary_temperament} temperament, you thrive with ${
            state.userData.temperament.primary_temperament === 'sanguine' ? 'social and varied activities' :
            state.userData.temperament.primary_temperament === 'choleric' ? 'challenging, goal-oriented tasks' :
            state.userData.temperament.primary_temperament === 'melancholic' ? 'structured, thoughtful practices' :
            'steady, comfortable routines'
          }.`
        )
      }
      
      if (state.userData.preferences) {
        const pref = state.userData.preferences
        if (pref.energyLevel === 'high') {
          insights.push("Your high energy level means you'll excel with intensive activities and challenging goals.")
        }
        if (pref.timePreference === 'morning') {
          insights.push("Morning person detected! We'll prioritize early-day reminders and activities.")
        }
      }
      
      insights.push("Your AI coach will learn from every interaction to provide increasingly personalized guidance.")
      
      setState(prev => ({
        ...prev,
        insights,
        isGeneratingInsights: false
      }))
    } catch (error) {
      // TODO: Replace with proper error handling
    // console.error('Failed to generate AI insights:', error);
      setState(prev => ({ ...prev, isGeneratingInsights: false }))
    }
  }

  const currentStepComponent = state.steps[state.currentStep]?.component
  const progress = ((state.currentStep + 1) / state.steps.length) * 100

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Setup Progress</span>
          <span className="text-sm text-gray-500">
            {state.currentStep + 1} of {state.steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* AI Insights Banner */}
      <AnimatePresence>
        {state.insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-purple-900 mb-2">AI Insights</h3>
                <div className="space-y-2">
                  {state.insights.map((insight, index) => (
                    <p key={index} className="text-sm text-purple-800">
                      💡 {insight}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {state.steps[state.currentStep]?.aiEnhanced && (
                  <Sparkles className="w-5 h-5 text-purple-600" />
                )}
                {state.steps[state.currentStep]?.title}
              </CardTitle>
              <CardDescription>
                {state.steps[state.currentStep]?.description}
              </CardDescription>
            </div>
            {state.steps[state.currentStep]?.aiEnhanced && (
              <Badge variant="default" className="bg-purple-600">
                <Brain className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {currentStepComponent && (
              <motion.div
                key={state.currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
{React.createElement(currentStepComponent, {
                  onComplete: completeCurrentStep,
                  onNext: goToNextStep,
                  userData: state.userData,
                  generateInsights: generateAIInsights,
                  isGeneratingInsights: state.isGeneratingInsights
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={goToPrevStep}
          disabled={state.currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {state.steps.map((step, index) => (
            <div
              key={step.id}
              className={`w-2 h-2 rounded-full transition-colors ${
                index < state.currentStep
                  ? 'bg-green-500'
                  : index === state.currentStep
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {state.currentStep === state.steps.length - 1 ? (
          <Button 
            onClick={onComplete}
            disabled={!state.steps[state.currentStep]?.isComplete}
          >
            Complete Setup
            <CheckCircle2 className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={goToNextStep}
            disabled={!state.steps[state.currentStep]?.isComplete}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

// Individual step components
function WelcomeStep({ onComplete, onNext }: any) {
  useEffect(() => {
    // Auto-complete welcome step
    onComplete()
  }, [onComplete])

  return (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to AI-Powered Wellness
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          AXIS6 uses advanced AI to understand your personality, behavior patterns, and preferences 
          to create a truly personalized wellness experience. Let's discover what makes you unique!
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="text-center p-4">
          <Brain className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">AI Analysis</h3>
          <p className="text-sm text-gray-600">
            Understand your personality and behavioral patterns
          </p>
        </div>
        <div className="text-center p-4">
          <Target className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Smart Goals</h3>
          <p className="text-sm text-gray-600">
            Receive personalized, achievable wellness goals
          </p>
        </div>
        <div className="text-center p-4">
          <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Adaptive Insights</h3>
          <p className="text-sm text-gray-600">
            Get smarter recommendations as the AI learns about you
          </p>
        </div>
      </div>
    </div>
  )
}

function PersonalityStep({ onComplete, userData, generateInsights }: any) {
  const [responses, setResponses] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const questions = [
    {
      id: 'work_style',
      text: 'When working on a project, you prefer to:',
      options: [
        { text: 'Collaborate with others and brainstorm ideas', temperament: 'sanguine' },
        { text: 'Take charge and drive results quickly', temperament: 'choleric' },
        { text: 'Plan thoroughly and work methodically', temperament: 'melancholic' },
        { text: 'Work steadily and support the team', temperament: 'phlegmatic' }
      ]
    },
    {
      id: 'social',
      text: 'In social situations, you typically:',
      options: [
        { text: 'Energize the room and connect with everyone', temperament: 'sanguine' },
        { text: 'Lead conversations and share your opinions', temperament: 'choleric' },
        { text: 'Listen carefully and contribute thoughtfully', temperament: 'melancholic' },
        { text: 'Stay comfortable and support others', temperament: 'phlegmatic' }
      ]
    },
    {
      id: 'decision_making',
      text: 'When making important decisions, you:',
      options: [
        { text: 'Go with your gut and seek others\' input', temperament: 'sanguine' },
        { text: 'Decide quickly and move forward confidently', temperament: 'choleric' },
        { text: 'Research thoroughly and consider all angles', temperament: 'melancholic' },
        { text: 'Take your time and seek consensus', temperament: 'phlegmatic' }
      ]
    }
  ]

  const handleAnswer = (option: any) => {
    const newResponses = [...responses, {
      questionId: questions[currentQuestion].id,
      questionText: questions[currentQuestion].text,
      answerText: option.text,
      selectedTemperament: option.temperament
    }]
    
    setResponses(newResponses)
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      analyzePersonality(newResponses)
    }
  }

  const analyzePersonality = async (allResponses: any[]) => {
    setIsAnalyzing(true)
    
    try {
      // Simple analysis for demo - in production, use AI
      const temperamentCounts: Record<string, number> = {}
      allResponses.forEach(r => {
        temperamentCounts[r.selectedTemperament] = (temperamentCounts[r.selectedTemperament] || 0) + 1
      })
      
      const sorted = Object.entries(temperamentCounts).sort((a, b) => b[1] - a[1])
      const temperament = {
        primary_temperament: sorted[0]?.[0] || 'balanced',
        secondary_temperament: sorted[1]?.[0] || 'balanced',
        responses: allResponses
      }
      
      onComplete({ temperament })
      generateInsights()
    } catch (error) {
      // TODO: Replace with proper error handling
    // console.error('Personality analysis failed:', error);
      onComplete({ temperament: { primary_temperament: 'balanced' } })
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (isAnalyzing) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Analyzing Your Personality...</h3>
          <p className="text-gray-600">AI is processing your responses to create your personalized profile</p>
        </div>
      </div>
    )
  }

  if (userData.temperament) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Personality Analysis Complete!</h3>
          <p className="text-gray-600 mb-4">
            Your primary temperament is <strong className="capitalize">{userData.temperament.primary_temperament}</strong>
          </p>
          <Badge variant="default" className="bg-purple-600">
            AI Personality Profile Created
          </Badge>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-purple-600" />
          <span className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        <Progress value={((currentQuestion + 1) / questions.length) * 100} className="mb-6" />
        <h3 className="text-xl font-semibold mb-6">{question.text}</h3>
      </div>
      
      <div className="grid gap-4">
        {question.options.map((option, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="outline"
              className="w-full p-6 text-left h-auto justify-start hover:bg-purple-50 hover:border-purple-300"
              onClick={() => handleAnswer(option)}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                </div>
                <span>{option.text}</span>
              </div>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function PreferencesStep({ onComplete }: any) {
  const [preferences, setPreferences] = useState({
    energyLevel: '',
    timePreference: '',
    socialPreference: '',
    notificationFrequency: 'moderate'
  })

  const handleComplete = () => {
    onComplete({ preferences })
  }

  const isComplete = preferences.energyLevel && preferences.timePreference && preferences.socialPreference

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            What's your typical energy level?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'low', label: '🌱 Low & Steady', desc: 'Gentle, sustainable activities' },
              { value: 'medium', label: '⚡ Balanced', desc: 'Mix of gentle and active' },
              { value: 'high', label: '🔥 High Energy', desc: 'Intense, challenging activities' }
            ].map(option => (
              <Button
                key={option.value}
                variant={preferences.energyLevel === option.value ? 'default' : 'outline'}
                className="h-auto p-4 flex-col gap-2"
                onClick={() => setPreferences(prev => ({ ...prev, energyLevel: option.value }))}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-600">{option.desc}</div>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            When do you prefer to focus on wellness?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'morning', label: '🌅 Morning Person', desc: 'Start the day strong' },
              { value: 'afternoon', label: '☀️ Afternoon', desc: 'Midday momentum' },
              { value: 'evening', label: '🌙 Evening', desc: 'Wind down routine' }
            ].map(option => (
              <Button
                key={option.value}
                variant={preferences.timePreference === option.value ? 'default' : 'outline'}
                className="h-auto p-4 flex-col gap-2"
                onClick={() => setPreferences(prev => ({ ...prev, timePreference: option.value }))}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-600">{option.desc}</div>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            How do you prefer to engage with wellness?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'solo', label: '🧘 Solo Focus', desc: 'Personal, private time' },
              { value: 'small_group', label: '👥 Small Groups', desc: 'Close friends & family' },
              { value: 'community', label: '👫 Community', desc: 'Larger social engagement' }
            ].map(option => (
              <Button
                key={option.value}
                variant={preferences.socialPreference === option.value ? 'default' : 'outline'}
                className="h-auto p-4 flex-col gap-2"
                onClick={() => setPreferences(prev => ({ ...prev, socialPreference: option.value }))}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-600">{option.desc}</div>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isComplete && (
        <div className="text-center">
          <Button onClick={handleComplete} className="px-8">
            Save Preferences
            <CheckCircle2 className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}

function GoalsStep({ onComplete, userData }: any) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [isGeneratingGoals, setIsGeneratingGoals] = useState(false)
  const [suggestedGoals, setSuggestedGoals] = useState<any[]>([])

  useEffect(() => {
    generatePersonalizedGoals()
  }, [])

  const generatePersonalizedGoals = () => {
    setIsGeneratingGoals(true)
    
    // Simulate AI goal generation based on temperament and preferences
    setTimeout(() => {
      const temperament = userData.temperament?.primary_temperament || 'balanced'
      const energyLevel = userData.preferences?.energyLevel || 'medium'
      
      let goals = []
      
      if (temperament === 'sanguine') {
        goals = [
          { id: '1', title: 'Connect socially 3x/week', description: 'Engage with friends during wellness activities', difficulty: 'easy', category: 'Social' },
          { id: '2', title: 'Try 2 new activities weekly', description: 'Keep variety in your routine', difficulty: 'medium', category: 'Physical' }
        ]
      } else if (temperament === 'choleric') {
        goals = [
          { id: '1', title: 'Achieve 5 check-ins daily', description: 'Complete all wellness dimensions', difficulty: 'challenging', category: 'All' },
          { id: '2', title: 'Set weekly challenges', description: 'Push your limits progressively', difficulty: 'medium', category: 'Physical' }
        ]
      } else if (temperament === 'melancholic') {
        goals = [
          { id: '1', title: 'Maintain 21-day streak', description: 'Build consistent daily habits', difficulty: 'medium', category: 'All' },
          { id: '2', title: 'Deep reflection weekly', description: 'Dedicated self-analysis time', difficulty: 'easy', category: 'Spiritual' }
        ]
      } else {
        goals = [
          { id: '1', title: 'Steady 3 categories daily', description: 'Consistent, manageable progress', difficulty: 'easy', category: 'All' },
          { id: '2', title: 'Gentle growth weekly', description: 'Small, sustainable improvements', difficulty: 'easy', category: 'Physical' }
        ]
      }

      setSuggestedGoals(goals)
      setIsGeneratingGoals(false)
    }, 2000)
  }

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    )
  }

  const handleComplete = () => {
    onComplete({ 
      goals: suggestedGoals.filter(g => selectedGoals.includes(g.id))
    })
  }

  if (isGeneratingGoals) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Generating Your Personal Goals...</h3>
          <p className="text-gray-600">
            AI is creating goals based on your {userData.temperament?.primary_temperament} temperament 
            and {userData.preferences?.energyLevel} energy preferences
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Your AI-Generated Goals</h3>
        <p className="text-gray-600">
          Based on your personality and preferences, here are some personalized wellness goals
        </p>
      </div>

      <div className="grid gap-4">
        {suggestedGoals.map(goal => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedGoals.includes(goal.id)
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => toggleGoal(goal.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{goal.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {goal.category}
                  </Badge>
                  <Badge 
                    variant={goal.difficulty === 'easy' ? 'secondary' : goal.difficulty === 'medium' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {goal.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{goal.description}</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                {selectedGoals.includes(goal.id) ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedGoals.length > 0 && (
        <div className="text-center pt-4">
          <Button onClick={handleComplete} className="px-8">
            Set {selectedGoals.length} Goal{selectedGoals.length > 1 ? 's' : ''}
            <Target className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}

function RecommendationsStep({ onComplete, userData }: any) {
  const [isLoading, setIsLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<any[]>([])

  useEffect(() => {
    generateRecommendations()
  }, [])

  const generateRecommendations = () => {
    setTimeout(() => {
      const temperament = userData.temperament?.primary_temperament || 'balanced'
      
      const recs = [
        {
          title: 'Morning Energizer',
          description: '5-minute movement to start your day',
          category: 'Physical',
          match: '95%',
          reason: `Perfect for your ${temperament} energy style`
        },
        {
          title: 'Mindful Moments',
          description: 'Brief meditation breaks throughout the day',
          category: 'Mental',
          match: '88%',
          reason: 'Matches your preferred wellness timing'
        },
        {
          title: 'Connection Check',
          description: 'Daily meaningful social interaction',
          category: 'Social',
          match: '92%',
          reason: 'Aligned with your social preferences'
        }
      ]
      
      setRecommendations(recs)
      setIsLoading(false)
      setTimeout(() => onComplete({ recommendations: recs }), 1000)
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Creating Your Personal Dashboard...</h3>
          <p className="text-gray-600">AI is curating activities and insights just for you</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Your AI-Curated Experience</h3>
        <p className="text-gray-600">
          Here's a preview of your personalized AXIS6 dashboard
        </p>
      </div>

      <div className="grid gap-4">
        {recommendations.map((rec, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold">{rec.title}</h4>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">{rec.match}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
            <div className="flex items-center justify-between">
              <Badge variant="outline">{rec.category}</Badge>
              <span className="text-xs text-purple-600">💡 {rec.reason}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center pt-6 border-t">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="font-medium">Your AI wellness coach is ready!</span>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Start using AXIS6 to unlock even more personalized insights and recommendations.
        </p>
      </div>
    </div>
  )
}