/**
 * Backward Compatibility Integration Tests
 * Tests for removed HexagonClock component - DISABLED
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

// HexagonClock component has been removed - these tests are disabled
// import { HexagonClock } from '@/components/hexagon-clock/HexagonClock';
// import type { CompletionData, TimeDistribution } from '@/components/hexagon-clock/types/HexagonTypes';

describe('Backward Compatibility Tests - DISABLED', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HexagonChartWithResonance Compatibility', () => {
    it('should skip tests - HexagonClock component removed', () => {
      // HexagonClock component was removed as part of cleanup
      // These tests need to be rewritten for the new architecture
      expect(true).toBe(true);
    });
    
    // Test legacy props interface
    const legacyHexagonChartProps = {
      data: {
        spiritual: { level: 5, resonance: 0.8 },
        mental: { level: 7, resonance: 0.9 },
        emotional: { level: 6, resonance: 0.7 },
        social: { level: 8, resonance: 0.85 },
        physical: { level: 4, resonance: 0.6 },
        material: { level: 9, resonance: 0.95 }
      },
      size: 300,
      showLabels: true,
      showResonance: true,
      animationSpeed: 'normal' as const
    };

    /*
    // DISABLED - Component removed
    it('should render with legacy HexagonChartWithResonance props', async () => {
      render(<HexagonClock {...legacyHexagonChartProps} />);
      
      // Verify resonance visualization
      const resonanceElements = screen.getAllByTestId(/resonance-ring/);
      expect(resonanceElements.length).toBeGreaterThan(0);
      
      // Check dimension labels
      const dimensionLabels = ['Spiritual', 'Mental', 'Emotional', 'Social', 'Physical', 'Material'];
      for (const label of dimensionLabels) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    });
    */
  });

  describe('HexagonChart Compatibility', () => {
    /*
    // DISABLED - Component removed
    const legacyHexagonProps = {
      data: {
        spiritual: 5,
        mental: 7,
        emotional: 6,
        social: 8,
        physical: 4,
        material: 9
      },
      size: 250,
      showLabels: false,
      color: '#8B5CF6'
    };

    it('should render with legacy HexagonChart props', () => {
      render(<HexagonClock {...legacyHexagonProps} />);
      
      // Basic rendering test
      const hexagonElement = screen.getByTestId('hexagon-clock');
      expect(hexagonElement).toBeInTheDocument();
    });
    */
  });

  describe('Dashboard Integration Compatibility', () => {
    /*
    // DISABLED - Component removed
    it('should integrate with dashboard completion data', async () => {
      const mockCompletionData: CompletionData = {
        spiritual: { completed: 3, total: 5, percentage: 60 },
        mental: { completed: 4, total: 6, percentage: 67 },
        emotional: { completed: 2, total: 4, percentage: 50 },
        social: { completed: 5, total: 7, percentage: 71 },
        physical: { completed: 1, total: 3, percentage: 33 },
        material: { completed: 6, total: 8, percentage: 75 }
      };

      render(
        <HexagonClock 
          completionData={mockCompletionData}
          size={300}
          showCompletionPercentage={true}
        />
      );

      // Verify completion percentages
      await waitFor(() => {
        expect(screen.getByText('60%')).toBeInTheDocument();
        expect(screen.getByText('67%')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });
    */
  });

  describe('Time Distribution Compatibility', () => {
    /*
    // DISABLED - Component removed
    it('should display time distribution from My Day', async () => {
      const mockTimeDistribution: TimeDistribution = {
        spiritual: { planned: 60, actual: 45, remaining: 15 },
        mental: { planned: 90, actual: 75, remaining: 15 },
        emotional: { planned: 30, actual: 30, remaining: 0 },
        social: { planned: 120, actual: 100, remaining: 20 },
        physical: { planned: 45, actual: 30, remaining: 15 },
        material: { planned: 180, actual: 200, remaining: -20 }
      };

      render(
        <HexagonClock 
          timeDistribution={mockTimeDistribution}
          showTimeBlocks={true}
          size={350}
        />
      );

      // Verify time blocks are displayed
      await waitFor(() => {
        const timeBlocks = screen.getAllByTestId(/time-block/);
        expect(timeBlocks.length).toBeGreaterThan(0);
      });
    });
    */
  });

  describe('Animation Compatibility', () => {
    /*
    // DISABLED - Component removed
    it('should maintain animation performance', async () => {
      const animationData = {
        spiritual: 8,
        mental: 6,
        emotional: 7,
        social: 9,
        physical: 5,
        material: 8
      };

      render(
        <HexagonClock 
          data={animationData}
          animationSpeed="fast"
          enableAnimations={true}
          size={300}
        />
      );

      // Test animation triggers
      const hexagon = screen.getByTestId('hexagon-clock');
      
      await act(async () => {
        fireEvent.mouseEnter(hexagon);
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verify animations don't break
      expect(hexagon).toBeInTheDocument();
    });
    */
  });

  describe('Event Handler Compatibility', () => {
    /*
    // DISABLED - Component removed
    it('should support legacy event handlers', async () => {
      const mockOnDimensionClick = jest.fn();
      const mockOnHover = jest.fn();

      render(
        <HexagonClock 
          data={{ spiritual: 5, mental: 6, emotional: 7, social: 8, physical: 4, material: 9 }}
          onDimensionClick={mockOnDimensionClick}
          onHover={mockOnHover}
          size={300}
        />
      );

      const spiritualSegment = screen.getByTestId('dimension-spiritual');
      
      await act(async () => {
        fireEvent.click(spiritualSegment);
      });

      expect(mockOnDimensionClick).toHaveBeenCalledWith('spiritual', expect.any(Object));
    });
    */
  });

  describe('Responsive Design Compatibility', () => {
    /*
    // DISABLED - Component removed
    it('should adapt to different screen sizes', () => {
      const { rerender } = render(
        <HexagonClock 
          data={{ spiritual: 5, mental: 6, emotional: 7, social: 8, physical: 4, material: 9 }}
          responsive={true}
        />
      );

      // Test mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      rerender(
        <HexagonClock 
          data={{ spiritual: 5, mental: 6, emotional: 7, social: 8, physical: 4, material: 9 }}
          responsive={true}
        />
      );

      const hexagon = screen.getByTestId('hexagon-clock');
      expect(hexagon).toBeInTheDocument();
    });
    */
  });
});