# AXIS6 MVP - Product Requirements Document

## Product Vision
AXIS6 is a gamified wellness application that helps users maintain balance across six essential life dimensions through daily check-ins, streak tracking, and visual progress representation.

## Problem Statement
People struggle to maintain consistent balance across different areas of their lives. Traditional habit trackers are either too complex or focus on single habits, missing the holistic view of personal wellness.

## Solution
A simple, visually engaging app that gamifies daily wellness through a hexagonal representation of six life dimensions, making it easy and rewarding to maintain life balance.

## Target Users
### Primary: Young Professionals (25-40)
- Busy lifestyle requiring balance reminders
- Tech-savvy and mobile-first
- Value personal growth and wellness
- Appreciate gamification and visual feedback

### Secondary: Wellness Coaches
- Track client progress
- Share accountability with clients
- Need simple tools for engagement

## Core Features (MVP)

### 1. User Authentication
- Email/password registration and login
- Password recovery
- Profile setup with timezone selection
- Secure session management

### 2. Six Life Dimensions
The app tracks six core areas:
- **Physical**: Exercise, health, nutrition
- **Mental**: Learning, focus, productivity
- **Emotional**: Mood, stress management, self-care
- **Social**: Relationships, community, connections
- **Spiritual**: Meditation, purpose, mindfulness
- **Material**: Finance, career, resources

### 3. Daily Check-in System
- One-tap marking for each category
- Visual feedback on completion
- Daily reset at midnight (user's timezone)
- Optional notes and mood tracking per category

### 4. Hexagon Visualization
- Interactive SVG hexagon with 6 segments
- Color-coded categories
- Real-time visual updates
- Animated transitions
- Mobile-optimized touch interactions

### 5. Streak Tracking
- Current streak per category
- Longest streak records
- Visual indicators for active streaks
- Recovery mechanism for missed days

### 6. Personal Analytics Dashboard
- Weekly/monthly completion rates
- Category performance insights
- Progress trends over time
- Best performing areas identification

## User Stories

### Authentication
- As a user, I want to create an account to save my progress
- As a user, I want to log in securely to access my data
- As a user, I want to reset my password if forgotten

### Daily Usage
- As a user, I want to quickly mark completed categories
- As a user, I want to see my daily progress visually
- As a user, I want to add notes about my day
- As a user, I want to complete all categories with one action

### Progress Tracking
- As a user, I want to see my current streaks
- As a user, I want to know my best streaks
- As a user, I want to view my completion history
- As a user, I want to see trends over time

### Mobile Experience
- As a user, I want to use the app on my phone
- As a user, I want quick access from home screen
- As a user, I want offline capability with sync

## Success Metrics

### Engagement Metrics
- **Daily Active Users (DAU)**: Target 60% of registered users
- **Weekly Active Users (WAU)**: Target 80% of registered users
- **Session Duration**: Average 2-3 minutes
- **Sessions per Day**: 1-2 sessions

### Retention Metrics
- **Day 1 Retention**: >80%
- **Day 7 Retention**: >60%
- **Day 30 Retention**: >40%
- **3-Month Retention**: >25%

### Feature Metrics
- **Daily Completion Rate**: >40% complete all 6 categories
- **Streak Length**: Average 7+ days per category
- **Category Balance**: <20% variance between categories
- **Note Usage**: >30% add notes regularly

### Technical Metrics
- **Page Load Time**: <2 seconds
- **Time to Interactive**: <3 seconds
- **API Response Time**: <200ms p95
- **Error Rate**: <0.1%
- **Uptime**: 99.9%

## Non-Functional Requirements

### Performance
- Load time under 2 seconds on 3G
- Smooth animations at 60fps
- Responsive on all devices
- Optimized for mobile-first

### Security
- Encrypted passwords (bcrypt)
- Secure API endpoints
- Row-level security in database
- HTTPS only
- JWT token authentication

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Clear touch targets (44x44px minimum)

### Scalability
- Support 10,000+ concurrent users
- Database optimized for growth
- CDN for static assets
- Efficient caching strategies

## Future Features (Post-MVP)

### Phase 2 (Month 2-3)
- Push notifications for reminders
- Social sharing of achievements
- Weekly/monthly challenges
- Custom categories
- Data export (CSV/PDF)

### Phase 3 (Month 4-6)
- Team/group challenges
- Integration with wearables
- AI-powered insights
- Premium features ($4.99/month)
- Coaching marketplace

### Phase 4 (Month 7-12)
- Mobile native apps (iOS/Android)
- API for third-party integrations
- Advanced analytics
- Habit recommendations
- Community features

## Technical Constraints
- Must work on mobile browsers
- Must support offline usage
- Must sync across devices
- Must handle timezone differences
- Must be GDPR compliant

## Design Principles
1. **Simplicity First**: Minimize cognitive load
2. **Visual Feedback**: Immediate response to actions
3. **Gamification**: Make wellness fun and engaging
4. **Privacy**: User data protection priority
5. **Accessibility**: Inclusive design for all users

## Launch Strategy
1. **Soft Launch**: Friends and family beta (Week 1)
2. **Beta Testing**: 100 users feedback (Week 2-3)
3. **Public Launch**: ProductHunt, social media (Week 4)
4. **Growth Phase**: Content marketing, SEO (Month 2+)

## Success Criteria
- 1,000 registered users in first month
- 60% weekly active rate
- 4.5+ app store rating
- <5% churn rate monthly
- Positive user testimonials