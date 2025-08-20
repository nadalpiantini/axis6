'use client'

interface IconProps {
  size?: number
  color?: string
  className?: string
}

// Físico - Flowing lines representing movement
export const PhysicalIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
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

// Mental - Geometric brain pattern
export const MentalIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path
      d="M12 3V12L17 7M12 12L7 7M12 12L7 17M12 12L17 17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
  </svg>
)

// Emocional - Heart with energy waves
export const EmotionalIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <path
      d="M12 21C12 21 3 14 3 8.5C3 5.5 5.5 3 8.5 3C10.5 3 12 4.5 12 4.5C12 4.5 13.5 3 15.5 3C18.5 3 21 5.5 21 8.5C21 14 12 21 12 21Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 10C8 10 9.5 8.5 12 10C14.5 11.5 16 10 16 10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

// Social - Connected dots
export const SocialIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <circle cx="12" cy="5" r="3" stroke={color} strokeWidth="2" />
    <circle cx="5" cy="19" r="3" stroke={color} strokeWidth="2" />
    <circle cx="19" cy="19" r="3" stroke={color} strokeWidth="2" />
    <path
      d="M12 8V14M12 14L5 16M12 14L19 16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

// Espiritual - Mandala pattern
export const SpiritualIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path
      d="M12 3L15 9L21 12L15 15L12 21L9 15L3 12L9 9L12 3Z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
)

// Material/Propósito - Target with arrow
export const MaterialIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path
      d="M3 3L9 9M21 3L15 9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

// Icon Map for easy access
export const AxisIcons = {
  physical: PhysicalIcon,
  mental: MentalIcon,
  emotional: EmotionalIcon,
  social: SocialIcon,
  spiritual: SpiritualIcon,
  material: MaterialIcon,
}

// Helper function to get icon by category slug
export const getAxisIcon = (slug: string) => {
  return AxisIcons[slug as keyof typeof AxisIcons] || PhysicalIcon
}