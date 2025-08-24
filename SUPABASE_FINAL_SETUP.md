# ✅ AXIS6 Supabase Setup - FINAL CHECKLIST

## 🎉 What's Working
- ✅ **Database**: All tables created and configured
- ✅ **Categories**: All 6 axes loaded  
- ✅ **Connection**: Successfully connected to Supabase cloud
- ✅ **Environment**: Variables properly configured

## ⚠️ Action Required in Supabase Dashboard

### 🔗 Go to your Supabase Dashboard:
https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/auth/settings

### 1️⃣ URL Configuration Section
Set these exact values:

**Site URL:**
```
http://localhost:6789
```

**Redirect URLs:** (add each on a new line)
```
http://localhost:6789/**
http://localhost:6789/auth/callback
http://localhost:6789/dashboard
http://localhost:6789/auth/onboarding
```

### 2️⃣ Email Auth Section  
**IMPORTANT FOR DEVELOPMENT:**

- **Enable Email Signup**: ✅ ON
- **Confirm email**: ❌ **OFF** (THIS IS CRITICAL FOR LOCAL TESTING)
- **Secure email change**: ❌ OFF
- **Enable email link sign-in**: ❌ OFF

### 3️⃣ Save Changes
Click the "Save" button at the bottom of the page

## 🧪 Test Your Setup

### 1. Start the development server:
```bash
npm run dev
```

### 2. Test Registration:
- Open: http://localhost:6789/auth/register
- Create a test account with:
  - Email: test@example.com
  - Password: TestPass123!
  - Name: Test User

### 3. Expected Behavior:
- ✅ With email confirmation OFF: Immediate redirect to /auth/onboarding or /dashboard
- ❌ With email confirmation ON: Shows "check your email" message (blocks local dev)

## 🔍 Quick Diagnostics

Run this command to verify:
```bash
node scripts/init-supabase.js
```

## 🚨 Common Issues & Fixes

### "Error sending confirmation email"
**Solution**: This is normal if you haven't configured SMTP. Just disable email confirmations for development.

### "User already registered" 
**Solution**: The email already exists. Try a different email or delete the user from Supabase Dashboard > Authentication > Users

### Can't login after registration
**Solution**: 
1. Check email confirmations are OFF
2. Verify redirect URLs include your local URL
3. Check browser console for errors

### RLS blocking access
**Solution**: Check if RLS is enabled on tables. For development, you can temporarily disable RLS from the Table Editor in Supabase.

## 📝 Database is Ready!

Your database has:
- 6 Categories (Physical, Mental, Emotional, Social, Spiritual, Material)
- User profiles system
- Check-in tracking
- Streak calculation
- Daily statistics

## 🎯 You're Ready to Go!

Once you've verified the settings above in Supabase Dashboard, your app should work perfectly:

1. Users can register without email confirmation
2. Immediate login after registration  
3. Dashboard access with full functionality
4. Daily check-ins for all 6 axes
5. Streak tracking

## 🆘 Need Help?

1. Check Supabase Logs: Dashboard > Logs > Auth Logs
2. Browser Console: Check for JavaScript errors
3. Network Tab: Verify API calls to Supabase
4. Run diagnostics: `npm run verify:supabase`

---

**Remember**: The most important setting for local development is turning OFF email confirmation in Supabase Dashboard!