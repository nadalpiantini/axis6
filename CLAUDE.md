# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# AXIS6 MVP

## Quick Start
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase keys

# Run development server (IMPORTANT: runs on port 6789, not 3000)
npm run dev

# Open browser
http://localhost:6789
```

## Project Overview
AXIS6 is a gamified wellness tracker that helps users maintain balance across 6 life dimensions: Physical, Mental, Emotional, Social, Spiritual, and Material. Built with Next.js 15, React 19, TypeScript, Supabase, and Tailwind CSS.

## Tech Stack
- **Frontend**: Next.js 15.4.7 (App Router), React 19.1.0, TypeScript 5.3.0
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel (axis6.app)
- **DNS/CDN**: Cloudflare
- **Email**: Resend (v6.0.1)
- **UI Components**: Radix UI primitives, custom hexagon visualization, Lucide icons
- **Charts**: Recharts for analytics
- **Testing**: Playwright (E2E), Jest (Unit)
- **State Management**: Zustand, TanStack Query (React Query)
- **Monitoring**: Sentry, Vercel Analytics

## Development Commands
```bash
# Core Development
npm run dev          # Start development server on http://localhost:6789
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run optimize:check  # Remove console logs + type check + lint

# Testing - Unit/Integration (Jest)
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
jest path/to/test.spec.ts  # Run single test file
jest --testNamePattern="test name"  # Run specific test by name

# Testing - Authentication & Database
npm run test:auth    # Test authentication flow
npm run test:performance # Test database performance
npm run test:concurrent  # Test database performance with concurrency
npm run verify:supabase  # Verify Supabase configuration

# E2E Testing (Playwright)
npm run test:e2e           # Run all E2E tests
npm run test:e2e:auth      # Test authentication flows
npm run test:e2e:dashboard # Test dashboard functionality
npm run test:e2e:performance # Performance testing
npm run test:e2e:accessibility # Accessibility testing
npm run test:e2e:security     # Security testing
npm run test:e2e:visual       # Visual regression tests
npm run test:e2e:mobile       # Mobile responsive tests
npm run test:e2e:debug        # Debug mode with browser UI

# Run specific E2E test
PLAYWRIGHT_BASE_URL=http://localhost:6789 npx playwright test tests/e2e/specific.spec.ts --headed
npx playwright test tests/e2e/auth.spec.ts --project=chromium  # Run on specific browser

# Setup & Configuration
npm run setup:all    # Complete project setup
npm run setup:dns    # Configure DNS records in Cloudflare
npm run setup:vercel # Configure Vercel deployment
npm run setup:resend # Configure Resend email (pending)
npm run setup:check  # Check all services status

# Database
npm run db:migrate   # Run Supabase migrations
npm run db:reset     # Reset database (development only)
npm run db:optimize  # Deploy performance indexes
npm run db:monitor   # View performance monitoring queries

# Production & Security
npm run production:health   # Check production health
npm run production:deploy   # Build and verify for production
npm run production:monitor  # Production monitoring dashboard
npm run security:audit      # Run security audit
npm run security:validate   # Validate security configuration

