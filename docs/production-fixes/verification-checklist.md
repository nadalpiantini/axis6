# Production Verification Checklist

## Post-Deployment Verification Steps

### 1. Database Access Verification
- [ ] Run diagnostic script: `node scripts/maintenance/diagnose-production-database.js`
- [ ] Verify all tables accessible with proper RLS
- [ ] Check schema alignment: `node scripts/maintenance/check-table-schemas.js`

### 2. API Endpoint Testing
```bash
# Test profile endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://axis6.app/api/auth/user

# Test checkins endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://axis6.app/api/checkins

# Test categories endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://axis6.app/api/categories
```

### 3. Frontend Functionality
- [ ] Profile page loads without errors
- [ ] Dashboard displays categories and hexagon
- [ ] Check-ins can be created and updated
- [ ] Streaks calculate correctly
- [ ] Temperament questionnaire works (if data exists)

### 4. Browser Console Checks
- [ ] No 400 errors on database queries
- [ ] No 404 errors for existing tables
- [ ] No 406 Not Acceptable errors
- [ ] No React Error #130
- [ ] WebSocket connections succeed (or fail gracefully)

### 5. Error Boundary Testing
- [ ] DatabaseErrorBoundary catches database failures
- [ ] ProfileErrorBoundary handles profile page errors
- [ ] Retry functionality works
- [ ] Navigation fallbacks function correctly

## Success Metrics

### Critical (Must Pass)
- ✅ Zero 400/404/406 HTTP errors in console
- ✅ Profile page loads for authenticated users
- ✅ Dashboard shows user data correctly
- ✅ Check-ins can be created/updated

### Important (Should Pass)
- ✅ Streaks display correctly
- ✅ Temperament data loads (if exists)
- ✅ Error boundaries provide fallback UI
- ✅ Performance within acceptable range (<3s load)

### Nice to Have
- ✅ WebSocket realtime updates work
- ✅ All animations smooth
- ✅ Mobile responsive layout correct
- ✅ Accessibility features functional

## Performance Benchmarks

### Database Query Times
- Profile query: < 100ms
- Categories query: < 50ms
- Check-ins query: < 200ms
- Dashboard load: < 500ms total

### Page Load Times
- Profile page: < 2s
- Dashboard: < 3s
- First contentful paint: < 1s
- Time to interactive: < 3s

## Monitoring Commands

### Check RLS Status
```sql
-- Run in Supabase SQL Editor
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'axis6_%'
ORDER BY tablename, policyname;
```

### Verify Table Columns
```sql
-- Check axis6_profiles structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'axis6_profiles';

-- Check axis6_checkins structure  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'axis6_checkins';
```

### Test User Access
```sql
-- Test as authenticated user (in Supabase Dashboard)
SELECT * FROM axis6_profiles WHERE id = auth.uid();
SELECT * FROM axis6_checkins WHERE user_id = auth.uid();
SELECT * FROM axis6_categories; -- Should return 6 rows
```

## Rollback Procedures

### If Issues Persist

1. **Revert RLS Policies**
```sql
-- Run original RLS policies if needed
-- Available in Git history before fixes
```

2. **Restore Original Queries**
```bash
# Revert profile page changes
git checkout HEAD~1 -- app/profile/page.tsx
```

3. **Remove Error Boundaries** (if causing issues)
```bash
# Remove error boundary components
rm components/error/DatabaseErrorBoundary.tsx
rm components/error/ProfileErrorBoundary.tsx
```

4. **Re-run Diagnostic Scripts**
```bash
node scripts/maintenance/diagnose-production-database.js
```

## Emergency Contacts

### If Critical Issues
1. Check Supabase Status: https://status.supabase.com
2. Review Vercel Logs: https://vercel.com/dashboard
3. Check Git history for working version
4. Restore from last known good commit

## Sign-off Checklist

### Before Marking Complete
- [ ] All critical metrics pass
- [ ] No user complaints in last 24 hours
- [ ] Performance metrics acceptable
- [ ] Documentation updated
- [ ] Team notified of changes
- [ ] Monitoring in place for 48 hours

### Final Verification
- [ ] Production site functional for all users
- [ ] No critical errors in logs
- [ ] Database queries optimized
- [ ] Error handling graceful
- [ ] Documentation complete

---

**Last Updated**: August 26, 2025  
**Status**: Active Monitoring  
**Next Review**: 48 hours post-deployment