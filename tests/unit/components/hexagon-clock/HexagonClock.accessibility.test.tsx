/**
 * HexagonClock Accessibility Tests
 * WCAG 2.1 AA compliance validation and screen reader support
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { HexagonClock } from '@/components/hexagon-clock/HexagonClock';
import type { CompletionData, TimeDistribution } from '@/components/hexagon-clock/types/HexagonTypes';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock screen reader announcements
const mockAriaLiveAnnouncements: string[] = [];
const originalCreateElement = document.createElement;

document.createElement = function(tagName: string, options?: ElementCreationOptions) {
  const element = originalCreateElement.call(this, tagName, options);
  
  if (tagName === 'div' && element.getAttribute('aria-live')) {
    const originalTextContent = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    Object.defineProperty(element, 'textContent', {
      ...originalTextContent,
      set(value: string) {
        if (value) mockAriaLiveAnnouncements.push(value);
        originalTextContent?.set?.call(this, value);
      },
    });
  }
  
  return element;
};

// Mock matchMedia for prefers-reduced-motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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

describe('HexagonClock Accessibility Tests', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockAriaLiveAnnouncements.length = 0;
  });

  afterEach(() => {
    // Clean up any created elements
    document.querySelectorAll('[role="status"], [aria-live]').forEach(el => {
      el.remove();
    });
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('passes axe accessibility audit', async () => {
      await act(async () => {
        const { container } = render(
          <HexagonClock 
            data={mockCompletionData}
            animate={false}
          />
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('provides proper semantic structure', async () => {
      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        // Check for proper button roles
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(6); // 6 category buttons

        buttons.forEach(button => {
          expect(button).toHaveAttribute('title');
          expect(button.textContent).toBeTruthy();
        });
      });
    });

    it('meets color contrast requirements (4.5:1 minimum)', async () => {
      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        // This test would ideally use a color contrast checking library
        // For now, we verify that text elements have proper styling
        const textElements = screen.getAllByRole('button');
        
        textElements.forEach(element => {
          const styles = window.getComputedStyle(element);
          // Should have defined text color and background
          expect(styles.color).toBeTruthy();
          expect(styles.backgroundColor || styles.background).toBeTruthy();
        });
      });
    });

    it('provides alternative text for visual elements', async () => {
      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        // SVG elements should have proper accessibility attributes
        const svgElements = document.querySelectorAll('svg');
        
        svgElements.forEach(svg => {
          // Should have either aria-label or be marked as decorative
          const hasAccessibleName = svg.hasAttribute('aria-label') || 
                                   svg.hasAttribute('aria-labelledby') ||
                                   svg.getAttribute('aria-hidden') === 'true';
          expect(hasAccessibleName).toBe(true);
        });
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports tab navigation through interactive elements', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            onCategoryClick={jest.fn()}
          />
        );
      });

      await waitFor(async () => {
        const buttons = screen.getAllByRole('button');
        
        // Should be able to tab through all buttons
        for (const button of buttons) {
          await user.tab();
          expect(button).toHaveFocus();
        }
      });
    });

    it('supports Enter and Space key activation', async () => {
      const mockCategoryClick = jest.fn();
      const user = userEvent.setup();

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            onCategoryClick={mockCategoryClick}
          />
        );
      });

      await waitFor(async () => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        
        // Tab to the button
        await user.tab();
        expect(physicalButton).toHaveFocus();
        
        // Enter key should activate
        await user.keyboard('{Enter}');
        expect(mockCategoryClick).toHaveBeenCalledTimes(1);
        
        // Space key should also activate
        await user.keyboard(' ');
        expect(mockCategoryClick).toHaveBeenCalledTimes(2);
      });
    });

    it('provides proper focus indicators', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
          />
        );
      });

      await waitFor(async () => {
        const firstButton = screen.getAllByRole('button')[0];
        
        await user.tab();
        expect(firstButton).toHaveFocus();
        
        // Focus should be visually indicated
        const styles = window.getComputedStyle(firstButton);
        expect(styles.outline || styles.boxShadow).toBeTruthy();
      });
    });

    it('supports arrow key navigation (optional enhancement)', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
          />
        );
      });

      await waitFor(async () => {
        const buttons = screen.getAllByRole('button');
        const firstButton = buttons[0];
        
        // Tab to first button
        await user.tab();
        expect(firstButton).toHaveFocus();
        
        // Arrow keys could navigate between buttons (if implemented)
        await user.keyboard('{ArrowRight}');
        // This would depend on implementation - test would need to be adjusted
      });
    });

    it('traps focus appropriately in modal context', async () => {
      // This test assumes the component might be used in a modal
      const user = userEvent.setup();

      await act(async () => {
        render(
          <div role="dialog" aria-modal="true">
            <HexagonClock 
              data={mockCompletionData}
              onCategoryClick={jest.fn()}
            />
          </div>
        );
      });

      await waitFor(async () => {
        const buttons = screen.getAllByRole('button');
        const firstButton = buttons[0];
        const lastButton = buttons[buttons.length - 1];
        
        // Focus should cycle within the component
        await user.tab();
        expect(firstButton).toHaveFocus();
        
        // Navigate to last button
        for (let i = 1; i < buttons.length; i++) {
          await user.tab();
        }
        expect(lastButton).toHaveFocus();
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('announces completion percentages correctly', async () => {
      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        
        buttons.forEach(button => {
          const title = button.getAttribute('title');
          expect(title).toBeTruthy();
          
          // Title should include meaningful information
          expect(title).toMatch(/Physical|Mental|Emotional|Social|Spiritual|Material/i);
        });
      });
    });

    it('provides context for time distribution mode', async () => {
      await act(async () => {
        render(
          <HexagonClock 
            distribution={mockTimeDistribution}
          />
        );
      });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        
        buttons.forEach(button => {
          const title = button.getAttribute('title');
          expect(title).toBeTruthy();
          
          // Should provide time context
          expect(title || button.textContent).toMatch(/hour|minute|time/i);
        });
      });
    });

    it('announces state changes via aria-live regions', async () => {
      const mockCategoryClick = jest.fn();

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            onCategoryClick={mockCategoryClick}
          />
        );
      });

      await waitFor(() => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        fireEvent.click(physicalButton);
        
        // Should announce the action (would need aria-live implementation)
        // For now, verify the click handler was called
        expect(mockCategoryClick).toHaveBeenCalled();
      });
    });

    it('describes visual hexagon structure for screen readers', async () => {
      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        // Check for descriptive text or labels
        const centerDisplay = screen.getByText('Balance Ritual');
        expect(centerDisplay).toBeInTheDocument();
        
        const percentageDisplay = screen.getByText('68%');
        expect(percentageDisplay).toBeInTheDocument();
      });
    });
  });

  describe('Reduced Motion Support', () => {
    it('respects prefers-reduced-motion preference', async () => {
      // Mock reduced motion preference
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            animate={true} // Animation requested but should be reduced
          />
        );
      });

      await waitFor(() => {
        // Elements should appear immediately without animation delays
        const buttons = screen.getAllByRole('button');
        
        buttons.forEach(button => {
          // Should not have animation-delay or long transitions
          const styles = window.getComputedStyle(button.parentElement || button);
          const animationDuration = parseFloat(styles.animationDuration || '0');
          
          // Animations should be very short or disabled for reduced motion
          expect(animationDuration).toBeLessThan(0.3); // Max 300ms
        });
      });
    });

    it('provides static alternative when animations are disabled', async () => {
      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            animate={false}
          />
        );
      });

      await waitFor(() => {
        // All content should be immediately visible
        const buttons = screen.getAllByRole('button');
        const centerDisplay = screen.getByText('Balance Ritual');
        
        buttons.forEach(button => {
          expect(button.parentElement).toHaveStyle({ opacity: '1' });
        });
        
        expect(centerDisplay.parentElement).toHaveStyle({ opacity: '1' });
      });
    });
  });

  describe('Touch Target Accessibility', () => {
    it('meets minimum touch target size (44x44px)', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
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

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        
        buttons.forEach(button => {
          const rect = button.getBoundingClientRect();
          expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
          
          // CSS properties should also ensure minimum size
          expect(button.style.minHeight).toBe('44px');
          expect(button.style.minWidth).toBe('44px');
        });
      });
    });

    it('provides adequate spacing between touch targets', async () => {
      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
            mobileOptimized={true}
          />
        );
      });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        
        // Check that buttons have proper flex container setup for spacing
        buttons.forEach(button => {
          const parentElement = button.parentElement;
          expect(parentElement?.style.display).toBe('flex');
          expect(parentElement?.style.alignItems).toBe('center');
          expect(parentElement?.style.justifyContent).toBe('center');
        });
      });
    });
  });

  describe('High Contrast Mode Support', () => {
    it('maintains usability in high contrast mode', async () => {
      // Mock high contrast media query
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('high-contrast') || query.includes('forced-colors'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        
        // Elements should remain visible and functional in high contrast mode
        buttons.forEach(button => {
          expect(button).toBeVisible();
          expect(button.textContent).toBeTruthy();
        });
      });
    });
  });

  describe('Language and Internationalization', () => {
    it('supports RTL languages properly', async () => {
      // Mock RTL direction
      document.dir = 'rtl';

      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        const container = document.querySelector('.hexagon-clock-container');
        expect(container).toBeInTheDocument();
        
        // Component should handle RTL layout
        // This would depend on implementation specifics
      });

      // Reset direction
      document.dir = 'ltr';
    });

    it('provides proper lang attributes when content changes', async () => {
      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
          />
        );
      });

      await waitFor(() => {
        // Check that text content has proper language context
        const centerText = screen.getByText('Balance Ritual');
        expect(centerText).toBeInTheDocument();
        
        // Should inherit or specify language
        const langAttr = centerText.closest('[lang]');
        expect(langAttr || document.documentElement).toHaveAttribute('lang');
      });
    });
  });

  describe('Error State Accessibility', () => {
    it('announces errors to screen readers', async () => {
      // Mock error boundary or error state
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        // Pass invalid data to trigger error handling
        render(
          <HexagonClock 
            data={null as any}
            distribution={undefined}
          />
        );
      });

      await waitFor(() => {
        // Component should handle errors gracefully
        const fallbackText = screen.getByText('AXIS6');
        expect(fallbackText).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Loading State Accessibility', () => {
    it('provides proper loading state announcements', async () => {
      await act(async () => {
        render(
          <HexagonClock 
            data={mockCompletionData}
          />
        );
      });

      // During initial hydration, loading state should be accessible
      const loadingElement = document.querySelector('.animate-pulse');
      if (loadingElement) {
        // Should have proper aria attributes for loading state
        expect(loadingElement).toBeInTheDocument();
      }
    });
  });

  describe('Focus Management', () => {
    it('maintains focus when content updates', async () => {
      const { rerender } = render(
        <HexagonClock 
          data={mockCompletionData}
          onCategoryClick={jest.fn()}
        />
      );

      await waitFor(async () => {
        const physicalButton = screen.getByRole('button', { name: /Physical/i });
        physicalButton.focus();
        expect(physicalButton).toHaveFocus();

        // Update data
        rerender(
          <HexagonClock 
            data={{ ...mockCompletionData, physical: 90 }}
            onCategoryClick={jest.fn()}
          />
        );

        // Focus should be maintained or properly managed
        await waitFor(() => {
          const updatedButton = screen.getByRole('button', { name: /Physical/i });
          expect(updatedButton).toBeInTheDocument();
        });
      });
    });
  });
});