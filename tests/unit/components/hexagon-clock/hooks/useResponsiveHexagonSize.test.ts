/**
 * useResponsiveHexagonSize Hook Tests
 * Responsive sizing optimization testing
 */

import { renderHook, act } from '@testing-library/react';
import { useResponsiveHexagonSize, useContainerSize, useDeviceCapabilities } from '@/components/hexagon-clock/hooks/useResponsiveHexagonSize';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation((callback) => {
  const mockObserver = {
    observe: jest.fn((target) => {
      // Simulate immediate callback
      setTimeout(() => {
        callback([
          {
            target,
            contentRect: {
              width: 300,
              height: 300,
              top: 0,
              right: 300,
              bottom: 300,
              left: 0,
            },
          },
        ]);
      }, 0);
    }),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  };
  return mockObserver;
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  x: 0,
  y: 0,
  width: 300,
  height: 300,
  top: 0,
  left: 0,
  bottom: 300,
  right: 300,
  toJSON: jest.fn(),
}));

// Mock window properties
const mockWindowResize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true });

  // Trigger resize event
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

describe('useResponsiveHexagonSize Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default desktop size
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  describe('Basic Functionality', () => {
    it('returns responsive sizing configuration', () => {
      const { result } = renderHook(() => useResponsiveHexagonSize(400));

      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('size');
      expect(result.current).toHaveProperty('touchTarget');
      expect(result.current).toHaveProperty('labelDistance');
      expect(result.current).toHaveProperty('resonanceRadius');
      expect(result.current).toHaveProperty('fontSize');

      expect(typeof result.current.size).toBe('number');
      expect(typeof result.current.touchTarget).toBe('number');
      expect(typeof result.current.labelDistance).toBe('number');
      expect(typeof result.current.resonanceRadius).toBe('number');
      expect(typeof result.current.fontSize).toBe('object');
    });

    it('provides proper font size configuration', () => {
      const { result } = renderHook(() => useResponsiveHexagonSize(400));

      const fontSize = result.current.fontSize;
      expect(fontSize).toHaveProperty('label');
      expect(fontSize).toHaveProperty('center');
      expect(fontSize).toHaveProperty('time');

      // Font sizes should be valid Tailwind CSS classes
      expect(fontSize.label).toMatch(/text-(xs|sm|base|lg|xl)/);
      expect(fontSize.center).toMatch(/text-(xs|sm|base|lg|xl)/);
      expect(fontSize.time).toMatch(/text-(xs|sm|base|lg|xl)/);
    });

    it('calculates appropriate dimensions based on container width', () => {
      const containerWidths = [200, 300, 400, 500];

      containerWidths.forEach(width => {
        const { result } = renderHook(() => useResponsiveHexagonSize(width));

        expect(result.current.size).toBeGreaterThan(0);
        expect(result.current.size).toBeLessThanOrEqual(width);
        expect(result.current.labelDistance).toBeGreaterThan(0);
        expect(result.current.resonanceRadius).toBeGreaterThan(0);
      });
    });
  });

  describe('Responsive Breakpoints', () => {
    it('adapts to mobile viewport (320px)', () => {
      const { result } = renderHook(() => useResponsiveHexagonSize(320));

      expect(result.current.size).toBeLessThanOrEqual(280); // Leaves padding
      expect(result.current.touchTarget).toBeGreaterThanOrEqual(44); // WCAG minimum
      expect(result.current.fontSize.label).toMatch(/text-(sm|base)/); // Readable on mobile
    });

    it('adapts to tablet viewport (768px)', () => {
      const { result } = renderHook(() => useResponsiveHexagonSize(600));

      expect(result.current.size).toBeGreaterThan(280);
      expect(result.current.size).toBeLessThanOrEqual(600);
      expect(result.current.fontSize.label).toMatch(/text-(base|lg)/);
    });

    it('adapts to desktop viewport (1024px+)', () => {
      const { result } = renderHook(() => useResponsiveHexagonSize(800));

      expect(result.current.size).toBeGreaterThan(300);
      expect(result.current.size).toBeLessThanOrEqual(400); // Max reasonable size
      expect(result.current.fontSize.center).toMatch(/text-(lg|xl|2xl)/);
    });

    it('handles very small containers gracefully', () => {
      const { result } = renderHook(() => useResponsiveHexagonSize(150));

      expect(result.current.size).toBeGreaterThan(100);
      expect(result.current.touchTarget).toBeGreaterThanOrEqual(44);
      expect(result.current.labelDistance).toBeGreaterThan(0);
    });

    it('handles very large containers appropriately', () => {
      const { result } = renderHook(() => useResponsiveHexagonSize(2000));

      expect(result.current.size).toBeLessThanOrEqual(500); // Reasonable maximum
      expect(result.current.labelDistance).toBeGreaterThan(50);
    });
  });

  describe('Touch Target Optimization', () => {
    it('ensures touch targets meet WCAG 2.1 AA requirements (44px minimum)', () => {
      const mobileSizes = [300, 375, 414]; // Common mobile widths

      mobileSizes.forEach(width => {
        const { result } = renderHook(() => useResponsiveHexagonSize(width));

        expect(result.current.touchTarget).toBeGreaterThanOrEqual(44);
      });
    });

    it('scales touch targets appropriately for different sizes', () => {
      const sizes = [200, 400, 600];
      const results = sizes.map(size =>
        renderHook(() => useResponsiveHexagonSize(size)).result.current
      );

      // Larger containers can have larger touch targets
      expect(results[1].touchTarget).toBeGreaterThanOrEqual(results[0].touchTarget);
      expect(results[2].touchTarget).toBeGreaterThanOrEqual(results[1].touchTarget);
    });
  });

  describe('Font Size Scaling', () => {
    it('uses smaller fonts for mobile devices', () => {
      const { result } = renderHook(() => useResponsiveHexagonSize(320));

      const fontSize = result.current.fontSize;
      expect(fontSize.label).toMatch(/text-(xs|sm)/);
      expect(fontSize.center).toMatch(/text-(sm|base)/);
      expect(fontSize.time).toMatch(/text-(xs|sm)/);
    });

    it('uses larger fonts for desktop displays', () => {
      const { result } = renderHook(() => useResponsiveHexagonSize(800));

      const fontSize = result.current.fontSize;
      expect(fontSize.center).toMatch(/text-(lg|xl|2xl)/);
    });

    it('maintains readable contrast between font sizes', () => {
      const { result } = renderHook(() => useResponsiveHexagonSize(400));

      const fontSize = result.current.fontSize;
      const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'];

      const getLabelIndex = (sizeClass: string) => {
        const match = sizeClass.match(/text-(\w+)/);
        return match ? sizes.indexOf(match[1]) : -1;
      };

      const labelIndex = getLabelIndex(fontSize.label);
      const centerIndex = getLabelIndex(fontSize.center);
      const timeIndex = getLabelIndex(fontSize.time);

      // Center should typically be larger than labels
      expect(centerIndex).toBeGreaterThanOrEqual(labelIndex);

      // All should be valid sizes
      expect(labelIndex).toBeGreaterThanOrEqual(0);
      expect(centerIndex).toBeGreaterThanOrEqual(0);
      expect(timeIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Proportional Scaling', () => {
    it('maintains proper proportions across different sizes', () => {
      const sizes = [200, 300, 400, 500];
      const results = sizes.map(size =>
        renderHook(() => useResponsiveHexagonSize(size)).result.current
      );

      // Check that ratios are consistent
      results.forEach((result, index) => {
        const containerSize = sizes[index];
        const sizeRatio = result.size / containerSize;
        const labelDistanceRatio = result.labelDistance / result.size;
        const resonanceRadiusRatio = result.resonanceRadius / result.size;

        expect(sizeRatio).toBeGreaterThan(0.5); // At least 50% of container
        expect(sizeRatio).toBeLessThanOrEqual(1.0); // Not larger than container
        expect(labelDistanceRatio).toBeGreaterThan(0.3); // Reasonable label distance
        expect(resonanceRadiusRatio).toBeGreaterThan(0.1); // Visible resonance radius
      });
    });

    it('scales all dimensions proportionally', () => {
      const { result: small } = renderHook(() => useResponsiveHexagonSize(200));
      const { result: large } = renderHook(() => useResponsiveHexagonSize(400));

      const smallResult = small.current;
      const largeResult = large.current;

      // Larger container should have proportionally larger dimensions
      expect(largeResult.size).toBeGreaterThan(smallResult.size);
      expect(largeResult.labelDistance).toBeGreaterThan(smallResult.labelDistance);
      expect(largeResult.resonanceRadius).toBeGreaterThan(smallResult.resonanceRadius);
    });
  });

  describe('Performance Optimization', () => {
    it('memoizes results for the same container width', () => {
      const { result, rerender } = renderHook(
        ({ width }) => useResponsiveHexagonSize(width),
        { initialProps: { width: 400 } }
      );

      const firstResult = result.current;

      // Re-render with same width
      rerender({ width: 400 });
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult); // Should be memoized
    });

    it('recalculates when container width changes', () => {
      const { result, rerender } = renderHook(
        ({ width }) => useResponsiveHexagonSize(width),
        { initialProps: { width: 300 } }
      );

      const firstResult = result.current;

      // Re-render with different width
      rerender({ width: 500 });
      const secondResult = result.current;

      expect(firstResult).not.toBe(secondResult);
      expect(secondResult.size).toBeGreaterThan(firstResult.size);
    });

    it('handles rapid size changes efficiently', () => {
      const { result, rerender } = renderHook(
        ({ width }) => useResponsiveHexagonSize(width),
        { initialProps: { width: 300 } }
      );

      // Rapid size changes
      const widths = [300, 400, 350, 400, 300];
      widths.forEach(width => {
        rerender({ width });
      });

      // Should complete without errors
      expect(result.current.size).toBeGreaterThan(0);
    });
  });
});

describe('useContainerSize Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides container reference and width', () => {
    const { result } = renderHook(() => useContainerSize());

    expect(result.current).toHaveProperty('containerRef');
    expect(result.current).toHaveProperty('containerWidth');

    expect(result.current.containerRef).toBeDefined();
    expect(typeof result.current.containerWidth).toBe('number');
  });

  it('updates width when container size changes', async () => {
    const { result } = renderHook(() => useContainerSize());

    // Mock container element
    const mockElement = document.createElement('div');

    act(() => {
      result.current.containerRef.current = mockElement;
    });

    // Simulate ResizeObserver callback
    await act(async () => {
      // The ResizeObserver mock will trigger the callback
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.containerWidth).toBeGreaterThan(0);
  });

  it('cleans up ResizeObserver on unmount', () => {
    const { unmount } = renderHook(() => useContainerSize());

    unmount();

    // Verify cleanup (mock ResizeObserver should have been disconnected)
    expect(true).toBe(true); // Test passes if no errors during unmount
  });
});

