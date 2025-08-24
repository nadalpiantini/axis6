# AXIS6 Visual Identity & Brand Guidelines

## Brand Philosophy
**Core Message**: "Six axes. One you. Don't break your Axis."
**Mission**: Transform lives by achieving perfect balance across 6 essential life dimensions
**Personality**: Balance between introspection and dynamism - sophisticated yet approachable

## Logo & Brand Mark
- **Current State**: Text-based "AXIS6" wordmark
- **Future Development**: Circular segmented design with 6 phases (to be designed)
- **Usage**: Maintain clean, geometric approach that reflects the hexagonal balance concept

---

## Color System

### Primary Axis Colors
Each dimension has its unique color identity, carefully selected for psychological resonance:

| Dimension | Color Name | Hex Code | RGB | Usage & Meaning |
|-----------|------------|----------|-----|-----------------|
| **Physical** | Warm Terracotta | `#D4845C` | rgb(212, 132, 92) | Exercise, health, nutrition - earthy vitality |
| **Mental** | Sage Blue | `#8B9DC3` | rgb(139, 157, 195) | Learning, productivity - calm focus |
| **Emotional** | Light Lavender | `#B8A4C9` | rgb(184, 164, 201) | Mood, stress management - gentle healing |
| **Social** | Warm Sand | `#C9A88F` | rgb(201, 168, 143) | Relationships, connections - human warmth |
| **Spiritual** | Soft Purple | `#9B8AE6` | rgb(155, 138, 230) | Meditation, purpose - transcendent peace |
| **Material** | Muted Gold | `#D4A574` | rgb(212, 165, 116) | Goals, achievements - grounded success |

### Neutral Foundation
| Tone | Hex Code | Usage |
|------|----------|-------|
| **Marfil** | `#F2E9DC` | Light backgrounds, cards |
| **Arena** | `#E0D2BD` | Secondary backgrounds |
| **Slate Spectrum** | `#F4F4F5` - `#09090B` | Full grayscale range for text and UI elements |

### Semantic Colors
- **Success**: `#10B981` (Emerald) - Achievements, completed streaks
- **Warning**: `#F59E0B` (Amber) - Attention needed
- **Error**: `#EF4444` (Red) - Issues, broken streaks
- **Info**: `#3B82F6` (Blue) - Informational content

### Glass Morphism Effects
- **Light**: `rgba(255, 255, 255, 0.05)` - Subtle overlay
- **Medium**: `rgba(255, 255, 255, 0.1)` - Card backgrounds
- **Dark**: `rgba(0, 0, 0, 0.2)` - Shadow elements

---

## Typography

### Font Hierarchy
1. **Brand/Headlines**: Serif font family (Playfair Display preferred)
   - Elegant, classic personality
   - Use for main headings, brand elements
   - Weights: 400 (Regular), 600 (SemiBold), 700 (Bold)

2. **UI Text**: Sans-serif (Inter primary)
   - Modern, geometric, highly legible
   - Use for interface elements, navigation, buttons
   - Weights: 300 (Light) to 700 (Bold)

3. **Body/Reading**: High-legibility sans-serif with optimized line height
   - Same as UI text but with increased line spacing
   - For descriptions, content blocks

4. **Code/Technical**: Monospace (Fira Code)
   - For technical elements, IDs, codes

### Size Scale
- **xs**: 12px - Micro-text, minimum readable size
- **sm**: 14px - Small labels, captions
- **base**: 16px - Body text baseline
- **lg**: 18px - Emphasized body text
- **xl**: 20px - Small headings
- **2xl**: 24px - Section headings
- **3xl**: 30px - Page headings
- **4xl**: 36px - Hero headings
- **5xl**: 48px - Brand statements

---

## Iconography

### Design Principles
- **Style**: Minimalist linear icons with consistent 2px stroke weight
- **Grid System**: Based on 24x24px circular grid
- **Visual Language**: Clean, geometric, universally recognizable

### Axis Icons (Custom Designed)
Each dimension has both a Lucide fallback and custom animated version:

1. **Physical**: `Target` → Flowing lines representing movement and vitality
2. **Mental**: `Brain` → Geometric brain pattern with neural connections
3. **Emotional**: `Heart` → Heart with energy waves emanating outward
4. **Social**: `Users` → Connected dots showing human relationships
5. **Spiritual**: `Sparkles` → Star/mandala pattern for transcendence
6. **Material**: `Briefcase` → Briefcase with success indicators

### Animation Patterns
- **Physical**: Gentle vertical float (movement)
- **Mental**: Subtle rotation (thinking)
- **Emotional**: Scale pulse (heartbeat)
- **Social**: Slow orbital rotation (connections)
- **Spiritual**: Opacity breathing (meditation)
- **Material**: Minimal vertical bob (stability)

---

