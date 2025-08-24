# AXIS6 - Supabase Initialization Guide

## ✅ Your Current Status
- **Connection**: ✅ Working (nvpnhqhjttgwfwvkgmpk.supabase.co)
- **Database Tables**: ✅ Created
- **Environment Variables**: ✅ Configured

## 🔧 Required Settings in Supabase Dashboard

### 1. Go to Authentication Settings
Visit: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/auth/settings

### 2. Configure URL Settings
In the **URL Configuration** section:

**Site URL**:
```
http://localhost:6789
```

**Redirect URLs** (add all of these):
```
http://localhost:6789/**
http://localhost:6789/auth/callback
http://localhost:6789/dashboard
http://localhost:6789/auth/onboarding
https://axis6.app/**
https://axis6.app/auth/callback
https://axis6.sujeto10.com/**
https://axis6.sujeto10.com/auth/callback
```

### 3. Email Settings (IMPORTANT)
In the **Email Auth** section:

- ✅ **Enable Email Signup**: ON
- ❌ **Confirm Email**: OFF (for development)
- ✅ **Secure Email Change**: OFF (for development)
- ✅ **Enable Email Change**: ON

### 4. Auth Providers
In the **Auth Providers** section:
- ✅ **Email**: Enabled

### 5. Security Settings
In the **Security** section:
- **Enable RLS**: Should be ON for all tables
- **Enable Row Security**: ON

## 🚀 Quick Test Commands

### Test Database Connection:
```bash
npm run verify:supabase
```

### Test Authentication Flow:
```bash
npm run test:auth
```

### Run Playwright Tests:
```bash
npx playwright test tests/e2e/auth.spec.ts --project=chromium
```

## 🔍 Troubleshooting

### If users can't register:
1. Check email confirmation is OFF in Supabase Dashboard
2. Verify redirect URLs include your local development URL
3. Check the auth.users table in Supabase

### If login redirects fail:
1. Ensure `/auth/callback` route exists
2. Check middleware.ts is not blocking the callback
3. Verify NEXT_PUBLIC_SUPABASE_URL is correct

### If RLS blocks access:
Run this in Supabase SQL Editor:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename LIKE 'axis6_%';

-- If missing, run the RLS setup from EJECUTAR_EN_SUPABASE.sql
```

## 📝 Database Schema Status

The following tables should exist:
- ✅ axis6_profiles
- ✅ axis6_categories (6 records)
- ✅ axis6_checkins
- ✅ axis6_streaks
- ✅ axis6_daily_stats
- ✅ axis6_mantras
- ✅ axis6_user_mantras

## 🎯 Next Steps

1. **Verify Auth Settings** in Supabase Dashboard (link above)
2. **Test Registration**: 
   ```bash
   npm run dev
   # Visit http://localhost:6789/auth/register
   ```
3. **Check Email Service**: 
   - Development: Uses Supabase's built-in email (may be slow)
   - Production: Configure Resend.com for better deliverability

## 🔐 Production Checklist

Before going to production:
- [ ] Enable email confirmation
- [ ] Configure custom SMTP (Resend)
- [ ] Set production redirect URLs
- [ ] Enable RLS on all tables
- [ ] Review security policies
- [ ] Set up backup strategy

## 📧 Email Testing

To test without real emails:
1. Use Supabase Dashboard > Auth > Users
2. Create users manually
3. Or use the Supabase Auth UI for testing

## 🆘 Support

If issues persist:
1. Check Supabase service status: https://status.supabase.com/
2. Review logs: Dashboard > Logs > Auth
3. Check browser console for errors
4. Verify network tab shows correct API calls