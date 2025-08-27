# HexagonClock Unified Architecture Specification

## Executive Summary

This document defines the architecture for unifying the current dual hexagon visualization system into a single, flexible **HexagonClock** component that supports multiple modes including the 12-hour clock concept, completion tracking, and time distribution visualization.

## Current State Analysis

### Existing Components

#### 1. HexagonChartWithResonance.tsx (Dashboard)
**Purpose**: Completion percentage visualization with community resonance
**Data**: Boolean completion states converted to percentages (0% or 100%)
**Features**:
- 6 hardcoded categories (HEXAGON_CATEGORIES constant)
- Resonance dots from community activity
- Responsive sizing (260px-400px)
- Mobile-optimized with safe area support
- Real-time community whispers

**Props Interface**:
```typescript
interface HexagonChartWithResonanceProps {
  data: {
    physical: number
    mental: number  
    emotional: number
    social: number
    spiritual: number
    material: number
  }
  size?: number
  animate?: boolean
  showResonance?: boolean
  onToggleAxis?: (id: string | number) => void
  isToggling?: boolean
  axes?: Array<{
    id: string | number
    name: string
    color: string
    icon: string
    completed: boolean
  }>
}
```

#### 2. TimeBlockHexagon.tsx (My Day)
**Purpose**: Time distribution visualization for daily planning
**Data**: Time-based data (minutes) showing planned vs actual time allocation
**Features**:
- Dynamic hexagon segments based on time percentages
- Visual states (empty, planned, in-progress, completed, partially complete)
- Timer integration with pulsing active state
- Center shows total active time

**Props Interface**:
```typescript
interface TimeBlockHexagonProps {
  distribution: TimeDistribution[]
  categories: any[]
  onCategoryClick?: (category: any) => void
  activeTimer?: any
}

interface TimeDistribution {
  category_id: number
  category_name: string
  category_color: string
  planned_minutes: number
  actual_minutes: number
  percentage: number
}
```

### Overlap Analysis

#### Shared Functionality
- **SVG Hexagon Rendering**: Both use 6-point hexagon with angular positioning
- **Category Mapping**: Both reference the same `axis6_categories` data structure
- **Responsive Sizing**: Both handle mobile/desktop size adaptation
- **Animation System**: Both use Framer Motion for progressive reveals
- **Color Theming**: Both use category-specific color schemes

#### Unique Features
| Component | Unique Features |
|-----------|-----------------|
| HexagonChartWithResonance | Resonance dots, community whispers, completion binary states |
| TimeBlockHexagon | Time-based calculations, visual progression states, timer integration |

## Proposed HexagonClock Architecture

### Core Concept: Clock-Based Positioning System

Instead of arbitrary angular positioning, the unified component will use **12-hour clock positions** as the foundation:

```typescript
// Clock Position Mapping (12-hour system)
const CLOCK_POSITIONS = {
  12: { angle: 270, label: "Noon/Midnight" },     // 12 o'clock (top)
  1:  { angle: 300, label: "1 o'clock" },
  2:  { angle: 330, label: "2 o'clock" },
  3:  { angle: 0,   label: "3 o'clock" },        // Right
  4:  { angle: 30,  label: "4 o'clock" },
  5:  { angle: 60,  label: "5 o'clock" },
  6:  { angle: 90,  label: "6 o'clock" },        // Bottom
  7:  { angle: 120, label: "7 o'clock" },
  8:  { angle: 150, label: "8 o'clock" },
  9:  { angle: 180, label: "9 o'clock" },        // Left
  10: { angle: 210, label: "10 o'clock" },
  11: { angle: 240, label: "11 o'clock" }
}
```

### Unified Component Structure

#### 1. HexagonClock.tsx - Master Component

```typescript
interface HexagonClockProps {
  // Mode Configuration
  mode: 'completion' | 'time-distribution' | 'clock-planning' | 'hybrid'
  
  // Data Sources (mode-dependent)
  completionData?: CompletionData
  timeData?: TimeDistributionData
  clockData?: ClockPlanningData
  
  // Visual Configuration
  size?: number
  showCenter?: boolean
  centerContent?: React.ReactNode | 'auto'
  clockReference?: boolean // Show 12 o'clock indicator
  
  // Interaction
  onSegmentClick?: (segment: SegmentData) => void
  onCenterClick?: () => void
  interactive?: boolean
  
  // Community Features
  showResonance?: boolean
  resonanceData?: ResonanceData
  
  // Animation
  animate?: boolean
  animationDelay?: number
  
  // Responsive
  responsive?: boolean
  minSize?: number
  maxSize?: number
}
```

#### 2. Data Type Definitions

