'use client'

import { motion } from 'framer-motion'
import { Focus, Users, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { usePreferencesStore } from '@/lib/stores/useAppStore'

interface FocusSettingsProps {
  className?: string
}

export function FocusSettings({ className = '' }: FocusSettingsProps) {
  const {
    adhdFocusMode,
    setAdhdFocusMode,
    showResonance,
    setShowResonance,
    showCommunityMetrics,
    setShowCommunityMetrics,
    showAnimations,
    setShowAnimations
  } = usePreferencesStore()

  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ADHD Focus Mode Section */}
      <motion.div
        className="glass rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Focus className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Focus Mode</h3>
              <p className="text-xs text-gray-400">ADHD-friendly interface</p>
            </div>
          </div>

          <button
            onClick={() => setAdhdFocusMode(!adhdFocusMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              adhdFocusMode ? 'bg-purple-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                adhdFocusMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {adhdFocusMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20"
          >
            <h4 className="text-xs font-medium text-purple-300 mb-2">Focus Mode Features</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Single-column layout</li>
              <li>• Larger text and buttons</li>
              <li>• Reduced visual noise</li>
              <li>• Minimal metrics display</li>
              <li>• One action at a time</li>
            </ul>
          </motion.div>
        )}
      </motion.div>

      {/* Social Features Section */}
      <motion.div
        className="glass rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Community Balance</h3>
              <p className="text-xs text-gray-400">Subtle social connections</p>
            </div>
          </div>

          <button
            onClick={() => toggleSection('social')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {expandedSection === 'social' ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="space-y-3">
          {/* Resonance Dots Setting */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Resonance Dots</p>
              <p className="text-xs text-gray-400">See when others complete same axes</p>
            </div>
            <button
              onClick={() => setShowResonance(!showResonance)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                showResonance ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  showResonance ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Community Metrics Setting */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Community Metrics</p>
              <p className="text-xs text-gray-400">Anonymous completion counts</p>
            </div>
            <button
              onClick={() => setShowCommunityMetrics(!showCommunityMetrics)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                showCommunityMetrics ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  showCommunityMetrics ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {expandedSection === 'social' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"
          >
            <h4 className="text-xs font-medium text-blue-300 mb-2">Community Balance Philosophy</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your hexagon resonates with others who find balance in the same axes.
              No usernames, no competition - just the gentle awareness that you're
              part of a community seeking balance together.
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Visual Preferences Section */}
      <motion.div
        className="glass rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-pink-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Visual Effects</h3>
            <p className="text-xs text-gray-400">Animations and transitions</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Animations</p>
            <p className="text-xs text-gray-400">
              {showAnimations ? 'Smooth transitions enabled' : 'Reduced motion for focus'}
            </p>
          </div>
          <button
            onClick={() => setShowAnimations(!showAnimations)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              showAnimations ? 'bg-pink-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                showAnimations ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </motion.div>

      {/* Focus Mode Impact Notice */}
      {adhdFocusMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <Focus className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-medium text-purple-300">Focus Mode Active</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your dashboard will show a simplified, single-column layout with larger elements
            and reduced visual complexity. Perfect for maintaining focus on one axis at a time.
          </p>
        </motion.div>
      )}
    </div>
  )
}