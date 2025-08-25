# Supabase Authentication Configuration for Production

## Manual Configuration Required

Since Supabase auth settings cannot be updated programmatically, these need to be configured manually through the Supabase Dashboard.

## URLs to Update

### 1. Site URL
- **Current**: `http://localhost:6789`
- **Update to**: `https://axis6.app`
- **Location**: Project Settings → Authentication → Site URL

### 2. Redirect URLs
Add the following allowed redirect URLs:
- `https://axis6.app/auth/callback`
- `https://axis6.app/auth/confirm`
- `https://axis6.app/auth/reset-password`
- `https://axis6.app/dashboard` (post-auth redirect)

### 3. Additional Allowed Origins (if using custom domains)
- `https://axis6.app`
- `https://www.axis6.app` (if www redirect is configured)

## Configuration Steps

1. **Go to Supabase Dashboard**:
   https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/settings/auth

2. **Update Site URL**:
   - Find "Site URL" field
   - Change from `http://localhost:6789` to `https://axis6.app`

3. **Update Redirect URLs**:
   - Find "Redirect URLs" section
   - Add production URLs listed above
   - Keep localhost URLs for development

4. **Email Templates** (if customized):
   - Confirm templates use {{ .SiteURL }} variable
   - Test password reset and email confirmation flows

## Verification

After updating:
1. Test user registration flow: https://axis6.app/auth/register
2. Test login flow: https://axis6.app/auth/login  
3. Test password reset: https://axis6.app/auth/forgot-password
4. Test email confirmation (if applicable)

## Current Auth Configuration Status

✅ **Environment Variables**: All set in Vercel
✅ **API Routes**: Deployed and responding
⚠️  **Site URL**: Needs manual update to production domain
⚠️  **Redirect URLs**: Need production URLs added
⚠️  **Email Templates**: May reference localhost

## Impact if Not Updated

- Users will get "Invalid redirect URL" errors
- Email links will point to localhost instead of production
- OAuth providers (if configured) will fail
- Password reset emails will be broken

## After Configuration

Run the verification script to test auth flows:
```bash
node scripts/verify-auth-production.js
```