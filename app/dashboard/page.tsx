'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Brain, Heart, Users, Target, Briefcase, Trophy, Flame, Calendar, LogOut, Settings, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

const userAxes = [
  { id: 'spiritual', name: 'Espiritual', icon: Sparkles, color: '#9B8AE6', completed: false },
  { id: 'mental', name: 'Mental', icon: Brain, color: '#6AA6FF', completed: false },
  { id: 'emotional', name: 'Emocional', icon: Heart, color: '#FF8B7D', completed: false },
  { id: 'social', name: 'Social', icon: Users, color: '#65D39A', completed: false },
  { id: 'physical', name: 'Físico', icon: Target, color: '#FFB366', completed: false },
  { id: 'material', name: 'Material', icon: Briefcase, color: '#F97B8B', completed: false },
]

export default function DashboardPage() {
  const [axes, setAxes] = useState(userAxes)
  const [currentStreak, setCurrentStreak] = useState(3)
  const completedCount = axes.filter(a => a.completed).length
  const completionPercentage = (completedCount / axes.length) * 100

  const toggleAxis = (axisId: string) => {
    setAxes(axes.map(axis => 
      axis.id === axisId 
        ? { ...axis, completed: !axis.completed }
        : axis
    ))
  }

  // Calculate hexagon points for SVG
  const createHexagonPath = (size: number, centerX: number, centerY: number) => {
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const x = centerX + size * Math.cos(angle)
      const y = centerY + size * Math.sin(angle)
      points.push(`${x},${y}`)
    }
    return points.join(' ')
  }

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AXIS6
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-gray-300">Racha: {currentStreak} días</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/settings" className="p-2 hover:bg-white/10 rounded-lg transition">
              <Settings className="w-5 h-5" />
            </Link>
            <button className="p-2 hover:bg-white/10 rounded-lg transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">¡Hola, Alan! 👋</h2>
          <p className="text-gray-400">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Hexagon Section */}
          <div className="lg:col-span-2">
            <div className="glass rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Tu Equilibrio de Hoy</h3>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-400">Progreso</div>
                  <div className="text-2xl font-bold">{completedCount}/6</div>
                </div>
              </div>

              {/* Hexagon Visualization */}
              <div className="relative flex justify-center items-center">
                <svg width="400" height="400" viewBox="0 0 400 400" className="w-full h-auto max-w-md">
                  {/* Background hexagon */}
                  <polygon
                    points={createHexagonPath(150, 200, 200)}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="2"
                  />

                  {/* Progress hexagon */}
                  <polygon
                    points={createHexagonPath(150 * (completionPercentage / 100), 200, 200)}
                    fill="rgba(139, 92, 246, 0.2)"
                    stroke="rgba(139, 92, 246, 0.5)"
                    strokeWidth="2"
                  />

                  {/* Axis points */}
                  {axes.map((axis, index) => {
                    const angle = (Math.PI / 3) * index - Math.PI / 2
                    const x = 200 + 150 * Math.cos(angle)
                    const y = 200 + 150 * Math.sin(angle)
                    const Icon = axis.icon

                    return (
                      <g key={axis.id}>
                        {/* Connection lines */}
                        <line
                          x1="200"
                          y1="200"
                          x2={x}
                          y2={y}
                          stroke={axis.completed ? axis.color : 'rgba(255,255,255,0.1)'}
                          strokeWidth="2"
                          opacity={axis.completed ? 0.6 : 0.3}
                        />

                        {/* Axis circle */}
                        <circle
                          cx={x}
                          cy={y}
                          r="35"
                          fill={axis.completed ? axis.color : 'rgba(255,255,255,0.1)'}
                          opacity={axis.completed ? 0.8 : 0.3}
                          className="cursor-pointer transition-all duration-300 hover:opacity-100"
                          onClick={() => toggleAxis(axis.id)}
                        />

                        {/* Icon */}
                        <foreignObject x={x - 15} y={y - 15} width="30" height="30">
                          <Icon 
                            className="w-7 h-7 text-white cursor-pointer" 
                            onClick={() => toggleAxis(axis.id)}
                          />
                        </foreignObject>

                        {/* Label */}
                        <text
                          x={x}
                          y={y + 55}
                          textAnchor="middle"
                          className="fill-white text-sm font-medium"
                        >
                          {axis.name}
                        </text>
                      </g>
                    )
                  })}

                  {/* Center */}
                  <circle cx="200" cy="200" r="40" fill="rgba(139, 92, 246, 0.2)" />
                  <text
                    x="200"
                    y="205"
                    textAnchor="middle"
                    className="fill-white font-bold text-xl"
                  >
                    {Math.round(completionPercentage)}%
                  </text>
                </svg>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 flex justify-center gap-4">
                <button className="px-4 py-2 glass rounded-lg hover:bg-white/20 transition text-sm">
                  Ver Historial
                </button>
                <button className="px-4 py-2 glass rounded-lg hover:bg-white/20 transition text-sm">
                  Añadir Nota
                </button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="space-y-6">
            {/* Streak Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Tu Racha</h4>
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-4xl font-bold mb-2">{currentStreak} días</div>
              <div className="text-sm text-gray-400">¡Sigue así! 🔥</div>
              <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-red-400 transition-all duration-500"
                  style={{ width: `${Math.min((currentStreak / 7) * 100, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {7 - currentStreak} días para tu próximo logro
              </div>
            </motion.div>

            {/* Today's Focus */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Enfoque de Hoy</h4>
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div className="space-y-3">
                {axes.slice(0, 3).map(axis => {
                  const Icon = axis.icon
                  return (
                    <div key={axis.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${axis.color}20` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: axis.color }} />
                        </div>
                        <span className="text-sm">{axis.name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={axis.completed}
                        onChange={() => toggleAxis(axis.id)}
                        className="w-4 h-4 rounded"
                      />
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Logros Recientes</h4>
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                    🎯
                  </div>
                  <div>
                    <div className="text-sm font-medium">Primera Semana</div>
                    <div className="text-xs text-gray-400">7 días consecutivos</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-10 h-10 bg-gray-600/20 rounded-lg flex items-center justify-center">
                    🔒
                  </div>
                  <div>
                    <div className="text-sm font-medium">Maestro del Equilibrio</div>
                    <div className="text-xs text-gray-400">30 días perfectos</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass rounded-2xl p-6 text-center"
        >
          <p className="text-lg italic text-gray-300">
            "El equilibrio no es algo que encuentras, es algo que creas."
          </p>
          <p className="text-sm text-gray-400 mt-2">- Jana Kingsford</p>
        </motion.div>
      </div>
    </div>
  )
}