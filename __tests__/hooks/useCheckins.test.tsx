import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTodayCheckins, useToggleCheckIn } from '@/lib/react-query/hooks/useCheckins'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => Promise.resolve({
              data: [
                {
                  id: '1',
                  user_id: 'user-1',
                  category_id: 1,
                  completed_at: '2023-12-01T10:00:00Z',
                  created_at: '2023-12-01T10:00:00Z'
                }
              ],
              error: null
            }))
          }))
        }))
      }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'user-1' } },
        error: null
      }))
    }
  }))
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useCheckins hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useTodayCheckins', () => {
    it('should fetch today checkins for a user', async () => {
      const { result } = renderHook(
        () => useTodayCheckins('user-1'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toHaveLength(1)
      expect(result.current.data![0]).toMatchObject({
        id: '1',
        user_id: 'user-1',
        category_id: 1
      })
    })

    it('should not fetch when userId is undefined', () => {
      const { result } = renderHook(
        () => useTodayCheckins(undefined),
        { wrapper: createWrapper() }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useToggleCheckIn', () => {
    it('should provide a mutation function', () => {
      const { result } = renderHook(
        () => useToggleCheckIn('user-1'),
        { wrapper: createWrapper() }
      )

      expect(typeof result.current.mutate).toBe('function')
      expect(result.current.isPending).toBe(false)
    })

    it('should handle mutation state correctly', async () => {
      const { result } = renderHook(
        () => useToggleCheckIn('user-1'),
        { wrapper: createWrapper() }
      )

      // Start mutation
      result.current.mutate({
        categoryId: 1,
        completed: true
      })

      // Should be pending
      expect(result.current.isPending).toBe(true)

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })
    })
  })
})