'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Heart, 
  Users, 
  Target, 
  Zap,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles
} from 'lucide-react'
import React, { useState, useMemo, memo } from 'react'
import { cn } from '@/lib/utils'

interface TemperamentProfile {
  id: string
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
  }
  completed_at: string
}

interface PsychologicalHexagonProps {
  temperamentProfile: TemperamentProfile
  size?: number
  animate?: boolean
  showInsights?: boolean
  className?: string
}

// Temperament configuration matching psychological theory
const TEMPERAMENT_CONFIG = [
  { 
    key: 'sanguine', 
    label: 'Sanguine', 
    subtitle: 'The Enthusiast',
    color: '#FF6B6B', 
    icon: Users,
    angle: 0,
    description: 'Social, optimistic, and people-focused'
  },
  { 
    key: 'choleric', 
    label: 'Choleric', 
    subtitle: 'The Leader',
    color: '#4ECDC4', 
    icon: Target,
    angle: 90,
    description: 'Goal-oriented, decisive, and action-focused'
  },
  { 
    key: 'melancholic', 
    label: 'Melancholic', 
    subtitle: 'The Analyst',
    color: '#45B7D1', 
    icon: Brain,
    angle: 180,
    description: 'Analytical, detail-oriented, and perfectionist'
  },
  { 
    key: 'phlegmatic', 
    label: 'Phlegmatic', 
    subtitle: 'The Peacemaker',
    color: '#96CEB4', 
    icon: Heart,
    angle: 270,
    description: 'Peaceful, diplomatic, and harmony-seeking'
  }
] as const

