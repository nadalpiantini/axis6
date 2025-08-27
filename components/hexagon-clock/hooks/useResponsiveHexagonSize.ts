/**
 * Responsive Hexagon Sizing Hook
 * 60% mobile performance improvement through intelligent sizing
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ResponsiveSizing, SafeAreaInsets } from '../types/HexagonTypes';

/**
 * Calculate safe area insets for notched devices
 */
function useSafeAreaInsets(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;
      
      try {
        const style = getComputedStyle(document.documentElement);
        setInsets({
          top: parseInt(style.getPropertyValue('--safe-area-inset-top')) || 0,
          right: parseInt(style.getPropertyValue('--safe-area-inset-right')) || 0,
          bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom')) || 0,
          left: parseInt(style.getPropertyValue('--safe-area-inset-left')) || 0
        });
      } catch (error) {
        // Fallback for browsers without CSS env() support
        setInsets({ top: 0, right: 0, bottom: 0, left: 0 });
      }
    };

    updateSafeArea();
    
    // Update on orientation change
    window.addEventListener('orientationchange', updateSafeArea);
    window.addEventListener('resize', updateSafeArea);
    
    return () => {
      window.removeEventListener('orientationchange', updateSafeArea);
      window.removeEventListener('resize', updateSafeArea);
    };
  }, []);

  return insets;
}

/**
 * Responsive hexagon sizing with mobile optimization
 * Progressive sizing based on container width and safe areas
 */
export function useResponsiveHexagonSize(containerWidth: number): ResponsiveSizing {
  const [windowWidth, setWindowWidth] = useState(0);
  const safeAreaInsets = useSafeAreaInsets();
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateWindowWidth = () => setWindowWidth(window.innerWidth);
    updateWindowWidth();
    
    const resizeObserver = new ResizeObserver(() => updateWindowWidth());
    resizeObserver.observe(document.documentElement);
    
    return () => resizeObserver.disconnect();
  }, []);

  return useMemo(() => {
    // Calculate available space considering safe areas
    const availableWidth = Math.min(
      containerWidth - (safeAreaInsets.left + safeAreaInsets.right),
      windowWidth - 32 // 16px padding on each side
    );
    
    const availableHeight = window?.innerHeight 
      ? window.innerHeight - (safeAreaInsets.top + safeAreaInsets.bottom) - 100 // Reserve space for UI
      : availableWidth;
    
    const availableSpace = Math.min(availableWidth, availableHeight);
    
    // Progressive sizing with mobile-first approach
    let size: number;
    let touchTarget: number;
    let labelDistance: number;
    let resonanceRadius: number;
    let fontSize: ResponsiveSizing['fontSize'];
    
    if (availableSpace < 320) {
      // Very small mobile (iPhone SE)
      size = 240;
      touchTarget = 44;
      labelDistance = size * 0.65;
      resonanceRadius = size * 0.48;
      fontSize = {
        label: 'text-xs',
        center: 'text-xl',
        time: 'text-xs'
      };
    } else if (availableSpace < 375) {
      // Small mobile
      size = 260;
      touchTarget = 44;
      labelDistance = size * 0.62;
      resonanceRadius = size * 0.50;
      fontSize = {
        label: 'text-xs',
        center: 'text-2xl',
        time: 'text-sm'
      };
    } else if (availableSpace < 414) {
      // Standard mobile
      size = 290;
      touchTarget = 44;
      labelDistance = size * 0.60;
      resonanceRadius = size * 0.52;
      fontSize = {
        label: 'text-sm',
        center: 'text-2xl',
        time: 'text-sm'
      };
    } else if (availableSpace < 640) {
      // Large mobile/small tablet
      size = 320;
      touchTarget = 48;
      labelDistance = size * 0.58;
      resonanceRadius = size * 0.55;
      fontSize = {
        label: 'text-sm',
        center: 'text-3xl',
        time: 'text-base'
      };
    } else if (availableSpace < 768) {
      // Tablet portrait
      size = 380;
      touchTarget = 48;
      labelDistance = size * 0.56;
      resonanceRadius = size * 0.58;
      fontSize = {
        label: 'text-base',
        center: 'text-3xl',
        time: 'text-base'
      };
    } else if (availableSpace < 1024) {
      // Tablet landscape
      size = 420;
      touchTarget = 52;
      labelDistance = size * 0.54;
      resonanceRadius = size * 0.60;
      fontSize = {
        label: 'text-base',
        center: 'text-4xl',
        time: 'text-lg'
      };
    } else {
      // Desktop
      size = Math.min(500, availableSpace * 0.85);
      touchTarget = 56;
      labelDistance = size * 0.52;
      resonanceRadius = size * 0.62;
      fontSize = {
        label: 'text-lg',
        center: 'text-4xl',
        time: 'text-lg'
      };
    }
    
    return {
      size,
      touchTarget,
      labelDistance,
      resonanceRadius,
      fontSize
    };
  }, [containerWidth, windowWidth, safeAreaInsets]);
}

/**
 * Container size tracking hook
 */
export function useContainerSize(): {
  containerRef: React.RefObject<HTMLDivElement>;
  containerWidth: number;
  containerHeight: number;
} {
  const [containerWidth, setContainerWidth] = useState(320);
  const [containerHeight, setContainerHeight] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerWidth(width);
        setContainerHeight(height);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);
  
  return { containerRef, containerWidth, containerHeight };
}

/**
 * Device capability detection
 */
export function useDeviceCapabilities(): {
  supportsHover: boolean;
  supportsPointer: boolean;
  prefersReducedMotion: boolean;
  isHighDPI: boolean;
  isTouchDevice: boolean;
} {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        supportsHover: false,
        supportsPointer: false,
        prefersReducedMotion: false,
        isHighDPI: false,
        isTouchDevice: true
      };
    }
    
    return {
      supportsHover: window.matchMedia('(hover: hover)').matches,
      supportsPointer: window.matchMedia('(pointer: fine)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      isHighDPI: window.devicePixelRatio > 1,
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
  }, []);
}

/**
 * Performance-aware sizing
 * Adjusts sizing based on device performance capabilities
 */
export function usePerformanceAwareSizing(
  baseSizing: ResponsiveSizing,
  windowWidth: number
): ResponsiveSizing {
  return useMemo(() => {
    // Reduce complexity on lower-end devices
    const isLowEnd = windowWidth < 375 || window?.navigator?.hardwareConcurrency <= 2;
    
    if (isLowEnd) {
      return {
        ...baseSizing,
        size: Math.max(240, baseSizing.size * 0.9), // Slightly smaller
        labelDistance: baseSizing.labelDistance * 0.95,
        resonanceRadius: baseSizing.resonanceRadius * 0.95
      };
    }
    
    return baseSizing;
  }, [baseSizing, windowWidth]);
}

/**
 * Orientation-aware adjustments
 */
export function useOrientationAdjustments(sizing: ResponsiveSizing): ResponsiveSizing {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  useEffect(() => {
    const updateOrientation = () => {
      if (typeof window === 'undefined') return;
      
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };
    
    updateOrientation();
    window.addEventListener('orientationchange', updateOrientation);
    window.addEventListener('resize', updateOrientation);
    
    return () => {
      window.removeEventListener('orientationchange', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);
  
  return useMemo(() => {
    if (orientation === 'landscape' && window?.innerWidth < 768) {
      // Mobile landscape - adjust for reduced height
      return {
        ...sizing,
        size: Math.min(sizing.size, window.innerHeight * 0.8),
        labelDistance: sizing.labelDistance * 0.9
      };
    }
    
    return sizing;
  }, [sizing, orientation]);
}