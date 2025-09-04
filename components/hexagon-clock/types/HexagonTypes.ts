/**
 * HexagonClock TypeScript Definitions
 * Unified types for both dashboard and time planning modes
 */
// Clock position configuration
export interface ClockPosition {
  hour: number;
  angle: number;
  timeRange: string;
}
// Category data for dashboard mode (completion percentages)
export interface CompletionData {
  physical: number;
  mental: number;
  emotional: number;
  social: number;
  spiritual: number;
  material: number;
}
// Time distribution for planning mode
export interface TimeDistribution {
  category_id: number;
  category_name: string;
  category_color: string;
  planned_minutes: number;
  actual_minutes: number;
  percentage: number;
}
// Time block states for planning mode
export type TimeBlockState =
  | 'empty'          // Dashed outline at clock position
  | 'planned'        // Solid fill with transparency
  | 'active'         // Pulsing animation with progress
  | 'completed'      // Full opacity with checkmark
  | 'overflowing';   // Extended beyond planned time
// Time block interface
export interface TimeBlock {
  category_id: number;
  category_name: string;
  category_color: string;
  planned_minutes: number;
  actual_minutes: number;
  state: TimeBlockState;
  clockPosition: ClockPosition;
  progress?: number; // 0-1 for active blocks
}
// Hexagon category configuration
export interface HexagonCategory {
  key: 'physical' | 'mental' | 'emotional' | 'social' | 'spiritual' | 'material';
  label: string;
  shortLabel: string;
  color: string;
  softColor: string;
  mantra: string;
  clockPosition: ClockPosition;
}
// Resonance data from community
export interface ResonanceData {
  axisSlug: string;
  resonanceCount: number;
  userCompleted: boolean;
  hasResonance: boolean;
}
// Pre-computed SVG paths for performance
export interface PrecomputedSVG {
  hexagonPath: string;
  gridPaths: string[];
  clockPositions: Array<{ x: number; y: number; angle: number }>;
  center: { x: number; y: number };
  radius: number;
}
// Responsive sizing configuration
export interface ResponsiveSizing {
  size: number;
  touchTarget: number;
  labelDistance: number;
  resonanceRadius: number;
  fontSize: {
    label: string;
    center: string;
    time: string;
  };
}
// Hardware acceleration CSS variables
export interface HardwareAcceleration {
  animationClasses: string;
  cssVariables: Record<string, string>;
}
// Safe area insets for notched devices
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
// Main component props interface
export interface HexagonClockProps {
  // Auto-detect mode based on props
  data?: CompletionData;           // Dashboard mode
  distribution?: TimeDistribution[]; // Planning mode
  timeBlocks?: Array<{             // Revolutionary time blocks on clock
    id: string;
    startTime: string;
    duration: number;
    category: string;
    status: 'empty' | 'planned' | 'active' | 'completed' | 'overflowing';
    title?: string;
    progress?: number;
  }>;
  // Display configuration
  size?: number | 'auto';
  showResonance?: boolean;
  showClockMarkers?: boolean;
  showCurrentTime?: boolean;
  showCategoryPositions?: boolean;    // Revolutionary clock positioning
  showCircadianRhythm?: boolean;      // Show circadian peak times
  showTimeBlocks?: boolean;           // Show time blocks on clock
  clockBasedPositioning?: boolean;    // Enable revolutionary positioning mode
  // Interaction callbacks
  onToggleAxis?: (id: string | number) => void;
  onCategoryClick?: (category: any) => void;
  onTimeBlockDrag?: (block: TimeBlock, newHour: number) => void;
  // Performance options
  mobileOptimized?: boolean;
  hardwareAccelerated?: boolean;
  // Backward compatibility
  animate?: boolean;
  isToggling?: boolean;
  axes?: Array<{
    id: string | number;
    name: string;
    color: string;
    icon: string;
    completed: boolean;
  }>;
  categories?: any[];
  activeTimer?: any;
}
// Internal component state
export interface HexagonState {
  mode: 'dashboard' | 'planning' | 'unified';
  isClient: boolean;
  windowWidth: number;
  containerWidth: number;
  responsiveSizing: ResponsiveSizing;
  precomputedSVG: PrecomputedSVG;
  safeAreaInsets: SafeAreaInsets;
}
