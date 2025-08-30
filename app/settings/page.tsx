'use client'

import { motion } from 'framer-motion'
import {
  User,
  Bell,
  Shield,
  Brain,
  Target,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { useUser } from '@/lib/react-query/hooks'

interface SettingsOverviewCard {
  id: string
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const OVERVIEW_CARDS: SettingsOverviewCard[] = [
  {
    id: 'account',
    title: 'Profile & Account',
    description: 'Personal information, preferences, and data management',
    href: '/settings/account',
    icon: User
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Reminders and alerts for your wellness journey',
    href: '/settings/notifications',
    icon: Bell
  },
  {
    id: 'axis',
    title: 'Axis & Wellness',
    description: 'Customize categories, goals, and tracking preferences',
    href: '/settings/axis-customization',
    icon: Target
  },
  {
    id: 'focus',
    title: 'Focus Mode',
    description: 'ADHD-friendly options and AI personalization',
    href: '/settings/focus',
    icon: Brain
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Password and privacy protection',
    href: '/settings/security',
    icon: Shield
  }
]

export default function SettingsPage() {
  const { data: user } = useUser()

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
        {/* Settings Categories - Clean and Simple */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Settings</h1>
            <p className="text-gray-400 text-sm">Manage your AXIS6 experience</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {OVERVIEW_CARDS.map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.id} href={card.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group p-5 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <Icon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                          <p className="text-sm text-gray-400 mt-1">{card.description}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                    </div>
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