# Build & Optimization
npm run build:production    # Production build
npm run analyze            # Bundle analyzer
npm run optimize:check     # Run optimization checks (console removal + type check + lint)
```

## IMPORTANT Development Notes
- **Port Configuration**: ALWAYS use http://localhost:6789 for development - The project is configured to run on port 6789, NOT the default 3000
- **Type Safety**: TypeScript build errors are temporarily ignored (next.config.js) - TODO: fix chat route types
- **Linting**: ESLint during build is temporarily ignored - TODO: fix linting issues
- **PWA**: Currently disabled for Next.js 15 compatibility (withPWA is exported but commented)

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
2. **PWA**: Temporarily disabled for Next.js 15 compatibility  
3. **React 19 Migration**: Some third-party libraries may need compatibility updates

## Resolved Issues (Historical Reference)
### Database Schema Differences (RESOLVED 2025-08-26)
- **Issue**: `axis6_profiles` table uses `id` column as user reference while other tables use `user_id`
- **Impact**: 400/404/406 errors, profile page failures
- **Solution**: Updated queries and RLS policies to use correct column names per table
- **Prevention**: Added error boundaries and defensive programming patterns
- **Documentation**: See `docs/production-fixes/2025-08-26-database-rls-crisis.md`

### RLS Policy Configuration (RESOLVED 2025-08-26)
- **Issue**: Row Level Security policies referenced incorrect columns
- **Impact**: Users couldn't access their own data
- **Solution**: Applied corrected RLS policies (28 total) with proper column references
- **Maintenance Scripts**: Available in `scripts/maintenance/` for future diagnostics

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

## High-Level Architecture

### Data Flow Pattern
The app follows a **unidirectional data flow** with clear separation of concerns:
1. **Client Layer**: React components with TanStack Query for server state management
2. **API Routes**: Next.js App Router API endpoints (`/api/*`) handle business logic
3. **Database Layer**: Supabase (PostgreSQL) with Row Level Security (RLS) policies
4. **Real-time Layer**: Supabase Realtime subscriptions for live updates
5. **Authentication**: Supabase Auth with session management through middleware

### State Management Strategy
The app uses a hybrid approach for different types of state:
- **Server State**: TanStack Query with hooks in `lib/react-query/hooks/`
  - Caching, refetching, and optimistic updates handled automatically
  - Key hooks: `useToggleCheckIn()`, `useTodayCheckins()`, `useDashboardData()`
- **Client State**: Zustand store (`lib/stores/useAppStore.ts`) for UI state
- **Form State**: React Hook Form with Zod validation schemas
- **Auth State**: Supabase Auth with automatic session refresh

### Component Architecture
Components are organized by responsibility:
- **Base UI Components** (`components/ui/`): Radix UI primitives with Tailwind styling
- **AXIS6 Components** (`components/axis/`): Domain-specific components like hexagon visualization
- **Error Boundaries** (`components/error/`): Multi-level error handling with fallback UI
- **Layout Components** (`components/layout/`): Shared layout structures

### Database Architecture
- **Table Naming**: All tables prefixed with `axis6_` for namespace isolation
- **Security Model**: Row Level Security (RLS) enabled on all tables
- **Performance**: 25+ custom indexes for optimized query patterns
- **Key Tables**:
  - `axis6_profiles`: User profiles (uses `id` column referencing auth.users)
  - `axis6_categories`: The 6 life dimensions
  - `axis6_checkins`: Daily check-ins per category
  - `axis6_streaks`: Streak tracking per category
  - `axis6_daily_stats`: Pre-calculated statistics

### Security Architecture
Multi-layered security approach:
- **Route Protection**: Authentication middleware (`middleware.ts`) protects routes
- **Rate Limiting**: Redis-backed rate limiting with route-specific limits
- **Content Security Policy**: Advanced CSP configuration in `next.config.js`
- **Input Validation**: Zod schemas validate all user inputs
- **RLS Policies**: Database-level security ensures users only access their own data

### Performance Optimization Strategy
- **Database Optimization**: Custom indexes and optimized RPC functions
- **Bundle Optimization**: Chunk splitting for React, Supabase, vendor code
- **Query Optimization**: Single-query dashboard loading, optimistic updates
- **Real-time Performance**: Debounced refetching, connection pooling
- **Image Optimization**: Next.js Image component with automatic optimization

### Testing Architecture
- **Unit Tests**: Jest for utility functions and components
- **Integration Tests**: Jest for API routes and database operations
- **E2E Tests**: Playwright for user workflows across browsers
- **Performance Tests**: Database performance benchmarking scripts
- **Authentication Tests**: Dedicated auth flow testing

### Deployment Pipeline
- **Version Control**: Git with feature branches
- **CI/CD**: Vercel automatic deployment on push to main
- **Environment Management**: Environment variables in Vercel dashboard
- **Monitoring**: Sentry for errors, Vercel Analytics for performance

## Debugging Patterns

### Database Column References
**CRITICAL**: Different tables use different column names for user references:
- `axis6_profiles` uses `id` column (references `auth.users(id)`)
- All other tables use `user_id` column (references `auth.users(id)`)
- This was a source of major production issues - always verify column names when writing queries

### Error Boundary Hierarchy
The app uses multiple error boundary layers:
1. `GlobalErrorBoundary` - Top-level application errors
2. `ApiErrorBoundary` - API route errors
3. `SupabaseErrorBoundary` - Database connection/query errors
4. `ProfileErrorBoundary` - Profile page specific errors
5. `QueryErrorBoundary` - TanStack Query specific errors

### Common Debug Commands
```bash
# Check database schema in development
npm run verify:supabase

# Test specific auth flows
npm run test:auth

# Monitor database performance
npm run db:monitor

# Debug Supabase client issues
# Check browser console for window.__supabaseError
```

### RLS Policy Debugging
When users can't access their data:
1. Check if correct column name is used (`id` vs `user_id`)
2. Verify RLS policies reference `auth.uid()` correctly
3. Test with service role key to bypass RLS
4. Use `scripts/maintenance/` scripts for diagnostics

### Performance Debugging
- All database queries are indexed - check `manual_performance_indexes.sql`
- TanStack Query DevTools available in development
- Bundle analyzer available via `npm run analyze`
- Real-time query monitoring via custom hooks

## Critical Cross-File Patterns

### Authentication Flow
The authentication system spans multiple files and layers:
1. **Supabase Client** (`lib/supabase/client.ts`): Creates browser client with auth config
2. **Middleware** (`middleware.ts`): Protects routes, checks auth state
3. **Auth Pages** (`app/auth/*`): Login/register UI components
4. **API Routes** (`app/api/auth/*`): Handle auth operations
5. **Custom Hooks** (`lib/react-query/hooks/useUser.ts`): Manage user state

### Real-time Updates Pattern
Real-time functionality requires coordination between:
1. **Supabase Client Config**: WebSocket configuration with retry logic
2. **React Query Hooks**: Subscription setup and cache invalidation
3. **Component Layer**: UI updates based on real-time events
4. **Error Handling**: Graceful fallback when WebSocket fails

### Optimistic Updates Pattern
Used throughout for better UX:
1. **Mutation Hook**: Optimistically updates cache before server response
2. **Rollback Logic**: Reverts changes if server request fails
3. **Cache Invalidation**: Ensures data consistency after success
4. **UI Feedback**: Shows loading/success/error states

### Rate Limiting Implementation
Multi-tier rate limiting across the stack:
1. **Redis Configuration**: Connection setup and key management
2. **Middleware Layer**: Route-specific rate limit application
3. **API Routes**: Individual endpoint protection
4. **Error Responses**: Proper 429 status with retry headers

## Working With This Codebase

### Key Development Principles
1. **Port 6789**: Always use localhost:6789, never localhost:3000
2. **Database Columns**: Verify column names - `axis6_profiles` uses `id`, others use `user_id`
3. **Testing**: Run tests before deploying - auth, performance, and E2E tests available
4. **Security**: RLS enabled on all tables, rate limiting on API routes
5. **Performance**: 25+ database indexes deployed, use optimized RPC functions

### Common Gotchas
- TypeScript errors temporarily ignored for chat routes (TODO in next.config.js)
- ESLint errors temporarily ignored during build (TODO in next.config.js)
- PWA configuration disabled for Next.js 15 compatibility
- WebSocket auth errors are normal during login (handled gracefully)
- CSP configuration in next.config.js may need adjustment for new external resources

### Quick Debugging
- Check browser console for `window.__supabaseError`
- Use `npm run verify:supabase` to check database configuration
- Run `npm run test:auth` to verify authentication flow
- Use `npm run analyze` to check bundle size issues
- TanStack Query DevTools available in development mode