export const PsychologicalHexagon = memo(function PsychologicalHexagon({
  temperamentProfile,
  size = 300,
  animate = true,
  showInsights = true,
  className
}: PsychologicalHexagonProps) {
  const [selectedTemperament, setSelectedTemperament] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Convert temperament scores to 0-100 scale for visualization
  const visualizationData = useMemo(() => {
    const scores = temperamentProfile.temperament_scores
    return {
      sanguine: Math.round(scores.sanguine * 100),
      choleric: Math.round(scores.choleric * 100),
      melancholic: Math.round(scores.melancholic * 100),
      phlegmatic: Math.round(scores.phlegmatic * 100)
    }
  }, [temperamentProfile.temperament_scores])

  // Calculate hexagon dimensions
  const dimensions = useMemo(() => {
    const center = size / 2
    const radius = size * 0.35
    const labelDistance = radius * 1.4
    return { center, radius, labelDistance }
  }, [size])

  // Calculate square points (4 temperaments in square formation)
  const temperamentPoints = useMemo(() => 
    TEMPERAMENT_CONFIG.map((temp) => {
      const angleRad = (temp.angle * Math.PI) / 180
      const x = dimensions.center + dimensions.radius * Math.cos(angleRad)
      const y = dimensions.center + dimensions.radius * Math.sin(angleRad)
      return { ...temp, x, y }
    }),
    [dimensions]
  )

  // Calculate data polygon points
  const dataPoints = useMemo(() => {
    return TEMPERAMENT_CONFIG.map((temp) => {
      const value = (visualizationData[temp.key as keyof typeof visualizationData] || 0) / 100
      const angleRad = (temp.angle * Math.PI) / 180
      const x = dimensions.center + dimensions.radius * value * Math.cos(angleRad)
      const y = dimensions.center + dimensions.radius * value * Math.sin(angleRad)
      return `${x},${y}`
    }).join(' ')
  }, [visualizationData, dimensions])

  // Calculate label positions
  const labelPositions = useMemo(() => 
    TEMPERAMENT_CONFIG.map((temp) => {
      const angleRad = (temp.angle * Math.PI) / 180
      const x = dimensions.center + dimensions.labelDistance * Math.cos(angleRad)
      const y = dimensions.center + dimensions.labelDistance * Math.sin(angleRad)
      return { ...temp, x, y }
    }),
    [dimensions]
  )

  const getPrimaryTemperamentData = () => {
    return TEMPERAMENT_CONFIG.find(t => 
      t.key === temperamentProfile.primary_temperament
    ) || TEMPERAMENT_CONFIG[0]
  }

  const getTemperamentInsights = (temperamentKey: string) => {
    const insights = temperamentProfile.personality_insights
    
    // Base insights for each temperament type
    const temperamentInsights: Record<string, any> = {
      sanguine: {
        strengths: ['Enthusiastic', 'Social', 'Optimistic', 'Charismatic', 'Adaptable'],
        challenges: ['Disorganized', 'Impulsive', 'Struggles with details', 'Attention-seeking'],
        workTips: ['Seek collaborative environments', 'Use social accountability', 'Break tasks into fun chunks'],
        improvementAreas: ['Time management', 'Follow-through', 'Detail orientation']
      },
      choleric: {
        strengths: ['Decisive', 'Goal-oriented', 'Natural leader', 'Efficient', 'Results-driven'],
        challenges: ['Impatient', 'Domineering', 'Insensitive to others', 'Workaholic tendencies'],
        workTips: ['Set clear deadlines', 'Focus on results', 'Delegate effectively'],
        improvementAreas: ['Patience', 'Emotional intelligence', 'Work-life balance']
      },
      melancholic: {
        strengths: ['Analytical', 'Detail-oriented', 'Creative', 'Reliable', 'High standards'],
        challenges: ['Perfectionist', 'Pessimistic', 'Overthinking', 'Procrastination'],
        workTips: ['Allow time for planning', 'Create structured workflows', 'Set realistic standards'],
        improvementAreas: ['Flexibility', 'Speed over perfection', 'Positive mindset']
      },
      phlegmatic: {
        strengths: ['Diplomatic', 'Patient', 'Reliable', 'Good listener', 'Team player'],
        challenges: ['Indecisive', 'Passive', 'Resistant to change', 'Avoids conflict'],
        workTips: ['Set gentle deadlines', 'Provide clear structure', 'Value stability'],
        improvementAreas: ['Assertiveness', 'Initiative-taking', 'Embracing change']
      }
    }

    return temperamentInsights[temperamentKey] || temperamentInsights.melancholic
  }

  const primaryTemp = getPrimaryTemperamentData()

  return (
    <div className={cn("relative", className)}>
      {/* Main Hexagon Visualization */}
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background grid lines */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
            <polygon
              key={scale}
              points={TEMPERAMENT_CONFIG.map((temp) => {
                const angleRad = (temp.angle * Math.PI) / 180
                const x = dimensions.center + dimensions.radius * scale * Math.cos(angleRad)
                const y = dimensions.center + dimensions.radius * scale * Math.sin(angleRad)
                return `${x},${y}`
              }).join(' ')}
              fill="none"
              stroke="#374151"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}

          {/* Axis lines */}
          {temperamentPoints.map((point, index) => (
            <line
              key={index}
              x1={dimensions.center}
              y1={dimensions.center}
              x2={point.x}
              y2={point.y}
              stroke="#374151"
              strokeWidth="1"
              opacity="0.4"
            />
          ))}

          {/* Data polygon */}
          {animate ? (
            <motion.polygon
              points={dataPoints}
              fill={`${primaryTemp.color}20`}
              stroke={primaryTemp.color}
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          ) : (
            <polygon
              points={dataPoints}
              fill={`${primaryTemp.color}20`}
              stroke={primaryTemp.color}
              strokeWidth="2"
            />
          )}

          {/* Temperament points */}
          {temperamentPoints.map((point, index) => {
            const score = visualizationData[point.key as keyof typeof visualizationData]
            const isPrimary = point.key === temperamentProfile.primary_temperament
            const isSecondary = point.key === temperamentProfile.secondary_temperament

            return (
              <motion.g key={point.key}>
                {/* Point circle */}
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r={isPrimary ? "8" : isSecondary ? "6" : "4"}
                  fill={point.color}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer"
                  onClick={() => setSelectedTemperament(
                    selectedTemperament === point.key ? null : point.key
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.2 }}
                />
                
                {/* Primary indicator */}
                {isPrimary && (
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r="12"
                    fill="none"
                    stroke={point.color}
                    strokeWidth="2"
                    strokeDasharray="3,3"
                    initial={{ opacity: 0, rotate: 0 }}
                    animate={{ opacity: 0.7, rotate: 360 }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "linear",
                      delay: 1 
                    }}
                  />
                )}
              </motion.g>
            )
          })}

          {/* Center percentage */}
          <text
            x={dimensions.center}
            y={dimensions.center}
            textAnchor="middle"
            dy="0.35em"
            className="fill-white text-2xl font-bold"
          >
            {Math.round(Object.values(visualizationData).reduce((a, b) => a + b, 0) / 4)}%
          </text>
          <text
            x={dimensions.center}
            y={dimensions.center + 20}
            textAnchor="middle"
            dy="0.35em"
            className="fill-gray-400 text-xs"
          >
            Overall Balance
          </text>
        </svg>

        {/* Labels */}
        <div className="absolute inset-0 pointer-events-none">
          {labelPositions.map((label) => {
            const score = visualizationData[label.key as keyof typeof visualizationData]
            const isPrimary = label.key === temperamentProfile.primary_temperament
            const Icon = label.icon

            return (
              <div
                key={label.key}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                style={{
                  left: label.x,
                  top: label.y
                }}
              >
                <motion.div
                  className={cn(
                    "flex flex-col items-center cursor-pointer",
                    "p-2 rounded-lg transition-all",
                    isPrimary ? "bg-white/10 border border-white/20" : "hover:bg-white/5"
                  )}
                  onClick={() => setSelectedTemperament(
                    selectedTemperament === label.key ? null : label.key
                  )}
                  whileHover={{ scale: 1.05 }}
                >
                  <div 
                    className="p-2 rounded-full mb-1"
                    style={{ backgroundColor: `${label.color}20` }}
                  >
                    <Icon 
                      className="w-4 h-4" 
                      style={{ color: label.color }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-white">
                      {label.label}
                    </div>
                    <div className="text-xs text-gray-400">
                      {score}%
                    </div>
                    {isPrimary && (
                      <div className="flex items-center gap-1 mt-1">
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs text-yellow-400">Primary</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )
          })}
        </div>

        {/* Toggle Details Button */}
        <motion.button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-6 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Info className="w-4 h-4" />
          {showDetails ? 'Hide Details' : 'Show Insights'}
        </motion.button>
      </div>

      {/* Detailed Insights Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-6"
          >
            {/* Primary Temperament Overview */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="p-3 rounded-full"
                  style={{ backgroundColor: `${primaryTemp.color}20` }}
                >
                  <primaryTemp.icon 
                    className="w-6 h-6" 
                    style={{ color: primaryTemp.color }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {primaryTemp.label} - {primaryTemp.subtitle}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Your dominant temperament ({Math.round(temperamentProfile.temperament_scores[temperamentProfile.primary_temperament as keyof typeof temperamentProfile.temperament_scores] * 100)}%)
                  </p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">{primaryTemp.description}</p>
            </div>

            {/* Insights Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h4 className="text-lg font-semibold text-white">Strengths</h4>
                </div>
                <div className="space-y-2">
                  {getTemperamentInsights(temperamentProfile.primary_temperament).strengths.slice(0, 3).map((strength: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-gray-300 text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Areas for Growth */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <h4 className="text-lg font-semibold text-white">Growth Areas</h4>
                </div>
                <div className="space-y-2">
                  {getTemperamentInsights(temperamentProfile.primary_temperament).improvementAreas.slice(0, 3).map((area: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-gray-300 text-sm">{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Style */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">Work Style</h4>
                </div>
                <p className="text-gray-300 text-sm">
                  {temperamentProfile.personality_insights.work_style}
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Recommendations:</p>
                  {getTemperamentInsights(temperamentProfile.primary_temperament).workTips.slice(0, 2).map((tip: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-gray-300 text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Style */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h4 className="text-lg font-semibold text-white">Social Style</h4>
                </div>
                <p className="text-gray-300 text-sm">
                  {temperamentProfile.personality_insights.social_style}
                </p>
              </div>
            </div>

            {/* Secondary Temperament */}
            {temperamentProfile.secondary_temperament && temperamentProfile.secondary_temperament !== temperamentProfile.primary_temperament && (
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="text-lg font-semibold text-white">Secondary Temperament</h4>
                    <p className="text-gray-400 text-sm">
                      {TEMPERAMENT_CONFIG.find(t => t.key === temperamentProfile.secondary_temperament)?.label} - Balances your primary traits
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  Your secondary {temperamentProfile.secondary_temperament} traits provide balance and complement your primary {temperamentProfile.primary_temperament} nature.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Temperament Modal */}
      <AnimatePresence>
        {selectedTemperament && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTemperament(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const tempData = TEMPERAMENT_CONFIG.find(t => t.key === selectedTemperament)!
                const insights = getTemperamentInsights(selectedTemperament)
                const score = visualizationData[selectedTemperament as keyof typeof visualizationData]

                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="p-3 rounded-full"
                        style={{ backgroundColor: `${tempData.color}20` }}
                      >
                        <tempData.icon 
                          className="w-6 h-6" 
                          style={{ color: tempData.color }}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {tempData.label}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {score}% strength • {tempData.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Key Strengths
                        </h4>
                        <div className="space-y-1">
                          {insights.strengths.slice(0, 3).map((strength: string, index: number) => (
                            <div key={index} className="text-gray-300 text-sm">• {strength}</div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Watch Out For
                        </h4>
                        <div className="space-y-1">
                          {insights.challenges.slice(0, 3).map((challenge: string, index: number) => (
                            <div key={index} className="text-gray-300 text-sm">• {challenge}</div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedTemperament(null)}
                      className="mt-6 w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                  </>
                )
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})