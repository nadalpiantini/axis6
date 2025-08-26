'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LogoProps {
  variant?: 'full' | 'icon' | 'icon-alt'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  className?: string
  priority?: boolean
}

const sizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 128, height: 128 },
  '2xl': { width: 192, height: 192 },
  '3xl': { width: 256, height: 256 },
}

const fullLogoSizes = {
  sm: { width: 80, height: 32 },
  md: { width: 120, height: 48 },
  lg: { width: 160, height: 64 },
  xl: { width: 320, height: 128 },
  '2xl': { width: 480, height: 192 },
  '3xl': { width: 640, height: 256 },
}

export function Logo({ 
  variant = 'full', 
  size = 'md', 
  className,
  priority = false 
}: LogoProps) {
  const dimensions = variant === 'full' ? fullLogoSizes[size] : sizeMap[size]
  
  const logoSrc = {
    full: '/brand/logo/logo.png',
    icon: '/brand/logo/logo-icon.png',
    'icon-alt': '/brand/logo/logo-icon-alt.png',
  }

  const altText = {
    full: 'AXIS6 - Balance Across 6 Life Dimensions',
    icon: 'AXIS6 Logo',
    'icon-alt': 'AXIS6 Icon',
  }

  return (
    <Image
      src={logoSrc[variant]}
      alt={altText[variant]}
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      className={cn(
        'object-contain',
        // Hover effects for interactive elements
        'transition-transform duration-200 ease-in-out',
        'hover:scale-105',
        className
      )}
      style={{
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    />
  )
}

// Convenient preset components
export function LogoFull(props: Omit<LogoProps, 'variant'>) {
  return <Logo variant="full" {...props} />
}

export function LogoIcon(props: Omit<LogoProps, 'variant'>) {
  return <Logo variant="icon" {...props} />
}

export function LogoIconAlt(props: Omit<LogoProps, 'variant'>) {
  return <Logo variant="icon-alt" {...props} />
}