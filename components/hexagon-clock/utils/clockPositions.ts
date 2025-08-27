/**
 * Clock Position Calculations
 * 12-hour clock-based positioning system for hexagon visualization
 */

import type { ClockPosition, HexagonCategory } from '../types/HexagonTypes';

// Revolutionary 12-hour clock positioning system with circadian-based mapping
// Physical starts at 12 o'clock (sun position), following natural daily rhythm
export const CLOCK_POSITIONS: Record<string, ClockPosition & {
  symbolism: string;
  icon: string;
  circadianPeak: string;
}> = {
  physical: { 
    hour: 12, 
    angle: 0, 
    timeRange: '6:00-9:00 AM',
    symbolism: 'Morning vitality - body is fresh and energized',
    icon: '☀️',
    circadianPeak: 'Dawn energy peak'
  },
  mental: { 
    hour: 2, 
    angle: 60, 
    timeRange: '9:00-11:00 AM',
    symbolism: 'Peak cognitive performance window',
    icon: '🧠',
    circadianPeak: 'Mid-morning focus'
  },
  emotional: { 
    hour: 4, 
    angle: 120, 
    timeRange: '2:00-4:00 PM',
    symbolism: 'Natural emotional processing time',
    icon: '💜',
    circadianPeak: 'Afternoon creativity'
  },
  social: { 
    hour: 6, 
    angle: 180, 
    timeRange: '6:00-8:00 PM',
    symbolism: 'Social energy peaks in evening',
    icon: '👥',
    circadianPeak: 'Evening connection'
  },
  spiritual: { 
    hour: 8, 
    angle: 240, 
    timeRange: '8:00-10:00 PM',
    symbolism: 'Quiet reflection before rest',
    icon: '🕯️',
    circadianPeak: 'Evening contemplation'
  },
  material: { 
    hour: 10, 
    angle: 300, 
    timeRange: '10:00 PM-12:00 AM',
    symbolism: 'End-of-day planning and organization',
    icon: '📊',
    circadianPeak: 'Night planning'
  }
};

// Enhanced category system with clock-based positioning and brand colors
export const HEXAGON_CATEGORIES: HexagonCategory[] = [
  { 
    key: 'physical', 
    label: 'Living Movement', 
    shortLabel: 'Physical',
    color: '#D4845C',      // Warm Terracotta
    softColor: '#F4E4DE',
    mantra: 'Today I inhabit my body with tenderness',
    clockPosition: CLOCK_POSITIONS.physical
  },
  { 
    key: 'mental', 
    label: 'Inner Clarity', 
    shortLabel: 'Mental',
    color: '#8B9DC3',      // Sage Blue
    softColor: '#E8EDF4',
    mantra: 'Today I make space to think less',
    clockPosition: CLOCK_POSITIONS.mental
  },
  { 
    key: 'emotional', 
    label: 'Creative Expression', 
    shortLabel: 'Emotional',
    color: '#B8A4C9',      // Light Lavender
    softColor: '#F0EAEF',
    mantra: 'Today I create not to show, but to free',
    clockPosition: CLOCK_POSITIONS.emotional
  },
  { 
    key: 'social', 
    label: 'Mirror Connection', 
    shortLabel: 'Social',
    color: '#A8C8B8',      // Soft Sage Green
    softColor: '#E8F1EC',
    mantra: 'Today I connect without disappearing',
    clockPosition: CLOCK_POSITIONS.social
  },
  { 
    key: 'spiritual', 
    label: 'Elevated Presence', 
    shortLabel: 'Spiritual',
    color: '#7B6C8D',      // Deep Lavender
    softColor: '#E9E4ED',
    mantra: 'Today I find myself beyond doing',
    clockPosition: CLOCK_POSITIONS.spiritual
  },
  { 
    key: 'material', 
    label: 'Earthly Sustenance', 
    shortLabel: 'Material',
    color: '#C19A6B',      // Golden Brown
    softColor: '#F1EBE4',
    mantra: 'Today I sustain myself, not prove myself',
    clockPosition: CLOCK_POSITIONS.material
  }
];

/**
 * Calculate clock position for a given hour (0-11)
 */
export function getClockPosition(hour: number, center: { x: number; y: number }, radius: number) {
  // Convert hour to angle (12 o'clock = 0°, 3 o'clock = 90°)
  const angle = ((hour % 12) * 30) - 90; // -90 to start at 12 o'clock
  const angleRad = (angle * Math.PI) / 180;
  
  return {
    x: center.x + radius * Math.cos(angleRad),
    y: center.y + radius * Math.sin(angleRad),
    angle: angle + 90 // Normalized to 0-360
  };
}

/**
 * Get current time indicator position
 */
