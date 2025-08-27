# Auth Diagnostic Fixes - August 27, 2025

## Issue Summary
Authentication errors causing React Error #310 and API 401 errors in production, specifically affecting the hexagon resonance feature.

## Root Causes Identified
1. **React Hook Dependencies**: Missing dependencies in `useMemo` causing stale closures
2. **Authentication State**: Session not properly handled in custom hooks
3. **Database Constraint**: Missing UNIQUE constraint on `axis6_resonance_events` table
4. **Error Boundaries**: Insufficient error handling for auth failures
5. **React Query Configuration**: Aggressive retry logic causing cascading failures

## Fixes Applied

### 1. Fixed useMemo Dependencies
**File**: `components/axis/HexagonChartWithResonance.tsx`
- Added `hexagonData` to dependency array for `calculateResonance`
- Prevents stale closure errors causing React Error #310
- Ensures resonance calculations use fresh data

### 2. Enhanced Error Boundary
**File**: `components/error/HexagonErrorBoundary.tsx` (NEW)
- Created specialized error boundary for hexagon components
- Handles auth errors gracefully with retry mechanism
- Provides fallback UI without losing user context

### 3. Fixed Authentication in Hook
**File**: `hooks/useHexagonResonance.ts`
- Added proper session validation before API calls
- Returns empty state when not authenticated
- Prevents unauthorized API calls that cause 401 errors

### 4. Hardened API Route Auth
**File**: `app/api/resonance/hexagon/route.ts`
- Enhanced authentication validation with detailed logging
- Better error messages for debugging
- Graceful fallbacks for missing RPC functions

### 5. Optimized React Query
**File**: `hooks/useHexagonResonance.ts`
- Disabled retries on 401 errors
- Reduced retry count to 1
- Added exponential backoff for network errors
- Prevents retry storms that amplify auth issues

### 6. Database Constraint Fix
**File**: `scripts/fix-hexagon-resonance-constraint.sql` (NEW)
- Adds missing UNIQUE constraint on resonance_events table
- ~~Fixes error 42804: "structure of query does not match function result type"~~ (Constraint added but type mismatch remains)
- Enables proper ON CONFLICT handling

### 7. UUID Type Mismatch Fix  
**File**: `scripts/fix-resonance-uuid-mismatch.sql` (NEW)
- Updates category_id columns from INTEGER to UUID
- Fixes the actual cause of error 42804
- Updates RPC functions to handle UUID categories correctly
- Handles JSONB slug field in axis6_categories table

## Deployment Steps

### 1. Deploy Database Fixes (REQUIRED - Run in order)
```bash
# Go to Supabase Dashboard
# https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new

# Step 1: Run constraint fix (if not already applied)
# scripts/fix-hexagon-resonance-constraint.sql

# Step 2: Run UUID type fix (CRITICAL)
# scripts/fix-resonance-uuid-mismatch.sql
```

### 2. Deploy Code Changes
```bash
# Commit and push to main branch
git add -A
git commit -m "fix: Resolve authentication errors and React Error #310 in hexagon resonance

- Fixed useMemo dependencies to prevent stale closures
- Added specialized error boundary for hexagon components  
- Enhanced authentication validation in hooks and API routes
- Optimized React Query configuration to prevent retry storms
- Added database constraint fix for resonance events table"

git push origin main
```

### 3. Verify Production Deployment
```bash
# Test authentication flow
npm run test:auth

# Check production health
npm run production:health

# Monitor for errors (should see significant reduction)
```

## Testing Checklist
- [ ] User can log in without errors
- [ ] Hexagon chart loads without React Error #310
- [ ] Resonance data fetches successfully (or falls back gracefully)
- [ ] No 401 errors in console for authenticated users
- [ ] Error boundaries provide helpful fallback UI
- [ ] Database constraint allows resonance recording

## Monitoring
Key metrics to track post-deployment:
1. **Error Rate**: Should drop significantly for React Error #310
2. **API 401 Errors**: Should only occur for truly unauthenticated requests
3. **User Sessions**: Should remain stable without unexpected logouts
4. **Database Function Calls**: `get_hexagon_resonance` should succeed

## Technical Details

### The Authentication Flow
1. User logs in via Supabase Auth
2. Session stored in cookies and localStorage
3. Middleware validates session on protected routes
4. Custom hooks check session before API calls
5. API routes validate auth headers
6. Database RLS policies enforce user isolation

### The Resonance System
1. User completes daily check-in
2. Trigger records resonance event
3. Other users see anonymous "resonance dots"
4. Hexagon visualization shows community activity
5. Creates subtle social layer without exposing identities

## Future Improvements
1. Implement session refresh mechanism in hooks
2. Add telemetry for auth failures
3. Create auth status indicator in UI
4. Consider implementing offline support
5. Add retry mechanism for database constraint violations

## Related Documentation
- Original issue: Production auth errors affecting hexagon feature
- Supabase project: nvpnhqhjttgwfwvkgmpk
- Production URL: https://axis6.app
- Error tracking: Check Sentry for React Error #310

## Support
If issues persist after deployment:
1. Check Supabase Auth logs for session issues
2. Verify database constraint was applied successfully
3. Clear browser cache and localStorage
4. Test in incognito mode to rule out stale sessions