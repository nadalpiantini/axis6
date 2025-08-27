'use client'

import { motion } from 'framer-motion'
import { 
  User,
  Bell,
  Shield,
  Lock,
  Brain,
  Target,
  Heart,
  Settings as SettingsIcon,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { useUser } from '@/lib/react-query/hooks'

interface SettingsOverviewCard {
  id: string
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  badge?: string
  isNew?: boolean
  stats?: {
    label: string
    value: string | number
  }
}

const OVERVIEW_CARDS: SettingsOverviewCard[] = [
  {
    id: 'focus',
    title: 'Focus & Community',
    description: 'ADHD-friendly modes, social features, and minimal connection',
    href: '/settings/focus',
    icon: Brain,
    color: '#4ECDC4',
    isNew: true,
    stats: { label: 'Mode', value: 'Standard' }
  },
  {
    id: 'account',
    title: 'Account Preferences',
    description: 'Profile information, display preferences, and data export',
    href: '/settings/account',
    icon: User,
    color: '#9B8AE6',
    stats: { label: 'Profile', value: 'Complete' }
  },
  {
    id: 'notifications',
    title: 'Smart Notifications',
    description: 'AI-powered alerts, reminders, and optimal timing',
    href: '/settings/notifications',
    icon: Bell,
    color: '#FFD166',
    badge: 'AI',
    stats: { label: 'Active', value: 8 }
  },
  {
    id: 'privacy',
    title: 'Privacy & Data',
    description: 'Control data sharing, AI analytics, and visibility settings',
    href: '/settings/privacy',
    icon: Shield,
    color: '#65D39A',
    stats: { label: 'Protection', value: 'High' }
  },
  {
    id: 'security',
    title: 'Security Settings',
    description: 'Password, two-factor auth, and session management',
    href: '/settings/security',
    icon: Lock,
    color: '#FF8B7D',
    stats: { label: '2FA', value: 'Enabled' }
  },
  {
    id: 'personalization',
    title: 'AI Personalization',
    description: 'Temperament-based coaching, insights, and recommendations',
    href: '/settings/personalization',
    icon: Brain,
    color: '#4ECDC4',
    isNew: true,
    stats: { label: 'Insights', value: 12 }
  },
  {
    id: 'axis',
    title: 'Axis Customization',
    description: 'Colors, icons, activities, and category preferences',
    href: '/settings/axis-customization',
    icon: Target,
    color: '#F97B8B',
    stats: { label: 'Customized', value: '6/6' }
  },
  {
    id: 'wellness',
    title: 'Wellness Preferences',
    description: 'Streaks, goals, motivation style, and progress tracking',
    href: '/settings/wellness',
    icon: Heart,
    color: '#A78BFA',
    stats: { label: 'Goals', value: 'Active' }
  },
  {
    id: 'advanced',
    title: 'Advanced Settings',
    description: 'Developer options, data management, experimental features',
    href: '/settings/advanced',
    icon: SettingsIcon,
    color: '#6B7280',
    stats: { label: 'Features', value: 'Beta' }
  }
]

export default function SettingsPage() {
  const { data: user } = useUser()

  // Get user's current settings status for display
  const getSettingsStatus = () => {
    // This would typically come from API calls to check user's settings completion
    return {
      profileComplete: true,
      notificationsConfigured: 8,
      securityLevel: 'High',
      twoFactorEnabled: true,
      aiInsights: 12,
      axisCustomization: '6/6',
      goalsActive: true,
      betaFeatures: true
    }
  }

  const status = getSettingsStatus()

  return (
    <div 
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
    >
      <SettingsLayout currentSection="overview">
      {/* Welcome Section */}
      <SettingsSection 
        title="Settings Overview"
        description="Customize your AXIS6 experience with powerful personalization options"
        icon={SettingsIcon}
        className="mb-4 sm:mb-6 lg:mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {/* Quick Stats */}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg sm:rounded-xl border border-green-500/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-400">Profile</p>
                  <p className="text-sm sm:text-base font-semibold text-green-400">Complete</p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg sm:rounded-xl border border-purple-500/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-400">AI Features</p>
                  <p className="text-sm sm:text-base font-semibold text-purple-400">Active</p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg sm:rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-400">Security</p>
                  <p className="text-sm sm:text-base font-semibold text-blue-400">High</p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg sm:rounded-xl border border-orange-500/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-400">Optimization</p>
                  <p className="text-sm sm:text-base font-semibold text-orange-400 tabular-nums">92%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Settings Categories */}
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 px-1">All Settings</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {OVERVIEW_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.id} href={card.href}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="group p-4 sm:p-5 lg:p-6 glass rounded-lg sm:rounded-xl lg:rounded-2xl border border-white/10 hover:border-white/20 transition-all cursor-pointer touch-manipulation active:scale-95 min-h-[120px] sm:min-h-[140px] lg:min-h-[160px]"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                      <div 
                        className="p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl flex-shrink-0"
                        style={{ 
                          backgroundColor: `${card.color  }20`,
                          border: `1px solid ${card.color}30`
                        }}
                      >
                        <Icon 
                          className="w-5 h-5 sm:w-6 sm:h-6" 
                          style={{ color: card.color }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-base sm:text-lg font-semibold leading-tight">{card.title}</h3>
                          {card.badge && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full flex-shrink-0">
                              {card.badge}
                            </span>
                          )}
                          {card.isNew && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs font-medium rounded-full flex items-center gap-1 flex-shrink-0">
                              <Sparkles className="w-3 h-3" />
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-2">{card.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                  
                  {card.stats && (
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-white/10 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: card.color }} />
                        <span className="text-xs sm:text-sm text-gray-400">{card.stats.label}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium tabular-nums" style={{ color: card.color }}>
                        {card.stats.value}
                      </span>
                    </div>
                  )}
                </motion.div>
              </Link>
            )
          })}
        </div>
      </div>
      </SettingsLayout>
    </div>
  )
}