# AXIS6 Database Performance Optimization Deployment Checklist

## 🚀 Pre-Deployment Checklist

### Prerequisites
- [ ] Supabase project access with admin privileges
- [ ] Database backup completed (recommended)
- [ ] Test user account available for verification
- [ ] Environment variables configured for testing

### Environment Setup
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `TEST_USER_ID` set for performance testing
- [ ] Node.js dependencies installed (`npm install`)

## 📊 Deployment Steps

### Phase 1: Database Indexes (5-10 minutes)

1. **Deploy Performance Indexes**
   - [ ] Open Supabase Dashboard > SQL Editor
   - [ ] Copy and execute `manual_performance_indexes.sql`
   - [ ] Verify no errors in execution
   - [ ] Check index creation status:
     ```sql
     SELECT indexname, indexdef 
     FROM pg_indexes 
     WHERE tablename LIKE 'axis6_%' 
     AND indexname LIKE 'idx_axis6_%'
     ORDER BY indexname;
     ```
   - [ ] Expected result: 15+ new indexes created

### Phase 2: Optimized Functions (2-3 minutes)

2. **Deploy RPC Functions**
   - [ ] Execute `supabase/migrations/006_dashboard_optimization_rpc.sql`
   - [ ] Verify functions created successfully:
     ```sql
     SELECT routine_name 
     FROM information_schema.routines 
     WHERE routine_name LIKE '%dashboard%' OR routine_name LIKE '%optimized%';
     ```
   - [ ] Expected functions:
     - `get_dashboard_data_optimized`
     - `get_weekly_stats` 
     - `axis6_calculate_streak_optimized`

### Phase 3: Performance Verification (5 minutes)

3. **Run Performance Tests**
   - [ ] Execute test script: `npm run test:performance`
   - [ ] Or manually: `node scripts/test-index-effectiveness.js`
   - [ ] Verify performance targets met:
     - [ ] Dashboard RPC: < 200ms average
     - [ ] Today's checkins: < 50ms average
     - [ ] Leaderboard query: < 100ms average
     - [ ] Streak calculation: < 50ms average
   - [ ] Check for any errors in test output

### Phase 4: Application Code Updates (Optional)

4. **Deploy Optimized Queries** (if updating application immediately)
   - [ ] Import optimized query functions from `lib/supabase/queries/optimized-dashboard.ts`
   - [ ] Update dashboard components to use `fetchOptimizedDashboardData()`
   - [ ] Replace individual queries with single RPC calls
   - [ ] Test application functionality in development
   - [ ] Deploy application changes

## ✅ Post-Deployment Verification

### Immediate Checks (within 15 minutes)

- [ ] **Index Usage Verification**
  ```sql
  SELECT tablename, indexname, idx_tup_read 
  FROM pg_stat_user_indexes 
  WHERE tablename LIKE 'axis6_%' 
  AND idx_tup_read > 0
  ORDER BY idx_tup_read DESC;
  ```

- [ ] **Query Performance Check**
  ```sql
  -- Test dashboard function
  SELECT get_dashboard_data_optimized('test-user-id');
  
  -- Should complete in < 200ms
  ```

- [ ] **Error Log Review**
  - Check Supabase logs for any new errors
  - Monitor application error rates
  - Verify no broken functionality

### Performance Monitoring (within 1 hour)

- [ ] **Dashboard Load Times**
  - Test dashboard loading from application
  - Verify < 200ms average response time
  - Check for any UI regressions

- [ ] **Database Metrics**
  ```sql
  -- Check buffer hit ratio (should be > 95%)
  SELECT 
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 
    as buffer_hit_ratio
  FROM pg_statio_user_tables 
  WHERE relname LIKE 'axis6_%';
  ```

- [ ] **Index Efficiency**
  ```sql
  SELECT 
    indexname,
    idx_tup_read/nullif(idx_tup_fetch,0) as efficiency_ratio
  FROM pg_stat_user_indexes 
  WHERE tablename LIKE 'axis6_%' 
  AND idx_tup_read > 0;
  ```

### Load Testing (within 24 hours)

- [ ] **Concurrent User Simulation**
  - Run concurrent tests: `npm run test:concurrent`
  - Verify system handles 10+ concurrent dashboard loads
  - Monitor response times under load

- [ ] **Peak Usage Simulation**
  - Test during expected peak hours
  - Monitor query queue lengths
  - Verify connection pool stability

## 🚨 Rollback Plan

If issues are detected:

### Immediate Rollback Steps

1. **Disable New Functions** (if causing issues)
   ```sql
   ALTER FUNCTION get_dashboard_data_optimized RENAME TO get_dashboard_data_optimized_disabled;
   ```

2. **Drop Problematic Indexes** (if needed)
   ```sql
   -- Only drop specific problematic indexes, not all
   DROP INDEX CONCURRENTLY idx_name_causing_issues;
   ```

3. **Revert Application Code** (if deployed)
   ```bash
   git revert <optimization-commit-hash>
   git push origin main
   ```

### Rollback Decision Criteria

Rollback if:
- [ ] Dashboard load time > 1000ms (worse than before)
- [ ] Error rate increase > 5%
- [ ] Database CPU usage > 80% sustained
- [ ] Connection pool exhaustion
- [ ] Any critical functionality broken

## 📊 Success Criteria

### Performance Targets Met
- [ ] Dashboard load time: **< 200ms** (was ~700ms)
- [ ] Today's checkins query: **< 50ms**
- [ ] Leaderboard query: **< 100ms** 
- [ ] Streak calculations: **< 50ms**
- [ ] Analytics queries: **< 300ms**

### System Stability
- [ ] Zero critical errors introduced
- [ ] Database connection pool stable
- [ ] Application functionality unchanged
- [ ] User experience improved

### Monitoring Setup
- [ ] Performance monitoring queries scheduled
- [ ] Alert thresholds configured
- [ ] Maintenance schedule documented
- [ ] Team trained on monitoring procedures

## 📈 Ongoing Monitoring Schedule

### Daily (Automated)
- [ ] Query performance alerts (> 500ms)
- [ ] Error rate monitoring
- [ ] Database connection health

### Weekly (Manual)
- [ ] Run `scripts/performance-monitoring.sql`
- [ ] Review index usage statistics
- [ ] Check for maintenance needs

### Monthly
- [ ] Full performance review
- [ ] Cleanup unused indexes
- [ ] Update performance baselines

## 📞 Emergency Contacts

### Escalation Path
1. **Database Issues**: Senior Backend Developer
2. **Performance Degradation**: Technical Lead
3. **Application Errors**: Frontend Team Lead
4. **Infrastructure Problems**: DevOps Engineer

### Communication Channels
- **Slack**: #axis6-performance
- **Email**: team@axis6.com
- **Monitoring**: Supabase Dashboard alerts

---

## 🎯 Expected Business Impact

### User Experience
- **70% faster dashboard loading** → improved user engagement
- **10x concurrent capacity** → supports user growth
- **Reduced bounce rate** → better retention metrics

### Technical Benefits
- **Reduced server costs** → lower infrastructure spend
- **Improved developer productivity** → faster development cycles
- **Better system reliability** → reduced support tickets

### Growth Enablement
- **Scale to 1000+ users** without infrastructure changes
- **Handle 10k+ daily checkins** with current resources
- **Foundation for advanced features** like real-time updates

---

*Deployment Date: _______________*  
*Deployed By: _______________*  
*Verified By: _______________*