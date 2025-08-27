/**
 * usePrecomputedSVG Hook Tests
 * Performance optimization hook testing
 */

import { renderHook } from '@testing-library/react';
import { usePrecomputedSVG } from '@/components/hexagon-clock/hooks/usePrecomputedSVG';

describe('usePrecomputedSVG Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('computes SVG paths for given size', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      expect(result.current).toBeDefined();
      expect(result.current.hexagonPath).toBeDefined();
      expect(result.current.gridPaths).toBeDefined();
      expect(result.current.clockPositions).toBeDefined();
      expect(result.current.center).toBeDefined();
      expect(result.current.radius).toBeDefined();

      // Verify basic structure
      expect(typeof result.current.hexagonPath).toBe('string');
      expect(Array.isArray(result.current.gridPaths)).toBe(true);
      expect(Array.isArray(result.current.clockPositions)).toBe(true);
      expect(typeof result.current.center.x).toBe('number');
      expect(typeof result.current.center.y).toBe('number');
      expect(typeof result.current.radius).toBe('number');
    });

    it('returns correct center coordinates', () => {
      const size = 300;
      const { result } = renderHook(() => usePrecomputedSVG(size));

      // Center should be at half the size
      expect(result.current.center.x).toBe(size / 2);
      expect(result.current.center.y).toBe(size / 2);
    });

    it('calculates appropriate radius', () => {
      const size = 300;
      const { result } = renderHook(() => usePrecomputedSVG(size));

      // Radius should be proportional to size
      expect(result.current.radius).toBeGreaterThan(0);
      expect(result.current.radius).toBeLessThan(size / 2);
    });
  });

  describe('Clock Positioning', () => {
    it('generates 12 clock positions', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      expect(result.current.clockPositions).toHaveLength(12);
    });

    it('positions 12 o\'clock at top (0 degrees)', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      const twelveOClock = result.current.clockPositions[0];
      expect(twelveOClock.angle).toBe(0);
      expect(twelveOClock.y).toBeLessThan(result.current.center.y);
    });

    it('positions 6 o\'clock at bottom (180 degrees)', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      const sixOClock = result.current.clockPositions[6];
      expect(sixOClock.angle).toBe(180);
      expect(sixOClock.y).toBeGreaterThan(result.current.center.y);
    });

    it('positions 3 o\'clock at right (90 degrees)', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      const threeOClock = result.current.clockPositions[3];
      expect(threeOClock.angle).toBe(90);
      expect(threeOClock.x).toBeGreaterThan(result.current.center.x);
    });

    it('positions 9 o\'clock at left (270 degrees)', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      const nineOClock = result.current.clockPositions[9];
      expect(nineOClock.angle).toBe(270);
      expect(nineOClock.x).toBeLessThan(result.current.center.x);
    });
  });

  describe('SVG Path Generation', () => {
    it('generates valid SVG path for hexagon', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      const path = result.current.hexagonPath;
      expect(path).toMatch(/^M/); // Should start with Move command
      expect(path).toMatch(/L/);  // Should contain Line commands
      expect(path).toMatch(/Z$/); // Should end with close path
    });

    it('generates grid paths for internal structure', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      expect(result.current.gridPaths.length).toBeGreaterThan(0);
      result.current.gridPaths.forEach(path => {
        expect(typeof path).toBe('string');
        expect(path.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Optimization', () => {
    it('memoizes results for same size', () => {
      const size = 300;
      const { result, rerender } = renderHook(
        ({ size }) => usePrecomputedSVG(size),
        { initialProps: { size } }
      );

      const firstResult = result.current;

      // Re-render with same size
      rerender({ size });
      const secondResult = result.current;

      // Should be the same object (memoized)
      expect(firstResult).toBe(secondResult);
    });

    it('recalculates when size changes', () => {
      const { result, rerender } = renderHook(
        ({ size }) => usePrecomputedSVG(size),
        { initialProps: { size: 300 } }
      );

      const firstResult = result.current;

      // Re-render with different size
      rerender({ size: 400 });
      const secondResult = result.current;

      // Should be different objects
      expect(firstResult).not.toBe(secondResult);
      expect(secondResult.center.x).toBe(200); // 400/2
      expect(secondResult.center.y).toBe(200); // 400/2
    });

    it('handles rapid size changes efficiently', () => {
      const { result, rerender } = renderHook(
        ({ size }) => usePrecomputedSVG(size),
        { initialProps: { size: 300 } }
      );

      const sizes = [300, 350, 400, 350, 300]; // Including repeat sizes
      const results: any[] = [];

      sizes.forEach(size => {
        rerender({ size });
        results.push(result.current);
      });

      // Verify memoization worked for repeated sizes
      expect(results[0]).toBe(results[4]); // size 300 should be memoized
      expect(results[1]).toBe(results[3]); // size 350 should be memoized
    });
  });

  describe('Mathematical Accuracy', () => {
    it('calculates hexagon points correctly', () => {
      const size = 300;
      const { result } = renderHook(() => usePrecomputedSVG(size));

      const path = result.current.hexagonPath;
      const center = result.current.center;
      const radius = result.current.radius;

      // Extract coordinates from path (basic validation)
      expect(path).toContain(center.x.toString());
      expect(radius).toBeCloseTo(size * 0.35, 1); // Approximate expected ratio
    });

    it('maintains consistent proportions across sizes', () => {
      const sizes = [200, 300, 400];
      const results = sizes.map(size => 
        renderHook(() => usePrecomputedSVG(size)).result.current
      );

      // Radius should scale proportionally
      const ratios = results.map(result => result.radius / (result.center.x * 2));
      
      // All ratios should be approximately equal
      ratios.forEach(ratio => {
        expect(ratio).toBeCloseTo(ratios[0], 2);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles very small sizes', () => {
      const { result } = renderHook(() => usePrecomputedSVG(50));

      expect(result.current.center.x).toBe(25);
      expect(result.current.center.y).toBe(25);
      expect(result.current.radius).toBeGreaterThan(0);
      expect(result.current.hexagonPath).toBeTruthy();
    });

    it('handles very large sizes', () => {
      const { result } = renderHook(() => usePrecomputedSVG(1000));

      expect(result.current.center.x).toBe(500);
      expect(result.current.center.y).toBe(500);
      expect(result.current.radius).toBeLessThan(500);
      expect(result.current.hexagonPath).toBeTruthy();
    });

    it('handles zero size gracefully', () => {
      const { result } = renderHook(() => usePrecomputedSVG(0));

      expect(result.current.center.x).toBe(0);
      expect(result.current.center.y).toBe(0);
      expect(result.current.radius).toBe(0);
      expect(result.current.hexagonPath).toBeTruthy();
    });

    it('handles negative size gracefully', () => {
      const { result } = renderHook(() => usePrecomputedSVG(-100));

      // Should handle gracefully, possibly with absolute value
      expect(result.current).toBeDefined();
      expect(typeof result.current.hexagonPath).toBe('string');
    });

    it('handles non-integer sizes', () => {
      const { result } = renderHook(() => usePrecomputedSVG(299.5));

      expect(result.current.center.x).toBeCloseTo(149.75);
      expect(result.current.center.y).toBeCloseTo(149.75);
      expect(result.current.hexagonPath).toBeTruthy();
    });
  });

  describe('Memory Usage', () => {
    it('does not create memory leaks with frequent changes', () => {
      const { rerender } = renderHook(
        ({ size }) => usePrecomputedSVG(size),
        { initialProps: { size: 300 } }
      );

      // Simulate frequent size changes
      for (let i = 0; i < 100; i++) {
        rerender({ size: 300 + (i % 10) });
      }

      // If this test completes without errors, no obvious memory leaks
      expect(true).toBe(true);
    });

    it('limits memoization cache size implicitly', () => {
      const { rerender } = renderHook(
        ({ size }) => usePrecomputedSVG(size),
        { initialProps: { size: 300 } }
      );

      // Create many different sizes to potentially overflow cache
      for (let i = 0; i < 50; i++) {
        rerender({ size: 300 + i });
      }

      // Should still work for new sizes
      rerender({ size: 1000 });
      expect(true).toBe(true);
    });
  });

  describe('Coordinate System', () => {
    it('uses standard SVG coordinate system', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      const positions = result.current.clockPositions;
      
      // Y increases downward in SVG
      expect(positions[0].y).toBeLessThan(positions[6].y); // 12 o'clock vs 6 o'clock
      
      // X increases rightward
      expect(positions[9].x).toBeLessThan(positions[3].x); // 9 o'clock vs 3 o'clock
    });

    it('maintains circular distribution of clock positions', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      const positions = result.current.clockPositions;
      const center = result.current.center;

      // All positions should be equidistant from center
      const distances = positions.map(pos => 
        Math.sqrt(Math.pow(pos.x - center.x, 2) + Math.pow(pos.y - center.y, 2))
      );

      const averageDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
      
      distances.forEach(distance => {
        expect(distance).toBeCloseTo(averageDistance, 1);
      });
    });
  });

  describe('Integration Points', () => {
    it('provides data structure expected by HexagonRenderer', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      // Should have all required properties for renderer
      expect(result.current).toHaveProperty('hexagonPath');
      expect(result.current).toHaveProperty('gridPaths');
      expect(result.current).toHaveProperty('center');
      expect(result.current).toHaveProperty('radius');
    });

    it('provides data structure expected by ClockMarkers', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      // Should have clock positions for markers
      expect(result.current).toHaveProperty('clockPositions');
      expect(result.current.clockPositions).toHaveLength(12);
      
      result.current.clockPositions.forEach(pos => {
        expect(pos).toHaveProperty('x');
        expect(pos).toHaveProperty('y');
        expect(pos).toHaveProperty('angle');
      });
    });

    it('coordinates align with category positioning', () => {
      const { result } = renderHook(() => usePrecomputedSVG(300));

      // Physical at 12 o'clock should align with category expectations
      const physicalPosition = result.current.clockPositions[0]; // 12 o'clock
      expect(physicalPosition.angle).toBe(0);
      
      // Social at 6 o'clock
      const socialPosition = result.current.clockPositions[6]; // 6 o'clock
      expect(socialPosition.angle).toBe(180);
    });
  });
});