## Visual Elements & Effects

### Textures & Patterns
- **Soft Gradients**: Subtle transitions between related colors
- **Noise Overlays**: Light film grain for depth and sophistication
- **Half-moon Shapes**: Organic curves representing growth and balance
- **Concentric Circles**: Progress indicators and focus elements

### Shadow & Depth System
```css
/* Shadow Scale */
sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
glow: '0 0 20px rgba(155, 138, 230, 0.4)' /* Spiritual purple glow */
```

### Geometric Elements
- **Hexagonal Grid**: Foundation for all layouts and visualizations
- **6-Point Symmetry**: Reflected in component arrangements
- **Golden Ratio Proportions**: For spacing and sizing relationships

---

## Motion & Animation

### Timing Functions
- **Linear**: `linear` - For continuous rotations
- **Ease In**: `cubic-bezier(0.4, 0, 1, 1)` - For entrances
- **Ease Out**: `cubic-bezier(0, 0, 0.2, 1)` - For exits
- **Ease In-Out**: `cubic-bezier(0.4, 0, 0.2, 1)` - For state transitions
- **Bounce**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` - For celebrations

### Duration Scale
- **Fast**: 150ms - Micro-interactions
- **Base**: 250ms - Standard transitions
- **Slow**: 500ms - Complex animations
- **Slower**: 1000ms - Dramatic effects

### Animation Patterns
- **Fade In**: Opacity 0 → 1 (welcoming)
- **Slide Up**: Y-translate with fade (lifting, elevating)
- **Scale**: 0.9 → 1 (importance, attention)
- **Float**: Gentle Y-axis movement (life, breath)
- **Glow**: Opacity pulsing (energy, activation)

---

## Layout & Spacing

### Grid System
- **Base Unit**: 4px (0.25rem)
- **Content Max Width**: 1280px (80rem)
- **Breakpoints**: Mobile-first responsive design
  - xs: 475px
  - sm: 640px  
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

### Spacing Scale
Built on 4px base unit for mathematical consistency:
- **1**: 4px - Tight elements
- **2**: 8px - Close related items
- **4**: 16px - Standard spacing
- **6**: 24px - Section separation
- **8**: 32px - Major spacing
- **12**: 48px - Page sections
- **20**: 80px - Major sections

### Component Patterns
- **Cards**: Glass morphism with rounded corners (12-24px radius)
- **Buttons**: Gradient backgrounds with subtle shadows
- **Forms**: Clean inputs with purple focus states
- **Navigation**: Minimal, gesture-friendly touch targets (44px minimum)

---

## Accessibility Standards

### Color Contrast
- **Text on Background**: Minimum 4.5:1 ratio (WCAG AA)
- **Large Text**: Minimum 3:1 ratio
- **Interactive Elements**: Clear visual hierarchy and states

### Touch Targets
- **Minimum**: 44px (iOS standard)
- **Recommended**: 48px (Material Design)
- **Comfortable**: 56px (optimal for most users)

### Motion Sensitivity
- **Respect `prefers-reduced-motion`** media query
- **Provide static alternatives** for essential animated content
- **Use subtle animations** as primary design language

---

## Implementation Notes

### CSS Custom Properties
```css
:root {
  /* Axis Colors */
  --color-axis-physical: #D4845C;
  --color-axis-mental: #8B9DC3;
  --color-axis-emotional: #B8A4C9;
  --color-axis-social: #C9A88F;
  --color-axis-spiritual: #9B8AE6;
  --color-axis-material: #D4A574;
  
  /* Glass Effects */
  --glass-light: rgba(255, 255, 255, 0.05);
  --glass-medium: rgba(255, 255, 255, 0.1);
  
  /* Typography */
  --font-display: 'Playfair Display', serif;
  --font-ui: 'Inter', system-ui, sans-serif;
  
  /* Timing */
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Utility Classes
- `.glass` - Glass morphism effect
- `.axis-[color]` - Axis-specific colors
- `.animate-float` - Subtle floating animation
- `.gradient-axis-[name]` - Predefined gradients per axis

---

## Brand Asset Checklist

### Current Assets ✅
- [x] Color palette with hex codes
- [x] Typography system with font families
- [x] Icon set with custom animations
- [x] Component library (buttons, cards, forms)
- [x] Glass morphism effects
- [x] Motion system with easing functions

### Future Development 🚀
- [ ] Professional logo design (circular, 6-segment concept)
- [ ] Brand photography style guide
- [ ] Illustration style guide
- [ ] Social media templates
- [ ] Email template designs
- [ ] Marketing material templates

---

**Document Version**: 1.0  
**Last Updated**: August 2025  
**Next Review**: When logo design is ready for integration

*This visual identity system captures the current aesthetic that resonates with the brand vision while providing a solid foundation for future design evolution.*