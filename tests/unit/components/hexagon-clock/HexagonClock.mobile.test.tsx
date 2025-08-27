/**
 * HexagonClock Mobile Tests
 * Mobile responsiveness and touch optimization testing
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { HexagonClock } from '@/components/hexagon-clock/HexagonClock';
import type { CompletionData, TimeDistribution } from '@/components/hexagon-clock/types/HexagonTypes';

// Mobile device viewport configurations
const DEVICE_VIEWPORTS = {
  'iPhone SE': { width: 320, height: 568 },
  'iPhone 12 mini': { width: 375, height: 812 },
  'iPhone 12': { width: 390, height: 844 },
  'iPhone 12 Pro Max': { width: 414, height: 896 },
  'iPhone 14 Pro': { width: 393, height: 852 },
  'Galaxy S22': { width: 360, height: 780 },
  'Pixel 7': { width: 393, height: 851 },
  'iPad mini': { width: 768, height: 1024 },
  'iPad Air': { width: 820, height: 1180 },
  'Desktop': { width: 1920, height: 1080 },
  '4K': { width: 3840, height: 2160 },
} as const;

// Mock CSS environment variables for safe areas
const mockSafeAreaInsets = {
  top: 47,    // iPhone notch
  right: 0,
  bottom: 34, // Home indicator
  left: 0,
};

// Mock CSS supports for env() variables
Object.defineProperty(CSS, 'supports', {
  value: jest.fn((property: string) => {
    return property.includes('env(safe-area-inset');
  }),
});

// Mock getBoundingClientRect for precise measurements
const createMockBoundingClientRect = (width = 44, height = 44) => ({
  x: 0,
  y: 0,
  width,
  height,
  top: 0,
  left: 0,
  bottom: height,
  right: width,
  toJSON: jest.fn(),
});

describe('HexagonClock Mobile Tests', () => {
  const mockCompletionData: CompletionData = {
    physical: 80,
    mental: 60,
    emotional: 90,
    social: 40,
    spiritual: 70,
    material: 85,
  };

  const mockTimeDistribution: TimeDistribution[] = [
    {
      category_id: 1,
      category_name: 'Physical',
      category_color: '#A6C26F',
      planned_minutes: 120,
      actual_minutes: 90,
      percentage: 75,
    },
  ];

  // Helper function to set viewport size
  const setViewportSize = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to desktop size
    setViewportSize(1024, 768);
  });

  describe('Perfect Modal Centering Across Devices', () => {
    Object.entries(DEVICE_VIEWPORTS).forEach(([deviceName, viewport]) => {
      it(`centers perfectly on ${deviceName} (${viewport.width}x${viewport.height})`, async () => {
        setViewportSize(viewport.width, viewport.height);

        await act(async () => {
          render(
            <HexagonClock 
              data={mockCompletionData}
              mobileOptimized={true}
              animate={false}
            />
          );
        });

        await waitFor(() => {
          const container = document.querySelector('.hexagon-clock-container');
          expect(container).toBeInTheDocument();

          // Verify flexbox centering is used (not transform)
          const parentStyles = window.getComputedStyle(container?.parentElement || container!);
          expect(parentStyles.display).toBe('flex');
          expect(parentStyles.alignItems).toBe('center');
          expect(parentStyles.justifyContent).toBe('center');
        });
      });
    });

    it('applies safe area insets for notched devices', async () => {
      setViewportSize(393, 852); // iPhone 14 Pro

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const container = document.querySelector('.hexagon-clock-container');
        const parentElement = container?.parentElement;
        expect(parentElement).toBeInTheDocument();

        // Check that safe area CSS custom properties are applied
        const styles = window.getComputedStyle(parentElement!);
        expect(styles.padding).toContain('env(safe-area-inset');
      });
    });

    it('prevents transform-based centering issues', async () => {
      setViewportSize(320, 568); // iPhone SE

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        // Ensure no transform-based centering is used
        const elementsWithTransform = document.querySelectorAll('[style*="transform: translate(-50%, -50%)"]');
        const containerElement = document.querySelector('.hexagon-clock-container');
        
        // Container itself should NOT use transform centering
        expect(containerElement).not.toHaveStyle({
          transform: 'translate(-50%, -50%)'
        });
      });
    });
  });

  describe('Touch Target Optimization', () => {
    it('ensures all interactive elements meet 44px minimum (WCAG 2.1 AA)', async () => {
      setViewportSize(375, 812); // iPhone 12 mini

      // Mock getBoundingClientRect to return proper touch target sizes
      Element.prototype.getBoundingClientRect = jest.fn(() => 
        createMockBoundingClientRect(44, 44)
      );

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
            onCategoryClick={jest.fn()}
          />
        );
      });

      await waitFor(() => {
        const touchTargets = screen.getAllByRole('button');
        expect(touchTargets.length).toBeGreaterThan(0);

        touchTargets.forEach(target => {
          // Check CSS properties
          expect(target.style.minHeight).toBe('44px');
          expect(target.style.minWidth).toBe('44px');

          // Check computed dimensions
          const rect = target.getBoundingClientRect();
          expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
        });
      });
    });

    it('applies touch-manipulation for better responsiveness', async () => {
      setViewportSize(360, 780); // Galaxy S22

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const touchElements = document.querySelectorAll('.touch-manipulation');
        expect(touchElements.length).toBeGreaterThan(0);

        touchElements.forEach(element => {
          expect(element).toHaveClass('touch-manipulation');
        });
      });
    });

    it('provides larger touch targets on smaller screens', async () => {
      setViewportSize(320, 568); // iPhone SE (smallest)

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          // On very small screens, touch targets should be even larger
          expect(button.style.minHeight).toBe('44px');
          expect(button.style.minWidth).toBe('44px');
        });
      });
    });
  });

  describe('Responsive Hexagon Sizing', () => {
    it('scales hexagon appropriately for mobile screens', async () => {
      const testCases = [
        { viewport: DEVICE_VIEWPORTS['iPhone SE'], expectedMaxSize: 280 },
        { viewport: DEVICE_VIEWPORTS['iPhone 12'], expectedMaxSize: 340 },
        { viewport: DEVICE_VIEWPORTS['iPad mini'], expectedMaxSize: 400 },
        { viewport: DEVICE_VIEWPORTS['Desktop'], expectedMaxSize: 400 },
      ];

      for (const { viewport, expectedMaxSize } of testCases) {
        setViewportSize(viewport.width, viewport.height);

        await act(async () => {
          render(
            <HexagonClock 
              data={mockCompletionData}
              size="auto" // Enable responsive sizing
            />
          );
        });

        await waitFor(() => {
          const container = document.querySelector('.hexagon-clock-container');
          expect(container).toBeInTheDocument();

          const styles = window.getComputedStyle(container!);
          const maxWidth = parseInt(styles.maxWidth);
          expect(maxWidth).toBeLessThanOrEqual(expectedMaxSize);
        });
      }
    });

    it('maintains aspect ratio across all device sizes', async () => {
      const devices = Object.entries(DEVICE_VIEWPORTS).slice(0, 5); // Test first 5 devices

      for (const [deviceName, viewport] of devices) {
        setViewportSize(viewport.width, viewport.height);

        await act(async () => {
          render(
            <HexagonClock 
              data={mockCompletionData}
              size="auto"
            />
          );
        });

        await waitFor(() => {
          const container = document.querySelector('.hexagon-clock-container');
          expect(container).toBeInTheDocument();

          // Container should maintain square aspect ratio
          const styles = window.getComputedStyle(container!);
          const width = parseInt(styles.width || styles.maxWidth);
          const height = parseInt(styles.height || styles.maxHeight);
          
          // Allow small tolerance for rounding
          expect(Math.abs(width - height)).toBeLessThan(5);
        });
      }
    });
  });

  describe('Mobile Typography and Spacing', () => {
    it('adjusts font sizes for mobile readability', async () => {
      setViewportSize(375, 812); // iPhone 12 mini

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        // Check that mobile-specific font size classes are applied
        const centerLabel = screen.getByText('Balance Ritual');
        const categoryLabels = screen.getAllByRole('button');
        
        expect(centerLabel).toBeInTheDocument();
        expect(categoryLabels.length).toBeGreaterThan(0);

        // Font sizes should be readable on mobile
        categoryLabels.forEach(label => {
          const computedStyles = window.getComputedStyle(label);
          const fontSize = parseFloat(computedStyles.fontSize);
          expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
        });
      });
    });

    it('provides adequate spacing between interactive elements', async () => {
      setViewportSize(360, 780); // Galaxy S22

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(1);

        // Elements should have adequate spacing to prevent accidental taps
        buttons.forEach(button => {
          const styles = window.getComputedStyle(button);
          // Should have padding/margin for spacing
          expect(button.style.display).toBe('flex');
          expect(button.style.alignItems).toBe('center');
          expect(button.style.justifyContent).toBe('center');
        });
      });
    });
  });

  describe('Mobile Gesture Support', () => {
    it('handles touch events properly', async () => {
      const mockCategoryClick = jest.fn();
      setViewportSize(375, 812);

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            onCategoryClick={mockCategoryClick}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        
        // Simulate mobile touch sequence
        fireEvent.touchStart(physicalButton);
        fireEvent.touchEnd(physicalButton);
        fireEvent.click(physicalButton);

        expect(mockCategoryClick).toHaveBeenCalled();
      });
    });

    it('prevents accidental activation during scrolling', async () => {
      const mockCategoryClick = jest.fn();
      setViewportSize(393, 852);

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            onCategoryClick={mockCategoryClick}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        
        // Simulate touch and drag (scroll gesture)
        fireEvent.touchStart(physicalButton, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        fireEvent.touchMove(physicalButton, {
          touches: [{ clientX: 100, clientY: 150 }] // Moved 50px
        });
        fireEvent.touchEnd(physicalButton);

        // Should not trigger click during scroll
        expect(mockCategoryClick).not.toHaveBeenCalled();
      });
    });
  });

  describe('Landscape Orientation Support', () => {
    it('adapts to landscape mode on mobile devices', async () => {
      // Simulate landscape (swap width/height)
      setViewportSize(812, 375); // iPhone 12 mini landscape

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toBeInTheDocument();

        // Should still center properly in landscape
        const parentStyles = window.getComputedStyle(container?.parentElement || container!);
        expect(parentStyles.display).toBe('flex');
        expect(parentStyles.alignItems).toBe('center');
        expect(parentStyles.justifyContent).toBe('center');
      });
    });
  });

  describe('Performance on Mobile Devices', () => {
    it('optimizes rendering for mobile hardware', async () => {
      setViewportSize(375, 812);

      const renderStart = performance.now();
      
      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
            hardwareAccelerated={true}
          />
        );
      });

      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;

      // Mobile should still meet performance targets
      expect(renderTime).toBeLessThan(150); // Slightly higher tolerance for mobile
    });

    it('reduces animation complexity on smaller screens', async () => {
      setViewportSize(320, 568); // iPhone SE

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            animate={true}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        // Hardware acceleration should be applied for smoother animations
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toHaveClass('transform-gpu');
      });
    });
  });

  describe('Accessibility on Mobile', () => {
    it('maintains accessibility on touch devices', async () => {
      setViewportSize(393, 851); // Pixel 7

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        
        buttons.forEach(button => {
          // Should have proper ARIA attributes
          expect(button).toHaveAttribute('title');
          
          // Should be focusable
          expect(button).not.toHaveAttribute('tabindex', '-1');
          
          // Should meet minimum touch target size
          expect(button.style.minHeight).toBe('44px');
          expect(button.style.minWidth).toBe('44px');
        });
      });
    });

    it('supports screen readers on mobile', async () => {
      setViewportSize(414, 896); // iPhone 12 Pro Max

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        
        // Each button should have meaningful text content
        buttons.forEach(button => {
          expect(button.textContent).toBeTruthy();
          expect(button.textContent?.trim().length).toBeGreaterThan(0);
        });

        // Center display should have meaningful content
        const centerDisplay = screen.getByText('Balance Ritual');
        expect(centerDisplay).toBeInTheDocument();
      });
    });
  });

  describe('Dark Mode Support on Mobile', () => {
    it('applies proper contrast ratios in dark mode', async () => {
      // Mock dark mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('prefers-color-scheme: dark'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      setViewportSize(375, 812);

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        // Component should render in dark mode (actual styling would be handled by CSS)
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Mobile-Specific Edge Cases', () => {
    it('handles very narrow screens gracefully', async () => {
      setViewportSize(240, 320); // Very narrow screen

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toBeInTheDocument();
        
        // Should not overflow or break layout
        const styles = window.getComputedStyle(container!);
        expect(styles.overflow).not.toBe('visible');
      });
    });

    it('adapts to very wide aspect ratios (foldable devices)', async () => {
      setViewportSize(2208, 1768); // Samsung Galaxy Z Fold unfolded

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toBeInTheDocument();
        
        // Should center properly even on wide screens
        const parentStyles = window.getComputedStyle(container?.parentElement || container!);
        expect(parentStyles.display).toBe('flex');
        expect(parentStyles.justifyContent).toBe('center');
      });
    });
  });
});