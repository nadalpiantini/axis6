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