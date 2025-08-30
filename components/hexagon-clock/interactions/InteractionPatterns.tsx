/**
 * Interaction Patterns for HexagonClock
 * Revolutionary intuitive time block interaction system
 */

'use client'

import React, { memo, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InteractionConfig {
  dragEnabled: boolean;
  hoverEffects: boolean;
  clickFeedback: boolean;
  touchOptimized: boolean;
  gestureSupport: boolean;
}

interface InteractionPatternsProps {
  config: InteractionConfig;
  onTimeBlockSelect: (blockId: string, action: 'edit' | 'delete' | 'move' | 'duplicate') => void;
  onTimeSlotClick: (hour: number, minute: number) => void;
  onGestureDetected: (gesture: 'swipe' | 'pinch' | 'rotate', data: any) => void;
}

/**
 * Touch/Click Feedback Component
 * Provides visual and haptic feedback for interactions
 */
const InteractionFeedback = memo(function InteractionFeedback({
  position,
  type = 'click',
  onComplete
}: {
  position: { x: number; y: number } | null;
  type?: 'click' | 'longpress' | 'drag' | 'success' | 'error';
  onComplete: () => void;
}) {
  if (!position) return null;

  const getFeedbackConfig = () => {
    switch (type) {
      case 'click':
        return {
          scale: [1, 1.5, 1],
          opacity: [0.8, 0.4, 0],
          duration: 0.3,
          color: '#4ade80'
        };
      case 'longpress':
        return {
          scale: [1, 2, 1.8],
          opacity: [0.6, 0.8, 0],
          duration: 0.6,
          color: '#f59e0b'
        };
      case 'drag':
        return {
          scale: [1, 1.2],
          opacity: [0.7, 0.5],
          duration: 0.2,
          color: '#3b82f6'
        };
      case 'success':
        return {
          scale: [1, 1.8, 1.2],
          opacity: [0.9, 0.6, 0],
          duration: 0.5,
          color: '#10b981'
        };
      case 'error':
        return {
          scale: [1, 1.3, 1.1],
          opacity: [0.8, 0.5, 0],
          duration: 0.4,
          color: '#ef4444'
        };
      default:
        return {
          scale: [1, 1.5, 1],
          opacity: [0.8, 0.4, 0],
          duration: 0.3,
          color: '#6b7280'
        };
    }
  };

  const config = getFeedbackConfig();

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      }}
      initial={{ scale: config.scale[0], opacity: config.opacity[0] }}
      animate={{
        scale: config.scale,
        opacity: config.opacity
      }}
      transition={{
        duration: config.duration,
        ease: 'easeOut'
      }}
      onAnimationComplete={onComplete}
    >
      <div
        className="rounded-full"
        style={{
          width: 40,
          height: 40,
          backgroundColor: config.color,
          boxShadow: `0 0 20px ${config.color}60`
        }}
      />
    </motion.div>
  );
});

/**
 * Context Menu for Time Blocks
 * Radial menu with touch-optimized buttons
 */
