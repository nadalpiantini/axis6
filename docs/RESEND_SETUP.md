# Resend Email Integration Setup

## Overview
AXIS6 uses Resend for transactional email delivery. This guide covers complete setup and configuration.

## Features Implemented
- ✅ Welcome emails for new users
- ✅ Password reset emails
- ✅ Weekly stats emails (planned)
- ✅ Test email functionality
- ✅ Beautiful React Email templates
- ✅ Development mode with console logging

## Quick Setup

### 1. Install Dependencies
```bash
# Already installed in package.json
npm install resend @react-email/components @react-email/render
```

### 2. Environment Variables
Add these to your `.env.local`:

```bash
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@axis6.app

# Optional: From name customization
RESEND_FROM_NAME=AXIS6
```

### 3. Get Resend API Key
1. Sign up at https://resend.com
2. Go to API Keys section
3. Create a new API key with full access
4. Copy the key to your environment variables

### 4. Configure Domain (Production)
For production emails, you need to verify your domain:

```bash
# Run the automated setup script
npm run setup:resend
```

This script will:
- Create/configure your domain in Resend
- Generate DNS records for Cloudflare
- Test email delivery
- Save configuration for future use

## Email Templates

### Available Templates
1. **Welcome Email** (`/lib/email/templates/welcome.tsx`)
   - Sent after successful registration
   - Introduces AXIS6 features
   - Guides users to first check-in

2. **Password Reset** (`/lib/email/templates/password-reset.tsx`)
   - Sent when password reset is requested
   - Secure reset link with expiration
   - Security warnings and help info

3. **Weekly Stats** (`/lib/email/templates/weekly-stats.tsx`)
   - Planned for engagement campaigns
   - Personal progress summary
   - Motivational content

### Template Features
- 📱 Mobile-responsive design
- 🎨 AXIS6 brand styling
- 🌍 Tailwind CSS for consistent styling
- 🔒 Security-focused messaging
- 📊 Data visualization for stats

## Email Service Usage

### Sending Emails via API
```typescript
// POST /api/email
const response = await fetch('/api/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'welcome',
    data: {
      name: 'User Name',
      email: 'user@example.com'
    },
    skipAuth: true // For welcome/reset emails
  })
})
```

### Direct Service Usage
```typescript
import { emailService } from '@/lib/email/service'

// Send welcome email
await emailService.sendWelcome({
  name: 'User Name',
  email: 'user@example.com'
})

// Send password reset
await emailService.sendPasswordReset({
  name: 'User Name',
  email: 'user@example.com',
  resetUrl: 'https://axis6.app/auth/reset-password?token=...'
})
```

## Integration Points

### 1. Registration Flow
- **File**: `/app/auth/register/page.tsx`
- **Trigger**: After successful Supabase user creation
- **Email**: Welcome email with onboarding guidance

### 2. Password Reset Flow
- **File**: `/app/auth/forgot/page.tsx`
- **Trigger**: When user requests password reset
- **Email**: Secure reset link with instructions

### 3. API Routes
- **Route**: `/app/api/email/route.ts`
- **Methods**: POST (send), GET (config status)
- **Features**: Type-safe email sending, error handling

## Development Mode

When `RESEND_API_KEY` is not set:
- Emails are logged to console instead of sent
- All email functions return success
- Perfect for development/testing

Example console output:
```
📧 [DEV] Welcome email would be sent to: user@example.com
📧 [DEV] Password reset email would be sent to: user@example.com
📧 [DEV] Reset URL: https://axis6.app/auth/reset-password?token=...
```

## Production Deployment

### DNS Configuration for axis6.app
The `npm run setup:resend` script will generate records like:

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

Type: TXT  
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ...

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@axis6.app
```

Add these to Cloudflare DNS and verification will complete automatically.

### Vercel Environment Variables
```bash
# Set in Vercel dashboard or via CLI
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM_EMAIL
```

## Error Handling

### Non-Blocking Design
- Email failures never block user flows
- Registration continues even if welcome email fails
- Password reset works with Supabase default emails as fallback

### Logging
```typescript
// Success
console.log('📧 Welcome email sent:', result.data?.id)

// Warnings (non-blocking)
console.warn('Failed to send welcome email:', emailError)

// Errors (with fallback)
console.error('❌ Failed to send password reset email:', error)
```

## Testing

### Test Email API
```bash
# Send test email
curl -X POST http://localhost:6789/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "data": { "to": "test@example.com" },
    "skipAuth": true
  }'
```

### Check Configuration
```bash
# Get email config status
curl http://localhost:6789/api/email/config
```

Returns:
```json
{
  "configured": true,
  "fromEmail": "noreply@axis6.app",
  "hasApiKey": true
}
```

## Monitoring & Analytics

### Resend Dashboard
- View email delivery stats at resend.com
- Track opens, clicks, bounces
- Monitor domain reputation

### Email Tags
All emails are tagged for analytics:
```typescript
tags: [
  { name: 'category', value: 'authentication' },
  { name: 'type', value: 'welcome' }
]
```

## Future Enhancements

### Planned Features
- [ ] Engagement email campaigns
- [ ] Weekly/monthly progress reports
- [ ] Achievement celebration emails
- [ ] Streak milestone congratulations
- [ ] Re-engagement sequences for inactive users

### Email Preferences
- [ ] User preference center
- [ ] Unsubscribe management
- [ ] Frequency controls
- [ ] Category-specific preferences

## Troubleshooting

### Common Issues

**Email not sending in development:**
- Check RESEND_API_KEY is set correctly
- Verify API key has correct permissions
- Check console for development mode messages

**Domain verification failing:**
- Ensure DNS records are added exactly as shown
- Wait up to 24 hours for DNS propagation
- Check Cloudflare proxy settings (should be DNS only for email records)

**Template styling issues:**
- Verify @react-email/components import paths
- Check Tailwind classes are supported in email
- Test template rendering in browser first

### Support Resources
- Resend Documentation: https://resend.com/docs
- React Email Documentation: https://react.email
- AXIS6 Email Templates: `/lib/email/templates/`

---

*Last updated: January 2025*
*Email integration status: ✅ Complete and tested*