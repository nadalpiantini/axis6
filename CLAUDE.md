# CLAUDE.md - AXIS6 MVP

## Project Overview
AXIS6 is a gamified wellness tracker that helps users maintain balance across 6 life dimensions: Physical, Mental, Emotional, Social, Spiritual, and Material. Built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel (axis6.app)
- **UI Components**: Custom hexagon visualization, Lucide icons
- **Charts**: Recharts for analytics

## Development Commands
```bash
npm run dev          # Start development server on http://localhost:6789
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests (when configured)
```

## IMPORTANT: Development URL
**ALWAYS use http://localhost:6789 for development** - The project is configured to run on port 6789, not the default 3000.

## Project Structure
```
axis6-mvp/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Protected routes (dashboard, settings, stats)
│   ├── auth/              # Authentication pages (login, register)
│   ├── api/               # API routes
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # Base UI components
│   ├── axis/              # AXIS6-specific components
│   └── layout/            # Layout components
├── lib/
│   ├── supabase/          # Supabase client and helpers
│   ├── utils/             # Utility functions
│   └── hooks/             # Custom React hooks
└── supabase/
    └── migrations/        # Database migrations
```

## Database Schema (Supabase)
All tables use the prefix `axis6_` for multi-tenant isolation:
- `axis6_profiles` - User profiles extending Supabase Auth
- `axis6_categories` - The 6 life dimensions
- `axis6_checkins` - Daily check-ins per category
- `axis6_streaks` - Streak tracking per category
- `axis6_daily_stats` - Pre-calculated daily statistics

## Key Features
1. **User Authentication**: Email/password with Supabase Auth
2. **Daily Check-ins**: Mark completion for each of 6 categories
3. **Hexagon Visualization**: Interactive SVG showing daily progress
4. **Streak Tracking**: Automatic calculation of current and longest streaks
5. **Analytics Dashboard**: Personal insights and progress tracking
6. **Mobile Responsive**: Optimized for all devices
7. **Dark Theme**: Navy-based color scheme from design system

## 🎨 AXIS6 Brand & UI Kit (v1)

### Brand Identity
- **Slogan**: "Seis ejes. Un solo tú. No rompas tu Axis."
- **Logo**: Circular segmented design with 6 phases
- **Philosophy**: Balance between introspection and dynamism

### Color Palette
| Eje | Color Base | Hex | Usage |
|-----|------------|-----|--------|
| **Físico** | Verde Lima | #A6C26F | Exercise, health, nutrition |
| **Mental** | Azul Petróleo | #365D63 | Learning, productivity |
| **Emocional** | Coral Profundo | #D36C50 | Mood, stress management |
| **Social** | Ciruela | #6F3D56 | Relationships, connections |
| **Espiritual** | Azul Medianoche | #2C3E50 | Meditation, purpose |
| **Propósito** | Naranja Tierra | #C85729 | Goals, achievements |
| **Neutrales** | Marfil / Arena | #F2E9DC / #E0D2BD | Backgrounds, cards |

### Typography System
- **Headlines/Brand**: Serif font (Playfair Display or similar) - Elegant, classic
- **UI Text**: Sans-serif (Inter, Satoshi) - Modern, geometric
- **Body/Journaling**: High-legibility sans-serif with proper line height
- **Micro-text**: Optimized for small sizes (12px minimum)

### Iconography
- **Style**: Minimalist linear icons
- **Weight**: Consistent 2px stroke
- **Geometry**: Based on circular grid
- **Symbols**: Abstract representations for each axis
  - Físico: Flowing lines (movement)
  - Mental: Geometric brain pattern
  - Emocional: Heart with energy waves
  - Social: Connected dots
  - Espiritual: Mandala pattern
  - Propósito: Target with arrow

### Visual Elements
- **Textures**: Soft gradients, noise overlays
- **Shapes**: Flowing curves for streaks, concentric circles for progress
- **Patterns**: Half-moon shapes, organic waves
- **Effects**: Subtle shadows, glass morphism on light backgrounds

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## Development Workflow
1. Make changes in feature branches
2. Test locally with `npm run dev`
3. Build with `npm run build` to check for errors
4. Deploy to Vercel with push to main branch

## API Routes
- `/api/checkins` - CRUD for daily check-ins
- `/api/streaks` - Get streak information
- `/api/analytics` - Fetch user analytics

## Security Considerations
- Row Level Security (RLS) enabled on all Supabase tables
- Users can only access their own data
- API routes protected with authentication middleware
- Environment variables for sensitive configuration

## Performance Optimizations
- Server Components for initial page load
- Client-side caching with React Query (when implemented)
- Optimistic UI updates for better UX
- Image optimization with Next.js Image component

## Testing Strategy
- Unit tests for utility functions
- Component testing with React Testing Library
- E2E tests with Playwright (planned)
- API route testing with Jest

## Deployment
- Automatic deployment to Vercel on push to main
- Custom domain: axis6.sujeto10.com
- Environment variables configured in Vercel dashboard
- Database hosted on Supabase cloud