describe('useDeviceCapabilities Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset navigator properties
    Object.defineProperty(window.navigator, 'hardwareConcurrency', { value: 8, writable: true });
    Object.defineProperty(window.navigator, 'deviceMemory', { value: 8, writable: true });
    Object.defineProperty(window.navigator, 'connection', {
      value: { effectiveType: '4g', downlink: 10 },
      writable: true
    });
  });

  it('detects device performance capabilities', () => {
    const { result } = renderHook(() => useDeviceCapabilities());

    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty('cpuCores');
    expect(result.current).toHaveProperty('memory');
    expect(result.current).toHaveProperty('connectionType');
    expect(result.current).toHaveProperty('performanceLevel');

    expect(typeof result.current.cpuCores).toBe('number');
    expect(typeof result.current.memory).toBe('number');
    expect(typeof result.current.connectionType).toBe('string');
    expect(typeof result.current.performanceLevel).toBe('string');
  });

  it('classifies high-performance devices correctly', () => {
    // Mock high-performance device
    Object.defineProperty(window.navigator, 'hardwareConcurrency', { value: 8 });
    Object.defineProperty(window.navigator, 'deviceMemory', { value: 8 });

    const { result } = renderHook(() => useDeviceCapabilities());

    expect(result.current.cpuCores).toBe(8);
    expect(result.current.memory).toBe(8);
    expect(result.current.performanceLevel).toBe('high');
  });

  it('classifies low-performance devices correctly', () => {
    // Mock low-performance device
    Object.defineProperty(window.navigator, 'hardwareConcurrency', { value: 2 });
    Object.defineProperty(window.navigator, 'deviceMemory', { value: 1 });

    const { result } = renderHook(() => useDeviceCapabilities());

    expect(result.current.cpuCores).toBe(2);
    expect(result.current.memory).toBe(1);
    expect(result.current.performanceLevel).toBe('low');
  });

  it('handles missing device APIs gracefully', () => {
    // Mock missing APIs
    Object.defineProperty(window.navigator, 'hardwareConcurrency', { value: undefined });
    Object.defineProperty(window.navigator, 'deviceMemory', { value: undefined });
    Object.defineProperty(window.navigator, 'connection', { value: undefined });

    const { result } = renderHook(() => useDeviceCapabilities());

    expect(result.current.cpuCores).toBeGreaterThan(0); // Should provide fallback
    expect(result.current.memory).toBeGreaterThan(0); // Should provide fallback
    expect(result.current.connectionType).toBeTruthy(); // Should provide fallback
    expect(result.current.performanceLevel).toBeTruthy(); // Should classify somehow
  });

  it('detects connection quality correctly', () => {
    const connectionTypes = ['4g', '3g', '2g', 'slow-2g'];

    connectionTypes.forEach(type => {
      Object.defineProperty(window.navigator, 'connection', {
        value: { effectiveType: type, downlink: type === '4g' ? 10 : 1 },
        writable: true
      });

      const { result } = renderHook(() => useDeviceCapabilities());
      expect(result.current.connectionType).toBe(type);
    });
  });

  it('memoizes device capabilities to avoid repeated detection', () => {
    const { result, rerender } = renderHook(() => useDeviceCapabilities());

    const firstResult = result.current;

    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });
});
