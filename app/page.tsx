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
    <div className="min-h-screen text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
          <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6 flex justify-center">
              <LogoFull size="xl" priority className="max-w-sm md:max-w-md" />
            </div>
            <p className="text-xl md:text-2xl mb-4 text-gray-300">
              Six axes. One you. Don't break your Axis.
            </p>
            <p className="text-lg mb-8 text-gray-400 max-w-2xl mx-auto">
              Transform your life by achieving perfect balance across the 6 essential dimensions of human wellbeing.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-2"
            >
              Start Free <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 glass rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Hexagon Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative w-80 h-80 mx-auto"
          >
            <svg viewBox="0 0 200 200" className="w-full h-full animate-float">
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
                    {/* Icon circles */}
                    <circle
                      cx={x}
                      cy={y}
                      r="25"
                      className={`fill-gradient-to-br ${axis.color}`}
                      fill="url(#gradient)"
                      opacity="0.8"
                    />
                    {/* Icons */}
                    <foreignObject x={x - 12} y={y - 12} width="24" height="24">
                      <Icon className="w-6 h-6 text-white" />
                    </foreignObject>
                  </g>
                )
              })}
              {/* Center circle */}
              <circle
                cx="100"
                cy="100"
                r="30"
                fill="rgba(139, 92, 246, 0.3)"
                stroke="rgba(139, 92, 246, 0.6)"
                strokeWidth="2"
              />
              <text
                x="100"
                y="105"
                textAnchor="middle"
                className="fill-white font-bold text-lg"
              >
                YOU
              </text>
            </svg>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            Why AXIS6?
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl p-6 hover:bg-white/20 transition-all duration-300"
                >
                  <Icon className="w-12 h-12 mb-4 text-purple-400" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 6 Axes Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent"
          >
            The 6 Dimensions of Balance
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {axes.map((axis, index) => {
              const Icon = axis.icon
              return (
                <motion.div
                  key={axis.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl p-6 hover:scale-105 transition-all duration-300"
                >
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${axis.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{axis.name}</h3>
                  <p className="text-gray-400 text-sm">
                    Develop and maintain balance in your {axis.name.toLowerCase()} dimension.
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12"
          >
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Start your transformation today
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of people already balancing their lives with AXIS6
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
            >
              Create Free Account <ChevronRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-sm text-gray-400">
              No credit card • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 AXIS6. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}