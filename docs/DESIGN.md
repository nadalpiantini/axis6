# AXIS6 Design System

## Visual Identity
**Concept**: Minimalist wellness tracker with soft-futurism aesthetic. Digital zen meets gamification.

## Color Palette

### Base Colors (Dark Theme)
```css
/* Background layers */
--navy-950: #0A0E1A;     /* Main background */
--navy-900: #1A1F36;     /* Card background */
--navy-800: #2A3352;     /* Elevated surfaces */
--navy-700: #3A4468;     /* Borders/dividers */

/* Text colors */
--text-primary: #E7E9EE;    /* Main text */
--text-secondary: #9CA3AF;  /* Secondary text */
--text-muted: #6B7280;      /* Muted/disabled */
```

### Category Colors (The 6 Axes)
```css
/* Each axis has its unique identity */
--physical: #65D39A;     /* Teal - Energy, vitality */
--mental: #9B8AE6;       /* Lavender - Clarity, focus */
--emotional: #FF8B7D;    /* Coral - Warmth, feeling */
--social: #6AA6FF;       /* Sky Blue - Connection */
--spiritual: #4ECDC4;    /* Turquoise - Inner peace */
--material: #FFD166;     /* Soft Yellow - Abundance */
```

### Semantic Colors
```css
/* Status and feedback */
--success: #65D39A;      /* Positive actions */
--warning: #FFD166;      /* Attention needed */
--error: #FF8B7D;        /* Errors/issues */
--info: #6AA6FF;         /* Information */
```

## Typography

### Font Family
```css
font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale
```css
/* Headings */
--text-4xl: 2.5rem;      /* 40px - Hero */
--text-3xl: 2rem;        /* 32px - Page title */
--text-2xl: 1.5rem;      /* 24px - Section */
--text-xl: 1.25rem;      /* 20px - Subsection */
--text-lg: 1.125rem;     /* 18px - Large body */

/* Body */
--text-base: 1rem;       /* 16px - Default */
--text-sm: 0.875rem;     /* 14px - Small */
--text-xs: 0.75rem;      /* 12px - Caption */

/* Font weights */
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System
```css
/* 8px base unit */
--space-0: 0;
--space-1: 0.25rem;      /* 4px */
--space-2: 0.5rem;       /* 8px */
--space-3: 0.75rem;      /* 12px */
--space-4: 1rem;         /* 16px */
--space-5: 1.25rem;      /* 20px */
--space-6: 1.5rem;       /* 24px */
--space-8: 2rem;         /* 32px */
--space-10: 2.5rem;      /* 40px */
--space-12: 3rem;        /* 48px */
--space-16: 4rem;        /* 64px */
```

## Components

### Cards
```css
.card {
  background: var(--navy-900);
  border: 1px solid var(--navy-700);
  border-radius: 12px;
  padding: var(--space-6);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.card-hover {
  transition: all 0.2s ease;
  cursor: pointer;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3);
  border-color: var(--navy-600);
}
```

### Buttons
```css
.button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: var(--space-3) var(--space-5);
}

.button-primary {
  background: linear-gradient(135deg, #4ECDC4, #65D39A);
  color: var(--navy-950);
}

.button-secondary {
  background: var(--navy-800);
  color: var(--text-primary);
  border: 1px solid var(--navy-700);
}

.button-ghost {
  background: transparent;
  color: var(--text-secondary);
}
```

### Hexagon Component
```css
/* Core hexagon visualization */
.hexagon-container {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
}

.hexagon-segment {
  fill: var(--navy-800);
  stroke: var(--navy-700);
  stroke-width: 2;
  transition: all 0.3s ease;
  cursor: pointer;
}

.hexagon-segment.active {
  fill: var(--category-color);
  filter: drop-shadow(0 0 20px var(--category-color));
}

.hexagon-segment:hover {
  transform: scale(1.05);
  transform-origin: center;
}
```

## Animation & Motion