```typescript
// Unified segment data structure
interface SegmentData {
  id: string | number
  position: ClockPosition // 1-12 or angular
  category: CategoryData
  value: number | TimeValue
  state: SegmentState
  visual: VisualConfig
}

interface CategoryData {
  id: number
  name: string
  slug: string
  color: string
  icon: string
  clockPosition?: number // 1-12, maps to CLOCK_POSITIONS
}

interface TimeValue {
  planned?: number
  actual?: number
  percentage?: number
}

type SegmentState = 
  | 'empty' 
  | 'planned' 
  | 'active' 
  | 'completed' 
  | 'partially-complete'
  | 'overflowing'

interface VisualConfig {
  fillOpacity: number
  strokeWidth: number
  strokeDashArray?: string
  pulsing?: boolean
}
```

#### 3. Mode-Specific Implementations

##### Completion Mode (Dashboard replacement)
- Maps boolean completion to 0%/100% values
- Shows resonance dots when `showResonance=true`
- Center displays overall completion percentage

##### Time Distribution Mode (My Day replacement)
- Maps time minutes to percentage-based segments
- Visual states show planning progression
- Center displays total time (e.g., "6h 30m")
- Supports timer integration with pulsing segments

##### Clock Planning Mode (New)
- Time blocks positioned at specific clock hours
- Segments represent scheduled time slots
- Center shows current time or focused block
- Supports drag-and-drop time allocation

##### Hybrid Mode (Advanced)
- Combines completion status with time data
- Dual-layer visualization (inner completion, outer time)
- Center content toggles between modes

### Clock Position System Integration

#### Category to Clock Mapping
```typescript
const CATEGORY_CLOCK_POSITIONS = {
  physical: 12,    // 12 o'clock - Morning energy/workout time
  mental: 2,       // 2 o'clock - Afternoon learning/work
  emotional: 4,    // 4 o'clock - Mid-afternoon reflection
  social: 6,       // 6 o'clock - Evening social time
  spiritual: 8,    // 8 o'clock - Evening meditation/reflection  
  material: 10     // 10 o'clock - Late night planning/finances
}
```

#### Hour-Based Time Blocks
For time-based visualization, segments can represent actual time periods:
- Segment width = allocated time duration
- Segment position = scheduled time slot
- Visual density = actual vs planned time

### Component Architecture

#### Core Rendering Engine

```typescript
// Core/HexagonRenderer.tsx
interface HexagonRendererProps {
  segments: SegmentData[]
  size: number
  centerContent?: React.ReactNode
  clockReference?: boolean
  interactive?: boolean
  onSegmentClick?: (segment: SegmentData) => void
}
```

#### Specialized Processors

```typescript
// Processors/CompletionProcessor.ts
class CompletionProcessor implements DataProcessor {
  process(input: CompletionData): SegmentData[]
}

// Processors/TimeDistributionProcessor.ts  
class TimeDistributionProcessor implements DataProcessor {
  process(input: TimeDistributionData): SegmentData[]
}

// Processors/ClockPlanningProcessor.ts
class ClockPlanningProcessor implements DataProcessor {
  process(input: ClockPlanningData): SegmentData[]
}
```

#### Animation System

```typescript
// Animation/HexagonAnimations.ts
export const animations = {
  progressiveReveal: (segments: SegmentData[], delay: number) => MotionProps,
  resonancePulse: (resonanceData: ResonanceData) => MotionProps,
  timerPulse: (activeSegment: SegmentData) => MotionProps,
  segmentUpdate: (oldValue: number, newValue: number) => MotionProps
}
```

### Migration Strategy

#### Phase 1: Core Infrastructure (Week 1)
1. Create `HexagonClock.tsx` master component
2. Implement core rendering engine (`HexagonRenderer.tsx`)
3. Define unified data interfaces
4. Create clock position mapping system

#### Phase 2: Mode Implementation (Week 2)
1. Implement completion mode (Dashboard compatibility)
2. Implement time distribution mode (My Day compatibility)  
3. Create data processors for each mode
4. Add responsive sizing system

#### Phase 3: Feature Integration (Week 3)
1. Port resonance system from existing component
2. Add timer integration for active states
3. Implement animation system
4. Add clock reference indicators

#### Phase 4: Migration & Testing (Week 4)
1. Replace `HexagonChartWithResonance` in Dashboard
2. Replace `TimeBlockHexagon` in My Day
3. Update all integration points
4. Performance testing and optimization
5. Mobile/responsive testing

#### Phase 5: Enhancement (Week 5)
1. Implement new clock planning mode
2. Add hybrid mode capabilities
3. Enhanced time block visualization
4. Advanced animation features

### File Organization

