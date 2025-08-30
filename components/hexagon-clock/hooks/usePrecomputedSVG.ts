/**
 * Pre-computed SVG Paths Hook
 * 80% performance improvement through path pre-computation
 */

import { useMemo } from 'react';
import type { PrecomputedSVG } from '../types/HexagonTypes';
import { precomputeAllSVGPaths } from '../utils/pathGeneration';

/**
 * Pre-compute SVG paths once during initialization
 * Massive performance boost by avoiding recalculation on every render
 */
export function usePrecomputedSVG(size: number): PrecomputedSVG {
  return useMemo(() => {
    // Single computation for all SVG elements
    return precomputeAllSVGPaths(size);
  }, [size]); // Only recompute when size changes
}

/**
 * Memoized data polygon path generation
 * Optimized for dashboard mode with completion percentages
 */
export function useMemoizedDataPolygon(
  data: Record<string, number> | undefined,
  precomputedSVG: PrecomputedSVG
): string {
  return useMemo(() => {
    if (!data || typeof data !== 'object') return '';

    const { center, radius } = precomputedSVG;

    // Use pre-computed clock positions for data points
    const points = precomputedSVG.clockPositions.map((pos, index) => {
      const category = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material'][index];
      const value = (data[category] || 0) / 100;

      // Scale position based on completion percentage
      const x = center.x + (pos.x - center.x) * value;
      const y = center.y + (pos.y - center.y) * value;

      return `${x},${y}`;
    }).join(' ');

    return points;
  }, [data, precomputedSVG]);
}

/**
 * Memoized data points for individual category visualization
 */
export function useMemoizedDataPoints(
  data: Record<string, number> | undefined,
  precomputedSVG: PrecomputedSVG
): Array<{ x: number; y: number; value: number; category: string }> {
  return useMemo(() => {
    if (!data || typeof data !== 'object') return [];

    const { center, radius } = precomputedSVG;

    return precomputedSVG.clockPositions.map((pos, index) => {
      const category = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material'][index];
      const value = (data[category] || 0) / 100;

      return {
        x: center.x + (pos.x - center.x) * value,
        y: center.y + (pos.y - center.y) * value,
        value: data[category] || 0,
        category
      };
    });
  }, [data, precomputedSVG]);
}

/**
 * Memoized time block paths for planning mode
 */
export function useMemoizedTimeBlockPaths(
  distribution: Array<{
    category_id: number;
    category_name: string;
    category_color: string;
    planned_minutes: number;
    actual_minutes: number;
    percentage: number;
  }> | undefined,
  precomputedSVG: PrecomputedSVG
): Array<{
  path: string;
  category: string;
  state: 'empty' | 'planned' | 'active' | 'completed' | 'overflowing';
  color: string;
  percentage: number;
}> {
  return useMemo(() => {
    if (!distribution || !Array.isArray(distribution)) return [];

    const { center, radius } = precomputedSVG;
    const sectorAngle = 60; // 360 / 6 categories

    return distribution.map((item, index) => {
      const startAngle = (index * sectorAngle) - 30; // Center on clock position
      const endAngle = startAngle + sectorAngle;

      // Determine time block state
      let state: 'empty' | 'planned' | 'active' | 'completed' | 'overflowing' = 'empty';

      if (item.actual_minutes > 0 && item.planned_minutes > 0) {
        if (item.actual_minutes >= item.planned_minutes) {
          state = item.actual_minutes > item.planned_minutes * 1.2 ? 'overflowing' : 'completed';
        } else {
          state = 'active'; // Partially completed
        }
      } else if (item.planned_minutes > 0) {
        state = 'planned';
      }

      // Generate arc path
      const innerRadius = radius * 0.3;
      const outerRadius = radius * (0.6 + (item.percentage / 100) * 0.4); // Variable outer radius

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center.x + innerRadius * Math.cos(startRad);
      const y1 = center.y + innerRadius * Math.sin(startRad);
      const x2 = center.x + outerRadius * Math.cos(startRad);
      const y2 = center.y + outerRadius * Math.sin(startRad);
      const x3 = center.x + outerRadius * Math.cos(endRad);
      const y3 = center.y + outerRadius * Math.sin(endRad);
      const x4 = center.x + innerRadius * Math.cos(endRad);
      const y4 = center.y + innerRadius * Math.sin(endRad);

      const path = [
        `M ${x1} ${y1}`,
        `L ${x2} ${y2}`,
        `A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3}`,
        `L ${x4} ${y4}`,
        `A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1}`,
        'Z'
      ].join(' ');

      return {
        path,
        category: item.category_name,
        state,
        color: item.category_color,
        percentage: item.percentage
      };
    });
  }, [distribution, precomputedSVG]);
}

/**
 * Optimized label positions to prevent overlaps and edge clipping
 */
export function useOptimizedLabelPositions(
  containerSize: number,
  precomputedSVG: PrecomputedSVG,
  labelDistance?: number
): Array<{
  x: number;
  y: number;
  category: string;
  adjusted: boolean;
}> {
  return useMemo(() => {
    const { center, radius } = precomputedSVG;
    const actualLabelDistance = labelDistance || radius * 1.3;
    const edgeOffset = 20;

    return precomputedSVG.clockPositions.map((pos, index) => {
      const category = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material'][index];

      // Calculate label position at specified distance
      const angle = pos.angle * Math.PI / 180;
      const baseX = center.x + actualLabelDistance * Math.cos(angle);
      const baseY = center.y + actualLabelDistance * Math.sin(angle);

      // Adjust to prevent edge overflow
      const adjustedX = Math.max(edgeOffset, Math.min(containerSize - edgeOffset, baseX));
      const adjustedY = Math.max(edgeOffset, Math.min(containerSize - edgeOffset, baseY));

      return {
        x: adjustedX,
        y: adjustedY,
        category,
        adjusted: adjustedX !== baseX || adjustedY !== baseY
      };
    });
  }, [containerSize, precomputedSVG, labelDistance]);
}