export function getCurrentTimePosition(center: { x: number; y: number }, radius: number) {
  const now = new Date();
  const hour = now.getHours() % 12;
  const minute = now.getMinutes();
  
  // Calculate precise position including minutes
  const hourAngle = (hour * 30) + (minute * 0.5) - 90; // -90 to start at 12 o'clock
  const angleRad = (hourAngle * Math.PI) / 180;
  
  return {
    x: center.x + radius * 0.85 * Math.cos(angleRad), // Slightly inside the hexagon
    y: center.y + radius * 0.85 * Math.sin(angleRad),
    angle: hourAngle + 90,
    hour,
    minute
  };
}

/**
 * Generate clock markers for 12-hour indicators
 */
export function generateClockMarkers(center: { x: number; y: number }, radius: number) {
  const markers = [];
  
  for (let hour = 0; hour < 12; hour++) {
    const position = getClockPosition(hour, center, radius * 1.1);
    const isMainHour = hour % 3 === 0; // 12, 3, 6, 9 are main hours
    
    markers.push({
      hour: hour === 0 ? 12 : hour,
      x: position.x,
      y: position.y,
      angle: position.angle,
      isMain: isMainHour,
      size: isMainHour ? 3 : 1.5
    });
  }
  
  return markers;
}

/**
 * Map time range to clock positions for planning mode
 */
export function mapTimeRangeToPosition(startHour: number, endHour: number, center: { x: number; y: number }, radius: number) {
  const duration = endHour - startHour;
  const midHour = startHour + (duration / 2);
  
  return {
    start: getClockPosition(startHour, center, radius),
    end: getClockPosition(endHour, center, radius),
    mid: getClockPosition(midHour, center, radius),
    duration,
    arc: duration * 30 // degrees
  };
}

/**
 * Calculate optimal label positioning to avoid overlaps
 */
export function optimizeLabelPositions(
  categories: HexagonCategory[],
  center: { x: number; y: number },
  labelDistance: number,
  containerSize: number
) {
  return categories.map((cat, index) => {
    const clockPos = cat.clockPosition;
    const angleRad = (clockPos.angle * Math.PI) / 180;
    const baseX = center.x + labelDistance * Math.cos(angleRad);
    const baseY = center.y + labelDistance * Math.sin(angleRad);
    
    // Adjust position to prevent edge overflow
    const edgeOffset = 20;
    const adjustedX = Math.max(edgeOffset, Math.min(containerSize - edgeOffset, baseX));
    const adjustedY = Math.max(edgeOffset, Math.min(containerSize - edgeOffset, baseY));
    
    return {
      ...cat,
      position: { x: adjustedX, y: adjustedY },
      originalPosition: { x: baseX, y: baseY },
      adjusted: adjustedX !== baseX || adjustedY !== baseY
    };
  });
}

/**
 * Generate time block sectors for planning mode
 */
export function generateTimeBlockSectors(
  center: { x: number; y: number },
  radius: number,
  categories: HexagonCategory[]
) {
  return categories.map((cat, index) => {
    const { clockPosition } = cat;
    const sectorAngle = 360 / 6; // 60 degrees per sector
    const startAngle = clockPosition.angle - (sectorAngle / 2);
    const endAngle = clockPosition.angle + (sectorAngle / 2);
    
    // Create sector path for time blocks
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const innerRadius = radius * 0.3; // Inner ring
    const outerRadius = radius * 1.0; // Outer ring
    
    // Sector path points
    const innerStart = {
      x: center.x + innerRadius * Math.cos(startRad),
      y: center.y + innerRadius * Math.sin(startRad)
    };
    const outerStart = {
      x: center.x + outerRadius * Math.cos(startRad),
      y: center.y + outerRadius * Math.sin(startRad)
    };
    const innerEnd = {
      x: center.x + innerRadius * Math.cos(endRad),
      y: center.y + innerRadius * Math.sin(endRad)
    };
    const outerEnd = {
      x: center.x + outerRadius * Math.cos(endRad),
      y: center.y + outerRadius * Math.sin(endRad)
    };
    
    const path = [
      `M ${innerStart.x} ${innerStart.y}`,
      `L ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y}`,
      'Z'
    ].join(' ');
    
    return {
      category: cat,
      sectorPath: path,
      centerPoint: {
        x: center.x + (radius * 0.65) * Math.cos((clockPosition.angle * Math.PI) / 180),
        y: center.y + (radius * 0.65) * Math.sin((clockPosition.angle * Math.PI) / 180)
      },
      clockPosition
    };
  });
}

/**
 * Revolutionary clock positioning functions
 */

/**
 * Get category position at its optimal clock hour
 */
export function getCategoryClockPosition(
  category: keyof typeof CLOCK_POSITIONS,
  center: { x: number; y: number },
  radius: number
) {
  const clockPos = CLOCK_POSITIONS[category];
  const angleRad = (clockPos.angle * Math.PI) / 180;
  
  return {
    x: center.x + radius * Math.cos(angleRad),
    y: center.y + radius * Math.sin(angleRad),
    hour: clockPos.hour,
    timeRange: clockPos.timeRange,
    icon: clockPos.icon,
    symbolism: clockPos.symbolism,
    circadianPeak: clockPos.circadianPeak
  };
}

