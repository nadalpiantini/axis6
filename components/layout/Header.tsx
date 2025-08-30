'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { Bell, Settings, User, LogOut, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'

import { LogoIcon } from '@/components/ui/Logo'

interface HeaderProps {
  user: any
  onLogout: () => void
  completionPercentage?: number
}

export default function Header({ user, onLogout, completionPercentage = 0 }: HeaderProps) {
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

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{ opacity: headerOpacity }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-premium' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo and Greeting - More Compact */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <LogoIcon size="sm" className="h-8 w-8" />
                <div className="hidden sm:block">
                  <h1 className="text-sm font-bold text-white">AXIS6</h1>
                  <p className="text-xs text-gray-400 -mt-1">
                    {getGreeting()}, {getUserName()}
                  </p>
                </div>
              </div>
            </div>

            {/* Center Progress Indicator - Desktop Only */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-gray-300">Balance del día:</span>
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: 'var(--gradient-wellness)',
                      width: `${completionPercentage}%`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-textPrimary">{completionPercentage}%</span>
              </div>
            </div>

            {/* Right Section - More Compact */}
            <div className="flex items-center gap-2">
              {/* Notifications - Smaller */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors relative"
              >
                <Bell className="w-4 h-4 text-gray-300" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-physical rounded-full" />
              </motion.button>

              {/* Settings - Hidden on mobile */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:block p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-300" />
              </motion.button>

              {/* User Avatar Dropdown - Smaller */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-gradient-to-r from-physical/20 to-spiritual/20 hover:from-physical/30 hover:to-spiritual/30 transition-all"
                >
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-physical to-spiritual flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {getUserInitial()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-200 hidden sm:block">
                    {getUserName()}
                  </span>
                </motion.button>

                {/* Dropdown Menu - More Compact */}
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-44 glass-premium rounded-lg overflow-hidden"
                  >
                    <button className="w-full px-3 py-2.5 text-left text-xs text-gray-300 hover:bg-white/5 transition-colors flex items-center gap-2.5">
                      <User className="w-3.5 h-3.5" />
                      Mi Perfil
                    </button>
                    <button className="w-full px-3 py-2.5 text-left text-xs text-gray-300 hover:bg-white/5 transition-colors flex items-center gap-2.5 sm:hidden">
                      <Settings className="w-3.5 h-3.5" />
                      Configuración
                    </button>
                    <div className="border-t border-white/10" />
                    <button
                      onClick={onLogout}
                      className="w-full px-3 py-2.5 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Cerrar Sesión
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Progress Bar - Bottom of Header */}
        <div className="md:hidden px-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Balance:</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, var(--physical), var(--emotional))`,
                  width: `${completionPercentage}%`
                }}
              />
            </div>
            <span className="text-xs font-semibold text-white">{completionPercentage}%</span>
          </div>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-14 md:h-14" />
    </>
  )
}