### Timing Functions
```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Micro-interactions
```css
/* Completion animation */
@keyframes celebrate {
  0% { transform: scale(1) rotate(0); }
  50% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0); }
}

/* Pulse for streaks */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Confetti burst */
@keyframes confetti {
  0% { transform: translateY(0) rotate(0); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
```

## Iconography
- **Style**: Line icons with 2px stroke
- **Size**: 20px (default), 16px (small), 24px (large)
- **Library**: Lucide React icons
- **Custom**: Hexagon shape for brand identity

## Mobile Design

### Breakpoints
```css
--mobile: 640px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1280px;
```

### Touch Targets
- Minimum size: 44x44px
- Spacing between targets: 8px minimum
- Clear visual feedback on touch

### Mobile-First Approach
```css
/* Base mobile styles */
.container {
  padding: var(--space-4);
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

## Dark Mode (Default)
The app uses dark mode by default for:
- Better focus on colorful categories
- Reduced eye strain
- Modern aesthetic
- Battery efficiency on OLED screens

## Accessibility

### Color Contrast
- Text on background: minimum 4.5:1 ratio
- Interactive elements: minimum 3:1 ratio
- Focus indicators: visible outline

### Focus States
```css
.focusable:focus-visible {
  outline: 2px solid var(--info);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Screen Reader Support
- Semantic HTML structure
- ARIA labels for interactive elements
- Descriptive alt text for images
- Keyboard navigation support

## Brand Voice
- **Encouraging**: "Great job! Your axis glows"
- **Simple**: "Tap to complete"
- **Motivating**: "16 days streak!"
- **Personal**: "Your balance, your way"

## Visual Examples

### Loading States
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--navy-800) 25%,
    var(--navy-700) 50%,
    var(--navy-800) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Success States
- Confetti animation on all 6 complete
- Glow effect on active categories
- Smooth color transitions
- Celebratory messages

## Implementation Notes
1. Use CSS variables for all colors
2. Implement smooth transitions (0.2-0.3s)
3. Maintain 60fps for animations
4. Test on real devices for touch feedback
5. Ensure text remains readable at all sizes

---

# AXIS6 Dashboard UI - Current Implementation (PRESERVED)

## Current Dashboard Layout
The dashboard is perfect as-is with its clean, minimalist design. This section documents the exact current implementation to preserve what works.

### Header Component
```typescript
// Current implementation - TO BE PRESERVED
<header className="glass border-b border-white/10">
  <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        AXIS6  <!-- TO BE REPLACED WITH: <LogoIcon size="md" /> -->
      </h1>
      <div className="flex items-center gap-2 text-sm">
        <Flame className="w-4 h-4 text-orange-400" />
        <span className="text-gray-300">Streak: {currentStreak} days</span>
      </div>
    </div>
  </div>
</header>
```

### Hexagon Visualization (KEEP EXACTLY AS IS)
The hexagon is the heart of the app. Current implementation:
- 300x300 SVG viewBox
- 6 category nodes at hexagon vertices
- Glass morphism effects
- Animated completion states
- Click/tap to toggle completion

```css
/* Current hexagon styles - DO NOT CHANGE */
.hexagon-node {
  r: 25px;
  fill: completed ? category.color : 'rgba(255,255,255,0.1)';
  cursor: pointer;
  transition: all 0.3s ease;
}
```

### Category Cards (PRESERVE CURRENT DESIGN)
```typescript
// Current category card implementation
<motion.button className={`p-4 rounded-xl transition-all min-h-[56px] ${
  axis.completed 
    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30' 
    : 'bg-white/5 hover:bg-white/10 border-white/10'
} border`}>
```

---

# AXIS6 Subtask Enhancement Design (NEW FEATURES)

## Overview
Add task management capabilities while maintaining the clean, minimalist aesthetic. All new features should be subtle and non-intrusive.

## 1. Logo Integration

### Header Logo Update
```typescript
// Replace text "AXIS6" with logo component
import { LogoIcon } from '@/components/ui/Logo'

<div className="flex items-center gap-4">
  <LogoIcon size="md" className="w-10 h-10" />
  <div className="flex items-center gap-2 text-sm">
    <Flame className="w-4 h-4 text-orange-400" />
    <span className="text-gray-300">Streak: {currentStreak} days</span>
  </div>
</div>
```

## 2. Subtask UI Components

### Corner Action Buttons (Subtle Enhancement)
Add tiny action buttons to hexagon nodes without disrupting the clean design:

```css
.hexagon-action-button {
  position: absolute;
  width: 16px;
  height: 16px;
  top: -8px;
  right: -8px;
  
  /* Glass morphism style */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  
  /* Hidden by default */
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;
  
  /* Show on hover */
  .hexagon-node:hover & {
    opacity: 1;
    transform: scale(1);
  }
}

.hexagon-action-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}
```

### Task Drawer Component
Slide-out panel from the right side:

```typescript
interface TaskDrawerProps {
  category: Category
  isOpen: boolean
  onClose: () => void
}

// Visual specifications
const TaskDrawer = {
  width: '400px',
  background: 'glass effect matching current cards',
  slideFrom: 'right',
  overlay: 'rgba(0, 0, 0, 0.4)',
  animation: 'slide-in 0.3s ease-out'
}
```

## 3. Database Schema for Tasks

### New Tables
```sql
-- Tasks table for all categories
CREATE TABLE axis6_tasks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES axis6_profiles(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES axis6_categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  priority INT DEFAULT 0, -- 0: low, 1: medium, 2: high
  contact_id INT REFERENCES axis6_contacts(id), -- For social tasks
  metadata JSONB, -- Store genre, book title, exercise type, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts for social tasks
CREATE TABLE axis6_contacts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES axis6_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  last_interaction DATE,
  interaction_count INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task templates for quick suggestions
CREATE TABLE axis6_task_templates (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES axis6_categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  suggested_metadata JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_user_category ON axis6_tasks(user_id, category_id);
CREATE INDEX idx_tasks_completed ON axis6_tasks(user_id, completed);
CREATE INDEX idx_contacts_user ON axis6_contacts(user_id);
```

## 4. Task Management by Category

### Physical Tasks
```typescript
interface PhysicalTask {
  type: 'exercise' | 'nutrition' | 'health'
  routine?: string
  duration?: number
  calories?: number
}

// Example tasks:
// - "30 min morning run"
// - "Drink 8 glasses of water"
// - "Annual check-up appointment"
```

### Mental Tasks
```typescript
interface MentalTask {
  type: 'learning' | 'reading' | 'skill'
  bookTitle?: string
  genre?: string
  course?: string
  progress?: number
}

// Example tasks:
// - "Read 'Atomic Habits' - Chapter 3"
// - "Complete JavaScript course module"
// - "Practice Spanish 15 minutes"
```

### Emotional Tasks
```typescript
interface EmotionalTask {
  type: 'journal' | 'meditation' | 'gratitude'
  mood?: 1-5
  duration?: number
}

// Example tasks:
// - "Evening gratitude journal"
// - "10-minute breathing exercise"
// - "Call therapist"
```

### Social Tasks
```typescript
interface SocialTask {
  type: 'contact' | 'event' | 'quality-time'
  contactId?: number
  contactName?: string
  lastContact?: Date
}

// Example tasks:
// - "Call Mom"
// - "Coffee with Sarah"
// - "Team lunch Friday"
```

### Spiritual Tasks
```typescript
interface SpiritualTask {
  type: 'meditation' | 'reflection' | 'practice'
  practice?: string
  duration?: number
}

// Example tasks:
// - "Morning meditation"
// - "Purpose reflection journal"
// - "Yoga practice"
```

### Material Tasks
```typescript
interface MaterialTask {
  type: 'financial' | 'career' | 'resource'
  amount?: number
  deadline?: Date
}

// Example tasks:
// - "Review monthly budget"
// - "Update portfolio"
// - "Apply for promotion"
```

## 5. User Interaction Flows

### Adding a Task
1. Hover over hexagon node → See subtle "+" button
2. Click "+" → Opens task drawer from right
3. Quick add with smart suggestions
4. Auto-categorization based on keywords
5. Save → Drawer closes, small success animation

### Completing Tasks
```typescript
// Swipe gesture for mobile
onSwipeRight: () => markComplete()

// Click checkbox for desktop
onClick: () => toggleComplete()

// Bulk actions
longPress: () => enterSelectionMode()
```

### Task Suggestions (AI-Powered)
```typescript
interface TaskSuggestion {
  getRecommendations(category: string, history: Task[]): string[]
  analyzePatterns(tasks: Task[]): InsightReport
  generateTimeBlocks(tasks: Task[]): TimeBlock[]
}
```

## 6. Monthly Wrapped Feature

### Social Wrapped
```typescript
interface SocialWrapped {
  topContacts: Contact[] // Top 5 most contacted
  totalInteractions: number
  newConnections: number
  qualityTime: number // hours spent
  visualization: 'network-graph'
}
```

### Mental Wrapped
```typescript
interface MentalWrapped {
  booksRead: number
  favoriteGenres: string[]
  learningHours: number
  topSkills: string[]
  visualization: 'progress-chart'
}
```

## 7. Visual Design Principles for Tasks

### Maintain Minimalism
- Tasks hidden by default
- Show only on intentional interaction
- Use existing color palette
- Glass morphism for all overlays

### Micro-interactions
```css
/* Task completion animation */
@keyframes task-complete {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); }
  100% { transform: scale(0); opacity: 0; }
}

/* Drawer slide */
@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

### Progressive Disclosure
1. Level 1: Just the hexagon (current state)
2. Level 2: Hover shows "+" button
3. Level 3: Click opens task drawer
4. Level 4: Advanced features in settings

## 8. Implementation Phases

### Phase 1: Basic Task CRUD (Week 1)
- Database schema
- API endpoints
- Basic task drawer
- Add/complete tasks

### Phase 2: Smart Features (Week 2)
- Contact management
- Task suggestions
- Quick add shortcuts
- Swipe gestures

### Phase 3: Analytics (Week 3)
- Monthly wrapped
- Time tracking
- Pattern analysis
- Insights dashboard

### Phase 4: AI Integration (Week 4)
- Smart suggestions
- Auto-categorization
- Time block generation
- Natural language input

## 9. Performance Considerations

### Optimization Strategies
- Lazy load task drawer component
- Virtual scrolling for long task lists
- Debounce search/filter operations
- Cache frequently accessed data
- Optimistic UI updates

### Database Indexes
```sql
-- Optimize common queries
CREATE INDEX idx_tasks_due_date ON axis6_tasks(user_id, due_date) WHERE completed = FALSE;
CREATE INDEX idx_tasks_search ON axis6_tasks USING gin(title gin_trgm_ops);
CREATE INDEX idx_contacts_search ON axis6_contacts USING gin(name gin_trgm_ops);
```

## 10. Accessibility for Tasks

### Keyboard Navigation
- Tab: Navigate between tasks
- Space/Enter: Toggle completion
- Escape: Close drawer
- Ctrl+N: Quick add task
- Arrow keys: Navigate in drawer

### Screen Reader Support
```html
<div role="complementary" aria-label="Task management drawer">
  <h2 id="task-drawer-title">Physical Tasks</h2>
  <ul role="list" aria-labelledby="task-drawer-title">
    <li role="listitem">
      <button role="checkbox" aria-checked="false">
        Morning run
      </button>
    </li>
  </ul>
</div>
```

## Implementation Notes
1. All new features must be additive, not destructive
2. Preserve current UI exactly as users love it
3. New elements should feel native to existing design
4. Performance must not degrade with task features
5. Mobile-first approach for all new components