// AXIS6 Brand Colors from CLAUDE.md - Design System v1
export const BRAND_COLORS = {
  // Core Axis Colors
  physical: {
    primary: '#A6C26F', // Verde Lima
    rgb: '166, 194, 111',
    gradient: 'from-[#A6C26F] to-[#8BA85C]',
    shadow: 'shadow-[#A6C26F]/30'
  },
  mental: {
    primary: '#365D63', // Azul Petróleo  
    rgb: '54, 93, 99',
    gradient: 'from-[#365D63] to-[#2A4A4F]',
    shadow: 'shadow-[#365D63]/30'
  },
  emotional: {
    primary: '#D36C50', // Coral Profundo
    rgb: '211, 108, 80', 
    gradient: 'from-[#D36C50] to-[#B8563D]',
    shadow: 'shadow-[#D36C50]/30'
  },
  social: {
    primary: '#6F3D56', // Ciruela
    rgb: '111, 61, 86',
    gradient: 'from-[#6F3D56] to-[#5A3145]',
    shadow: 'shadow-[#6F3D56]/30'
  },
  spiritual: {
    primary: '#2C3E50', // Azul Medianoche
    rgb: '44, 62, 80',
    gradient: 'from-[#2C3E50] to-[#1F2A36]',
    shadow: 'shadow-[#2C3E50]/30'
  },
  material: {
    primary: '#C85729', // Naranja Tierra
    rgb: '200, 87, 41',
    gradient: 'from-[#C85729] to-[#A64623]',
    shadow: 'shadow-[#C85729]/30'
  },
  
  // Neutral Colors
  neutral: {
    ivory: '#F2E9DC', // Marfil
    sand: '#E0D2BD', // Arena
    charcoal: '#2C3E50',
    lightGray: '#8B8B8B',
    darkGray: '#4A4A4A'
  }
} as const

// Color type union
type AxisColorScheme = {
  primary: string
  rgb: string
  gradient: string
  shadow: string
}

// Mapping from database slugs to brand colors
export const AXIS_COLORS: Record<string, AxisColorScheme> = {
  physical: BRAND_COLORS.physical,
  mental: BRAND_COLORS.mental,
  emotional: BRAND_COLORS.emotional,
  social: BRAND_COLORS.social,
  spiritual: BRAND_COLORS.spiritual,
  material: BRAND_COLORS.material,
  
  // Spanish aliases
  físico: BRAND_COLORS.physical,
  emocional: BRAND_COLORS.emotional,
  espiritual: BRAND_COLORS.spiritual,
} as const

// Helper function to get colors by category slug
export function getAxisColors(slug: string) {
  const normalizedSlug = slug.toLowerCase().replace(/[_\s]/g, '')
  return AXIS_COLORS[normalizedSlug] || BRAND_COLORS.neutral
}

// Color utilities for CSS-in-JS or dynamic styling
export function getCSSColor(slug: string, variant: 'primary' | 'gradient' | 'shadow' = 'primary') {
  const colors = getAxisColors(slug)
  return colors[variant] || colors.primary
}

// Generate dynamic CSS custom properties
export function generateAxisCSSProps(slug: string) {
  const colors = getAxisColors(slug)
  return {
    '--axis-color': colors.primary,
    '--axis-rgb': colors.rgb,
    '--axis-gradient': colors.gradient,
    '--axis-shadow': colors.shadow,
  }
}