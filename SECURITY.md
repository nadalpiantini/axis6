# 🔒 AXIS6 Security Policy

## 🚨 Reporting Security Vulnerabilities

If you discover a security vulnerability, please **DO NOT** open a public issue. 
Instead, send details to: security@axis6.sujeto10.com

## 🛡️ Security Best Practices

### 1. Environment Variables

#### ✅ DO:
- Store all sensitive data in `.env.local` (never commit this file)
- Use `.env.example` as a template with placeholder values
- Rotate keys regularly (every 90 days minimum)
- Use different keys for development/staging/production

#### ❌ DON'T:
- Commit real credentials to version control
- Share service role keys publicly
- Use the same keys across environments
- Log sensitive data to console

### 2. Authentication & Authorization

#### Current Implementation:
- **Supabase Auth**: Email/password authentication
- **Row Level Security (RLS)**: Database-level access control
- **Session Management**: Secure cookie-based sessions
- **Middleware Protection**: Route-level authentication checks

#### Security Measures:
```typescript
// Always verify user authentication
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return redirect('/login')
}

// Never trust client-side user data
// Always fetch fresh user data from Supabase
```

### 3. Input Validation

#### All user inputs MUST be validated:
```typescript
// Example validation schema (to be implemented)
const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100)
})
```

### 4. Rate Limiting

#### Endpoints requiring rate limiting:
- `/login` - 5 attempts per 15 minutes
- `/register` - 3 accounts per hour per IP
- `/api/*` - 100 requests per minute
- Password reset - 3 attempts per hour

### 5. Security Headers

#### Required headers (configured in vercel.json):
```json
{
  "headers": [
    {
      "key": "Content-Security-Policy",
      "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    },
    {
      "key": "Strict-Transport-Security",
      "value": "max-age=31536000; includeSubDomains"
    },
    {
      "key": "X-Content-Type-Options",
      "value": "nosniff"
    },
    {
      "key": "X-Frame-Options",
      "value": "DENY"
    },
    {
      "key": "X-XSS-Protection",
      "value": "1; mode=block"
    },
    {
      "key": "Referrer-Policy",
      "value": "strict-origin-when-cross-origin"
    }
  ]
}
```

### 6. Database Security

#### Supabase RLS Policies:
- Users can only read/write their own data
- Categories are read-only for all authenticated users
- Streaks are calculated server-side via stored procedures
- All tables use `user_id` for row-level isolation

### 7. API Security

#### Protected API Routes:
```typescript
// Always check authentication in API routes
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Process request...
}
```

### 8. CSRF Protection

#### Implementation (to be added):
- Generate CSRF tokens for all forms
- Validate tokens on server-side actions
- Use SameSite cookie attribute

### 9. Data Protection

#### Sensitive Data Handling:
- Never log passwords or tokens
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper session timeout (30 minutes)

### 10. Dependency Security

#### Regular Updates:
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

## 🔐 Security Checklist for PRs

Before merging any PR, ensure:

- [ ] No credentials in code
- [ ] All inputs validated
- [ ] Authentication checks in place
- [ ] Rate limiting implemented (where needed)
- [ ] No sensitive data in logs
- [ ] Dependencies updated
- [ ] Security headers configured
- [ ] CSRF protection active
- [ ] Error messages don't leak information
- [ ] Tests include security scenarios

## 📊 Security Monitoring

### What to Monitor:
- Failed login attempts
- Unusual API usage patterns
- Database query anomalies
- Error rates and types
- Session hijacking attempts

### Tools:
- **Sentry**: Error tracking and monitoring
- **Vercel Analytics**: Traffic patterns
- **Supabase Logs**: Database and auth events

## 🚀 Incident Response Plan

### If a security breach occurs:

1. **Immediate Actions**:
   - Rotate all affected credentials
   - Disable compromised accounts
   - Enable maintenance mode if needed

2. **Investigation**:
   - Review logs to understand scope
   - Identify attack vector
   - Document timeline of events

3. **Communication**:
   - Notify affected users within 72 hours
   - Provide clear remediation steps
   - Update security measures

4. **Post-Incident**:
   - Conduct security audit
   - Update security policies
   - Implement additional safeguards

## 📝 Security Update Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-20 | 1.0.0 | Initial security policy |
| 2025-01-20 | 1.0.1 | Removed exposed credentials from docs |

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Vercel Security](https://vercel.com/docs/security)

---

**Last Updated**: January 20, 2025
**Version**: 1.0.1
**Contact**: security@axis6.sujeto10.com