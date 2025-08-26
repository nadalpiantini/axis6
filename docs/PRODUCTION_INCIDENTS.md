# AXIS6 Production Incidents Log

> Critical production incidents, root cause analyses, and resolution documentation

## Incident #002: Profile Page Complete Failure
**Date**: August 26, 2025  
**Severity**: 🔴 CRITICAL  
**Duration**: ~2 hours  
**Impact**: 100% profile page failure for all users

### Timeline
- **20:00 UTC**: Users report profile page showing error boundary
- **20:15 UTC**: Console errors identified: 400/406 API errors, React error #130
- **20:30 UTC**: Root cause identified: Database column mismatch
- **21:00 UTC**: Fix deployed and verified
- **22:00 UTC**: Full functionality restored

### Root Cause Analysis

#### Primary Cause
The `axis6_profiles` table in production uses `id` as the primary key column, but the application code was querying using `user_id`, causing a column not found error.

#### Error Chain
1. **Database Query**: `axis6_profiles.user_id does not exist` → 400 error
2. **API Response**: Profile data returns undefined
3. **Component Render**: Undefined data causes invalid element type
4. **React Error #130**: Component crash with minified error
5. **Error Boundary**: Catches crash, shows error UI

### Resolution Steps

#### Immediate Actions
1. **Query Correction**: Updated all profile queries from `user_id` to `id`
   ```typescript
   // Before (broken)
   .eq('user_id', user.id)
   
   // After (fixed)
   .eq('id', user.id)
   ```

2. **Defensive Programming**: Added null-safe queries
   ```typescript
   .maybeSingle() // Instead of .single()
   ```

3. **Auto-Profile Creation**: New users get profiles automatically
4. **Error Boundaries**: Enhanced with retry and navigation options

#### Preventive Measures
1. **Type Validation**: Added runtime type checks for all database responses
2. **Graceful Degradation**: Features work without optional data
3. **Comprehensive Testing**: Added API query verification scripts
4. **Documentation**: Updated schema documentation with correct column names

### Lessons Learned
1. **Always verify production schema** before deploying database queries
2. **Use defensive query patterns** (maybeSingle vs single)
3. **Implement comprehensive error boundaries** with recovery options
4. **Add type validation** for all external data sources
5. **Test with production-like data** to catch schema mismatches

### Prevention Checklist
- [ ] Verify database schema matches code expectations
- [ ] Use TypeScript types generated from actual schema
- [ ] Implement defensive programming patterns
- [ ] Add comprehensive error boundaries
- [ ] Test all API queries in staging environment
- [ ] Monitor error rates post-deployment

---

## Incident #001: Dashboard Hexagon & Button Failures
**Date**: August 26, 2025  
**Severity**: 🟡 HIGH  
**Duration**: ~4 hours  
**Impact**: Dashboard unusable, buttons non-functional

### Summary
Dashboard hexagon visualization and category buttons completely broken due to:
1. 7th mystery category in database (should only be 6)
2. React Query hooks import path issues
3. Missing database migration dependencies

### Resolution
1. Removed 7th category from database
2. Fixed import paths for React Query hooks
3. Applied corrected database migrations
4. Enhanced error handling

### Post-Mortem Actions
- Added category count validation
- Improved import path resolution
- Enhanced migration testing procedures

---

## Incident Response Playbook

### 1. Detection
- Monitor error tracking (Sentry/logs)
- Check user reports
- Review console errors

### 2. Triage
- Assess severity (Critical/High/Medium/Low)
- Identify affected users/features
- Estimate impact duration

### 3. Investigation
- Check recent deployments
- Review error logs
- Test in development environment
- Identify root cause

### 4. Resolution
- Implement fix
- Test thoroughly
- Deploy to staging
- Verify in production

### 5. Documentation
- Update this incident log
- Create post-mortem report
- Update runbooks
- Share learnings with team

### 6. Prevention
- Add monitoring for similar issues
- Update testing procedures
- Implement preventive measures
- Schedule follow-up review

---

## Metrics & KPIs

### Mean Time to Detection (MTTD)
- Target: < 5 minutes
- Current: ~15 minutes

### Mean Time to Resolution (MTTR)
- Target: < 1 hour
- Current: ~2 hours

### Incident Frequency
- August 2025: 2 critical incidents
- Target: < 1 critical/month

### Post-Incident Actions Completion
- Target: 100% within 48 hours
- Current: 100%

---

## Emergency Contacts

### Primary On-Call
- Check PagerDuty rotation
- Slack: #production-alerts

### Escalation Path
1. On-call engineer
2. Team lead
3. Platform team
4. CTO

### External Dependencies
- Supabase Status: status.supabase.com
- Vercel Status: vercel-status.com
- Cloudflare Status: cloudflarestatus.com

---

*Last Updated: August 26, 2025*
*Next Review: September 1, 2025*