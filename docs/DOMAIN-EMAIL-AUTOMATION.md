# AXIS6 Domain & Email Automation Guide

## 🚀 Complete Automation Setup

This guide provides complete automation for configuring DNS, domains, and email for AXIS6.

## Prerequisites

### 1. Required Accounts
- **Cloudflare**: Domain DNS management
- **Vercel**: Hosting and domain configuration  
- **Resend**: Email service provider
- **Supabase**: Already configured (backend)

### 2. API Credentials Needed

Copy `.env.automation.example` to `.env.local` and add:

```bash
# Cloudflare
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# Vercel
VERCEL_TOKEN=your_token_here

# Resend
RESEND_API_KEY=re_your_key_here

# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=https://nvpnhqhjttgwfwvkgmpk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

## 🎯 Quick Start (One Command)

Run everything with a single command:

```bash
npm run setup:all
```

Or manually:

```bash
node scripts/setup-all.js
```

This will:
1. ✅ Configure Cloudflare DNS records
2. ✅ Set up Vercel domain and redirects
3. ✅ Create Resend email domain
4. ✅ Configure Supabase email templates

## 📋 Individual Scripts

Run specific configurations separately:

### DNS Configuration (Cloudflare)
```bash
node scripts/configure-dns.js
```
- Creates A record: @ → 76.76.21.21
- Creates CNAME: www → axis6.app
- Adds SPF and DMARC records

### Domain Setup (Vercel)
```bash
node scripts/configure-vercel.js
```
- Connects axis6.app domain
- Sets up 301 redirect: www → apex
- Verifies SSL certificates

### Email Domain (Resend)
```bash
node scripts/configure-resend.js
```
- Creates email domain
- Retrieves DNS records for verification
- Sets up SPF, DKIM, DMARC

### Supabase Email Templates
```bash
node scripts/configure-supabase-email.js
```
- Generates email templates
- Provides SMTP configuration
- Creates template files

## 🔄 MCP Server Integration

### Configure MCP Servers

The `.mcp.json` file is already configured for all services:

```json
{
  "mcpServers": {
    "cloudflare": { ... },
    "vercel": { ... },
    "resend": { ... },
    "supabase": { ... }
  }
}
```

### Using MCP with Claude Code

1. Install MCP servers globally:
```bash
npm install -g @cloudflare/mcp-server-cloudflare
npm install -g @vercel/mcp
npm install -g mcp-server-resend
npm install -g @supabase/mcp-server-supabase
```

2. Claude Code will automatically use these servers when the `.mcp.json` file is present.

## 📊 Verification & Testing

### Check DNS Propagation
```bash
# Check A record
dig axis6.app

# Check CNAME
dig www.axis6.app

# Check TXT records
dig TXT axis6.app
```

### Test Email Sending
```bash
# After DNS propagation (1-24 hours)
node scripts/test-email.js
```

### Verify Domain Redirect
```bash
# Should redirect to https://axis6.app
curl -I https://www.axis6.app
```

## 🛠️ Manual Steps Required

Some configurations still require manual dashboard access:

### 1. Supabase Email Templates
1. Go to: [Supabase Dashboard](https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/settings/auth)
2. Navigate to Authentication → Email Templates
3. Update each template with HTML from `supabase/email-templates/`

### 2. Supabase SMTP Settings
1. Go to Authentication → SMTP Settings
2. Enable "Custom SMTP"
3. Enter:
   - Host: `smtp.resend.com`
   - Port: `587`
   - Username: `resend`
   - Password: `[Your Resend API Key]`

### 3. DNS Verification (if needed)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Verify all DNS records are properly configured
3. Check DNS propagation status

## 📈 Monitoring & Logs

### View Setup Report
```bash
cat scripts/setup-report.json
```

### Check Configuration Status
```bash
node scripts/check-status.js
```

## 🚨 Troubleshooting

### DNS Not Propagating
- Wait 1-24 hours for global propagation
- Clear local DNS cache: `sudo dscacheutil -flushcache` (macOS)
- Use different DNS servers (8.8.8.8, 1.1.1.1)

### Email Not Sending
1. Verify domain in Resend dashboard
2. Check DNS records are correctly configured
3. Ensure SMTP settings in Supabase are correct
4. Check Resend API key is valid

### Domain Not Accessible
1. Verify DNS records in Cloudflare
2. Check Vercel domain configuration
3. Ensure SSL certificates are issued
4. Wait for DNS propagation

## 🔐 Security Notes

- **Never commit** `.env.local` or API keys
- Store production keys in Vercel environment variables
- Use separate API keys for development/production
- Rotate keys regularly
- Enable 2FA on all service accounts

## 📚 Resources

- [Cloudflare API Docs](https://developers.cloudflare.com/api)
- [Vercel API Docs](https://vercel.com/docs/rest-api)
- [Resend Documentation](https://resend.com/docs)
- [Supabase Email Auth](https://supabase.com/docs/guides/auth/auth-email)

## 🎯 Next Steps

After running the automation:

1. **Wait for DNS propagation** (1-24 hours)
2. **Verify domain** at https://axis6.app
3. **Test email** by creating a test user
4. **Configure production** environment variables in Vercel
5. **Monitor** email delivery in Resend dashboard

## 💡 Pro Tips

- Run `setup-all.js` for complete automation
- Use individual scripts for targeted fixes
- Keep `.env.automation.example` updated
- Document any manual changes
- Test in development before production

---

**Questions?** Check the setup report at `scripts/setup-report.json` for detailed status and next steps.