'use client'

import { motion } from 'framer-motion'
import { Home, Activity, TrendingUp, User, Plus, Calendar, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
}

interface FloatingNavProps {
  onQuickAdd?: () => void
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" />, href: '/dashboard' },
  { id: 'my-day', label: 'My Day', icon: <Calendar className="w-5 h-5" />, href: '/my-day' },
  { id: 'chat', label: 'Chat', icon: <MessageCircle className="w-5 h-5" />, href: '/chat' },
  { id: 'stats', label: 'Stats', icon: <TrendingUp className="w-5 h-5" />, href: '/analytics' },
  { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" />, href: '/profile' }
]

export default function FloatingNav({ onQuickAdd }: FloatingNavProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      >
        <div className="glass-premium border-t border-white/20">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all
                    ${isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200'
                    }
                  `}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      p-2 rounded-xl transition-all
                      ${isActive
                        ? 'bg-gradient-to-br from-physical/20 to-spiritual/20'
                        : 'hover:bg-white/5'
                      }
                    `}
                  >
                    {item.icon}
                  </motion.div>
                  <span className="text-xs">{item.label}</span>
                </Link>
              )
            })}

            {/* Floating Action Button for mobile */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onQuickAdd}
              className="flex flex-col items-center gap-1 px-3 py-2"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-physical to-spiritual">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-400">Añadir</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Desktop Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        onClick={onQuickAdd}
        className="fab hidden md:flex"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Desktop Side Navigation (Optional) */}
      <motion.div
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-30 hidden lg:block"
      >
        <div className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.id}
                href={item.href}
                className="group relative"
              >
                <motion.div
                  whileHover={{ scale: 1.1, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    p-3 rounded-xl transition-all
                    ${isActive
                      ? 'bg-gradient-to-br from-physical/20 to-spiritual/20 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {item.icon}
                </motion.div>

                {/* Tooltip */}
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg whitespace-nowrap">
                    <span className="text-sm text-white">{item.label}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </motion.div>
    </>
  )
}
