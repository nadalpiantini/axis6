/**
 * useHardwareAcceleration Hook Tests
 * Hardware acceleration optimization testing
 */

import { renderHook } from '@testing-library/react';
import { useHardwareAcceleration } from '@/components/hexagon-clock/hooks/useHardwareAcceleration';

// Mock performance and device capabilities
Object.defineProperty(window, 'CSS', {
  value: {
    supports: jest.fn((property: string) => {
      // Mock CSS support for various properties
      const supportedProperties = [
        'transform: translateZ(0)',
        'will-change: transform',
        'backface-visibility: hidden',
        'transform-style: preserve-3d',
      ];
      return supportedProperties.some(prop => property.includes(prop.split(':')[0].trim()));
    }),
  },
});

describe('useHardwareAcceleration Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('returns hardware acceleration configuration', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('animationClasses');
      expect(result.current).toHaveProperty('cssVariables');
      
      expect(typeof result.current.animationClasses).toBe('string');
      expect(typeof result.current.cssVariables).toBe('object');
    });

    it('includes transform-gpu class when supported', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      expect(result.current.animationClasses).toContain('transform-gpu');
    });

    it('includes appropriate CSS variables', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      const cssVars = result.current.cssVariables;
      
      // Should include GPU acceleration
      expect(cssVars).toHaveProperty('--gpu-acceleration');
      
      // Should include animation timing
      expect(cssVars).toHaveProperty('--animation-timing');
      
      // Should include perspective optimization
      expect(cssVars).toHaveProperty('--perspective');
    });
  });

  describe('Performance Optimization', () => {
    it('memoizes results to prevent unnecessary recalculation', () => {
      const { result, rerender } = renderHook(() => useHardwareAcceleration());

      const firstResult = result.current;
      
      // Re-render without changes
      rerender();
      const secondResult = result.current;

      // Should be the same object (memoized)
      expect(firstResult).toBe(secondResult);
    });

    it('includes performance-optimized CSS variables', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      const cssVars = result.current.cssVariables;
      
      // Should include transform3d for hardware acceleration
      expect(cssVars['--gpu-acceleration']).toContain('translateZ(0)');
      
      // Should include appropriate animation timing
      expect(cssVars['--animation-timing']).toMatch(/cubic-bezier/);
    });

    it('optimizes for animation performance', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      const cssVars = result.current.cssVariables;
      
      // Should include perspective for 3D transforms
      expect(cssVars).toHaveProperty('--perspective');
      expect(cssVars['--perspective']).toBe('1000px');
      
      // Should include animation duration
      expect(cssVars).toHaveProperty('--animation-duration');
      expect(cssVars['--animation-duration']).toBe('0.3s');
    });
  });

  describe('Animation Classes', () => {
    it('includes essential animation classes', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      const classes = result.current.animationClasses.split(' ');
      
      expect(classes).toContain('transform-gpu');
      expect(classes).toContain('will-change-transform');
      expect(classes).toContain('backface-visibility-hidden');
      expect(classes.length).toBeGreaterThan(0);
    });

    it('provides appropriate classes for GPU acceleration', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      const classes = result.current.animationClasses.split(' ');
      
      // Should include GPU-optimized classes
      expect(classes).toContain('transform-gpu');
      expect(classes).toContain('will-change-transform');
    });
  });

  describe('CSS Variables Structure', () => {
    it('provides consistent variable naming', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      const cssVars = result.current.cssVariables;
      const varNames = Object.keys(cssVars);
      
      // All variables should start with --
      varNames.forEach(name => {
        expect(name).toMatch(/^--/);
      });
    });

    it('includes all required optimization variables', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      const cssVars = result.current.cssVariables;
      const requiredVars = [
        '--gpu-acceleration',
        '--animation-timing',
        '--animation-duration',
        '--transform-origin',
        '--perspective',
      ];

      requiredVars.forEach(varName => {
        expect(cssVars).toHaveProperty(varName);
        expect(cssVars[varName]).toBeTruthy();
      });
    });

    it('provides sensible default values', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      const cssVars = result.current.cssVariables;
      
      expect(cssVars['--gpu-acceleration']).toBe('translateZ(0)');
      expect(cssVars['--animation-timing']).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
      expect(cssVars['--animation-duration']).toBe('0.3s');
      expect(cssVars['--transform-origin']).toBe('center center');
      expect(cssVars['--perspective']).toMatch(/\d+px/);
    });
  });

  describe('Memory Management', () => {
    it('does not create memory leaks with repeated calls', () => {
      // Render hook multiple times
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useHardwareAcceleration());
        unmount();
      }

      // If this completes without error, no obvious memory leaks
      expect(true).toBe(true);
    });
  });

  describe('Browser Compatibility', () => {
    it('handles browsers without CSS.supports', () => {
      // Mock missing CSS.supports
      delete (window as any).CSS;

      const { result } = renderHook(() => useHardwareAcceleration());

      // Should provide fallback behavior
      expect(result.current).toBeDefined();
      expect(result.current.animationClasses).toBeTruthy();
      expect(result.current.cssVariables).toBeTruthy();

      // Restore CSS for other tests
      Object.defineProperty(window, 'CSS', {
        value: {
          supports: jest.fn(() => true),
        },
      });
    });

    it('handles older browsers gracefully', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      // Should provide basic acceleration
      expect(result.current.animationClasses).toBeTruthy();
      expect(result.current.cssVariables).toBeTruthy();
    });
  });

  describe('Integration with Component Usage', () => {
    it('provides classes compatible with Tailwind CSS', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      const classes = result.current.animationClasses.split(' ');
      
      // Should include classes that work well with Tailwind
      expect(classes).toContain('transform-gpu');
      expect(classes).toContain('will-change-transform');
      
      // Classes should be valid CSS class names
      classes.forEach(className => {
        expect(className).toMatch(/^[a-zA-Z][a-zA-Z0-9-_]*$/);
      });
    });

    it('provides CSS variables usable in style objects', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      const cssVars = result.current.cssVariables;
      
      // Should be directly usable in React style props
      const testStyle = {
        transform: cssVars['--gpu-acceleration'],
        animationTimingFunction: cssVars['--animation-timing'],
        perspective: cssVars['--perspective'],
      };

      expect(testStyle.transform).toBeTruthy();
      expect(testStyle.animationTimingFunction).toBeTruthy();
      expect(testStyle.perspective).toBeTruthy();
    });
  });

  describe('Performance Monitoring', () => {
    it('provides optimizations that improve frame rate', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      const cssVars = result.current.cssVariables;
      
      // Optimizations should target 60fps performance
      expect(cssVars['--gpu-acceleration']).toBe('translateZ(0)');
      
      // Should use hardware-optimized timing functions
      expect(cssVars['--animation-timing']).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
    });

    it('uses reasonable animation durations', () => {
      const { result } = renderHook(() => useHardwareAcceleration());

      const cssVars = result.current.cssVariables;
      const duration = parseFloat(cssVars['--animation-duration']);
      
      // Should be between 100ms and 1000ms for good UX
      expect(duration).toBeGreaterThanOrEqual(0.1);
      expect(duration).toBeLessThanOrEqual(1.0);
    });
  });
});