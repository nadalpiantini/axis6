# CLAUDE.md - AXIS6 MVP

## Project Overview
AXIS6 is a gamified wellness tracker that helps users maintain balance across 6 life dimensions: Physical, Mental, Emotional, Social, Spiritual, and Material. Built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel (axis6.sujeto10.com)
- **UI Components**: Custom hexagon visualization, Lucide icons
- **Charts**: Recharts for analytics

## Development Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests (when configured)
```

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

## Design System
- **Primary Colors**: Navy (#0A0E1A), Teal (#65D39A), Lavender (#9B8AE6)
- **Category Colors**: Physical (Teal), Mental (Lavender), Emotional (Coral), Social (Blue), Spiritual (Turquoise), Material (Yellow)
- **Typography**: Satoshi font family
- **Components**: Dark cards with subtle borders, smooth animations

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