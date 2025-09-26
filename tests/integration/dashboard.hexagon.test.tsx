/**
 * Dashboard HexagonClock Integration Tests - DISABLED
 * Tests for removed HexagonClock component
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
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
    })),
    rpc: jest.fn().mockResolvedValue({
      data: [],
      error: null
    })
  })
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: null,
    isLoading: false,
    error: null
  }),
  useMutation: () => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null
  }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn()
  })
}));

describe('Dashboard HexagonClock Integration Tests - DISABLED', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Completion Visualization', () => {
    it('should skip tests - HexagonClock component removed', () => {
      // HexagonClock component was removed as part of cleanup
      // These tests need to be rewritten for the new architecture
      expect(true).toBe(true);
    });

    /*
    // DISABLED - Component removed
    const mockCompletionData = {
      spiritual: { completed: 3, total: 5, percentage: 60 },
      mental: { completed: 4, total: 6, percentage: 67 },
      emotional: { completed: 2, total: 4, percentage: 50 },
      social: { completed: 5, total: 7, percentage: 71 },
      physical: { completed: 1, total: 3, percentage: 33 },
      material: { completed: 6, total: 8, percentage: 75 }
    };

    it('should display daily completion percentages', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });

    it('should highlight dimensions with low completion', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });

    it('should show celebration animation for 100% completion', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });
    */
  });

  describe('Dashboard Integration', () => {
    /*
    // DISABLED - Component removed
    it('should navigate to My Day when clicking dimensions', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });

    it('should show streaks for each dimension', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });

    it('should display balance score in center', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });
    */
  });

  describe('Performance Metrics', () => {
    /*
    // DISABLED - Component removed
    it('should render smoothly with animations', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });

    it('should handle data updates without flicker', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });
    */
  });
});