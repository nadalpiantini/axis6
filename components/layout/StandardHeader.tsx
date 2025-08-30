'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Bell,
  Settings,
  User,
  LogOut,
  Sparkles,
  Flame,
  TrendingUp,
  Calendar,
  Trophy,
  ChevronLeft,
  Home,
  BarChart3,
  Target,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, memo } from 'react'

import { LogoIcon } from '@/components/ui/Logo'

interface StandardHeaderProps {
  user?: any
  onLogout?: () => void
  completionPercentage?: number
  currentStreak?: number
  variant?: 'dashboard' | 'profile' | 'settings' | 'analytics' | 'default'
  showBackButton?: boolean
  backUrl?: string
  title?: string
  subtitle?: string
}

export const StandardHeader = memo<StandardHeaderProps>(({
  user,
  onLogout,
  completionPercentage = 0,
  currentStreak = 0,
  variant = 'default',
  showBackButton = false,
  backUrl = '/dashboard',
  title,
  subtitle
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const [showDropdown, setShowDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 50], [0.95, 1])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (showDropdown) {
      const handleClickOutside = () => setShowDropdown(false)
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
    return undefined
  }, [showDropdown])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const getUserInitial = () => {
    const email = user?.email || ''
    return email.charAt(0).toUpperCase()
  }

  const getUserName = () => {
    const email = user?.email || ''
    return email.split('@')[0]
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      router.push('/auth/login')
    }
  }

  const navigationItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/my-day', icon: Calendar, label: 'Mi Día' },
    { href: '/chat', icon: MessageSquare, label: 'Chat' },
    { href: '/analytics', icon: BarChart3, label: 'Análisis' },
    { href: '/achievements', icon: Trophy, label: 'Logros' },
    { href: '/profile', icon: User, label: 'Perfil' }
  ]

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{ opacity: headerOpacity }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-premium backdrop-blur-md' : 'glass backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo and Title */}
            <div className="flex items-center gap-4">
              {showBackButton && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(backUrl)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label="Volver"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-300" />
                </motion.button>
              )}

              <Link href="/dashboard" className="flex items-center gap-3">
                <LogoIcon size="md" className="h-10 w-10" />
                <div>
                  <h1 className="text-lg font-bold text-white">
                    {title || 'AXIS6'}
                  </h1>
                  {subtitle ? (
                    <p className="text-xs text-gray-400 -mt-0.5">{subtitle}</p>
                  ) : user && (
                    <p className="text-xs text-gray-400 -mt-0.5">
                      {getGreeting()}, {getUserName()}
                    </p>
                  )}
                </div>
              </Link>
            </div>

            {/* Center Section - Progress or Navigation */}
            {variant === 'dashboard' && completionPercentage > 0 && (
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-300">Balance del día:</span>
                  <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #A6C26F, #365D63, #D36C50, #6F3D56, #2C3E50, #C85729)',
                        width: `${completionPercentage}%`
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white">{completionPercentage}%</span>
                </div>
              </div>
            )}

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                )
              })}
            </nav>

            {/* Right Section - User Actions */}
            <div className="flex items-center gap-3">
              {/* Streak Display */}
              {currentStreak > 0 && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full glass">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-medium text-white">
                    {currentStreak} {currentStreak === 1 ? 'día' : 'días'}
                  </span>
                </div>
              )}

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors relative"
                aria-label="Notificaciones"
              >
                <Bell className="w-5 h-5 text-gray-300" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-400 rounded-full" />
              </motion.button>

              {/* Settings - Desktop Only */}
              <Link
                href="/settings"
                className="hidden sm:block p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Configuración"
              >
                <Settings className="w-5 h-5 text-gray-300" />
              </Link>

              {/* User Menu */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDropdown(!showDropdown)
                  }}
                  className="flex items-center gap-2 p-2 pr-3 rounded-lg glass hover:bg-white/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-physical to-spiritual flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {getUserInitial()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-200 hidden sm:block max-w-[100px] truncate">
                    {getUserName()}
                  </span>
                </motion.button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 glass-premium rounded-lg overflow-hidden shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href="/profile"
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <User className="w-4 h-4" />
                      Mi Perfil
                    </Link>
                    <Link
                      href="/settings"
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 transition-colors flex items-center gap-3 sm:hidden"
                    >
                      <Settings className="w-4 h-4" />
                      Configuración
                    </Link>
                    <div className="border-t border-white/10" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Progress Bar */}
          {variant === 'dashboard' && completionPercentage > 0 && (
            <div className="md:hidden px-4 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Balance:</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #A6C26F, #365D63, #D36C50)',
                      width: `${completionPercentage}%`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-white">{completionPercentage}%</span>
              </div>
            </div>
          )}

          {/* Mobile Navigation */}
          <nav className="md:hidden border-t border-white/10 px-2 py-2" aria-label="Mobile navigation">
            <div className="flex items-center justify-around">
              {navigationItems.slice(0, 4).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                      isActive
                        ? 'text-white bg-white/10'
                        : 'text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className={variant === 'dashboard' ? 'h-32 md:h-16' : 'h-28 md:h-16'} />
    </>
  )
})

StandardHeader.displayName = 'StandardHeader'