```
components/
├── hexagon-clock/
│   ├── HexagonClock.tsx              # Master component
│   ├── core/
│   │   ├── HexagonRenderer.tsx       # Core SVG renderer
│   │   ├── SegmentRenderer.tsx       # Individual segment rendering
│   │   └── CenterRenderer.tsx        # Center content renderer
│   ├── processors/
│   │   ├── CompletionProcessor.ts    # Dashboard mode logic
│   │   ├── TimeDistributionProcessor.ts # My Day mode logic
│   │   └── ClockPlanningProcessor.ts # New planning mode logic
│   ├── animations/
│   │   ├── HexagonAnimations.ts      # Animation definitions
│   │   └── MotionVariants.ts         # Framer Motion variants
│   ├── hooks/
│   │   ├── useHexagonClock.ts        # Main hook
│   │   ├── useClockPosition.ts       # Position calculations
│   │   └── useResponsiveSize.ts      # Size calculations
│   └── types/
│       ├── HexagonTypes.ts           # Core type definitions
│       └── DataTypes.ts              # Data structure types
```

### Props Interface Design

#### Backward Compatibility Layer

```typescript
// For Dashboard replacement
interface CompletionModeProps {
  data: {
    physical: number
    mental: number
    emotional: number
    social: number
    spiritual: number  
    material: number
  }
  size?: number
  animate?: boolean
  showResonance?: boolean
  onToggleAxis?: (id: string | number) => void
  isToggling?: boolean
  axes?: AxisData[]
}

// For My Day replacement
interface TimeDistributionModeProps {
  distribution: TimeDistribution[]
  categories: CategoryData[]
  onCategoryClick?: (category: CategoryData) => void
  activeTimer?: TimerData
}

// Unified component automatically detects mode based on props
<HexagonClock {...completionModeProps} />  // Auto-detects completion mode
<HexagonClock {...timeDistributionModeProps} />  // Auto-detects time mode
<HexagonClock mode="clock-planning" {...clockPlanningProps} />  // Explicit mode
```

### Performance Optimization

#### Memoization Strategy
- Memoize segment calculations based on data changes
- Memoize animation variants
- Memoize responsive size calculations
- Use React.memo for sub-components

#### Rendering Optimization  
- Virtual segment rendering for complex time data
- Batch animation updates
- Lazy load resonance data
- Optimize SVG path calculations

### Testing Strategy

#### Unit Tests
- Data processor accuracy
- Clock position calculations
- Responsive sizing logic
- Animation timing

#### Integration Tests  
- Dashboard replacement functionality
- My Day replacement functionality
- Cross-mode compatibility
- Props interface compatibility

#### Visual Regression Tests
- Screenshot comparisons for all modes
- Mobile responsive layouts
- Animation frame testing
- Color scheme variations

### Migration Checklist

#### Pre-Migration
- [ ] Create unified component architecture
- [ ] Implement completion mode with full compatibility
- [ ] Implement time distribution mode with full compatibility
- [ ] Test responsive behavior matches existing components
- [ ] Verify animation performance matches current system

#### Migration Execution
- [ ] Update Dashboard page to use `HexagonClock` in completion mode
- [ ] Update My Day page to use `HexagonClock` in time distribution mode
- [ ] Update all import statements across codebase
- [ ] Update type definitions and interfaces
- [ ] Update test files to reference new component

#### Post-Migration
- [ ] Delete old component files
- [ ] Update documentation and README
- [ ] Performance audit and optimization
- [ ] User acceptance testing
- [ ] Monitor for regression issues

### Future Enhancements

#### Clock Planning Mode Features
- Drag-and-drop time slot allocation
- Visual time conflict detection  
- Automatic time optimization suggestions
- Integration with calendar systems

#### Advanced Visualizations
- Multi-day time patterns
- Trend analysis over weeks/months
- Goal vs actual time comparison
- Predictive time allocation

#### Community Features
- Shared time patterns within categories
- Community challenges for time allocation
- Time-based achievements and streaks
- Social time accountability features

### Technical Specifications

#### Performance Requirements
- **Initial Render**: < 100ms for all modes
- **Animation Frame Rate**: 60fps for all transitions
- **Memory Usage**: < 5MB for component tree
- **Bundle Size**: < 50KB additional weight vs current components

#### Browser Support
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Desktop**: Chrome 90+, Safari 14+, Firefox 88+
- **Responsive**: 320px - 4K+ screen sizes
- **Touch**: Full touch gesture support

#### Accessibility
- **ARIA**: Full screen reader support
- **Keyboard**: Complete keyboard navigation
- **Color**: WCAG 2.1 AA color contrast
- **Motion**: Respects `prefers-reduced-motion`

This architecture provides a solid foundation for unifying the hexagon visualization system while introducing the clock concept and maintaining backward compatibility. The modular design allows for easy extension and future enhancements while optimizing performance and user experience.