# 🚀 AXIS6 MVP - Deployment Guide

## ✅ Latest Deployment Status (2025-08-25)

**Production is LIVE**: https://axis6.app ✨

### Deployment Summary
- ✅ Code pushed to GitHub
- ✅ Vercel deployment successful
- ✅ Production site accessible
- ⚠️ Database migration pending (manual action required)
- ⚠️ Realtime configuration pending (manual action required)

## 📋 Deployment Overview

This project is deployed exclusively on **Vercel** with automatic deployments on push to main branch.

- **Production URL**: `axis6.app`
- **Secondary URL**: `axis6.sujeto10.com`
- **Platform**: Vercel (NOT Cloudflare Pages)
- **DNS Management**: Cloudflare (for DNS records only)

## ⚡ Vercel Deployment Setup

### Prerequisites

1. Vercel account with project connected
2. Domain configured in Vercel dashboard
3. Environment variables set in Vercel

### Required Environment Variables

Configure these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://nvpnhqhjttgwfwvkgmpk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# ⚠️ SENSITIVE: Mark as encrypted
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=https://axis6.app
NODE_ENV=production

# Infrastructure (for DNS management scripts only)
VERCEL_TOKEN=your-vercel-token
VERCEL_TEAM_ID=team_seGJ6iISQxrrc5YlXeRfkltH
CLOUDFLARE_API_TOKEN=your-cloudflare-token  # Only for DNS management
CLOUDFLARE_ACCOUNT_ID=69d3a8e7263adc6d6972e5ed7ffc6f2a  # Only for DNS management

# Email (Pending Integration)
# RESEND_API_KEY=re_your_key_here
```

### Automatic Deployment

Vercel automatically deploys when you:
1. Push to `main` branch
2. Create a pull request (preview deployment)
3. Manually trigger deployment from Vercel dashboard

```bash
# Push to main for production deployment
git push origin main

# Manual deployment (requires Vercel CLI)
vercel --prod
```

## 🌐 DNS Configuration

Cloudflare is used **ONLY for DNS management**, not for deployment or hosting.

### DNS Records Setup

Run the automated DNS configuration:

```bash
npm run setup:dns
```

This configures DNS records in Cloudflare to point to Vercel:
- A record → Vercel's IP address
- CNAME records → Vercel's domain
- TXT records for domain verification

### Manual DNS Configuration

If you prefer to configure manually in Cloudflare dashboard:

1. **A Record**:
   - Name: `@`
   - Content: `76.76.21.21` (Vercel's IP)
   - Proxy: OFF (Important: Let Vercel handle SSL)

2. **CNAME Record**:
   - Name: `www`
   - Content: `cname.vercel-dns.com`
   - Proxy: OFF

## 🔧 Build and Deployment Scripts

```bash
# Development
npm run dev              # Local development on port 6789

# Production Build
npm run build            # Standard Next.js build for Vercel
npm run start            # Start production server locally

# Deployment
git push origin main     # Automatic deployment via Vercel
vercel --prod           # Manual deployment with Vercel CLI

# Setup & Verification
npm run setup:vercel    # Configure Vercel domain settings
npm run setup:dns       # Configure DNS records in Cloudflare
npm run setup:check     # Verify all services are configured
```

## 📁 Deployment Configuration Files

```
axis6-mvp/
├── vercel.json                      # Vercel configuration
├── next.config.ts                   # Next.js configuration
├── .env.example                     # Environment variables template
└── scripts/
    ├── configure-vercel.js          # Vercel domain configuration
    └── configure-dns.js             # DNS records configuration
```

## 🔒 Security Configuration

### Headers Configuration

Security headers are configured in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### Environment Variables Security

⚠️ **NEVER commit**:
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_TOKEN`
- `CLOUDFLARE_API_TOKEN`
- `RESEND_API_KEY`

✅ **Safe to expose** (prefixed with `NEXT_PUBLIC_`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

## 📊 Monitoring

### Vercel Analytics

- Built-in analytics in Vercel dashboard
- Real User Monitoring (Web Vitals)
- Function execution metrics
- Error tracking

### Performance Monitoring

- Vercel automatically tracks Core Web Vitals
- Check performance in Vercel dashboard → Analytics
- Set up alerts for performance degradation

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### Environment Variables Not Working
- Verify variables are set in Vercel dashboard
- Check for typos in variable names
- Ensure `NEXT_PUBLIC_` prefix for client-side variables

#### Domain Not Working
```bash
# Verify DNS configuration
npm run setup:check

# Check DNS propagation
nslookup axis6.app
dig axis6.app
```

#### Deployment Not Triggering
- Check Vercel GitHub integration
- Verify branch protection rules
- Check Vercel deployment settings

## 🔄 Deployment Workflow

1. **Development**: Work in feature branches
2. **Testing**: Create PR for preview deployment
3. **Review**: Test preview URL from Vercel
4. **Production**: Merge to main for automatic deployment

### Branch Strategy

```
main (production) → axis6.app
  ↑
feature branches → Preview deployments
```

## 📞 Support

### Deployment Issues

1. Check Vercel deployment logs
2. Verify environment variables
3. Check DNS configuration with `npm run setup:check`
4. Review this documentation

### Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- Vercel Dashboard: Check project settings
- DNS Status: Use `npm run setup:check`

---

**Important Note**: This project deploys **ONLY on Vercel**. Cloudflare is used exclusively for DNS management, not for hosting or deployment.

**Last Updated**: Project configured for Vercel-only deployment