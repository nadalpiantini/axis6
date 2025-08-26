'use client'

import Link from 'next/link'
import { Sparkles, Brain, Heart, Users, Target, Briefcase, ChevronRight, Star, TrendingUp, Shield } from 'lucide-react'
import { LogoFull } from '@/components/ui/Logo'

import { motion } from 'framer-motion'

const axes = [
  { name: 'Spiritual', icon: Sparkles, color: 'from-purple-400 to-purple-600' },
  { name: 'Mental', icon: Brain, color: 'from-blue-400 to-blue-600' },
  { name: 'Emotional', icon: Heart, color: 'from-red-400 to-red-600' },
  { name: 'Social', icon: Users, color: 'from-green-400 to-green-600' },
  { name: 'Physical', icon: Target, color: 'from-orange-400 to-orange-600' },
  { name: 'Material', icon: Briefcase, color: 'from-yellow-400 to-yellow-600' },
]

const features = [
  { icon: Star, title: 'Gamification', description: 'Transform your personal development into an engaging game' },
  { icon: TrendingUp, title: 'Streaks', description: 'Maintain your progress and celebrate every achievement' },
  { icon: Shield, title: 'Privacy', description: 'Your data is safe and encrypted' },
]

export default function LandingPage() {
  return (
    <div 
      className="min-h-screen text-white"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
    >
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-3 sm:px-4 lg:px-6 overflow-hidden">
        {/* Enhanced animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-3xl -top-36 sm:-top-48 -left-36 sm:-left-48 animate-pulse" />
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-blue-500/20 rounded-full blur-3xl -bottom-36 sm:-bottom-48 -right-36 sm:-right-48 animate-pulse" />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-2 sm:px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-4 sm:mb-6 flex justify-center">
              <LogoFull size="xl" priority className="max-w-xs sm:max-w-sm md:max-w-md" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-white leading-tight px-2">
              Balance Your Life with AXIS6
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4 text-gray-300 px-2">
              Six axes. One you. Don't break your Axis.
            </p>
            <p className="text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 text-gray-400 max-w-xl lg:max-w-2xl mx-auto leading-relaxed px-2">
              Transform your life by achieving perfect balance across the 6 essential dimensions of human wellbeing.
            </p>
          </motion.div>

          {/* Enhanced CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-2"
          >
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 min-h-[48px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold text-base sm:text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-2 touch-manipulation active:scale-95"
            >
              Start Free <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 min-h-[48px] glass rounded-full font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 touch-manipulation active:scale-95"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Enhanced Mobile Hexagon Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 mx-auto max-w-[90vw]"
          >
            <svg viewBox="0 0 200 200" className="w-full h-full animate-float touch-manipulation">
              {axes.map((axis, index) => {
                const angle = (index * 60 - 90) * (Math.PI / 180)
                const x = 100 + 60 * Math.cos(angle)
                const y = 100 + 60 * Math.sin(angle)
                const Icon = axis.icon

                return (
                  <g key={axis.name}>
                    {/* Lines to center */}
                    <line
                      x1="100"
                      y1="100"
                      x2={x}
                      y2={y}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                    />
                    {/* Enhanced mobile icon circles */}
                    <circle
                      cx={x}
                      cy={y}
                      r="22"
                      className={`fill-gradient-to-br ${axis.color} cursor-pointer`}
                      fill="url(#gradient)"
                      opacity="0.8"
                    />
                    {/* Enhanced mobile icons */}
                    <foreignObject x={x - 10} y={y - 10} width="20" height="20">
                      <Icon className="w-5 h-5 text-white" />
                    </foreignObject>
                  </g>
                )
              })}
              {/* Enhanced mobile center circle */}
              <circle
                cx="100"
                cy="100"
                r="28"
                fill="rgba(139, 92, 246, 0.3)"
                stroke="rgba(139, 92, 246, 0.6)"
                strokeWidth="2"
                className="cursor-pointer"
              />
              <text
                x="100"
                y="105"
                textAnchor="middle"
                className="fill-white font-bold text-base sm:text-lg select-none"
              >
                YOU
              </text>
            </svg>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 lg:px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-10 lg:mb-12 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent px-2"
          >
            Why AXIS6?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 hover:bg-white/20 transition-all duration-300 touch-manipulation active:scale-95"
                >
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-3 sm:mb-4 text-purple-400" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Enhanced 6 Axes Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-10 lg:mb-12 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent px-2 leading-tight"
          >
            The 6 Dimensions of Balance
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {axes.map((axis, index) => {
              const Icon = axis.icon
              return (
                <motion.div
                  key={axis.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 hover:scale-105 transition-all duration-300 touch-manipulation active:scale-95"
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br ${axis.color} flex items-center justify-center mb-3 sm:mb-4`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{axis.name}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                    Develop and maintain balance in your {axis.name.toLowerCase()} dimension.
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 lg:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent px-2 leading-tight">
              Start your transformation today
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 px-2 leading-relaxed">
              Join thousands of people already balancing their lives with AXIS6
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 min-h-[48px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold text-base sm:text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 touch-manipulation active:scale-95"
            >
              Create Free Account <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-400">
              No credit card • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="py-6 sm:py-8 px-3 sm:px-4 lg:px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p className="text-xs sm:text-sm">&copy; 2024 AXIS6. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}