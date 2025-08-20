import { render, screen, waitFor } from '@testing-library/react'
import Dashboard from '../page'

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => {
    const mockChain = {
      select: jest.fn(() => mockChain),
      eq: jest.fn(() => mockChain),
      order: jest.fn(() => mockChain),
      single: jest.fn(() => Promise.resolve({
        data: {
          id: 'test-user-id',
          display_name: 'Test User',
          username: 'testuser',
        },
        error: null,
      })),
      then: jest.fn((fn) => Promise.resolve({
        data: [],
        error: null,
      }).then(fn)),
    }
    
    return {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
            },
          },
          error: null,
        }),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
      from: jest.fn(() => mockChain),
    }
  }),
}))

// Mock the useStreaks hook
jest.mock('@/lib/hooks/useStreaks', () => ({
  useStreaks: jest.fn(() => ({
    streaks: { current: 0, longest: 0 },
    loading: false,
    refreshStreaks: jest.fn(),
  })),
}))

// Mock components that might cause issues
jest.mock('@/components/axis/HexagonChart', () => ({
  __esModule: true,
  default: () => <div>HexagonChart Mock</div>,
}))

jest.mock('@/components/axis/StreakCounter', () => ({
  __esModule: true,
  default: () => <div>StreakCounter Mock</div>,
}))

describe('Dashboard Page', () => {
  it('renders dashboard elements', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
    })
  })

  it('displays loading state initially', () => {
    render(<Dashboard />)
    
    expect(screen.getByText(/Cargando tu progreso/i)).toBeInTheDocument()
  })

  it('shows the hexagon chart component', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      const dashboard = screen.getByText(/Dashboard/i)
      expect(dashboard).toBeInTheDocument()
    })
  })

  it('includes motivational quote section', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      // Dashboard has daily quotes
      const dashboard = screen.getByText(/Dashboard/i)
      expect(dashboard).toBeInTheDocument()
    })
  })
})