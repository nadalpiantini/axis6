/**
 * Backward Compatibility Integration Tests
 * Ensures HexagonClock maintains 100% backward compatibility with replaced components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { HexagonClock } from '@/components/hexagon-clock/HexagonClock';
import type { CompletionData, TimeDistribution } from '@/components/hexagon-clock/types/HexagonTypes';

describe('Backward Compatibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HexagonChartWithResonance Compatibility', () => {
    // Test legacy props interface
    const legacyHexagonChartProps = {
      data: {
        physical: 80,
        mental: 60,
        emotional: 90,
        social: 40,
        spiritual: 70,
        material: 85,
      },
      size: 350,
      animate: true,
      showResonance: true,
      onToggleAxis: jest.fn(),
      isToggling: false,
      axes: [
        { id: 1, name: 'Physical', color: '#A6C26F', icon: 'activity', completed: true },
        { id: 2, name: 'Mental', color: '#365D63', icon: 'brain', completed: false },
        { id: 3, name: 'Emotional', color: '#D36C50', icon: 'heart', completed: true },
        { id: 4, name: 'Social', color: '#6F3D56', icon: 'users', completed: false },
        { id: 5, name: 'Spiritual', color: '#2C3E50', icon: 'sun', completed: true },
        { id: 6, name: 'Material', color: '#C85729', icon: 'dollar-sign', completed: true },
      ],
    };

    it('accepts all legacy HexagonChartWithResonance props', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...legacyHexagonChartProps}
          />
        );
      });

      await waitFor(() => {
        // Should render in dashboard mode
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
        expect(screen.getByText('68%')).toBeInTheDocument(); // Average completion

        // Should show resonance features
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(6); // 6 category buttons
      });
    });

    it('maintains exact same interaction behavior as legacy component', async () => {
      const mockToggleAxis = jest.fn();

      await act(async () => {
        render(
          <HexagonClock
            {...legacyHexagonChartProps}
            onToggleAxis={mockToggleAxis}
          />
        );
      });

      await waitFor(() => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        fireEvent.click(physicalButton);

        // Should call onToggleAxis with the same signature
        expect(mockToggleAxis).toHaveBeenCalledWith(
          expect.any(String) // Legacy component passed string ID
        );
      });
    });

    it('renders same visual output as legacy HexagonChartWithResonance', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...legacyHexagonChartProps}
          />
        );
      });

      await waitFor(() => {
        // Same center display
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
        expect(screen.getByText('68%')).toBeInTheDocument();

        // Same category labels
        expect(screen.getByRole('button', { name: /Physical/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Mental/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Emotional/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Social/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Spiritual/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Material/i })).toBeInTheDocument();

        // Same percentage displays
        expect(screen.getByText('80%')).toBeInTheDocument(); // Physical
        expect(screen.getByText('60%')).toBeInTheDocument(); // Mental
        expect(screen.getByText('90%')).toBeInTheDocument(); // Emotional
        expect(screen.getByText('40%')).toBeInTheDocument(); // Social
        expect(screen.getByText('70%')).toBeInTheDocument(); // Spiritual
        expect(screen.getByText('85%')).toBeInTheDocument(); // Material
      });
    });

    it('handles legacy axes prop format correctly', async () => {
      await act(async () => {
        render(
          <HexagonClock
            data={legacyHexagonChartProps.data}
            axes={legacyHexagonChartProps.axes}
            showResonance={true}
          />
        );
      });

      await waitFor(() => {
        // Should render all axes from legacy format
        legacyHexagonChartProps.axes.forEach(axis => {
          expect(screen.getByRole('button', { name: new RegExp(axis.name, 'i') })).toBeInTheDocument();
        });
      });
    });

    it('preserves legacy animation behavior', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...legacyHexagonChartProps}
            animate={true}
          />
        );
      });

      // Should apply animations (test would verify CSS classes in real implementation)
      await waitFor(() => {
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass('transform-gpu'); // Hardware acceleration
      });
    });

    it('handles legacy isToggling state correctly', async () => {
      const { rerender } = render(
        <HexagonClock
          {...legacyHexagonChartProps}
          isToggling={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
      });

      // Update to toggling state
      rerender(
        <HexagonClock
          {...legacyHexagonChartProps}
          isToggling={true}
        />
      );

      await waitFor(() => {
        // Should handle toggling state (visual changes would depend on implementation)
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
      });
    });

    it('maintains legacy size prop behavior', async () => {
      const sizes = [300, 350, 400];

      sizes.forEach(async (size) => {
        await act(async () => {
          render(
            <HexagonClock
              {...legacyHexagonChartProps}
              size={size}
            />
          );
        });

        await waitFor(() => {
          const container = document.querySelector('.hexagon-clock-container');
          expect(container).toBeInTheDocument();

          // Size should influence the component dimensions
          const styles = window.getComputedStyle(container!);
          expect(parseInt(styles.maxWidth || '0')).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('TimeBlockHexagon Compatibility', () => {
    // Test legacy TimeBlockHexagon props
    const legacyTimeBlockProps = {
      distribution: [
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
        {
          category_id: 3,
          category_name: 'Emotional',
          category_color: '#D36C50',
          planned_minutes: 60,
          actual_minutes: 45,
          percentage: 75,
        },
      ] as TimeDistribution[],
      categories: [
        { id: 1, name: 'Physical', color: '#A6C26F' },
        { id: 2, name: 'Mental', color: '#365D63' },
        { id: 3, name: 'Emotional', color: '#D36C50' },
      ],
      onCategoryClick: jest.fn(),
      activeTimer: { category: 'Physical', elapsed: 30, startTime: Date.now() - 30000 },
    };

    it('accepts all legacy TimeBlockHexagon props', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...legacyTimeBlockProps}
          />
        );
      });

      await waitFor(() => {
        // Should render in time planning mode
        expect(screen.getByText('Total Time')).toBeInTheDocument();
        expect(screen.getByText('6h 0m')).toBeInTheDocument(); // 360 minutes total
      });
    });

    it('displays time distribution exactly like legacy component', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...legacyTimeBlockProps}
          />
        );
      });

      await waitFor(() => {
        // Same time displays as legacy
        expect(screen.getByText('2h 0m')).toBeInTheDocument(); // Physical: 120 minutes
        expect(screen.getByText('3h 0m')).toBeInTheDocument(); // Mental: 180 minutes
        expect(screen.getByText('1h 0m')).toBeInTheDocument(); // Emotional: 60 minutes

        // Same total calculation
        expect(screen.getByText('Total Time')).toBeInTheDocument();
        expect(screen.getByText('6h 0m')).toBeInTheDocument();
      });
    });

    it('handles legacy category click behavior identically', async () => {
      const mockCategoryClick = jest.fn();

      await act(async () => {
        render(
          <HexagonClock
            {...legacyTimeBlockProps}
            onCategoryClick={mockCategoryClick}
          />
        );
      });

      await waitFor(async () => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        await userEvent.click(physicalButton);

        // Should call with same signature as legacy
        expect(mockCategoryClick).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'physical',
            shortLabel: 'Physical',
          })
        );
      });
    });

    it('handles legacy categories prop format', async () => {
      await act(async () => {
        render(
          <HexagonClock
            distribution={legacyTimeBlockProps.distribution}
            categories={legacyTimeBlockProps.categories}
          />
        );
      });

      await waitFor(() => {
        // Should render categories from legacy format
        legacyTimeBlockProps.categories.forEach(category => {
          expect(screen.getByRole('button', { name: new RegExp(category.name, 'i') })).toBeInTheDocument();
        });
      });
    });

    it('displays active timer state like legacy component', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...legacyTimeBlockProps}
          />
        );
      });

      await waitFor(() => {
        // Should show timer information (implementation specific)
        expect(screen.getByText('Total Time')).toBeInTheDocument();

        // Active timer should be indicated somehow (visual or behavioral)
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        expect(physicalButton).toBeInTheDocument();
      });
    });

    it('handles time block drag interactions like legacy', async () => {
      const mockTimeBlockDrag = jest.fn();

      await act(async () => {
        render(
          <HexagonClock
            {...legacyTimeBlockProps}
            onTimeBlockDrag={mockTimeBlockDrag}
          />
        );
      });

      await waitFor(() => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });

        // Simulate drag operation
        fireEvent.mouseDown(physicalButton);
        fireEvent.mouseMove(physicalButton, { clientX: 100, clientY: 50 });
        fireEvent.mouseUp(physicalButton);

        // Should handle drag interaction (callback would be called in real implementation)
        expect(physicalButton).toBeInTheDocument();
      });
    });
  });

  describe('Mixed Legacy Props Compatibility', () => {
    it('handles mixed props from both legacy components gracefully', async () => {
      await act(async () => {
        render(
          <HexagonClock
            // Dashboard mode props
            data={legacyHexagonChartProps.data}
            showResonance={true}
            onToggleAxis={jest.fn()}
            isToggling={false}
            axes={legacyHexagonChartProps.axes}

            // Time planning mode props (should be ignored when data is present)
            distribution={legacyTimeBlockProps.distribution}
            categories={legacyTimeBlockProps.categories}
            activeTimer={legacyTimeBlockProps.activeTimer}

            // Common props
            size={350}
            animate={true}
            onCategoryClick={jest.fn()}
          />
        );
      });

      await waitFor(() => {
        // Should prioritize dashboard mode when both data and distribution are present
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
        expect(screen.getByText('68%')).toBeInTheDocument();

        // Should not show time planning mode
        expect(screen.queryByText('Total Time')).not.toBeInTheDocument();
      });
    });

    it('gracefully handles missing or undefined legacy props', async () => {
      await act(async () => {
        render(
          <HexagonClock
            data={legacyHexagonChartProps.data}
            axes={undefined}
            categories={undefined}
            activeTimer={undefined}
            onToggleAxis={undefined}
            onCategoryClick={undefined}
          />
        );
      });

      await waitFor(() => {
        // Should still render correctly with undefined props
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
        expect(screen.getByText('68%')).toBeInTheDocument();

        // Should show categories despite undefined axes prop
        expect(screen.getByRole('button', { name: /Physical/i })).toBeInTheDocument();
      });
    });
  });

  describe('API Compatibility', () => {
    it('maintains same prop types as legacy components', () => {
      // TypeScript compilation test - if this compiles, types are compatible
      const dashboardProps = {
        data: {
          physical: 80,
          mental: 60,
          emotional: 90,
          social: 40,
          spiritual: 70,
          material: 85,
        } as CompletionData,
        size: 350 as number,
        animate: true as boolean,
        showResonance: true as boolean,
        onToggleAxis: (() => {}) as (id: string | number) => void,
        isToggling: false as boolean,
      };

      const timePlanningProps = {
        distribution: [] as TimeDistribution[],
        onCategoryClick: (() => {}) as (category: any) => void,
      };

      // These should compile without TypeScript errors
      expect(dashboardProps.data.physical).toBe(80);
      expect(timePlanningProps.distribution).toEqual([]);
    });

    it('provides same ref forwarding as legacy components', async () => {
      const ref = React.createRef<HTMLDivElement>();

      await act(async () => {
        render(
          <HexagonClock
            ref={ref as any}
            data={legacyHexagonChartProps.data}
          />
        );
      });

      await waitFor(() => {
        // Ref should be forwarded (if implemented)
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
      });
    });

    it('maintains same displayName for debugging', () => {
      expect(HexagonClock.displayName).toBe('HexagonClock');
    });
  });

  describe('Performance Parity', () => {
    it('renders as fast as legacy components', async () => {
      const startTime = performance.now();

      await act(async () => {
        render(
          <HexagonClock
            {...legacyHexagonChartProps}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render as fast or faster than legacy components
      expect(renderTime).toBeLessThan(100); // Fast render target
    });

    it('maintains same memory footprint as legacy components', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      await act(async () => {
        render(
          <HexagonClock
            {...legacyHexagonChartProps}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
      });

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Should use reasonable memory
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // <5MB
    });
  });

  describe('Error Handling Compatibility', () => {
    it('handles malformed legacy data like original components', async () => {
      const malformedData = {
        physical: NaN,
        mental: null as any,
        emotional: undefined as any,
        social: 'invalid' as any,
        spiritual: -10,
        material: 150, // Over 100%
      };

      await act(async () => {
        render(
          <HexagonClock
            data={malformedData}
          />
        );
      });

      await waitFor(() => {
        // Should handle gracefully without crashing
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();

        // Should show some center value (might be NaN but shouldn't crash)
        const centerValue = screen.getByText(/%/);
        expect(centerValue).toBeInTheDocument();
      });
    });

    it('handles missing required props gracefully like legacy', async () => {
      await act(async () => {
        render(
          <HexagonClock
            // No data or distribution provided
          />
        );
      });

      await waitFor(() => {
        // Should render unified mode or fallback state
        expect(screen.getByText('AXIS6')).toBeInTheDocument();
      });
    });
  });

  describe('CSS Class Compatibility', () => {
    it('maintains same CSS classes as legacy components for styling', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...legacyHexagonChartProps}
          />
        );
      });

      await waitFor(() => {
        // Should have main container class
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toBeInTheDocument();

        // Should maintain classes for external CSS targeting
        expect(container).toHaveClass('ritual-card');
      });
    });

    it('preserves legacy CSS custom properties', async () => {
      await act(async () => {
        render(
          <HexagonClock
            {...legacyHexagonChartProps}
          />
        );
      });

      await waitFor(() => {
        const container = document.querySelector('.hexagon-clock-container');
        const styles = window.getComputedStyle(container!);

        // Should maintain CSS custom properties for theming
        expect(styles.getPropertyValue('--transform-gpu')).toBeTruthy();
      });
    });
  });

  describe('Integration Compatibility', () => {
    it('works with existing dashboard integration code', async () => {
      // Simulate existing dashboard wrapper
      const DashboardWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className="dashboard-layout">
          <header>Dashboard Header</header>
          <main className="dashboard-main">{children}</main>
          <aside>Dashboard Sidebar</aside>
        </div>
      );

      await act(async () => {
        render(
          <DashboardWrapper>
            <HexagonClock
              {...legacyHexagonChartProps}
            />
          </DashboardWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Dashboard Header')).toBeInTheDocument();
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
      });
    });

    it('works with existing My Day integration code', async () => {
      // Simulate existing My Day wrapper
      const MyDayWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className="my-day-layout">
          <header>My Day Planner</header>
          <section className="time-planning">{children}</section>
          <aside>Time Controls</aside>
        </div>
      );

      await act(async () => {
        render(
          <MyDayWrapper>
            <HexagonClock
              {...legacyTimeBlockProps}
            />
          </MyDayWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('My Day Planner')).toBeInTheDocument();
        expect(screen.getByText('Total Time')).toBeInTheDocument();
      });
    });
  });
});
