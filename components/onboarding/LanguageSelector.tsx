'use client'

import { motion } from 'framer-motion'
import { Languages } from 'lucide-react'

interface LanguageSelectorProps {
  language: 'es' | 'en'
  onLanguageChange: (language: 'es' | 'en') => void
  className?: string
}

export function LanguageSelector({ 
  language, 
  onLanguageChange, 
  className = '' 
}: LanguageSelectorProps) {
  
  const languages = [
    { code: 'es' as const, label: 'Español', flag: '🇪🇸' },
    { code: 'en' as const, label: 'English', flag: '🇺🇸' }
  ]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Languages className="w-4 h-4 text-gray-400" />
      <div className="flex bg-white/10 rounded-lg p-1 backdrop-blur-sm">
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`
              relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300
              ${language === lang.code 
                ? 'text-white bg-white/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.label}
            
            {language === lang.code && (
              <motion.div
                layoutId="language-selector"
                className="absolute inset-0 bg-purple-500/30 rounded-md"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}