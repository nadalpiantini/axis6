'use client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Heart,
  Users,
  Target,
  Star,
  TrendingUp,
  CheckCircle,
  Lightbulb,
  Zap,
  Shield,
  Award,
  ArrowRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { LogoIcon } from '@/components/ui/Logo'
interface TemperamentResult {
  primary_temperament: string
  secondary_temperament: string
  scores: {
    sanguine: number
    choleric: number
    melancholic: number
    phlegmatic: number
    [key: string]: number
  }
  total_responses: number
}
interface PersonalityInsights {
  strengths: string[]
  challenges: string[]
  recommendations: string[]
  work_style: string
  social_style: string
  decision_style: string
}
interface TemperamentResultsProps {
  result: TemperamentResult
  insights?: PersonalityInsights
  onContinue: () => void
  onClose?: () => void
  language?: 'en' | 'es'
}
const temperamentData = {
  sanguine: {
    name: { en: 'Sanguine', es: 'Sanguíneo' },
    subtitle: { en: 'The Enthusiast', es: 'El Entusiasta' },
    description: {
      en: 'You are naturally optimistic, social, and energetic. You thrive on interaction and bring joy to those around you.',
      es: 'Eres naturalmente optimista, social y enérgico. Prosperas en la interacción y traes alegría a quienes te rodean.'
    },
    color: '#FF6B6B',
    bgGradient: 'from-red-500/20 to-pink-500/20',
    borderColor: 'border-red-500/30',
    icon: Users,
    traits: {
      en: ['Optimistic', 'Social', 'Energetic', 'Creative', 'Spontaneous'],
      es: ['Optimista', 'Social', 'Enérgico', 'Creativo', 'Espontáneo']
    }
  },
  choleric: {
    name: { en: 'Choleric', es: 'Colérico' },
    subtitle: { en: 'The Leader', es: 'El Líder' },
    description: {
      en: 'You are ambitious, goal-oriented, and natural leader. You excel at getting things done efficiently.',
      es: 'Eres ambicioso, orientado a objetivos y líder natural. Sobresales en hacer las cosas de manera eficiente.'
    },
    color: '#4ECDC4',
    bgGradient: 'from-teal-500/20 to-cyan-500/20',
    borderColor: 'border-teal-500/30',
    icon: Target,
    traits: {
      en: ['Ambitious', 'Decisive', 'Independent', 'Efficient', 'Confident'],
      es: ['Ambicioso', 'Decisivo', 'Independiente', 'Eficiente', 'Confiado']
    }
  },
  melancholic: {
    name: { en: 'Melancholic', es: 'Melancólico' },
    subtitle: { en: 'The Analyst', es: 'El Analista' },
    description: {
      en: 'You are thoughtful, analytical, and detail-oriented. You value quality and deep understanding.',
      es: 'Eres reflexivo, analítico y detallista. Valoras la calidad y la comprensión profunda.'
    },
    color: '#45B7D1',
    bgGradient: 'from-blue-500/20 to-indigo-500/20',
    borderColor: 'border-blue-500/30',
    icon: Brain,
    traits: {
      en: ['Analytical', 'Thoughtful', 'Organized', 'Reliable', 'Quality-focused'],
      es: ['Analítico', 'Reflexivo', 'Organizado', 'Confiable', 'Enfocado en calidad']
    }
  },
  phlegmatic: {
    name: { en: 'Phlegmatic', es: 'Flemático' },
    subtitle: { en: 'The Peacemaker', es: 'El Pacificador' },
    description: {
      en: 'You are calm, stable, and diplomatic. You excel at maintaining harmony and supporting others.',
      es: 'Eres tranquilo, estable y diplomático. Sobresales en mantener la armonía y apoyar a otros.'
    },
    color: '#96CEB4',
    bgGradient: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/30',
    icon: Heart,
    traits: {
      en: ['Calm', 'Supportive', 'Patient', 'Diplomatic', 'Stable'],
      es: ['Tranquilo', 'Solidario', 'Paciente', 'Diplomático', 'Estable']
    }
  }
}
export function TemperamentResults({
  result,
  insights,
  onContinue,
  language = 'en'
}: TemperamentResultsProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  // Add null checks and fallbacks for temperament data
  const primaryTemp = temperamentData[result.primary_temperament as keyof typeof temperamentData] || temperamentData.melancholic
  const secondaryTemp = result.secondary_temperament
    ? temperamentData[result.secondary_temperament as keyof typeof temperamentData] || null
    : null
  
  const PrimaryIcon = primaryTemp?.icon || Brain
  const SecondaryIcon = secondaryTemp?.icon || Heart
  
  // Convert scores to percentages with null checks
  const scorePercentages = Object.entries(result.scores || {}).map(([temperament, score]) => ({
    temperament,
    percentage: Math.round((score || 0) * 100),
    data: temperamentData[temperament as keyof typeof temperamentData] || temperamentData.melancholic
  })).sort((a, b) => b.percentage - a.percentage)
  
  useEffect(() => {
    // Animate details reveal after component mounts
    const timer = setTimeout(() => setShowDetails(true), 1000)
    return () => clearTimeout(timer)
  }, [])
  
  const translations = {
    en: {
      yourTemperament: 'Your Temperament Profile',
      primary: 'Primary',
      secondary: 'Secondary',
      scores: 'Detailed Scores',
      strengths: 'Your Strengths',
      challenges: 'Growth Areas',
      recommendations: 'Recommendations',
      workStyle: 'Work Style',
      socialStyle: 'Social Style',
      decisionStyle: 'Decision Style',
      continue: 'Continue to Dashboard',
      wellnessJourney: 'Your personalized wellness journey begins now!'
    },
    es: {
      yourTemperament: 'Tu Perfil de Temperamento',
      primary: 'Primario',
      secondary: 'Secundario',
      scores: 'Puntajes Detallados',
      strengths: 'Tus Fortalezas',
      challenges: 'Áreas de Crecimiento',
      recommendations: 'Recomendaciones',
      workStyle: 'Estilo de Trabajo',
      socialStyle: 'Estilo Social',
      decisionStyle: 'Estilo de Decisión',
      continue: 'Continuar al Dashboard',
      wellnessJourney: '¡Tu viaje de bienestar personalizado comienza ahora!'
    }
  }
  
  const t = translations[language] || translations.en
  
  // Add safety checks for temperament data access
  const getTemperamentName = (temp: any, lang: string): string => {
    if (!temp || !temp.name) return 'Unknown'
    if (typeof temp.name === 'string') return temp.name
    if (typeof temp.name === 'object' && temp.name[lang]) return temp.name[lang]
    return temp.name.en || 'Unknown'
  }
  
  const getTemperamentSubtitle = (temp: any, lang: string): string => {
    if (!temp || !temp.subtitle) return ''
    if (typeof temp.subtitle === 'string') return temp.subtitle
    if (typeof temp.subtitle === 'object' && temp.subtitle[lang]) return temp.subtitle[lang]
    return temp.subtitle.en || ''
  }
  
  const getTemperamentDescription = (temp: any, lang: string): string => {
    if (!temp || !temp.description) return ''
    if (typeof temp.description === 'string') return temp.description
    if (typeof temp.description === 'object' && temp.description[lang]) return temp.description[lang]
    return temp.description.en || ''
  }
  
  const getTemperamentTraits = (temp: any, lang: string): string[] => {
    if (!temp || !temp.traits) return []
    if (Array.isArray(temp.traits)) return temp.traits
    if (typeof temp.traits === 'object' && temp.traits[lang]) return temp.traits[lang]
    return temp.traits.en || []
  }
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] md:max-w-lg lg:max-w-xl max-h-[85vh] overflow-y-auto z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl w-full"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-white/10 text-center">
            <div className="flex justify-center mb-4">
              <LogoIcon size="md" className="h-10" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {t.yourTemperament}
            </h1>
            <p className="text-gray-400">
              {t.wellnessJourney}
            </p>
          </div>
          <div className="p-4 sm:p-6">
            {/* Primary & Secondary Temperaments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Primary Temperament */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`relative p-6 rounded-2xl bg-gradient-to-br ${primaryTemp.bgGradient} border ${primaryTemp.borderColor}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${primaryTemp.color}20` }}
                  >
                    <PrimaryIcon
                      className="w-6 h-6"
                      style={{ color: primaryTemp.color }}
                    />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-gray-400">
                      {t.primary}
                    </span>
                    <h3 className="text-xl font-bold text-white">
                      {getTemperamentName(primaryTemp, language)}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {getTemperamentSubtitle(primaryTemp, language)}
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4 text-sm sm:text-base">
                  {getTemperamentDescription(primaryTemp, language)}
                </p>
                {/* Key Traits */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">Key Traits:</h4>
                  <div className="flex flex-wrap gap-2">
                    {getTemperamentTraits(primaryTemp, language).map((trait: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs rounded-full border"
                        style={{
                          backgroundColor: `${primaryTemp.color}15`,
                          borderColor: `${primaryTemp.color}30`,
                          color: primaryTemp.color
                        }}
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Score Badge */}
                <div className="absolute top-4 right-4">
                  <div
                    className="px-3 py-1 rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: primaryTemp.color }}
                  >
                    {Math.round((result.scores as any)[result.primary_temperament] * 100)}%
                  </div>
                </div>
              </motion.div>
              {/* Secondary Temperament */}
              {secondaryTemp && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`relative p-6 rounded-2xl bg-gradient-to-br ${secondaryTemp.bgGradient} border ${secondaryTemp.borderColor} opacity-80`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${secondaryTemp.color}20` }}
                    >
                      <SecondaryIcon
                        className="w-6 h-6"
                        style={{ color: secondaryTemp.color }}
                      />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide text-gray-400">
                        {t.secondary}
                      </span>
                      <h3 className="text-lg font-bold text-white">
                        {getTemperamentName(secondaryTemp, language)}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {getTemperamentSubtitle(secondaryTemp, language)}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {getTemperamentDescription(secondaryTemp, language)}
                  </p>
                  {/* Score Badge */}
                  <div className="absolute top-4 right-4">
                    <div
                      className="px-3 py-1 rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: secondaryTemp.color }}
                    >
                      {Math.round((result.scores as any)[result.secondary_temperament] * 100)}%
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            {/* Detailed Analysis - Animated Reveal */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Complete Scores */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass rounded-2xl p-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      {t.scores}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {scorePercentages.map((item, index) => (
                        <div key={item.temperament} className="text-center">
                          <div
                            className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center"
                            style={{ backgroundColor: `${item.data.color}20` }}
                          >
                            <item.data.icon
                              className="w-8 h-8"
                              style={{ color: item.data.color }}
                            />
                          </div>
                          <h4 className="text-sm font-medium text-white">
                            {getTemperamentName(item.data, language)}
                          </h4>
                          <div
                            className="text-2xl font-bold mt-1"
                            style={{ color: item.data.color }}
                          >
                            {item.percentage}%
                          </div>
                          {index === 0 && (
                            <div className="mt-1">
                              <Award className="w-4 h-4 text-yellow-400 mx-auto" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                  {/* Personality Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Strengths & Challenges */}
                    <div className="space-y-6">
                      {/* Strengths */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="glass rounded-2xl p-6"
                      >
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-400" />
                          {t.strengths}
                        </h3>
                        <div className="space-y-2">
                          {(insights?.strengths || []).map((strength, index) => (
                            <div key={index} className="flex items-center gap-2 text-gray-300">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="capitalize">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                      {/* Challenges */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                        className="glass rounded-2xl p-6"
                      >
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-orange-400" />
                          {t.challenges}
                        </h3>
                        <div className="space-y-2">
                          {(insights?.challenges || []).map((challenge, index) => (
                            <div key={index} className="flex items-center gap-2 text-gray-300">
                              <TrendingUp className="w-4 h-4 text-orange-400" />
                              <span className="capitalize">{challenge}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                    {/* Styles & Recommendations */}
                    <div className="space-y-6">
                      {/* Personal Styles */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="glass rounded-2xl p-6"
                      >
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Brain className="w-5 h-5 text-blue-400" />
                          Personal Styles
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-purple-400">{t.workStyle}</h4>
                            <p className="text-sm text-gray-300">{insights?.work_style || 'Not available'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-purple-400">{t.socialStyle}</h4>
                            <p className="text-sm text-gray-300">{insights?.social_style || 'Not available'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-purple-400">{t.decisionStyle}</h4>
                            <p className="text-sm text-gray-300">{insights?.decision_style || 'Not available'}</p>
                          </div>
                        </div>
                      </motion.div>
                      {/* Recommendations */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4 }}
                        className="glass rounded-2xl p-6"
                      >
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-yellow-400" />
                          {t.recommendations}
                        </h3>
                        <div className="space-y-2">
                          {(insights?.recommendations || []).map((rec, index) => (
                            <div key={index} className="flex items-center gap-2 text-gray-300">
                              <Zap className="w-4 h-4 text-purple-400" />
                              <span className="capitalize">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: showDetails ? 1.6 : 0.8 }}
              className="flex justify-center mt-8"
            >
              <button
                onClick={onContinue}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                {t.continue}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
