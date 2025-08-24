'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Sparkles, Brain, Heart, Users, Target, Briefcase } from 'lucide-react'

// Unified icon props interface
export interface IconProps {
  size?: number
  color?: string
  className?: string
  animated?: boolean
}

// Map axis types to their icons - single source of truth
export const AXIS_ICONS: Record<string, LucideIcon> = {
  physical: Target,
  mental: Brain,
  emotional: Heart,
  social: Users,
  spiritual: Sparkles,
  material: Briefcase,
  // Alternative keys for compatibility
  físico: Target,
  mental_clarity: Brain,
  emocional: Heart,
  social_connection: Users,
  espiritual: Sparkles,
  material_purpose: Briefcase,
}

// Custom animated axis icons with brand personality
export const PhysicalIcon = ({ size = 24, color = 'currentColor', className = '', animated = false }: IconProps) => {
  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 2L12 7M12 7C10 7 8 9 8 11C8 13 10 15 12 15C14 15 16 13 16 11C16 9 14 7 12 7Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15L12 22M8 18L12 22L16 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 11C4 11 5 10 6 11C7 12 8 11 8 11M16 11C16 11 17 10 18 11C19 12 20 11 20 11"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )

  if (animated) {
    return (
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {Icon}
      </motion.div>
    )
  }

  return Icon
}

export const MentalIcon = ({ size = 24, color = 'currentColor', className = '', animated = false }: IconProps) => {
  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path
        d="M12 7C12 7 9 9 9 12C9 15 12 17 12 17C12 17 15 15 15 12C15 9 12 7 12 7Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 7V17M9 12H15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )

  if (animated) {
    return (
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {Icon}
      </motion.div>
    )
  }

  return Icon
}

export const EmotionalIcon = ({ size = 24, color = 'currentColor', className = '', animated = false }: IconProps) => {
  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
        stroke={color}
        strokeWidth="2"
        fill={animated ? color : 'none'}
        fillOpacity={animated ? 0.2 : 0}
      />
      <circle cx="12" cy="10" r="2" fill={color} />
    </svg>
  )

  if (animated) {
    return (
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {Icon}
      </motion.div>
    )
  }

  return Icon
}

export const SocialIcon = ({ size = 24, color = 'currentColor', className = '', animated = false }: IconProps) => {
  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="9" cy="9" r="3" stroke={color} strokeWidth="2" />
      <circle cx="15" cy="15" r="3" stroke={color} strokeWidth="2" />
      <path
        d="M9 12L15 12M12 9L12 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" opacity="0.3" />
    </svg>
  )

  if (animated) {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {Icon}
      </motion.div>
    )
  }

  return Icon
}

export const SpiritualIcon = ({ size = 24, color = 'currentColor', className = '', animated = false }: IconProps) => {
  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 2L14.09 8.26L20.18 8.91L15.82 12.83L17.18 19.02L12 15.77L6.82 19.02L8.18 12.83L3.82 8.91L9.91 8.26L12 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" opacity="0.5" />
    </svg>
  )

  if (animated) {
    return (
      <motion.div
        animate={{ 
          opacity: [0.7, 1, 0.7],
          scale: [0.95, 1, 0.95]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {Icon}
      </motion.div>
    )
  }

  return Icon
}

export const MaterialIcon = ({ size = 24, color = 'currentColor', className = '', animated = false }: IconProps) => {
  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <rect x="4" y="8" width="16" height="12" rx="2" stroke={color} strokeWidth="2" />
      <path
        d="M8 8V6C8 4.89543 8.89543 4 10 4H14C15.1046 4 16 4.89543 16 6V8"
        stroke={color}
        strokeWidth="2"
      />
      <circle cx="12" cy="14" r="2" fill={color} />
      <path d="M12 16V18" stroke={color} strokeWidth="2" />
    </svg>
  )

  if (animated) {
    return (
      <motion.div
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {Icon}
      </motion.div>
    )
  }

  return Icon
}

// Export all custom icons as a collection
export const CustomAxisIcons = {
  physical: PhysicalIcon,
  mental: MentalIcon,
  emotional: EmotionalIcon,
  social: SocialIcon,
  spiritual: SpiritualIcon,
  material: MaterialIcon,
}

// Helper function to get icon by axis name
export function getAxisIcon(axis: string, custom: boolean = false) {
  const normalizedAxis = axis.toLowerCase().replace(/[_\s]/g, '')
  
  if (custom && CustomAxisIcons[normalizedAxis as keyof typeof CustomAxisIcons]) {
    return CustomAxisIcons[normalizedAxis as keyof typeof CustomAxisIcons]
  }
  
  return AXIS_ICONS[normalizedAxis] || Target
}

// Icon wrapper component with consistent styling
interface AxisIconWrapperProps extends IconProps {
  axis: string
  custom?: boolean
}

export function AxisIcon({ axis, custom = false, ...props }: AxisIconWrapperProps) {
  const IconComponent = getAxisIcon(axis, custom)
  
  if (custom) {
    return <IconComponent {...props} />
  }
  
  // For Lucide icons
  const LucideIcon = IconComponent as LucideIcon
  return <LucideIcon size={props.size} color={props.color} className={props.className} />
}