'use client'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { AxisIcon } from '@/components/icons'
import { getAxisColors } from '@/lib/constants/brand-colors'
export interface Category {
  id: number
  slug: string
  name: Record<string, string> // Multilingual names
  description?: Record<string, string>
  color: string
  icon: string
  position: number
}
interface CategoryCardProps {
  category: Category
  isSelected: boolean
  onClick: () => void
  language: 'es' | 'en'
  animationDelay?: number
  disabled?: boolean
}
export function CategoryCard({
  category,
  isSelected,
  onClick,
  language,
  animationDelay = 0,
  disabled = false
}: CategoryCardProps) {
  const brandColors = getAxisColors(category.slug)
  const name = category.name[language] || category.name['en'] || category.slug
  const description = category.description?.[language] || category.description?.['en'] || ''
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { delay: animationDelay * 0.1, duration: 0.4, ease: "easeOut" }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2, ease: "easeInOut" }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  }
  const iconVariants = {
    idle: { rotate: 0, scale: 1 },
    hover: { rotate: 5, scale: 1.1 },
    selected: { rotate: 360, scale: 1.15 }
  }
  const checkVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    }
  }
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={!disabled ? "hover" : undefined}
      whileTap={!disabled ? "tap" : undefined}
      onClick={disabled ? undefined : onClick}
      className={`
        relative glass rounded-2xl p-6 cursor-pointer transition-all duration-300
        ${isSelected
          ? `ring-2 ring-[${brandColors.primary}] bg-white/20 shadow-lg ${brandColors.shadow}`
          : disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-white/10 hover:shadow-md'
        }
        group
      `}
      style={{
        boxShadow: isSelected
          ? `0 0 20px rgba(${brandColors.rgb}, 0.3), 0 8px 32px rgba(${brandColors.rgb}, 0.1)`
          : undefined
      }}
    >
      {/* Selection Indicator */}
      <motion.div
        variants={checkVariants}
        initial="hidden"
        animate={isSelected ? "visible" : "hidden"}
        className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-10"
      >
        <Check className="w-4 h-4 text-white" />
      </motion.div>
      {/* Icon Container */}
      <motion.div
        variants={iconVariants}
        initial="idle"
        whileHover={!disabled ? "hover" : undefined}
        animate={isSelected ? "selected" : "idle"}
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center mb-3 relative overflow-hidden
        `}
        style={{
          background: `linear-gradient(135deg, ${brandColors.primary}, rgba(${brandColors.rgb}, 0.8))`
        }}
      >
        {/* Icon Glow Effect */}
        <div
          className="absolute inset-0 opacity-30 blur-sm"
          style={{
            background: `radial-gradient(circle, ${brandColors.primary}, transparent)`
          }}
        />
        <AxisIcon
          axis={category.slug}
          size={24}
          color="white"
          className="relative z-10 drop-shadow-sm"
        />
      </motion.div>
      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-white transition-colors">
          {name}
        </h3>
        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
          {description}
        </p>
      </div>
      {/* Subtle border glow for selected state */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent, rgba(${brandColors.rgb}, 0.1))`
          }}
        />
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  )
}
