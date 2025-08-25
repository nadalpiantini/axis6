# CLAUDE.md - AXIS6 MVP

## Quick Start
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase keys

# Run development server
npm run dev

# Open browser
http://localhost:6789
```

## Project Overview
AXIS6 is a gamified wellness tracker that helps users maintain balance across 6 life dimensions: Physical, Mental, Emotional, Social, Spiritual, and Material. Built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel (axis6.app)
- **DNS/CDN**: Cloudflare
- **Email**: Resend (pending integration)
- **UI Components**: Custom hexagon visualization, Lucide icons
- **Charts**: Recharts for analytics
- **Testing**: Playwright (E2E), Jest (Unit)

## Development Commands
```bash
# Core Development
npm run dev          # Start development server on http://localhost:6789
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Testing
npm run test         # Run unit tests
npm run test:auth    # Test authentication flow
npm run test:performance # Test database performance
npm run verify:supabase # Verify Supabase configuration

# Setup & Configuration
npm run setup:all    # Complete project setup
npm run setup:dns    # Configure DNS records in Cloudflare
npm run setup:vercel # Configure Vercel deployment
npm run setup:resend # Configure Resend email (pending)
npm run setup:check  # Check all services status

# Database
npm run db:migrate   # Run Supabase migrations
npm run db:optimize  # Deploy performance indexes
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
- `axis6_categories` - The 6 life dimensions (Physical, Mental, Emotional, Social, Spiritual, Material)
- `axis6_checkins` - Daily check-ins per category (completed_at DATE, mood INT, notes TEXT)
- `axis6_streaks` - Streak tracking per category (current_streak, longest_streak, last_checkin)
- `axis6_daily_stats` - Pre-calculated daily statistics (completion_rate, categories_completed, total_mood)
- `axis6_mantras` - Daily mantras feature (content JSONB, author, is_active)
- `axis6_user_mantras` - User mantra history

### Database Performance
- **25+ custom indexes** for optimized queries
- **RPC Functions**: `get_dashboard_data_optimized`, `axis6_calculate_streak_optimized`, `get_weekly_stats`
- **Performance metrics view**: `dashboard_performance_metrics`
- All indexes deployed via `manual_performance_indexes.sql`

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
- **Slogan**: "Six axes. One you. Don't break your Axis."
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
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://nvpnhqhjttgwfwvkgmpk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:6789  # or https://axis6.app in production
NODE_ENV=development

# Infrastructure (Production)
VERCEL_TOKEN=your_vercel_token
VERCEL_TEAM_ID=team_seGJ6iISQxrrc5YlXeRfkltH
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ACCOUNT_ID=69d3a8e7263adc6d6972e5ed7ffc6f2a

# Email (Pending)
# RESEND_API_KEY=re_your_key_here
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
- **CSP Note**: Content Security Policy temporarily disabled in next.config.js to resolve inline styles/scripts blocking. TODO: Implement hash-based CSP for better security

## Performance Optimizations
- Server Components for initial page load
- Client-side caching with React Query
- Optimistic UI updates for better UX
- Image optimization with Next.js Image component
- **Database Performance**: 25+ custom indexes deployed for 70% faster queries
- **Optimized RPC Functions**: Single-query dashboard loads replacing N+1 patterns
- **Incremental Streak Calculations**: 80% faster streak updates
- **Connection Pooling**: Optimized Supabase connection management

## Testing Strategy
- Unit tests for utility functions
- Component testing with React Testing Library
- E2E tests with Playwright (configured)
- API route testing with Jest
- Authentication flow testing (`npm run test:auth`)
- Database performance testing (`npm run test:performance`)
- Supabase configuration verification (`npm run verify:supabase`)

## Deployment & Infrastructure
- **Hosting**: Vercel (automatic deployment on push to main)
- **Primary Domain**: axis6.app
- **Secondary Domain**: axis6.sujeto10.com
- **DNS Management**: Cloudflare (for DNS records only, configured with `npm run setup:dns`)
- **Database**: Supabase cloud (nvpnhqhjttgwfwvkgmpk.supabase.co)
- **Environment Variables**: Configured in Vercel dashboard
- **SSL**: Automatic via Vercel

## Known Issues & Workarounds
1. **CSP Temporarily Disabled**: Content Security Policy is commented out in next.config.js due to conflicts with inline styles/scripts from Next.js and Supabase Auth. TODO: Implement hash-based CSP.
2. **Email Service**: Resend integration pending - currently using Supabase's default email service
3. **PWA**: Temporarily disabled for Next.js 15 compatibility

## Important Files & Scripts
### Configuration Files
- `next.config.js` - Next.js config with CSP settings (currently commented)
- `middleware.ts` - Auth middleware and security headers
- `.env.local` - Local environment variables
- `.env.production.example` - Production environment template

### Database Files
- `manual_performance_indexes.sql` - Performance indexes to deploy
- `supabase/migrations/` - Database schema migrations
- `scripts/verify-supabase-config.js` - Verify Supabase setup

### Setup Scripts
- `scripts/setup-all.js` - Complete project setup automation
- `scripts/configure-dns.js` - DNS records configuration (Cloudflare DNS management)
- `scripts/configure-vercel.js` - Vercel deployment setup
- `scripts/check-status.js` - Check all services status

### Documentation
- `docs/csp-fix-complete-guide.md` - CSP issues and solutions
- `docs/supabase-dashboard-settings.md` - Supabase configuration guide
- `docs/database-performance-optimization.md` - DB optimization details
- `docs/application-integration-guide.md` - Optimized queries integration