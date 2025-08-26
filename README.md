# AXIS6 - Balance Across 6 Life Dimensions

> "Six axes. One you. Don't break your Axis."

AXIS6 is a gamified wellness tracker that helps users maintain balance across 6 essential life dimensions: Physical, Mental, Emotional, Social, Spiritual, and Material.

🌐 **Live Application**: [axis6.app](https://axis6.app)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase keys

# Run development server (IMPORTANT: runs on port 6789, not 3000)
npm run dev

# Open browser
open http://localhost:6789
```

## 📱 Mobile-First Design

AXIS6 features comprehensive mobile optimization with:

- **Perfect Modal Centering**: Works flawlessly on all screen sizes (320px - 4K+)
- **Safe Area Support**: Full support for notched devices (iPhone X+)
- **Touch Optimization**: 44px minimum touch targets for accessibility
- **Responsive Layouts**: Mobile-first design across all components
- **PWA Ready**: Web app capabilities for iOS and Android

## ✨ Key Features

- ✅ **Daily Check-ins**: Track progress across all 6 life dimensions  
- ✅ **Interactive Hexagon**: Visual progress representation
- ✅ **Streak Tracking**: Maintain motivation with streak counters
- ✅ **Analytics Dashboard**: Personal insights and progress tracking
- ✅ **Mobile-Responsive**: Optimized for all devices and screen sizes
- ✅ **Dark Theme**: Professional navy-based color scheme

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS (mobile-first)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel with automatic deployments
- **Testing**: Playwright (E2E), Jest (Unit)

## 📊 The 6 Dimensions

| Dimension | Color | Focus Area |
|-----------|--------|------------|
| **Physical** | 🟢 #65D39A | Exercise, health, nutrition |
| **Mental** | 🟣 #9B8AE6 | Learning, focus, productivity |
| **Emotional** | 🔴 #FF8B7D | Mood, stress management |
| **Social** | 🔵 #6AA6FF | Relationships, connections |
| **Spiritual** | 🟡 #4ECDC4 | Meditation, purpose, mindfulness |
| **Material** | 🟠 #FFD166 | Finance, career, resources |

## 🧪 Testing

```bash
# Run all tests
npm run test:e2e          # E2E tests with Playwright
npm run test              # Unit tests with Jest
npm run test:e2e:mobile   # Mobile-specific E2E tests

# Authentication & Database
npm run test:auth         # Test auth flows
npm run verify:supabase   # Verify database setup
```

## 🔧 Development

```bash
# Core commands
npm run dev               # Development server (port 6789)
npm run build             # Production build
npm run type-check        # TypeScript checking
npm run lint              # ESLint

# Production
npm run production:health # Health check
npm run setup:all         # Complete project setup
```

## 📂 Project Structure

```
axis6-mvp/
├── app/                  # Next.js App Router (mobile-optimized)
├── components/           # React components (responsive)
│   ├── ui/              # Base components
│   ├── axis/            # AXIS6-specific components
│   ├── settings/        # Settings components
│   └── chat/            # Chat system
├── lib/                 # Utilities and hooks
└── supabase/           # Database migrations
```

## 🚀 Deployment

The application automatically deploys to production when pushing to the `main` branch.

- **Production URL**: [axis6.app](https://axis6.app)
- **Hosting**: Vercel
- **Database**: Supabase Cloud
- **DNS**: Cloudflare

## 📱 Mobile Development

When developing mobile features:

1. **Test on real devices** - Use Safari Web Inspector for iOS
2. **Verify safe areas** - Check env() variables work correctly
3. **Touch targets** - Ensure minimum 44px for accessibility
4. **Modal centering** - Use flexbox, never transform positioning

## 📚 Documentation

For comprehensive development guidance, see [CLAUDE.md](./CLAUDE.md) which includes:

- Detailed setup instructions
- Architecture documentation
- Database schema information
- Performance optimization guide
- Mobile development best practices

## 🔐 Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:6789
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes (ensure mobile responsiveness)
4. Test thoroughly on mobile devices
5. Submit a pull request

## 📄 License

Private project - All rights reserved.
