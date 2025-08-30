'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Bell,
  Shield,
  Lock,
  Brain,
  Target,
  Heart,
  Settings as SettingsIcon,
  ChevronLeft,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface SettingsSection {
  id: string
  name: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  isNew?: boolean
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'account',
    name: 'Profile & Account',
    description: 'Personal information and preferences',
    href: '/settings/account',
    icon: User
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Reminders and alerts',
    href: '/settings/notifications',
    icon: Bell
  },
  {
    id: 'axis-customization',
    name: 'Axis & Wellness',
    description: 'Categories and goals',
    href: '/settings/axis-customization',
    icon: Target
  },
  {
    id: 'focus',
    name: 'Focus Mode',
    description: 'ADHD-friendly options',
    href: '/settings/focus',
    icon: Brain
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Password and privacy',
    href: '/settings/security',
    icon: Shield
  }
]

interface SettingsLayoutProps {
  children: React.ReactNode
  currentSection?: string
  title?: string
  subtitle?: string
}

export function SettingsLayout({
  children,
  currentSection,
  title = 'Settings',
  subtitle = 'Customize your AXIS6 experience'
}: SettingsLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Determine active section
  const activeSection = currentSection || SETTINGS_SECTIONS.find(section =>
    pathname.startsWith(section.href)
  )?.id || 'overview'

  const activeSectionData = SETTINGS_SECTIONS.find(s => s.id === activeSection)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 text-white">
      {/* Mobile header */}
      <div className="lg:hidden bg-black/20 backdrop-blur-md border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">{activeSectionData?.name || 'Settings'}</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Open settings menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 bg-black/20 backdrop-blur-md border-r border-white/10 h-screen sticky top-0 overflow-y-auto">
          <SettingsSidebar
            sections={SETTINGS_SECTIONS}
            activeSection={activeSection}
            onSectionClick={() => {}}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="lg:hidden fixed left-0 top-0 h-full w-80 bg-black/90 backdrop-blur-md border-r border-white/10 z-50 overflow-y-auto"
              >
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Settings</h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      aria-label="Close settings menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <SettingsSidebar
                  sections={SETTINGS_SECTIONS}
                  activeSection={activeSection}
                  onSectionClick={() => setSidebarOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 lg:p-8 p-4">
          {/* Desktop Header */}
          {/* Desktop Header - Simplified */}
          <div className="hidden lg:block mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">{activeSectionData?.name || 'Settings'}</h1>
            </div>
          </div>

          {/* Content Area */}
          <div className="max-w-6xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

interface SettingsSidebarProps {
  sections: SettingsSection[]
  activeSection: string
  onSectionClick: () => void
}

function SettingsSidebar({ sections, activeSection, onSectionClick }: SettingsSidebarProps) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Settings</h3>
        <p className="text-sm text-gray-400">Configure your AXIS6 experience</p>
      </div>

      {/* Settings Overview Link */}
      <div className="mb-6">
        <Link
          href="/settings"
          onClick={onSectionClick}
          className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
            activeSection === 'overview'
              ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
              : 'hover:bg-white/5 border border-transparent hover:border-white/10'
          }`}
        >
          <div className="p-2 rounded-lg bg-purple-500/10">
            <SettingsIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">Settings</h4>
          </div>
        </Link>
      </div>

      {/* Settings Sections */}
      <div className="space-y-2">
        {sections.map((section) => {
          const isActive = activeSection === section.id
          const Icon = section.icon

          return (
            <Link
              key={section.id}
              href={section.href}
              onClick={onSectionClick}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                isActive
                  ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                  : 'hover:bg-white/5 border border-transparent hover:border-white/10'
              }`}
            >
              <Icon className="w-4 h-4 text-purple-400" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{section.name}</h4>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
