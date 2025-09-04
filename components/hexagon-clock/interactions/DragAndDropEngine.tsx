/**
 * Drag and Drop Engine for Revolutionary Time Block Interactions
 * Transforms time scheduling into natural clock-hand-like manipulation
 */
'use client'
import React, { useRef, useCallback, useEffect, useState } from 'react';
import type { TimeBlock } from '../types/HexagonTypes';
// Interaction state types
interface DragState {
  isDragging: boolean;
  draggedBlock: TimeBlock | null;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  ghostPosition: { x: number; y: number };
  snapToHour: number | null;
  conflictDetected: boolean;
  optimalTimeHighlighted: boolean;
}
interface DragFeedback {
  visualFeedback: 'shadow-elevation' | 'glow-effect' | 'scale-animation';
  hapticFeedback: boolean;
  magneticSnapping: boolean;
  resistanceOnSuboptimal: boolean;
  liveTimeLabels: boolean;
}
interface DragAndDropEngineProps {
  containerRef: React.RefObject<HTMLElement>;
  center: { x: number; y: number };
  radius: number;
  timeBlocks: TimeBlock[];
  onTimeBlockDrag: (blockId: string, newHour: number, newMinute?: number) => void;
  onDragStart?: (block: TimeBlock) => void;
  onDragEnd?: (block: TimeBlock, dropped: boolean) => void;
  onConflictDetected?: (conflicts: any[]) => void;
  feedback: DragFeedback;
  enabled?: boolean;
}
/**
 * Clock-based position calculations
 */
export function calculateHourFromPosition(
  position: { x: number; y: number },
  center: { x: number; y: number }
): { hour: number; minute: number; angle: number } {
  const dx = position.x - center.x;
  const dy = position.y - center.y;
  // Calculate angle in radians, then convert to degrees
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  // Normalize to 0-360 and adjust for 12 o'clock at top
  angle = (angle + 90) % 360;
  if (angle < 0) angle += 360;
  // Convert to 12-hour format
  const totalMinutes = (angle / 360) * 720; // 720 minutes = 12 hours
  const hour = Math.floor(totalMinutes / 60) % 12;
  const minute = Math.floor(totalMinutes % 60);
  return {
    hour: hour === 0 ? 12 : hour,
    minute: Math.round(minute / 15) * 15, // Snap to 15-minute intervals
    angle
  };
}
/**
 * Magnetic snapping to optimal hours
 */
export function getMagneticSnapPosition(
  currentHour: number,
  optimalHour: number,
  magneticStrength: number = 0.3
): { shouldSnap: boolean; snapHour: number } {
  const hourDistance = Math.abs(currentHour - optimalHour);
  const crossMidnightDistance = Math.min(
    Math.abs(currentHour - (optimalHour + 12)),
    Math.abs((currentHour + 12) - optimalHour)
  );
  const minDistance = Math.min(hourDistance, crossMidnightDistance);
  const shouldSnap = minDistance <= magneticStrength;
  return {
    shouldSnap,
    snapHour: shouldSnap ? optimalHour : currentHour
  };
}
/**
 * Haptic feedback helper (mobile)
 */
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30
    };
    navigator.vibrate(patterns[type]);
  }
}
/**
 * Main Drag and Drop Engine Component
 */