const TimeBlockContextMenu = memo(function TimeBlockContextMenu({
  position,
  blockId,
  onAction,
  onClose
}: {
  position: { x: number; y: number } | null;
  blockId: string | null;
  onAction: (action: 'edit' | 'delete' | 'move' | 'duplicate') => void;
  onClose: () => void;
}) {
  if (!position || !blockId) return null;

  const actions = [
    { key: 'edit', label: '✏️', title: 'Edit Time Block', angle: 0 },
    { key: 'move', label: '↻', title: 'Move Time Block', angle: 90 },
    { key: 'duplicate', label: '⊞', title: 'Duplicate Block', angle: 180 },
    { key: 'delete', label: '🗑️', title: 'Delete Block', angle: 270 }
  ] as const;

  const radius = 50;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        <div
          className="absolute"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Center dot */}
          <motion.div
            className="absolute w-4 h-4 bg-white rounded-full"
            style={{
              left: -8,
              top: -8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          />

          {/* Action buttons */}
          {actions.map((action, index) => {
            const angle = (action.angle * Math.PI) / 180;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <motion.button
                key={action.key}
                className="absolute w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-lg hover:scale-110 active:scale-95 transition-transform"
                style={{
                  left: x - 24,
                  top: y - 24,
                  transformOrigin: 'center'
                }}
                title={action.title}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(action.key);
                  onClose();
                }}
                initial={{
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{
                  scale: 1,
                  x,
                  y
                }}
                transition={{
                  delay: 0.1 + (index * 0.05),
                  type: 'spring',
                  stiffness: 300,
                  damping: 25
                }}
                whileHover={{
                  scale: 1.1,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                {action.label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

/**
 * Drag and Drop Visual Indicators
 * Shows valid drop zones and visual feedback during dragging
 */
const DragIndicators = memo(function DragIndicators({
  isDragging,
  validDropZones,
  previewPosition
}: {
  isDragging: boolean;
  validDropZones: Array<{ hour: number; valid: boolean; position: { x: number; y: number } }>;
  previewPosition: { x: number; y: number } | null;
}) {
  if (!isDragging) return null;

  return (
    <>
      {/* Valid drop zones */}
      {validDropZones.map((zone, index) => (
        <motion.div
          key={index}
          className={`absolute w-8 h-8 rounded-full border-2 ${
            zone.valid
              ? 'border-green-400 bg-green-400/20'
              : 'border-red-400 bg-red-400/20'
          }`}
          style={{
            left: zone.position.x - 16,
            top: zone.position.y - 16,
            pointerEvents: 'none'
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: zone.valid ? [1, 1.2, 1] : 1,
            opacity: 0.8
          }}
          transition={{
            repeat: zone.valid ? Infinity : 0,
            duration: 1.5,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Drag preview */}
      {previewPosition && (
        <motion.div
          className="absolute w-6 h-6 bg-blue-500 rounded-full opacity-70 pointer-events-none"
          style={{
            left: previewPosition.x - 12,
            top: previewPosition.y - 12
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 0.9, 0.7]
          }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            ease: 'easeInOut'
          }}
        />
      )}
    </>
  );
});

/**
 * Gesture Detection System
 * Detects touch gestures like swipe, pinch, rotate
 */
const GestureDetector = memo(function GestureDetector({
  onGestureDetected,
  children
}: {
  onGestureDetected: (gesture: 'swipe' | 'pinch' | 'rotate', data: any) => void;
  children: React.ReactNode;
}) {
  const gestureRef = useRef<HTMLDivElement>(null);
  const [gestureState, setGestureState] = useState({
    isDetecting: false,
    initialTouches: [] as Array<{ x: number; y: number; identifier: number }>,
    currentTouches: [] as Array<{ x: number; y: number; identifier: number }>
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      identifier: touch.identifier
    }));

    setGestureState({
      isDetecting: true,
      initialTouches: touches,
      currentTouches: touches
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gestureState.isDetecting) return;

    const currentTouches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      identifier: touch.identifier
    }));

    setGestureState(prev => ({
      ...prev,
      currentTouches
    }));

    // Detect gestures
    if (gestureState.initialTouches.length === 1 && currentTouches.length === 1) {
      // Single finger - potential swipe
      const initial = gestureState.initialTouches[0];
      const current = currentTouches[0];
      const deltaX = current.x - initial.x;
      const deltaY = current.y - initial.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > 50) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        let direction: string;

        if (angle >= -45 && angle <= 45) direction = 'right';
        else if (angle >= 45 && angle <= 135) direction = 'down';
        else if (angle >= -135 && angle <= -45) direction = 'up';
        else direction = 'left';

        onGestureDetected('swipe', { direction, distance, deltaX, deltaY });
      }
    } else if (gestureState.initialTouches.length === 2 && currentTouches.length === 2) {
      // Two finger - pinch or rotate
      const initial1 = gestureState.initialTouches[0];
      const initial2 = gestureState.initialTouches[1];
      const current1 = currentTouches[0];
      const current2 = currentTouches[1];

      const initialDistance = Math.sqrt(
        Math.pow(initial2.x - initial1.x, 2) + Math.pow(initial2.y - initial1.y, 2)
      );
      const currentDistance = Math.sqrt(
        Math.pow(current2.x - current1.x, 2) + Math.pow(current2.y - current1.y, 2)
      );

      const scale = currentDistance / initialDistance;

      if (Math.abs(scale - 1) > 0.1) {
        onGestureDetected('pinch', { scale, type: scale > 1 ? 'zoom-in' : 'zoom-out' });
      }

      // Rotation detection
      const initialAngle = Math.atan2(initial2.y - initial1.y, initial2.x - initial1.x);
      const currentAngle = Math.atan2(current2.y - current1.y, current2.x - current1.x);
      const rotation = (currentAngle - initialAngle) * 180 / Math.PI;

      if (Math.abs(rotation) > 15) {
        onGestureDetected('rotate', { rotation, direction: rotation > 0 ? 'clockwise' : 'counterclockwise' });
      }
    }
  }, [gestureState, onGestureDetected]);

  const handleTouchEnd = useCallback(() => {
    setGestureState({
      isDetecting: false,
      initialTouches: [],
      currentTouches: []
    });
  }, []);

  return (
    <div
      ref={gestureRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="touch-manipulation-auto"
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </div>
  );
});

/**
 * Main Interaction Patterns Controller
 * Orchestrates all interaction patterns and feedback systems
 */
export const InteractionPatterns = memo(function InteractionPatterns({
  config,
  onTimeBlockSelect,
  onTimeSlotClick,
  onGestureDetected,
  children
}: InteractionPatternsProps & { children: React.ReactNode }) {
  const [feedback, setFeedback] = useState<{
    position: { x: number; y: number } | null;
    type: 'click' | 'longpress' | 'drag' | 'success' | 'error';
  }>({
    position: null,
    type: 'click'
  });

  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number } | null;
    blockId: string | null;
  }>({
    position: null,
    blockId: null
  });

  const [dragState, setDragState] = useState({
    isDragging: false,
    validDropZones: [] as Array<{ hour: number; valid: boolean; position: { x: number; y: number } }>,
    previewPosition: null as { x: number; y: number } | null
  });

  const showFeedback = useCallback((
    position: { x: number; y: number },
    type: 'click' | 'longpress' | 'drag' | 'success' | 'error' = 'click'
  ) => {
    if (!config.clickFeedback) return;

    setFeedback({ position, type });

    // Haptic feedback on supported devices
    if ('vibrate' in navigator && config.touchOptimized) {
      navigator.vibrate(type === 'success' ? [50, 30, 50] : [30]);
    }
  }, [config.clickFeedback, config.touchOptimized]);

  const showContextMenu = useCallback((
    position: { x: number; y: number },
    blockId: string
  ) => {
    setContextMenu({ position, blockId });
  }, []);

  const handleContextMenuAction = useCallback((action: 'edit' | 'delete' | 'move' | 'duplicate') => {
    if (contextMenu.blockId) {
      onTimeBlockSelect(contextMenu.blockId, action);
      showFeedback(contextMenu.position!, action === 'delete' ? 'error' : 'success');
    }
  }, [contextMenu, onTimeBlockSelect, showFeedback]);

  const wrappedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onInteractionFeedback: showFeedback,
        onContextMenu: showContextMenu,
        onDragStateChange: setDragState
      });
    }
    return child;
  });

  return (
    <>
      {config.gestureSupport ? (
        <GestureDetector onGestureDetected={onGestureDetected}>
          {wrappedChildren}
        </GestureDetector>
      ) : (
        wrappedChildren
      )}

      {/* Interaction feedback */}
      <InteractionFeedback
        position={feedback.position}
        type={feedback.type}
        onComplete={() => setFeedback({ position: null, type: 'click' })}
      />

      {/* Context menu */}
      <TimeBlockContextMenu
        position={contextMenu.position}
        blockId={contextMenu.blockId}
        onAction={handleContextMenuAction}
        onClose={() => setContextMenu({ position: null, blockId: null })}
      />

      {/* Drag indicators */}
      <DragIndicators
        isDragging={dragState.isDragging}
        validDropZones={dragState.validDropZones}
        previewPosition={dragState.previewPosition}
      />
    </>
  );
});

InteractionPatterns.displayName = 'InteractionPatterns';

// Default interaction configuration
export const DEFAULT_INTERACTION_CONFIG: InteractionConfig = {
  dragEnabled: true,
  hoverEffects: true,
  clickFeedback: true,
  touchOptimized: true,
  gestureSupport: true
};

// Export types for external use
export type { InteractionConfig, InteractionPatternsProps };
