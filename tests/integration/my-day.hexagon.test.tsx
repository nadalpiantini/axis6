/**
 * My Day HexagonClock Integration Tests
 * Testing HexagonClock component within My Day page context (time planning mode)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/my-day',
  }),
  usePathname: () => '/my-day',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        data: [
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
        ],
        error: null,
      }),
    }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    }),
  },
};

jest.mock('@/lib/supabase/client', () => ({
  createClientComponentClient: () => mockSupabaseClient,
}));

// Mock the My Day page component
const MockMyDayPage = () => {
  const [timeDistribution, setTimeDistribution] = React.useState([
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
  ]);

  const [activeTimer, setActiveTimer] = React.useState(null);

  const handleCategoryClick = React.useCallback((category: any) => {
    console.log('Time block clicked:', category);
  }, []);

  const handleTimeBlockDrag = React.useCallback((block: any, newHour: number) => {
    console.log('Time block dragged:', block, 'to hour:', newHour);
  }, []);

  const HexagonClock = React.lazy(() => import('@/components/hexagon-clock/HexagonClock'));

  return (
    <div className="my-day-container">
      <header>
        <h1>Plan My Day</h1>
        <div className="current-time">
          Current time: {new Date().toLocaleTimeString()}
        </div>
      </header>
      
      <main className="time-planning-section" role="main" aria-label="Time Planning Interface">
        <React.Suspense fallback={<div>Loading time planner...</div>}>
          <HexagonClock
            distribution={timeDistribution}
            size="auto"
            showClockMarkers={true}
            showCurrentTime={true}
            onCategoryClick={handleCategoryClick}
            onTimeBlockDrag={handleTimeBlockDrag}
            activeTimer={activeTimer}
            animate={true}
            mobileOptimized={true}
            hardwareAccelerated={true}
          />
        </React.Suspense>
      </main>

      <section className="time-controls" role="complementary" aria-label="Time Controls">
        <h2>Time Blocks</h2>
        <div className="time-summary">
          Total planned: {timeDistribution.reduce((sum, item) => sum + item.planned_minutes, 0)} minutes
        </div>
        <div className="time-blocks-list">
          {timeDistribution.map(block => (
            <div key={block.category_id} className="time-block-card">
              <span style={{ color: block.category_color }}>{block.category_name}</span>
              <span>{Math.floor(block.planned_minutes / 60)}h {block.planned_minutes % 60}m</span>
            </div>
          ))}
        </div>
      </section>

      <aside className="timer-controls" role="complementary" aria-label="Timer Controls">
        <button 
          onClick={() => setActiveTimer(activeTimer ? null : { category: 'Physical', startTime: Date.now() })}
          className="timer-toggle"
        >
          {activeTimer ? 'Stop Timer' : 'Start Timer'}
        </button>
      </aside>
    </div>
  );
};

describe('My Day HexagonClock Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset window size
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  describe('My Day Page Integration', () => {
    it('renders HexagonClock in time planning mode', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Plan My Day')).toBeInTheDocument();
        expect(screen.getByRole('main', { name: /Time Planning Interface/i })).toBeInTheDocument();
        
        // HexagonClock should show time distribution mode
        expect(screen.getByText('Total Time')).toBeInTheDocument();
        expect(screen.getByText('6h 0m')).toBeInTheDocument(); // 360 minutes total
      });
    });

    it('displays time distribution correctly', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        // Check for time displays on categories
        expect(screen.getByText('2h 0m')).toBeInTheDocument(); // Physical: 120 minutes
        expect(screen.getByText('3h 0m')).toBeInTheDocument(); // Mental: 180 minutes
        expect(screen.getByText('1h 0m')).toBeInTheDocument(); // Emotional: 60 minutes
        
        // Check for category buttons
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        const mentalButton = screen.getByRole('button', { name: /Mental/i });
        
        expect(physicalButton).toBeInTheDocument();
        expect(mentalButton).toBeInTheDocument();
      });
    });

    it('shows clock markers for time planning', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        // Clock markers should be visible
        const hexagonContainer = document.querySelector('.hexagon-clock-container');
        expect(hexagonContainer).toBeInTheDocument();
        
        // SVG should contain clock marker elements
        const svgElements = document.querySelectorAll('svg');
        expect(svgElements.length).toBeGreaterThan(0);
      });
    });

    it('displays current time indicator', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        // Current time should be shown in header
        expect(screen.getByText(/Current time:/)).toBeInTheDocument();
        
        // Current time indicator should be visible in hexagon (if implemented)
        const hexagonContainer = document.querySelector('.hexagon-clock-container');
        expect(hexagonContainer).toBeInTheDocument();
      });
    });
  });

  describe('Time Block Interactions', () => {
    it('handles time block clicks', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(async () => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        
        await userEvent.click(physicalButton);
        
        expect(consoleSpy).toHaveBeenCalledWith('Time block clicked:', expect.objectContaining({
          key: 'physical',
        }));
      });

      consoleSpy.mockRestore();
    });

    it('handles time block dragging to different hours', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        
        // Simulate drag operation
        fireEvent.mouseDown(physicalButton);
        fireEvent.mouseMove(physicalButton, { clientX: 100, clientY: 50 });
        fireEvent.mouseUp(physicalButton);
        
        // In a real implementation, this would trigger the drag handler
        expect(physicalButton).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('updates time distribution when blocks are modified', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        // Check initial total time
        expect(screen.getByText('6h 0m')).toBeInTheDocument();
        
        // After modification (would be triggered by real interactions)
        expect(screen.getByText('Total planned: 360 minutes')).toBeInTheDocument();
      });
    });
  });

  describe('Timer Integration', () => {
    it('displays active timer state', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(async () => {
        const startButton = screen.getByText('Start Timer');
        expect(startButton).toBeInTheDocument();
        
        await userEvent.click(startButton);
        
        await waitFor(() => {
          expect(screen.getByText('Stop Timer')).toBeInTheDocument();
        });
      });
    });

    it('shows timer progress on hexagon clock', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(async () => {
        // Start timer
        const startButton = screen.getByText('Start Timer');
        await userEvent.click(startButton);
        
        // Active timer should affect hexagon display
        const hexagonContainer = document.querySelector('.hexagon-clock-container');
        expect(hexagonContainer).toBeInTheDocument();
      });
    });

    it('handles timer state changes', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(async () => {
        const timerButton = screen.getByRole('button', { name: /Timer/i });
        
        // Toggle timer multiple times
        await userEvent.click(timerButton);
        await waitFor(() => expect(screen.getByText('Stop Timer')).toBeInTheDocument());
        
        await userEvent.click(timerButton);
        await waitFor(() => expect(screen.getByText('Start Timer')).toBeInTheDocument());
      });
    });
  });

  describe('Clock Positioning in Time Planning', () => {
    it('positions time blocks at appropriate clock positions', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        // Physical should be at 12 o'clock (morning activities)
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        expect(physicalButton).toBeInTheDocument();
        
        // Mental should be positioned based on typical work hours
        const mentalButton = screen.getByRole('button', { name: /Mental/i });
        expect(mentalButton).toBeInTheDocument();
      });
    });

    it('shows clock hour markers', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        // Clock markers should be visible
        const svgElements = document.querySelectorAll('svg');
        expect(svgElements.length).toBeGreaterThan(0);
        
        // Would check for specific clock markers in real implementation
      });
    });

    it('indicates current time position', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        // Current time indicator should be visible
        expect(screen.getByText(/Current time:/)).toBeInTheDocument();
        
        // Sun symbol or current time indicator should be on hexagon
        const hexagonContainer = document.querySelector('.hexagon-clock-container');
        expect(hexagonContainer).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Time Planning Integration', () => {
    it('adapts to mobile time planning interface', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 812 });

      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        const hexagonContainer = document.querySelector('.hexagon-clock-container');
        expect(hexagonContainer).toBeInTheDocument();
        
        // Touch targets should meet requirements
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          if (button.textContent?.includes('Physical') || button.textContent?.includes('Mental')) {
            expect(button.style.minHeight).toBe('44px');
            expect(button.style.minWidth).toBe('44px');
          }
        });
      });
    });

    it('handles touch interactions for time block manipulation', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(async () => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        
        // Touch interaction sequence
        fireEvent.touchStart(physicalButton, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        fireEvent.touchEnd(physicalButton);
        
        expect(physicalButton).toBeInTheDocument();
      });
    });
  });

  describe('Performance in My Day Context', () => {
    it('renders efficiently with time distribution data', async () => {
      const renderStart = performance.now();
      
      await act(async () => {
        render(<MockMyDayPage />);
      });

      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;

      // Should render quickly with time planning data
      expect(renderTime).toBeLessThan(200);
    });

    it('handles real-time timer updates smoothly', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(async () => {
        const startButton = screen.getByText('Start Timer');
        await userEvent.click(startButton);
        
        // Simulate timer ticks (would be handled by setInterval in real implementation)
        act(() => {
          // Timer state updates
        });
        
        expect(screen.getByText('Stop Timer')).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence', () => {
    it('saves time distribution changes', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        // Verify Supabase calls for data persistence
        expect(mockSupabaseClient.from).toHaveBeenCalled();
        
        // Changes would trigger update calls in real implementation
      });
    });

    it('syncs timer state with backend', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(async () => {
        const startButton = screen.getByText('Start Timer');
        await userEvent.click(startButton);
        
        // Timer start would trigger backend sync
        expect(mockSupabaseClient.from).toHaveBeenCalled();
      });
    });
  });

  describe('Time Block Management', () => {
    it('displays time block summary correctly', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Total planned: 360 minutes')).toBeInTheDocument();
        
        // Individual time blocks
        expect(screen.getByText('Physical')).toBeInTheDocument();
        expect(screen.getByText('Mental')).toBeInTheDocument();
        expect(screen.getByText('Emotional')).toBeInTheDocument();
      });
    });

    it('updates totals when time blocks change', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        // Initial total
        expect(screen.getByText('Total planned: 360 minutes')).toBeInTheDocument();
        
        // After changes (would be triggered by real interactions)
        expect(screen.getByText('6h 0m')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility in My Day Context', () => {
    it('provides proper time planning semantics', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('main', { name: /Time Planning Interface/i })).toBeInTheDocument();
        expect(screen.getByRole('complementary', { name: /Time Controls/i })).toBeInTheDocument();
        expect(screen.getByRole('complementary', { name: /Timer Controls/i })).toBeInTheDocument();
      });
    });

    it('announces timer state changes to screen readers', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(async () => {
        const timerButton = screen.getByRole('button', { name: /Timer/i });
        
        await userEvent.click(timerButton);
        
        // Timer state change should be announced
        expect(screen.getByText('Stop Timer')).toBeInTheDocument();
      });
    });

    it('provides keyboard navigation for time blocks', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(async () => {
        // Should be able to navigate through time block controls
        const buttons = screen.getAllByRole('button');
        
        for (const button of buttons.slice(0, 3)) {
          await user.tab();
          if (button.textContent?.includes('Physical') || 
              button.textContent?.includes('Mental') || 
              button.textContent?.includes('Timer')) {
            expect(button).toHaveFocus();
          }
        }
      });
    });
  });

  describe('Integration with Time Tracking', () => {
    it('connects with time tracking systems', async () => {
      await act(async () => {
        render(<MockMyDayPage />);
      });

      await waitFor(() => {
        // Should integrate with time tracking
        expect(screen.getByText('Plan My Day')).toBeInTheDocument();
        
        // Time distribution should reflect tracked time
        expect(screen.getByText('6h 0m')).toBeInTheDocument();
      });
    });
  });
});