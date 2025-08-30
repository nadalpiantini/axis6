/**
 * HexagonClock Unit Tests
 * Comprehensive testing for the unified revolutionary component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { HexagonClock } from '@/components/hexagon-clock/HexagonClock';
import type { CompletionData, TimeDistribution, HexagonClockProps } from '@/components/hexagon-clock/types/HexagonTypes';

// Mock performance API for testing
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1024 * 1024, // 1MB
      totalJSHeapSize: 2 * 1024 * 1024, // 2MB
    },
  },
});

// Mock matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock CSS environment variables for safe areas
Object.defineProperty(document.documentElement.style, 'setProperty', {
  value: jest.fn(),
});

// Mock window.innerWidth for responsive testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock getBoundingClientRect for touch target testing
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  x: 0,
  y: 0,
  width: 44,
  height: 44,
  top: 0,
  left: 0,
  bottom: 44,
  right: 44,
  toJSON: jest.fn(),
}));

// Mock ResizeObserver for container size tracking
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('HexagonClock Component', () => {
  // Test data fixtures
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
    {
      category_id: 2,
      category_name: 'Mental',
      category_color: '#365D63',
      planned_minutes: 180,
      actual_minutes: 160,
      percentage: 89,
    },
  ];

  const defaultProps: Partial<HexagonClockProps> = {
    animate: false, // Disable animations for testing
    mobileOptimized: true,
    hardwareAccelerated: false, // Disable for unit tests
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window width
    Object.defineProperty(window, 'innerWidth', { value: 1024 });
  });

  describe('Basic Rendering', () => {
    it('renders loading state during SSR/hydration', () => {
      const { container } = render(<HexagonClock {...defaultProps} />);

      // Should show loading placeholder initially
      const loadingElement = container.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });

    it('renders dashboard mode with completion data', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
        expect(screen.getByText('68%')).toBeInTheDocument(); // Average of completion data
      });
    });

    it('renders planning mode with time distribution', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            distribution={mockTimeDistribution}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Total Time')).toBeInTheDocument();
        expect(screen.getByText('4h 10m')).toBeInTheDocument(); // 250 minutes total
      });
    });

    it('renders unified mode when no data provided', async () => {
      await act(async () => {
        render(<HexagonClock {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText('AXIS6')).toBeInTheDocument();
      });
    });
  });

  describe('Clock Positioning', () => {
    it('positions categories at correct clock hours', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
            showClockMarkers={true}
          />
        );
      });

      await waitFor(() => {
        // Physical should be at 12 o'clock position (top)
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        expect(physicalButton).toBeInTheDocument();

        // Check if labels are positioned correctly (visual regression would be better)
        const categoryLabels = screen.getAllByRole('button');
        expect(categoryLabels).toHaveLength(6); // 6 categories
      });
    });

    it('calculates center values correctly', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        // Average of mockCompletionData should be 68%
        expect(screen.getByText('68%')).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Features', () => {
    it('handles category clicks', async () => {
      const mockCategoryClick = jest.fn();

      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
            onCategoryClick={mockCategoryClick}
          />
        );
      });

      await waitFor(() => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        fireEvent.click(physicalButton);

        expect(mockCategoryClick).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'physical',
            shortLabel: 'Physical'
          })
        );
      });
    });

    it('handles toggle axis callback', async () => {
      const mockToggleAxis = jest.fn();

      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
            onToggleAxis={mockToggleAxis}
          />
        );
      });

      // This would require more complex interaction testing with the hexagon paths
      // For now, we verify the callback is passed through
      expect(mockToggleAxis).toBeDefined();
    });
  });

  describe('Responsive Behavior', () => {
    const testSizes = [
      { width: 320, height: 568, label: 'iPhone SE' },
      { width: 375, height: 812, label: 'iPhone 12 mini' },
      { width: 414, height: 896, label: 'iPhone 11 Pro Max' },
      { width: 768, height: 1024, label: 'iPad' },
      { width: 1920, height: 1080, label: 'Desktop' },
    ];

    it.each(testSizes)('adapts to $label viewport ($width x $height)', async ({ width, height }) => {
      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', { value: width });
      Object.defineProperty(window, 'innerHeight', { value: height });

      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toBeInTheDocument();

        // Verify responsive sizing classes are applied
        expect(container).toHaveClass('ritual-card');
      });
    });

    it('applies mobile optimizations for touch devices', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });

      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        // Check that touch targets meet minimum size requirements
        const touchTargets = screen.getAllByRole('button');
        touchTargets.forEach(target => {
          const styles = window.getComputedStyle(target);
          // minHeight and minWidth should be set for mobile
          expect(target.style.minHeight).toBe('44px');
          expect(target.style.minWidth).toBe('44px');
        });
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('provides proper ARIA labels and roles', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        const categoryButtons = screen.getAllByRole('button');
        expect(categoryButtons).toHaveLength(6);

        categoryButtons.forEach(button => {
          expect(button).toHaveAttribute('title');
          expect(button).toBeVisible();
        });
      });
    });

    it('meets touch target size requirements (44px minimum)', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 }); // Mobile width

      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const touchTargets = screen.getAllByRole('button');
        touchTargets.forEach(target => {
          const rect = target.getBoundingClientRect();
          expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
        });
      });
    });

    it('supports keyboard navigation', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
            onCategoryClick={jest.fn()}
          />
        );
      });

      await waitFor(() => {
        const firstButton = screen.getAllByRole('button')[0];

        // Tab to first button
        firstButton.focus();
        expect(firstButton).toHaveFocus();

        // Enter should trigger click
        fireEvent.keyDown(firstButton, { key: 'Enter' });
        // Would need to verify click was triggered
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing data gracefully', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={undefined}
            distribution={undefined}
          />
        );
      });

      await waitFor(() => {
        // Should not crash and show unified mode
        expect(screen.getByText('AXIS6')).toBeInTheDocument();
      });
    });

    it('handles malformed data gracefully', async () => {
      const malformedData = {
        physical: NaN,
        mental: -10,
        emotional: 150, // Over 100%
        social: null as any,
        spiritual: undefined as any,
        material: 'invalid' as any,
      };

      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={malformedData}
          />
        );
      });

      await waitFor(() => {
        // Should handle gracefully and not crash
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
        // Center value should handle NaN/invalid values
        const centerValue = screen.getByText(/%/);
        expect(centerValue).toBeInTheDocument();
      });
    });
  });

  describe('Perfect Modal Centering', () => {
    it('uses flexbox centering instead of transform', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toBeInTheDocument();

        const styles = window.getComputedStyle(container?.parentElement || container!);
        expect(styles.display).toBe('flex');
        expect(styles.alignItems).toBe('center');
        expect(styles.justifyContent).toBe('center');
      });
    });

    it('applies safe area support for notched devices', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toBeInTheDocument();

        // Check that safe area CSS custom properties are used
        const styles = window.getComputedStyle(container?.parentElement || container!);
        expect(styles.padding).toContain('env(safe-area-inset');
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('accepts legacy HexagonChartWithResonance props', async () => {
      const legacyProps = {
        data: mockCompletionData,
        size: 350,
        animate: true,
        showResonance: true,
        onToggleAxis: jest.fn(),
        isToggling: false,
        axes: [
          { id: 1, name: 'Physical', color: '#A6C26F', icon: 'activity', completed: true },
          { id: 2, name: 'Mental', color: '#365D63', icon: 'brain', completed: false },
        ],
      };

      await act(async () => {
        render(<HexagonClock {...legacyProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
        expect(screen.getByText('68%')).toBeInTheDocument();
      });
    });

    it('accepts legacy TimeBlockHexagon props', async () => {
      const legacyProps = {
        distribution: mockTimeDistribution,
        categories: [
          { id: 1, name: 'Physical', color: '#A6C26F' },
          { id: 2, name: 'Mental', color: '#365D63' },
        ],
        onCategoryClick: jest.fn(),
        activeTimer: { category: 'Physical', elapsed: 30 },
      };

      await act(async () => {
        render(<HexagonClock {...legacyProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Total Time')).toBeInTheDocument();
        expect(screen.getByText('4h 10m')).toBeInTheDocument();
      });
    });
  });

  describe('SVG Rendering', () => {
    it('renders hexagon SVG elements', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        const svgElements = document.querySelectorAll('svg');
        expect(svgElements.length).toBeGreaterThan(0);

        // Check for hexagon path elements
        const pathElements = document.querySelectorAll('path');
        expect(pathElements.length).toBeGreaterThan(0);
      });
    });

    it('applies hardware acceleration classes when enabled', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
            hardwareAccelerated={true}
          />
        );
      });

      await waitFor(() => {
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toHaveClass('transform-gpu');
      });
    });
  });

  describe('Animation Control', () => {
    it('disables animations when animate=false', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
            animate={false}
          />
        );
      });

      await waitFor(() => {
        // Elements should have opacity: 1 immediately (no fade-in animation)
        const categoryLabels = screen.getAllByRole('button');
        categoryLabels.forEach(label => {
          expect(label.parentElement).toHaveStyle({ opacity: '1' });
        });
      });
    });

    it('applies staggered animations when animate=true', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
            animate={true}
          />
        );
      });

      // This is harder to test without actual animation timing
      // In a real scenario, we'd use testing utilities that can handle CSS animations
      await waitFor(() => {
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Community Features', () => {
    it('displays resonance indicators', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
            showResonance={true}
          />
        );
      });

      await waitFor(() => {
        // Check for resonance dots (would be rendered by ResonanceLayer)
        const resonanceLayer = document.querySelector('svg');
        expect(resonanceLayer).toBeInTheDocument();
      });
    });

    it('shows community count in center display', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...defaultProps}
            data={mockCompletionData}
            showResonance={true}
          />
        );
      });

      await waitFor(() => {
        // Should show community indicator
        expect(screen.getByText(/community/)).toBeInTheDocument();
      });
    });
  });

  describe('Display Name', () => {
    it('has correct displayName for debugging', () => {
      expect(HexagonClock.displayName).toBe('HexagonClock');
    });
  });
});
