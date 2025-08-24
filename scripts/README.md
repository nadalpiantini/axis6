# 🔧 AXIS6 Deployment Scripts

Automated scripts to help you deploy your AXIS6 MVP to production with all optimizations.

## Available Scripts

### 🔍 setup-sentry.sh
**Purpose**: Configure Sentry error monitoring for production

**Usage**:
```bash
chmod +x scripts/setup-sentry.sh
./scripts/setup-sentry.sh
```

**What it does**:
- ✅ Prompts for Sentry DSN and Auth Token
- ✅ Updates `.env.local` with Sentry configuration
- ✅ Creates `.sentryclirc` and `sentry.properties` files
- ✅ Tests the configuration with a build
- ✅ Updates `.gitignore` to protect secrets

**Prerequisites**: 
- Sentry account created
- Next.js project with Sentry DSN

---

### 🗄️ setup-supabase.sh
**Purpose**: Link project to Supabase and apply performance optimizations

**Usage**:
```bash
chmod +x scripts/setup-supabase.sh
./scripts/setup-supabase.sh
```

**What it does**:
- ✅ Links local project to Supabase remote database
- ✅ Applies performance indexes from migrations
- ✅ Enables Realtime for key tables (checkins, streaks)
- ✅ Verifies Row Level Security policies
- ✅ Tests database connection and performance

**Prerequisites**:
- Supabase CLI installed (`npm install -g supabase`)
- Supabase project created
- Project reference ID

---

### 🚀 deploy-vercel.sh
**Purpose**: Complete Vercel deployment with environment variables

**Usage**:
```bash
chmod +x scripts/deploy-vercel.sh
./scripts/deploy-vercel.sh
```

**What it does**:
- ✅ Checks Vercel CLI authentication
- ✅ Links to Vercel project (if needed)
- ✅ Sets up all required environment variables
- ✅ Creates optimized `vercel.json` configuration
- ✅ Deploys to production
- ✅ Provides post-deployment checklist

**Prerequisites**:
- Vercel CLI installed (`npm install -g vercel`)
- Vercel account with project created
- Environment variables ready (from previous scripts)

## Quick Start Deployment

Run all scripts in sequence for complete deployment:

```bash
# 1. Set up error monitoring
./scripts/setup-sentry.sh

# 2. Configure database
./scripts/setup-supabase.sh

# 3. Deploy to production
./scripts/deploy-vercel.sh
```

## Environment Variables Handled

The scripts will configure these environment variables:

### Required for Production
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

### Optional (Recommended)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`
- `NEXT_PUBLIC_APP_VERSION`

## Troubleshooting

### Script Permission Denied
```bash
chmod +x scripts/*.sh
```

### Sentry Setup Fails
- Verify DSN format: `https://[key]@[org].ingest.sentry.io/[project-id]`
- Check Auth Token has correct permissions

### Supabase Link Fails  
- Verify project reference ID
- Check network connection
- Ensure Supabase CLI is logged in: `supabase login`

### Vercel Deploy Fails
- Check if logged into Vercel: `vercel whoami`  
- Verify all environment variables are set
- Check build logs for specific errors

## Manual Alternatives

If scripts fail, you can run commands manually:

### Manual Sentry Setup
```bash
# Add to .env.local
NEXT_PUBLIC_SENTRY_DSN=your-dsn
SENTRY_AUTH_TOKEN=your-token
```

### Manual Supabase Setup
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### Manual Vercel Deploy
```bash
vercel login
vercel link  
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... add other variables
vercel --prod
```

## Script Output

All scripts provide:
- ✅ **Colored output** for better readability
- ✅ **Progress indicators** showing what's being done
- ✅ **Error handling** with helpful messages
- ✅ **Success confirmation** with next steps
- ✅ **Validation** of configurations

## Security Notes

These scripts will:
- ❌ **Never commit secrets** to git
- ✅ **Update .gitignore** automatically  
- ✅ **Validate input formats** before setting
- ✅ **Use secure file permissions** for config files

---

**Happy Deploying! 🚀**