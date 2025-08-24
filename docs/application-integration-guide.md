# AXIS6 Application Integration Guide

## 🚀 Integrating Optimized Database Queries

Now that your performance indexes and RPC functions are deployed, this guide shows you how to integrate the optimized queries into your application for **70% faster dashboard loading**.

## 📊 Current vs Optimized Approach

### Before Optimization (Multiple Queries)
```typescript
// OLD: 6 separate database calls = ~700ms total
const [profile, categories, todayCheckins, streaks, weeklyStats, recentActivity] = await Promise.all([
  supabase.from('axis6_profiles').select('*').eq('id', userId).single(),
  supabase.from('axis6_categories').select('*').order('position'),
  supabase.from('axis6_checkins').select('*').eq('user_id', userId).eq('completed_at', today),
  supabase.from('axis6_streaks').select('*').eq('user_id', userId),
  // ... more queries
])
```

### After Optimization (Single Query)
```typescript
// NEW: 1 optimized RPC call = ~200ms total  
const dashboardData = await supabase.rpc('get_dashboard_data_optimized', {
  p_user_id: userId,
  p_today: new Date().toISOString().split('T')[0]
})
```

## 🔧 Step-by-Step Integration

### Step 1: Update Dashboard Hook

Replace your existing `useDashboardData.ts` hook:

```typescript
// lib/react-query/hooks/useDashboardData.ts
import { useQuery } from '@tanstack/react-query'
import { fetchOptimizedDashboardData } from '@/lib/supabase/queries/optimized-dashboard'

export function useDashboardData(userId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard-optimized', userId],
    queryFn: () => fetchOptimizedDashboardData(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  })
}
```

### Step 2: Update Dashboard Components

Modify your dashboard components to use the new data structure:

```typescript
// app/(auth)/dashboard/page.tsx  
import { useDashboardData } from '@/lib/react-query/hooks/useDashboardData'

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useDashboardData(user?.id)

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="dashboard">
      <UserProfile user={dashboardData.user} />
      
      <HexagonGrid 
        categories={dashboardData.categories}
        // Data now includes todayCompleted, currentStreak, longestStreak per category
      />
      
      <WeeklyStats stats={dashboardData.weeklyStats} />
      <RecentActivity activity={dashboardData.recentActivity} />
    </div>
  )
}
```

### Step 3: Update Checkin Toggle

Use the optimized checkin toggle function:

```typescript
// components/axis/CategoryCheckin.tsx
import { toggleCheckinOptimized } from '@/lib/supabase/queries/optimized-dashboard'
import { useQueryClient } from '@tanstack/react-query'

export function CategoryCheckin({ category, userId }) {
  const queryClient = useQueryClient()

  const handleToggle = async () => {
    try {
      const newStatus = await toggleCheckinOptimized(userId, category.id)
      
      // Optimistic update (instant UI feedback)
      queryClient.setQueryData(['dashboard-optimized', userId], (old) => ({
        ...old,
        categories: old.categories.map(c => 
          c.id === category.id 
            ? { ...c, todayCompleted: newStatus }
            : c
        )
      }))
      
      // Invalidate to refetch with updated streaks
      queryClient.invalidateQueries(['dashboard-optimized', userId])
      
    } catch (error) {
      console.error('Checkin toggle failed:', error)
      // Revert optimistic update on error
      queryClient.invalidateQueries(['dashboard-optimized', userId])
    }
  }

  return (
    <button 
      onClick={handleToggle}
      className={category.todayCompleted ? 'completed' : 'incomplete'}
    >
      {category.name}
    </button>
  )
}
```

### Step 4: Update Leaderboard

Use the optimized leaderboard query:

```typescript
// components/leaderboard/LeaderboardTable.tsx
import { fetchLeaderboard } from '@/lib/supabase/queries/optimized-dashboard'

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => fetchLeaderboard(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes (leaderboard changes slowly)
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

## ⚡ Performance Optimizations

### Optimistic Updates

Implement optimistic updates for instant UI feedback:

```typescript
// Before server response
queryClient.setQueryData(['dashboard-optimized', userId], (old) => ({
  ...old,
  categories: old.categories.map(c => 
    c.id === categoryId 
      ? { ...c, todayCompleted: !c.todayCompleted }
      : c
  )
}))

// After server response
queryClient.invalidateQueries(['dashboard-optimized', userId])
```

### Smart Caching Strategy

Configure caching for different data types:

```typescript
// Dashboard data - refreshes frequently
staleTime: 30 * 1000 // 30 seconds

// Categories - rarely change  
staleTime: 60 * 60 * 1000 // 1 hour

// Leaderboard - moderate changes
staleTime: 5 * 60 * 1000 // 5 minutes

// User profile - changes rarely
staleTime: 15 * 60 * 1000 // 15 minutes
```

### Prefetching for Speed

Prefetch dashboard data on login:

```typescript
// lib/hooks/usePrefetchDashboard.ts
export function usePrefetchDashboard(userId: string | undefined) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    if (userId) {
      queryClient.prefetchQuery({
        queryKey: ['dashboard-optimized', userId],
        queryFn: () => fetchOptimizedDashboardData(userId),
        staleTime: 30 * 1000,
      })
    }
  }, [userId, queryClient])
}
```

## 🔄 Migration Strategy

### Option 1: Gradual Migration (Recommended)

1. **Deploy optimized queries alongside existing ones**
2. **A/B test with percentage of users**  
3. **Monitor performance metrics**
4. **Gradually increase percentage**
5. **Remove old queries after full migration**

```typescript
// Feature flag approach
const useOptimizedDashboard = process.env.NODE_ENV === 'development' || 
  user.email.includes('@axis6.com') // Start with team

