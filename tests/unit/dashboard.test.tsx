import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Dashboard from '@/app/(auth)/dashboard/page'
import '@testing-library/jest-dom'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        }
      })
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: mockDashboardData,
            error: null
          }))
        }))
      }))
    })),
    rpc: jest.fn(() => Promise.resolve({
      data: mockRPCData,
      error: null
    }))
  }))
}))

const mockDashboardData = {
  checkins: [
    { category_id: 1, mood: 5, notes: 'Great workout!' },
    { category_id: 2, mood: 4, notes: 'Productive day' }
  ],
  streaks: [
    { category_id: 1, current_streak: 5, longest_streak: 10 },
    { category_id: 2, current_streak: 3, longest_streak: 7 }
  ]
}

const mockRPCData = {
  checkins: mockDashboardData.checkins,
  streaks: mockDashboardData.streaks,
  weekly_stats: {
    days_active: 5,
    total_checkins: 10,
    avg_mood: 4.5
  }
}

describe('Dashboard', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('should render dashboard with user data', async () => {
    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })
  })

  it('should display hexagon chart', async () => {
    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      const hexagon = screen.getByTestId('hexagon-chart')
      expect(hexagon).toBeInTheDocument()
    })
  })

  it('should show daily checkins', async () => {
    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/great workout/i)).toBeInTheDocument()
      expect(screen.getByText(/productive day/i)).toBeInTheDocument()
    })
  })

  it('should display streak information', async () => {
    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/5.*streak/i)).toBeInTheDocument()
      expect(screen.getByText(/3.*streak/i)).toBeInTheDocument()
    })
  })

  it('should handle loading state', () => {
    renderWithProviders(<Dashboard />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should handle error state gracefully', async () => {
    const errorClient = {
      ...createClient(),
      rpc: jest.fn().mockRejectedValue(new Error('Failed to load data'))
    }

    ;(createClient as jest.Mock).mockReturnValue(errorClient)

    renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument()
    })
  })

  it('should refresh data on pull-to-refresh', async () => {
    const { rerender } = renderWithProviders(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })

    // Simulate pull-to-refresh
    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    refreshButton.click()

    await waitFor(() => {
      expect(createClient().rpc).toHaveBeenCalledTimes(2)
    })
  })
})
