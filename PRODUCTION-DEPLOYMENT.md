# 🚀 AXIS6 Production Deployment Guide

This guide covers the complete process of deploying AXIS6 to production with all performance, security, and monitoring features enabled.

## 📋 Pre-Deployment Checklist

### 1. Environment Setup

**Required Services:**
- [ ] Supabase project (database + auth)
- [ ] Upstash Redis instance (rate limiting)
- [ ] Sentry project (error monitoring)
- [ ] Domain setup (axis6.app)
- [ ] Deployment platform (Vercel recommended)

**Environment Variables:**
```bash
# Run verification script
npm run verify:production
```

### 2. Database Setup

**Run Migrations:**
```bash
# Connect to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
supabase db push

# Or manually run in Supabase SQL Editor:
# - 001_initial_schema.sql
# - 002_auth_triggers.sql  
# - 003_performance_optimizations.sql
# - 004_daily_mantras.sql
```

**Verify Database:**
- [ ] All tables created with RLS policies
- [ ] Performance indexes applied
- [ ] Triggers functioning correctly

## 🔧 Service Configuration

### Redis/Upstash Setup

1. **Create Upstash Account:**
   - Visit https://upstash.com
   - Create new Redis database
   - Copy REST URL and token

2. **Test Connection:**
   ```bash
   npm run test:redis
   ```

3. **Environment Variables:**
   ```env
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-redis-token
   ENABLE_REDIS_RATE_LIMIT=true
   ```

### Sentry Error Monitoring

1. **Create Sentry Project:**
   - Visit https://sentry.io
   - Create Next.js project
   - Copy DSN and auth token

2. **Environment Variables:**
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   SENTRY_AUTH_TOKEN=your-auth-token
   SENTRY_ORG=your-org-name
   SENTRY_PROJECT=axis6-production
   ```

3. **Verify Setup:**
   - Deploy to staging first
   - Trigger test error to verify tracking

### Security Configuration

1. **Generate CSRF Secret:**
   ```bash
   openssl rand -base64 32
   ```

2. **Enable Security Features:**
   ```env
   CSRF_SECRET=your-generated-secret
   ENFORCE_CSRF=true
   ```

3. **Verify Security:**
   - Security headers active
   - CSRF protection working
   - Rate limiting functional

## 🌐 Deployment Platforms

### Vercel Deployment (Recommended)

1. **Connect Repository:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables:**
   - Add all `.env.production` variables in Vercel dashboard
   - Ensure `NODE_ENV=production`

3. **Custom Domain:**
   - Add `axis6.app` domain in Vercel
   - Configure DNS records
   - Enable SSL

### Netlify Deployment

1. **Build Settings:**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. **Environment Variables:**
   - Add all production variables in Netlify dashboard

## 📊 Monitoring & Analytics

### Performance Monitoring

1. **Web Vitals Setup:**
   ```env
   NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
   ```

2. **Lighthouse CI:**
   ```yaml
   # .github/workflows/lighthouse.yml
   - name: Lighthouse CI
     uses: treosh/lighthouse-ci-action@v9
     with:
       urls: |
         https://axis6.app
         https://axis6.app/dashboard
   ```

### Error Monitoring

1. **Sentry Alerts:**
   - Configure error thresholds
   - Set up Slack/email notifications
   - Monitor performance issues

2. **Uptime Monitoring:**
   ```bash
   # Add to monitoring service:
   # - https://axis6.app
   # - https://axis6.app/api/health
   ```

## 🔒 Security Best Practices

### Production Security Checklist

- [ ] Security headers enabled (CSP, HSTS, etc.)
- [ ] CSRF protection active
- [ ] Rate limiting configured
- [ ] Input sanitization enabled
- [ ] Environment variables secured
- [ ] Database RLS policies active
- [ ] API routes protected
- [ ] HTTPS enforced
- [ ] Domain security configured

### Security Headers Verification

```bash
# Test security headers
curl -I https://axis6.app

# Should include:
# x-frame-options: DENY
# x-content-type-options: nosniff
# content-security-policy: ...
# strict-transport-security: ...
```

## 🚀 Go-Live Process

### Phase 1: Staging Deployment

1. **Deploy to Staging:**
   ```bash
   vercel --prod --scope staging
   ```

2. **Run Full Tests:**
   ```bash
   npm run verify:production
   npm run test:redis
   # Manual testing of key user flows
   ```

3. **Performance Testing:**
   ```bash
   # Lighthouse audit
   # Load testing with realistic data
   # Database query performance check
   ```

### Phase 2: Production Launch

1. **Final Environment Setup:**
   ```env
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://axis6.app
   ENABLE_REDIS_RATE_LIMIT=true
   ENFORCE_CSRF=true
   ```

2. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

3. **Post-Launch Verification:**
   - [ ] Website loads correctly
   - [ ] User registration works
   - [ ] Dashboard functions properly
   - [ ] Database operations successful
   - [ ] Error monitoring active
   - [ ] Performance metrics good

### Phase 3: Monitoring & Optimization

1. **Monitor Key Metrics:**
   - Error rates (< 1%)
   - Response times (< 2s)
   - Core Web Vitals (all green)
   - Database performance

2. **Set Up Alerts:**
   - Error rate spikes
   - Performance degradation
   - Database connection issues
   - High memory usage

## 🔄 Maintenance & Updates

### Regular Tasks

- [ ] Monitor error rates weekly
- [ ] Review performance metrics monthly
- [ ] Update dependencies quarterly
- [ ] Security audit semi-annually

### Deployment Pipeline

```bash
# Development workflow
git checkout -b feature/new-feature
# ... make changes ...
git push origin feature/new-feature
# ... create PR, review, merge ...

# Automatic deployment via Vercel
# Staging: preview deployments
# Production: main branch deployments
```

### Rollback Procedure

```bash
# Vercel rollback
vercel rollback https://axis6.app

# Or redeploy previous commit
git revert HEAD
git push origin main
```

## 📞 Support & Troubleshooting

### Common Issues

1. **Build Failures:**
   ```bash
   npm run build
   # Check build logs for errors
   ```

2. **Database Connection Issues:**
   ```bash
   # Verify Supabase connection
   # Check RLS policies
   # Verify environment variables
   ```

3. **Performance Issues:**
   ```bash
   # Check Redis connection
   # Verify database indexes
   # Monitor API response times
   ```

### Health Checks

```bash
# Application health
curl https://axis6.app/api/health

# Database health  
# Check Supabase dashboard

# Redis health
npm run test:redis
```

### Emergency Contacts

- **Development Team:** [your-team@domain.com]
- **Infrastructure:** [ops@domain.com]
- **Supabase Support:** via dashboard
- **Vercel Support:** via dashboard

---

## 🎉 Production Deployment Complete!

Your AXIS6 application is now running in production with:

✅ **Security:** Headers, CSRF, rate limiting, input sanitization  
✅ **Performance:** Optimized builds, caching, database indexes  
✅ **Monitoring:** Sentry error tracking, performance metrics  
✅ **Reliability:** Connection pooling, health checks, rollback procedures

**Next Steps:**
1. Monitor application performance for first 24 hours
2. Set up regular maintenance schedule
3. Plan feature roadmap based on user feedback
4. Consider additional monitoring tools as you scale

Happy launching! 🚀