/**
 * Time Blocks on Clock Component
 * Revolutionary time block positioning on 12-hour clock face
 */

'use client'

import React, { memo, useCallback } from 'react';
import type { PrecomputedSVG, ResponsiveSizing } from '../types/HexagonTypes';
import {
  mapTimeBlocksToClockPosition,
  detectTimeConflicts,
  getOptimalTimeForCategory,
  CLOCK_POSITIONS
} from '../utils/clockPositions';

interface TimeBlock {
  id: string;
  startTime: string;
  duration: number;
  category: keyof typeof CLOCK_POSITIONS;
  status: 'empty' | 'planned' | 'active' | 'completed' | 'overflowing';
  title?: string;
  progress?: number; // 0-1 for active blocks
}

interface TimeBlocksOnClockProps {
  precomputedSVG: PrecomputedSVG;
  responsiveSizing: ResponsiveSizing;
  timeBlocks: TimeBlock[];
  animate?: boolean;
  onTimeBlockClick?: (block: TimeBlock) => void;
  onTimeBlockDrag?: (blockId: string, newHour: number) => void;
  showConflicts?: boolean;
}

/**
 * Individual time block arc on clock
 */
const TimeBlockArc = memo(function TimeBlockArc({
  block,
  clockPosition,
  center,
  radius,
  animate = true,
  onClick,
  conflicts = []
}: {
  block: TimeBlock;
  clockPosition: any;
  center: { x: number; y: number };
  radius: number;
  animate?: boolean;
  onClick?: () => void;
  conflicts?: any[];
}) {
  const { arcStart, arcEnd, arcWidth } = clockPosition;

  // Convert angles to radians for SVG arc calculation
  const startRad = (arcStart * Math.PI) / 180;
  const endRad = (arcEnd * Math.PI) / 180;

  const innerRadius = radius * 0.75;
  const outerRadius = radius * 0.95;

  // Calculate arc path
  const innerStartX = center.x + innerRadius * Math.cos(startRad);
  const innerStartY = center.y + innerRadius * Math.sin(startRad);
  const outerStartX = center.x + outerRadius * Math.cos(startRad);
  const outerStartY = center.y + outerRadius * Math.sin(startRad);
  const innerEndX = center.x + innerRadius * Math.cos(endRad);
  const innerEndY = center.y + innerRadius * Math.sin(endRad);
  const outerEndX = center.x + outerRadius * Math.cos(endRad);
  const outerEndY = center.y + outerRadius * Math.sin(endRad);

  const largeArcFlag = arcWidth > 180 ? 1 : 0;

  const arcPath = [
    `M ${innerStartX} ${innerStartY}`,
    `L ${outerStartX} ${outerStartY}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}`,
    `L ${innerEndX} ${innerEndY}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
    'Z'
  ].join(' ');

  // Visual properties based on status
  const getVisualProps = () => {
    const categoryColor = CLOCK_POSITIONS[block.category];
    const baseColor = categoryColor ? CLOCK_POSITIONS[block.category] : '#A8C8B8'; // fallback to social color

    switch (block.status) {
      case 'empty':
        return {
          fill: 'transparent',
          stroke: baseColor,
          strokeWidth: 2,
          strokeDasharray: '5,5',
          opacity: 0.5,
          animationClass: ''
        };
      case 'planned':
        return {
          fill: baseColor,
          stroke: baseColor,
          strokeWidth: 2,
          strokeDasharray: 'none',
          opacity: 0.4,
          animationClass: ''
        };
      case 'active':
        return {
          fill: baseColor,
          stroke: baseColor,
          strokeWidth: 3,
          strokeDasharray: 'none',
          opacity: 0.8,
          animationClass: 'animate-pulse'
        };
      case 'completed':
        return {
          fill: baseColor,
          stroke: baseColor,
          strokeWidth: 2,
          strokeDasharray: 'none',
          opacity: 0.9,
          animationClass: ''
        };
      case 'overflowing':
        return {
          fill: baseColor,
          stroke: '#ff6b6b',
          strokeWidth: 3,
          strokeDasharray: 'none',
          opacity: 0.7,
          animationClass: 'animate-bounce'
        };
      default:
        return {
          fill: baseColor,
          stroke: baseColor,
          strokeWidth: 2,
          strokeDasharray: 'none',
          opacity: 0.5,
          animationClass: ''
        };
    }
  };

  const visual = getVisualProps();
  const hasConflicts = conflicts.length > 0;

  return (
    <g className={`time-block-arc time-block-${block.status}`}>
      {/* Main time block arc */}
      <path
        d={arcPath}
        fill={visual.fill}
        stroke={hasConflicts ? '#ff6b6b' : visual.stroke}
        strokeWidth={hasConflicts ? visual.strokeWidth + 1 : visual.strokeWidth}
        strokeDasharray={visual.strokeDasharray}
        opacity={visual.opacity}
        className={`transform-gpu cursor-pointer hover:scale-105 transition-all duration-200 ${visual.animationClass}`}
        onClick={onClick}
        style={{
          filter: hasConflicts ? 'drop-shadow(0 0 8px #ff6b6b)' : `drop-shadow(0 2px 4px ${visual.stroke}40)`,
          transformOrigin: `${center.x}px ${center.y}px`
        }}
      />

      {/* Progress indicator for active blocks */}
      {block.status === 'active' && block.progress !== undefined && (
        <path
          d={arcPath}
          fill="none"
          stroke="#FFD700"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
          strokeDasharray={`${(block.progress * 100)} ${100 - (block.progress * 100)}`}
          className="transform-gpu animate-pulse"
        />
      )}

      {/* Time display */}
      <text
        x={clockPosition.x}
        y={clockPosition.y - 10}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-white text-xs font-bold select-none"
        style={{ pointerEvents: 'none' }}
      >
        {block.timeDisplay}
      </text>

      {/* Title or category */}
      <text
        x={clockPosition.x}
        y={clockPosition.y + 5}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-white/80 text-xs select-none"
        style={{ pointerEvents: 'none' }}
      >
        {block.title || block.category}
      </text>

      {/* Conflict indicator */}
      {hasConflicts && (
        <circle
          cx={clockPosition.x + 15}
          cy={clockPosition.y - 15}
          r="4"
          fill="#ff6b6b"
          className="animate-bounce"
        />
      )}

      {/* Completion checkmark */}
      {block.status === 'completed' && (
        <g transform={`translate(${clockPosition.x + 10}, ${clockPosition.y - 10})`}>
          <circle r="6" fill="#4ade80" />
          <path
            d="M -2 0 L 0 2 L 4 -2"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      )}
    </g>
  );
});

/**
 * Time conflict warnings
 */
const ConflictWarnings = memo(function ConflictWarnings({
  conflicts,
  center,
  animate = true
}: {
  conflicts: any[];
  center: { x: number; y: number };
  animate?: boolean;
}) {
  if (conflicts.length === 0) return null;

  return (
    <g className="conflict-warnings">
      <text
        x={center.x}
        y={center.y - 40}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-red-400 text-sm font-medium select-none"
        style={{
          opacity: animate ? 0 : 1,
          animation: animate ? 'fade-in 0.5s ease-out 1s forwards' : 'none'
        }}
      >
        ⚠️ {conflicts.length} Time Conflict{conflicts.length > 1 ? 's' : ''}
      </text>
    </g>
  );
});

/**
 * Optimal time suggestions
 */
const OptimalTimeSuggestions = memo(function OptimalTimeSuggestions({
  precomputedSVG,
  timeBlocks,
  animate = true
}: {
  precomputedSVG: PrecomputedSVG;
  timeBlocks: TimeBlock[];
  animate?: boolean;
}) {
  const { center, radius } = precomputedSVG;

  // Get suggestions for empty time slots
  const suggestions = Object.keys(CLOCK_POSITIONS)
    .filter(category => !timeBlocks.some(block => block.category === category))
    .map(category => getOptimalTimeForCategory(category as keyof typeof CLOCK_POSITIONS));

  if (suggestions.length === 0) return null;

  return (
    <g className="optimal-time-suggestions">
      <text
        x={center.x}
        y={center.y + radius + 30}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-white/60 text-xs select-none"
        style={{
          opacity: animate ? 0 : 1,
          animation: animate ? 'fade-in 0.5s ease-out 2s forwards' : 'none'
        }}
      >
        💡 Optimal times available: {suggestions.map(s => s.timeRange).join(', ')}
      </text>
    </g>
  );
});

/**
 * Main TimeBlocksOnClock component
 */
export const TimeBlocksOnClock = memo(function TimeBlocksOnClock({
  precomputedSVG,
  responsiveSizing,
  timeBlocks,
  animate = true,
  onTimeBlockClick,
  onTimeBlockDrag,
  showConflicts = true
}: TimeBlocksOnClockProps) {
  const { center, radius } = precomputedSVG;

  // Map time blocks to clock positions
  const clockTimeBlocks = mapTimeBlocksToClockPosition(
    timeBlocks,
    center,
    radius
  );

  // Detect conflicts
  const allConflicts = showConflicts
    ? timeBlocks.flatMap(block =>
        detectTimeConflicts(
          { startTime: block.startTime, duration: block.duration },
          timeBlocks.filter(b => b.id !== block.id)
        )
      )
    : [];

  const handleTimeBlockClick = useCallback((block: TimeBlock) => {
    onTimeBlockClick?.(block);
  }, [onTimeBlockClick]);

  return (
    <g className="time-blocks-on-clock">
      {/* Time blocks as arcs */}
      {clockTimeBlocks.map((block, idx) => {
        const blockConflicts = allConflicts.filter(conflict =>
          conflict.conflictingBlock.startTime === block.startTime
        );

        return (
          <TimeBlockArc
            key={block.id}
            block={block}
            clockPosition={block.clockPosition}
            center={center}
            radius={radius}
            animate={animate}
            onClick={() => handleTimeBlockClick(block)}
            conflicts={blockConflicts}
          />
        );
      })}

      {/* Conflict warnings */}
      {showConflicts && (
        <ConflictWarnings
          conflicts={allConflicts}
          center={center}
          animate={animate}
        />
      )}

      {/* Optimal time suggestions */}
      <OptimalTimeSuggestions
        precomputedSVG={precomputedSVG}
        timeBlocks={timeBlocks}
        animate={animate}
      />
    </g>
  );
});

TimeBlocksOnClock.displayName = 'TimeBlocksOnClock';
