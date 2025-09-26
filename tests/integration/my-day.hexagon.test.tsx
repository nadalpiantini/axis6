/**
 * My Day HexagonClock Integration Tests - DISABLED
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
    pathname: '/my-day',
  }),
  usePathname: () => '/my-day',
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

describe('My Day HexagonClock Integration Tests - DISABLED', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Time Planning Mode', () => {
    it('should skip tests - HexagonClock component removed', () => {
      // HexagonClock component was removed as part of cleanup
      // These tests need to be rewritten for the new architecture
      expect(true).toBe(true);
    });

    /*
    // DISABLED - Component removed
    const timeBlocksData = [
      {
        id: '1',
        startTime: '09:00',
        duration: 60,
        category: 'physical',
        status: 'planned' as const,
        title: 'Morning Workout'
      },
      {
        id: '2', 
        startTime: '10:30',
        duration: 90,
        category: 'mental',
        status: 'active' as const,
        title: 'Deep Work Session'
      },
      {
        id: '3',
        startTime: '14:00', 
        duration: 45,
        category: 'social',
        status: 'completed' as const,
        title: 'Team Meeting'
      }
    ];

    it('should render time blocks on hexagon', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });

    it('should allow editing time blocks by clicking', async () => {
      // HexagonClock component removed - test disabled  
      expect(true).toBe(true);
    });

    it('should show current time indicator', () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });
    */
  });

  describe('Activity Timer Integration', () => {
    /*
    // DISABLED - Component removed
    it('should start timer when clicking active time block', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });

    it('should show timer progress on hexagon', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });

    it('should complete time block when timer finishes', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });
    */
  });

  describe('Responsive Time Planning', () => {
    /*
    // DISABLED - Component removed
    it('should adapt time blocks for mobile', () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });

    it('should show condensed view on small screens', () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });
    */
  });

  describe('Data Synchronization', () => {
    /*
    // DISABLED - Component removed  
    it('should sync with Supabase time blocks table', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });

    it('should update UI when time blocks change', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });
    */
  });

  describe('Performance', () => {
    /*
    // DISABLED - Component removed
    it('should render smoothly with many time blocks', async () => {
      // HexagonClock component removed - test disabled
      expect(true).toBe(true);
    });

    it('should not lag during timer updates', async () => {
      // HexagonClock component removed - test disabled  
      expect(true).toBe(true);
    });
    */
  });
});