/**
 * Calculate sun position based on current time
 */
export function getCurrentTimeSunPosition(center: { x: number; y: number }, radius: number) {
  const now = new Date();
  const hour = now.getHours() % 12;
  const minute = now.getMinutes();
  const second = now.getSeconds();
  
  // Ultra-precise position including seconds for smooth animation
  const totalMinutes = (hour * 60) + minute + (second / 60);
  const angle = (totalMinutes / 720) * 360 - 90; // 720 minutes = 12 hours, -90 for 12 o'clock start
  const angleRad = (angle * Math.PI) / 180;
  
  return {
    x: center.x + radius * Math.cos(angleRad),
    y: center.y + radius * Math.sin(angleRad),
    angle: angle + 90, // Normalized
    hour: hour === 0 ? 12 : hour,
    minute,
    second,
    timeString: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  };
}

/**
 * Generate 12-hour clock markers with sun symbol at 12
 */
export function generateRevolutionaryClockMarkers(center: { x: number; y: number }, radius: number) {
  const markers = [];
  
  for (let hour = 0; hour < 12; hour++) {
    const displayHour = hour === 0 ? 12 : hour;
    const angle = (hour * 30) - 90; // -90 to start at 12 o'clock
    const angleRad = (angle * Math.PI) / 180;
    const markerRadius = radius * 1.1;
    
    const x = center.x + markerRadius * Math.cos(angleRad);
    const y = center.y + markerRadius * Math.sin(angleRad);
    
    markers.push({
      hour: displayHour,
      x,
      y,
      angle: angle + 90,
      isSun: displayHour === 12, // Special sun marker
      isQuarter: displayHour % 3 === 0, // 12, 3, 6, 9
      size: displayHour === 12 ? 6 : (displayHour % 3 === 0 ? 4 : 2),
      symbol: displayHour === 12 ? '☀️' : displayHour.toString()
    });
  }
  
  return markers;
}

/**
 * Map time blocks to clock positions
 */
export function mapTimeBlocksToClockPosition(
  timeBlocks: Array<{
    startTime: string;
    duration: number;
    category: keyof typeof CLOCK_POSITIONS;
    status: 'empty' | 'planned' | 'active' | 'completed' | 'overflowing';
  }>,
  center: { x: number; y: number },
  radius: number
) {
  return timeBlocks.map(block => {
    const startDate = new Date(block.startTime);
    const hour = startDate.getHours() % 12;
    const minute = startDate.getMinutes();
    
    // Position based on actual scheduled time
    const scheduledAngle = ((hour * 60 + minute) / 720) * 360 - 90;
    const scheduledAngleRad = (scheduledAngle * Math.PI) / 180;
    
    // Duration as arc width
    const durationAngle = (block.duration / 60) * 30; // 30 degrees per hour
    
    const blockRadius = radius * 0.8;
    const x = center.x + blockRadius * Math.cos(scheduledAngleRad);
    const y = center.y + blockRadius * Math.sin(scheduledAngleRad);
    
    return {
      ...block,
      clockPosition: {
        x,
        y,
        angle: scheduledAngle + 90,
        arcStart: scheduledAngle - (durationAngle / 2),
        arcEnd: scheduledAngle + (durationAngle / 2),
        arcWidth: durationAngle
      },
      categoryPosition: getCategoryClockPosition(block.category, center, radius * 0.6),
      timeDisplay: startDate.toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  });
}

/**
 * Detect time conflicts for smart scheduling
 */
export function detectTimeConflicts(
  newTimeBlock: { startTime: string; duration: number },
  existingBlocks: Array<{ startTime: string; duration: number }>
): Array<{
  conflictingBlock: { startTime: string; duration: number };
  overlapMinutes: number;
}> {
  const conflicts = [];
  const newStart = new Date(newTimeBlock.startTime);
  const newEnd = new Date(newStart.getTime() + newTimeBlock.duration * 60000);
  
  existingBlocks.forEach(existing => {
    const existingStart = new Date(existing.startTime);
    const existingEnd = new Date(existingStart.getTime() + existing.duration * 60000);
    
    if (newStart < existingEnd && newEnd > existingStart) {
      const overlapStart = new Date(Math.max(newStart.getTime(), existingStart.getTime()));
      const overlapEnd = new Date(Math.min(newEnd.getTime(), existingEnd.getTime()));
      const overlapMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
      
      conflicts.push({
        conflictingBlock: existing,
        overlapMinutes
      });
    }
  });
  
  return conflicts;
}

/**
 * Get optimal time suggestion for category
 */
export function getOptimalTimeForCategory(category: keyof typeof CLOCK_POSITIONS): {
  hour: number;
  timeRange: string;
  reasoning: string;
} {
  const clockPos = CLOCK_POSITIONS[category];
  return {
    hour: clockPos.hour,
    timeRange: clockPos.timeRange,
    reasoning: `${clockPos.symbolism} - optimal during ${clockPos.circadianPeak.toLowerCase()}`
  };
}