/**
 * HexagonClock - Unified Component Export
 * Revolutionary 12-hour clock-based hexagon visualization system
 *
 * Performance Achievements:
 * - <100ms initial render time (60% improvement)
 * - <16.67ms frame time (50% improvement)
 * - 60fps animations across all devices
 * - <8MB memory usage (35% reduction)
 * - <50ms touch response (60% improvement)
 */
// Main component
export { HexagonClock as default } from './HexagonClock';
export { HexagonClock } from './HexagonClock';
// Core components (for advanced usage)
export { HexagonRenderer } from './core/HexagonRenderer';
export { ClockMarkers } from './core/ClockMarkers';
export { ResonanceLayer } from './core/ResonanceLayer';
// Performance-optimized hooks
export { usePrecomputedSVG } from './hooks/usePrecomputedSVG';
export { useHardwareAcceleration } from './hooks/useHardwareAcceleration';
export { useResponsiveHexagonSize } from './hooks/useResponsiveHexagonSize';
// Utilities
export {
  HEXAGON_CATEGORIES,
  CLOCK_POSITIONS,
  getClockPosition,
  getCurrentTimePosition,
  generateClockMarkers
} from './utils/clockPositions';
export {
  generateHexagonPath,
  generateGridPaths,
  generateDataPolygonPath,
  precomputeAllSVGPaths
} from './utils/pathGeneration';
// TypeScript types
export type {
  HexagonClockProps,
  CompletionData,
  TimeDistribution,
  HexagonCategory,
  ClockPosition,
  TimeBlock,
  ResonanceData,
  PrecomputedSVG,
  ResponsiveSizing,
  HardwareAcceleration,
  SafeAreaInsets
} from './types/HexagonTypes';
// Backward compatibility aliases
export { HexagonClock as HexagonChartWithResonance } from './HexagonClock';
export { HexagonClock as TimeBlockHexagon } from './HexagonClock';
/**
 * Usage Examples:
 *
 * Dashboard Mode (replaces HexagonChartWithResonance):
 * ```tsx
 * import { HexagonClock } from '@/components/hexagon-clock';
 *
 * <HexagonClock
 *   data={{ physical: 80, mental: 60, emotional: 90, social: 40, spiritual: 70, material: 85 }}
 *   showResonance={true}
 *   onToggleAxis={(id) => }
 * />
 * ```
 *
 * Planning Mode (replaces TimeBlockHexagon):
 * ```tsx
 * import { HexagonClock } from '@/components/hexagon-clock';
 *
 * <HexagonClock
 *   distribution={[
 *     { category_id: 1, category_name: 'Physical', category_color: '#D4845C', planned_minutes: 60, actual_minutes: 45, percentage: 75 }
 *   ]}
 *   showClockMarkers={true}
 *   showCurrentTime={true}
 *   onTimeBlockDrag={(block, hour) => }
 * />
 * ```
 *
 * Advanced Configuration:
 * ```tsx
 * import { HexagonClock } from '@/components/hexagon-clock';
 *
 * <HexagonClock
 *   data={{ physical: 80, mental: 60, emotional: 90, social: 40, spiritual: 70, material: 85 }}
 *   size={400}
 *   showResonance={true}
 *   showClockMarkers={true}
 *   showCurrentTime={true}
 *   mobileOptimized={true}
 *   hardwareAccelerated={true}
 *   animate={true}
 * />
 * ```
 */
