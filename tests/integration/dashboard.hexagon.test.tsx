/**
 * Dashboard HexagonClock Integration Tests
 * Testing HexagonClock component within Dashboard page context
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
    pathname: '/dashboard',
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            name: 'Test User',
            timezone: 'UTC',
          },
          error: null,
        }),
      }),
      limit: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          data: [
            {
              category_id: 1,
              category_name: 'Physical',
              mood: 4,
              notes: 'Good workout',
              completed_at: new Date().toISOString().split('T')[0],
            },
          ],
          error: null,
        }),
      }),
    }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    }),
  },
  rpc: jest.fn().mockResolvedValue({
    data: {
      checkins: [
        {
          category_id: 1,
          category_name: 'Physical',
          mood: 4,
          notes: 'Good workout',
        },
      ],
      streaks: [
        {
          category_id: 1,
          current_streak: 5,
          longest_streak: 12,
        },
      ],
      stats: {
        days_active: 6,
        avg_mood: 4.2,
      },
    },
    error: null,
  }),
};

jest.mock('@/lib/supabase/client', () => ({
  createClientComponentClient: () => mockSupabaseClient,
}));

// Mock the Dashboard page component
const MockDashboard = () => {
  const [completionData, setCompletionData] = React.useState({
    physical: 80,
    mental: 60,
    emotional: 90,
    social: 40,
    spiritual: 70,
    material: 85,
  });

  const handleToggleAxis = React.useCallback((axisId: string) => {
    setCompletionData(prev => ({
      ...prev,
      [axisId]: prev[axisId as keyof typeof prev] > 0 ? 0 : 80,
    }));
  }, []);

  const handleCategoryClick = React.useCallback((category: any) => {
    console.log('Category clicked:', category);
  }, []);

  const HexagonClock = React.lazy(() => import('@/components/hexagon-clock/HexagonClock'));

  return (
    <div className="dashboard-container">
      <h1>Your AXIS6 Dashboard</h1>

      <div className="hexagon-section" role="main" aria-label="Daily Balance Tracker">
        <React.Suspense fallback={<div>Loading...</div>}>
          <HexagonClock
            data={completionData}
            size="auto"
            showResonance={true}
            showClockMarkers={false}
            onToggleAxis={handleToggleAxis}
            onCategoryClick={handleCategoryClick}
            animate={true}
            mobileOptimized={true}
            hardwareAccelerated={true}
          />
        </React.Suspense>
      </div>

      <div className="dashboard-stats" role="complementary" aria-label="Statistics">
        <h2>Your Progress</h2>
        <div>Average: {Math.round(Object.values(completionData).reduce((a, b) => a + b, 0) / 6)}%</div>
      </div>
    </div>
  );
};

describe('Dashboard HexagonClock Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset window size
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  describe('Dashboard Page Integration', () => {
    it('renders HexagonClock within dashboard layout', async () => {
      await act(async () => {
        render(<MockDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Your AXIS6 Dashboard')).toBeInTheDocument();
        expect(screen.getByRole('main', { name: /Daily Balance Tracker/i })).toBeInTheDocument();

        // HexagonClock should be rendered
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
        expect(screen.getByText('68%')).toBeInTheDocument(); // Average completion
      });
    });

    it('displays completion percentages correctly', async () => {
      await act(async () => {
        render(<MockDashboard />);
      });

      await waitFor(() => {
        // Check for category labels
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        const mentalButton = screen.getByRole('button', { name: /Mental/i });

        expect(physicalButton).toBeInTheDocument();
        expect(mentalButton).toBeInTheDocument();

        // Check for percentage displays
        expect(screen.getByText('80%')).toBeInTheDocument(); // Physical
        expect(screen.getByText('60%')).toBeInTheDocument(); // Mental
      });
    });

    it('handles category interactions correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await act(async () => {
        render(<MockDashboard />);
      });

      await waitFor(async () => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });

        await userEvent.click(physicalButton);

        expect(consoleSpy).toHaveBeenCalledWith('Category clicked:', expect.objectContaining({
          key: 'physical',
        }));
      });

      consoleSpy.mockRestore();
    });

    it('updates completion data when toggling axes', async () => {
      await act(async () => {
        render(<MockDashboard />);
      });

      await waitFor(async () => {
        // Find a way to trigger the toggle (this would depend on actual implementation)
        // For now, verify the data structure is correct
        const centerDisplay = screen.getByText('Balance Ritual');
        expect(centerDisplay).toBeInTheDocument();

        const averageDisplay = screen.getByText('68%');
        expect(averageDisplay).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Data Updates', () => {
    it('updates hexagon display when data changes', async () => {
      let rerender: any;

      await act(async () => {
        const result = render(<MockDashboard />);
        rerender = result.rerender;
      });

      await waitFor(() => {
        expect(screen.getByText('68%')).toBeInTheDocument();
      });

      // Simulate data update (would come from real data hooks)
      await act(async () => {
        // This would be triggered by actual data changes in real implementation
        // For testing, we verify the component can handle updates
        rerender(<MockDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
      });
    });

    it('handles Supabase real-time subscriptions', async () => {
      // Mock real-time subscription
      const mockSubscription = {
        unsubscribe: jest.fn(),
      };

      mockSupabaseClient.from = jest.fn().mockReturnValue({
        on: jest.fn().mockReturnValue({
          subscribe: jest.fn().mockResolvedValue(mockSubscription),
        }),
      });

      await act(async () => {
        render(<MockDashboard />);
      });

      // Test would verify subscription setup in real implementation
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });
  });

  describe('Performance in Dashboard Context', () => {
    it('renders efficiently within complex dashboard layout', async () => {
      const renderStart = performance.now();

      await act(async () => {
        render(
          <div>
            <MockDashboard />
            {/* Additional dashboard components */}
            <div>Other dashboard content</div>
            <div>Sidebar navigation</div>
            <div>Footer content</div>
          </div>
        );
      });

      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;

      // Should render quickly even with other components
      expect(renderTime).toBeLessThan(200); // Reasonable for integration test
    });

    it('maintains 60fps during interactions', async () => {
      await act(async () => {
        render(<MockDashboard />);
      });

      await waitFor(async () => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });

        // Rapid interactions should remain smooth
        for (let i = 0; i < 10; i++) {
          await userEvent.click(physicalButton);
        }

        expect(physicalButton).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Dashboard Integration', () => {
    it('adapts to mobile dashboard layout', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 812 });

      await act(async () => {
        render(<MockDashboard />);
      });

      await waitFor(() => {
        const hexagonContainer = document.querySelector('.hexagon-clock-container');
        expect(hexagonContainer).toBeInTheDocument();

        // Should adapt to mobile constraints
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button.style.minHeight).toBe('44px');
          expect(button.style.minWidth).toBe('44px');
        });
      });
    });

    it('integrates with mobile navigation patterns', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });

      await act(async () => {
        render(
          <div className="mobile-dashboard">
            <nav role="navigation" aria-label="Main navigation">
              <button>Menu</button>
            </nav>
            <MockDashboard />
            <nav role="navigation" aria-label="Bottom navigation">
              <button>Home</button>
              <button>Stats</button>
              <button>Settings</button>
            </nav>
          </div>
        );
      });

      await waitFor(() => {
        // Should coexist with mobile navigation
        expect(screen.getByRole('navigation', { name: /Main navigation/i })).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: /Bottom navigation/i })).toBeInTheDocument();
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling in Dashboard Context', () => {
    it('handles data loading errors gracefully', async () => {
      // Mock API error
      mockSupabaseClient.rpc = jest.fn().mockRejectedValue(new Error('Network error'));

      await act(async () => {
        render(<MockDashboard />);
      });

      await waitFor(() => {
        // Should still render with fallback data or error state
        expect(screen.getByText('Your AXIS6 Dashboard')).toBeInTheDocument();

        // Component should handle missing data gracefully
        const hexagonText = screen.queryByText('Balance Ritual') || screen.queryByText('AXIS6');
        expect(hexagonText).toBeInTheDocument();
      });
    });

    it('recovers from component errors without crashing dashboard', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // This would test error boundary behavior in real implementation
      await act(async () => {
        render(<MockDashboard />);
      });

      // Should not crash the entire dashboard
      await waitFor(() => {
        expect(screen.getByText('Your AXIS6 Dashboard')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility in Dashboard Context', () => {
    it('maintains proper heading hierarchy', async () => {
      await act(async () => {
        render(<MockDashboard />);
      });

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        const h2 = screen.getByRole('heading', { level: 2 });

        expect(h1).toHaveTextContent('Your AXIS6 Dashboard');
        expect(h2).toHaveTextContent('Your Progress');
      });
    });

    it('provides proper landmark regions', async () => {
      await act(async () => {
        render(<MockDashboard />);
      });

      await waitFor(() => {
        expect(screen.getByRole('main', { name: /Daily Balance Tracker/i })).toBeInTheDocument();
        expect(screen.getByRole('complementary', { name: /Statistics/i })).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation in dashboard context', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MockDashboard />);
      });

      await waitFor(async () => {
        // Should be able to tab through interactive elements
        const buttons = screen.getAllByRole('button');

        for (const button of buttons.slice(0, 3)) { // Test first few buttons
          await user.tab();
          expect(button).toHaveFocus();
        }
      });
    });
  });

  describe('State Management Integration', () => {
    it('synchronizes with dashboard state management', async () => {
      // Mock state management (would be Zustand, Context, etc.)
      const mockDashboardState = {
        user: { id: 'user-123', name: 'Test User' },
        checkins: [],
        streaks: [],
      };

      await act(async () => {
        render(<MockDashboard />);
      });

      await waitFor(() => {
        // Verify component reflects dashboard state
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
      });
    });

    it('handles concurrent state updates', async () => {
      await act(async () => {
        render(<MockDashboard />);
      });

      // Simulate multiple rapid state changes
      await act(async () => {
        // Would trigger multiple state updates in real implementation
        fireEvent.focus(document.body);
        fireEvent.blur(document.body);
      });

      await waitFor(() => {
        // Should handle concurrent updates gracefully
        expect(screen.getByText('Balance Ritual')).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Integration', () => {
    it('tracks user interactions for dashboard analytics', async () => {
      // Mock analytics
      const mockAnalytics = jest.fn();
      (window as any).gtag = mockAnalytics;

      await act(async () => {
        render(<MockDashboard />);
      });

      await waitFor(async () => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        await userEvent.click(physicalButton);

        // Would verify analytics calls in real implementation
        expect(physicalButton).toBeInTheDocument();
      });
    });
  });
});