export function DragAndDropEngine({
  containerRef,
  center,
  radius,
  timeBlocks,
  onTimeBlockDrag,
  onDragStart,
  onDragEnd,
  onConflictDetected,
  feedback,
  enabled = true
}: DragAndDropEngineProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedBlock: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    ghostPosition: { x: 0, y: 0 },
    snapToHour: null,
    conflictDetected: false,
    optimalTimeHighlighted: false
  });
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((
    block: TimeBlock,
    startPosition: { x: number; y: number }
  ) => {
    if (!enabled) return;
    dragStartRef.current = startPosition;
    setDragState({
      isDragging: true,
      draggedBlock: block,
      startPosition,
      currentPosition: startPosition,
      ghostPosition: startPosition,
      snapToHour: null,
      conflictDetected: false,
      optimalTimeHighlighted: true
    });
    if (feedback.hapticFeedback) {
      triggerHapticFeedback('light');
    }
    onDragStart?.(block);
  }, [enabled, feedback.hapticFeedback, onDragStart]);
  /**
   * Handle drag movement with circular constraint
   */
  const handleDragMove = useCallback((position: { x: number; y: number }) => {
    if (!dragState.isDragging || !dragState.draggedBlock) return;
    // Constrain to circular movement around center
    const dx = position.x - center.x;
    const dy = position.y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Keep on circle at radius * 0.85 for optimal positioning
    const targetRadius = radius * 0.85;
    const normalizedX = (dx / distance) * targetRadius + center.x;
    const normalizedY = (dy / distance) * targetRadius + center.y;
    const circularPosition = { x: normalizedX, y: normalizedY };
    const hourInfo = calculateHourFromPosition(circularPosition, center);
    // Check for magnetic snapping to optimal time
    const optimalHour = 9; // Example: mental tasks optimal at 9 AM
    const magnetic = getMagneticSnapPosition(hourInfo.hour, optimalHour);
    // Update drag state
    setDragState(prev => ({
      ...prev,
      currentPosition: position,
      ghostPosition: circularPosition,
      snapToHour: magnetic.shouldSnap ? magnetic.snapHour : hourInfo.hour,
      optimalTimeHighlighted: magnetic.shouldSnap
    }));
    // Haptic feedback on snapping
    if (magnetic.shouldSnap && feedback.hapticFeedback) {
      triggerHapticFeedback('medium');
    }
    // Cancel any existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Smooth animation frame for ghost position
    animationFrameRef.current = requestAnimationFrame(() => {
      // Additional smooth animations can go here
    });
  }, [dragState.isDragging, dragState.draggedBlock, center, radius, feedback.hapticFeedback]);
  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging || !dragState.draggedBlock) return;
    const finalHour = dragState.snapToHour || 12;
    const dropped = Math.abs(
      dragState.currentPosition.x - dragState.startPosition.x
    ) > 10 || Math.abs(
      dragState.currentPosition.y - dragState.startPosition.y
    ) > 10;
    if (dropped) {
      onTimeBlockDrag(dragState.draggedBlock.id, finalHour);
      if (feedback.hapticFeedback) {
        triggerHapticFeedback('heavy');
      }
    }
    onDragEnd?.(dragState.draggedBlock, dropped);
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedBlock: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      ghostPosition: { x: 0, y: 0 },
      snapToHour: null,
      conflictDetected: false,
      optimalTimeHighlighted: false
    });
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [dragState, onTimeBlockDrag, onDragEnd, feedback.hapticFeedback]);
  /**
   * Mouse event handlers
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      handleDragMove({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };
    const handleMouseUp = () => {
      handleDragEnd();
    };
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [containerRef, enabled, dragState.isDragging, handleDragMove, handleDragEnd]);
  /**
   * Touch event handlers for mobile
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      handleDragMove({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    };
    const handleTouchEnd = () => {
      handleDragEnd();
    };
    if (dragState.isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [containerRef, enabled, dragState.isDragging, handleDragMove, handleDragEnd]);
  /**
   * Render drag ghost and feedback
   */
  if (!dragState.isDragging || !dragState.draggedBlock) return null;
  const hourInfo = dragState.snapToHour
    ? { hour: dragState.snapToHour, minute: 0 }
    : calculateHourFromPosition(dragState.ghostPosition, center);
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Drag Ghost */}
      <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ${
          feedback.visualFeedback === 'shadow-elevation' ? 'drop-shadow-lg' :
          feedback.visualFeedback === 'glow-effect' ? 'drop-shadow-glow' :
          'animate-scale-pulse'
        } ${dragState.optimalTimeHighlighted ? 'ring-2 ring-green-400' : ''}`}
        style={{
          left: dragState.ghostPosition.x,
          top: dragState.ghostPosition.y,
          opacity: 0.8
        }}
      >
        <div className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium min-w-[80px] text-center">
          {dragState.draggedBlock.title || dragState.draggedBlock.category}
        </div>
      </div>
      {/* Live Time Label */}
      {feedback.liveTimeLabels && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-full mb-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono"
          style={{
            left: dragState.ghostPosition.x,
            top: dragState.ghostPosition.y
          }}
        >
          {hourInfo.hour}:00 {hourInfo.hour >= 12 ? 'PM' : 'AM'}
          {dragState.optimalTimeHighlighted && (
            <span className="ml-1 text-green-400">✨ Optimal</span>
          )}
        </div>
      )}
      {/* Magnetic Snap Indicator */}
      {feedback.magneticSnapping && dragState.optimalTimeHighlighted && (
        <div
          className="absolute w-6 h-6 border-2 border-green-400 rounded-full animate-pulse"
          style={{
            left: dragState.ghostPosition.x - 12,
            top: dragState.ghostPosition.y - 12
          }}
        />
      )}
      {/* Conflict Warning */}
      {dragState.conflictDetected && (
        <div
          className="absolute transform -translate-x-1/2 translate-y-full mt-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
          style={{
            left: dragState.ghostPosition.x,
            top: dragState.ghostPosition.y
          }}
        >
          ⚠️ Time Conflict
        </div>
      )}
    </div>
  );
}
/**
 * Hook to enable dragging on time blocks
 */
export function useDragHandle(
  dragEngine: {
    handleDragStart: (block: TimeBlock, position: { x: number; y: number }) => void;
  },
  block: TimeBlock
) {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    dragEngine.handleDragStart(block, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [dragEngine, block]);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    dragEngine.handleDragStart(block, {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  }, [dragEngine, block]);
  return {
    onMouseDown: handleMouseDown,
    onTouchStart: handleTouchStart,
    style: { cursor: 'grab', touchAction: 'none' }
  };
}
export default DragAndDropEngine;
