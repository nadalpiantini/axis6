'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
    id: 'focus',
    name: 'Focus & Community',
    description: 'ADHD modes and subtle social features',
    href: '/settings/focus',
    icon: Brain,
    isNew: true
  },
  {
    id: 'account',
    name: 'Account',
    description: 'Profile, preferences, and display settings',
    href: '/settings/account',
    icon: User
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Smart alerts, reminders, and delivery preferences',
    href: '/settings/notifications',
    icon: Bell,
    badge: 'AI'
  },
  {
    id: 'privacy',
    name: 'Privacy & Data',
    description: 'Data visibility, sharing, and AI analytics controls',
    href: '/settings/privacy',
    icon: Shield
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Password, 2FA, sessions, and security audit',
    href: '/settings/security',
    icon: Lock
  },
  {
    id: 'personalization',
    name: 'AI Personalization',
    description: 'Temperament, coaching insights, and behavior analysis',
    href: '/settings/personalization',
    icon: Brain,
    isNew: true
  },
  {
    id: 'axis-customization',
    name: 'Axis Customization',
    description: 'Colors, icons, activities, and goal preferences',
    href: '/settings/axis-customization',
    icon: Target
  },
  {
    id: 'wellness',
    name: 'Wellness',
    description: 'Streaks, goals, motivation, and progress tracking',
    href: '/settings/wellness',
    icon: Heart
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Developer settings, data management, and experimental features',
    href: '/settings/advanced',
    icon: SettingsIcon
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
            <div>
              <h1 className="text-lg font-semibold">{activeSectionData?.name || title}</h1>
              <p className="text-sm text-gray-400">{activeSectionData?.description || subtitle}</p>
            </div>
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
          <div className="hidden lg:block mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold">{activeSectionData?.name || title}</h1>
                <p className="text-gray-400">{activeSectionData?.description || subtitle}</p>
              </div>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-400">
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Dashboard
              </Link>
              <ChevronLeft className="w-4 h-4 rotate-180" />
              <Link href="/settings" className="hover:text-white transition-colors">
                Settings
              </Link>
              {activeSection !== 'overview' && activeSectionData && (
                <>
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  <span className="text-white">{activeSectionData.name}</span>
                </>
              )}
            </nav>
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
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <SettingsIcon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">Overview</h4>
            <p className="text-xs text-gray-400">Settings dashboard</p>
          </div>
        </Link>
      </div>

      {/* Settings Sections */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Categories
        </h4>
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
              <div className={`p-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-purple-500/30' 
                  : 'bg-white/10 group-hover:bg-white/20'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{section.name}</h4>
                  {section.badge && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full">
                      {section.badge}
                    </span>
                  )}
                  {section.isNew && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs font-medium rounded-full">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{section.description}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
        <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <Link
            href="/settings/account"
            onClick={onSectionClick}
            className="block text-sm text-gray-400 hover:text-white transition-colors"
          >
            Export Data
          </Link>
          <Link
            href="/settings/security"
            onClick={onSectionClick}
            className="block text-sm text-gray-400 hover:text-white transition-colors"
          >
            Security Check
          </Link>
          <Link
            href="/settings/personalization"
            onClick={onSectionClick}
            className="block text-sm text-gray-400 hover:text-white transition-colors"
          >
            Retake Assessment
          </Link>
        </div>
      </div>

      {/* Settings Version */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-xs text-gray-500">
          Settings v2.0 • Enhanced with AI
        </p>
      </div>
    </div>
  )
}