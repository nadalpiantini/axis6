# CSP Resolution Guide - AXIS6
## The Blank Page Issue and How It Was Fixed

### 🚨 Problem Summary
Users were seeing a blank page on axis6.app due to Content Security Policy (CSP) blocking inline styles and scripts required by React, Next.js, and Framer Motion.

### ✅ Current Status: RESOLVED
The site is fully functional with proper CSP configuration allowing inline execution.

## Root Cause Analysis

### The CSP Journey
1. **Initial Issue**: Overly restrictive CSP in vercel.json blocked inline styles/scripts
2. **First Fix Attempt**: Added 'unsafe-inline' to vercel.json CSP
3. **Discovery**: Next.js headers() in next.config.js was overriding vercel.json
4. **Second Fix**: Updated next.config.js to include 'unsafe-inline' 
5. **Final Issue**: Browser cache showing old broken version

### Configuration Hierarchy (Important!)
```
Priority Order:
1. next.config.js headers() function (HIGHEST - wins)
2. vercel.json headers
3. middleware.ts headers (for non-CSP headers only)
```

## The Working Configuration

### next.config.js (Lines 113-126)
```javascript
const productionCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.vercel-scripts.com https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // ... other directives
].join('; ')
```

Key requirements:
- `'unsafe-inline'` for script-src (Required by Next.js hydration)
- `'unsafe-inline'` for style-src (Required by Framer Motion animations)
- Supabase domains for authentication
- Google Fonts for typography

## Troubleshooting Steps

### If You See a Blank Page:

#### 1. Clear Browser Cache (Most Common Fix)
```bash
# Mac Chrome/Edge/Firefox
Cmd + Shift + Delete → Select "Cached images and files" → Clear

# Windows Chrome/Edge/Firefox  
Ctrl + Shift + Delete → Select "Cached images and files" → Clear

# Safari
Safari menu → Clear History → All history
```

#### 2. Hard Refresh
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + F5`
- Or hold Shift + click Reload

#### 3. Test in Incognito/Private Mode
Should work immediately without cache issues

#### 4. Check Health Endpoint
Visit: https://axis6.app/api/health
- Should return JSON with status: "healthy"
- Shows current CSP configuration
- Confirms server is running

#### 5. Verify Headers
```bash
curl -I https://axis6.app | grep -i content-security
```
Should show CSP with 'unsafe-inline' for both script-src and style-src

## Developer Notes

### Why 'unsafe-inline' is Required

1. **Next.js**: Injects inline scripts for:
   - React hydration
   - Route prefetching
   - Error boundaries
   - Development hot reload

2. **Framer Motion**: Uses inline styles for:
   - Animation calculations
   - Dynamic transforms
   - Gesture handling

3. **Supabase Auth**: Requires inline scripts for:
   - Session management
   - Auth state synchronization

### Future Improvements

1. **Implement Nonce-Based CSP**:
   - Generate nonce in middleware
   - Pass to all inline scripts/styles
   - More secure than 'unsafe-inline'

2. **Use Hash-Based CSP**:
   - Generate hashes for known inline content
   - Add to CSP header
   - Allows specific inline content only

3. **External Script Migration**:
   - Move inline scripts to external files
   - Use Next.js Script component
   - Reduce need for 'unsafe-inline'

## Quick Reference

### Files Involved
- `/next.config.js` - Main CSP configuration (ACTIVE)
- `/vercel.json` - Deployment and other headers
- `/middleware.ts` - Non-CSP security headers
- `/app/api/health/route.ts` - Health check endpoint

### Environment Variables
No CSP-specific environment variables needed. CSP is configured in code.

### Deployment
```bash
git add .
git commit -m "fix: Update CSP configuration"
git push origin main
# Vercel auto-deploys to production
```

### Monitoring
- Health Check: https://axis6.app/api/health
- Vercel Dashboard: https://vercel.com/nadalpiantini/axis6
- Browser DevTools Console for CSP violations

## Emergency Contacts
- Vercel Support: https://vercel.com/support
- Next.js Issues: https://github.com/vercel/next.js/issues
- Project Repo: https://github.com/nadalpiantini/axis6

---
Last Updated: 2024-12-24
Status: RESOLVED ✅