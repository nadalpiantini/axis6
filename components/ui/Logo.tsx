'use client'
import Image from 'next/image'
import { cn } from '@/lib/utils'
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
  xl: { width: 96, height: 96 },
  '2xl': { width: 128, height: 128 },
  '3xl': { width: 160, height: 160 },
}
const fullLogoSizes = {
  sm: { width: 80, height: 32 },
  md: { width: 120, height: 48 },
  lg: { width: 160, height: 64 },
  xl: { width: 240, height: 96 },
  '2xl': { width: 320, height: 128 },
  '3xl': { width: 400, height: 160 },
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
  // Optimized sizes for responsive loading - avoiding 256px preload issue
  const getOptimizedSizes = () => {
    const baseWidth = dimensions.width
    if (variant === 'full') {
      return `(max-width: 640px) ${Math.min(baseWidth * 0.6, 144)}px, (max-width: 1024px) ${Math.min(baseWidth * 0.8, 192)}px, ${baseWidth}px`
    }
    return `(max-width: 640px) ${Math.min(baseWidth * 0.8, 64)}px, (max-width: 1024px) ${Math.min(baseWidth * 0.9, 96)}px, ${baseWidth}px`
  }
  return (
    <Image
      src={logoSrc[variant]}
      alt={altText[variant]}
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      sizes={getOptimizedSizes()}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
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
      unoptimized={false}
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