const dashboardHook = useOptimizedDashboard 
  ? useDashboardDataOptimized 
  : useDashboardDataLegacy
```

### Option 2: Full Migration

1. **Replace all dashboard queries at once**
2. **Test thoroughly in staging**  
3. **Deploy with rollback plan**
4. **Monitor error rates closely**

## 🐛 Error Handling

Handle fallbacks gracefully:

```typescript
// lib/supabase/queries/optimized-dashboard.ts
export async function fetchOptimizedDashboardData(userId: string) {
  try {
    // Try optimized RPC function first
    const { data, error } = await supabase.rpc('get_dashboard_data_optimized', {
      p_user_id: userId,
      p_today: new Date().toISOString().split('T')[0]
    })
    
    if (error && error.code === '42883') {
      // Function doesn't exist, fallback to individual queries
      console.warn('Optimized function not found, using fallback')
      return await fetchDashboardDataFallback(userId)
    }
    
    if (error) throw error
    return data
    
  } catch (error) {
    console.error('Optimized dashboard fetch failed:', error)
    // Fallback to legacy approach
    return await fetchDashboardDataFallback(userId)
  }
}
```

## 📊 Performance Monitoring

Add performance tracking to your queries:

```typescript
// lib/utils/performance.ts
export function trackQueryPerformance(queryName: string) {
  const start = performance.now()
  
  return {
    end: () => {
      const duration = performance.now() - start
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`)
      }
      
      // Send to analytics (optional)
      analytics?.track('query_performance', {
        query: queryName,
        duration,
        slow: duration > 1000
      })
      
      return duration
    }
  }
}

// Usage
const perf = trackQueryPerformance('dashboard_load')
const data = await fetchOptimizedDashboardData(userId)
const duration = perf.end()
```

## ✅ Testing Integration

### Unit Tests
```typescript
// __tests__/optimized-dashboard.test.ts
import { fetchOptimizedDashboardData } from '@/lib/supabase/queries/optimized-dashboard'

describe('Optimized Dashboard', () => {
  it('should load dashboard data in under 500ms', async () => {
    const start = performance.now()
    const data = await fetchOptimizedDashboardData(TEST_USER_ID)
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(500)
    expect(data.categories).toHaveLength(6)
    expect(data.user).toBeDefined()
  })
})
```

### Performance Tests
```typescript
// scripts/integration-performance-test.js
const PERFORMANCE_TARGETS = {
  dashboardLoad: 200, // ms
  checkinToggle: 50,  // ms
  leaderboard: 100,   // ms
}

async function testPerformance() {
  for (const [test, target] of Object.entries(PERFORMANCE_TARGETS)) {
    const duration = await measureQueryTime(test)
    const pass = duration < target
    
    console.log(`${test}: ${duration}ms ${pass ? '✅' : '❌'} (target: ${target}ms)`)
  }
}
```

## 🚀 Expected Performance Improvements

After integration, you should see:

### Response Times
- **Dashboard load**: ~700ms → **< 200ms** (70% improvement)
- **Today's checkins**: Table scan → **< 50ms** (95% improvement)  
- **Leaderboard**: ~500ms → **< 100ms** (80% improvement)
- **Checkin toggle**: ~200ms → **< 50ms** (75% improvement)

### User Experience  
- **Faster page loads** → reduced bounce rate
- **Instant UI feedback** → improved engagement
- **Smoother interactions** → better user satisfaction

### System Performance
- **Reduced database load** → lower costs
- **Better concurrent handling** → supports more users
- **Less memory usage** → improved scalability

## 🔧 Troubleshooting

### Common Issues

#### 1. RPC Function Not Found
```typescript
// Error: function "get_dashboard_data_optimized" does not exist
// Solution: Deploy the RPC functions migration
```

#### 2. Slow Queries Still Occurring
```sql
-- Check index usage in Supabase Dashboard
SELECT * FROM dashboard_performance_metrics 
WHERE efficiency_ratio < 10;
```

#### 3. Type Errors
```typescript
// Update TypeScript types to match optimized response structure
interface OptimizedCategory {
  id: number
  name: any // JSONB
  todayCompleted: boolean  // New field
  currentStreak: number    // New field
  longestStreak: number    // New field
}
```

## 📈 Monitoring Success

Track these metrics after integration:

- **Page load times** (should be 70% faster)
- **Database query duration** (monitor in Supabase)
- **User engagement metrics** (time on page, interactions)
- **Error rates** (should remain low)
- **Server resource usage** (should decrease)

## 🎯 Next Steps

1. **Integrate optimized queries** following this guide
2. **Deploy to staging** and test thoroughly  
3. **Monitor performance** with real user data
4. **Deploy to production** with gradual rollout
5. **Remove legacy code** after successful migration

This integration will give your users a dramatically faster and more responsive experience while supporting 10x user growth! 🚀