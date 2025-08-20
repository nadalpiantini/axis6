# Supabase Setup Guide for AXIS6 (Multi-Tenant Project)

## Important: Multi-Tenant Architecture
This project uses a shared Supabase instance with multiple SaaS applications. All AXIS6 tables and functions use the `axis6_` prefix to maintain isolation from other projects.

## Prerequisites
- Access to existing Supabase project: `nqzhxukuvmdlpewqytpv`
- Access to Supabase Dashboard: https://supabase.com/dashboard/project/nqzhxukuvmdlpewqytpv

## Step 1: Access Your Shared Supabase Project

1. Go to your project dashboard: https://supabase.com/dashboard/project/nqzhxukuvmdlpewqytpv
2. Navigate to SQL Editor
3. Verify you have permission to create tables with `axis6_` prefix

## Step 2: Run Database Migration

1. Go to SQL Editor in Supabase Dashboard
2. Copy the entire content from `supabase/migrations/001_initial_schema.sql`
3. Paste and run in SQL Editor
4. Verify tables are created with `axis6_` prefix

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Get your credentials from your Supabase project:
   - Go to: https://supabase.com/dashboard/project/nqzhxukuvmdlpewqytpv/settings/api
   - Copy:
     - **Project URL**: `https://nqzhxukuvmdlpewqytpv.supabase.co`
     - **anon public key**: Copy from "Project API keys" section
     - **service_role key**: Copy from "Project API keys" section (keep secret!)

3. Update `.env.local` with these values

## Step 4: Enable Authentication

1. In Supabase Dashboard, go to Authentication → Providers
2. Enable Email provider (enabled by default)
3. Configure email templates if needed (Settings → Auth → Email Templates)

## Step 5: Configure Row Level Security (RLS)

RLS policies are already included in the migration. They ensure:
- Users can only see/edit their own data
- Categories are public read
- Profiles are created automatically on signup

## Step 6: Test Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser console and check for Supabase connection errors
3. Test registration/login flow

## Step 7: Seed Initial Data (Optional)

If you want test data, run this in SQL Editor:

```sql
-- Insert test user (use Auth → Users to create properly)
-- Then insert test checkins for that user

-- Example: Insert today's checkins for a user
INSERT INTO axis6_checkins (user_id, category_id, completed_at)
SELECT 
  'YOUR_USER_ID',
  id,
  CURRENT_DATE
FROM axis6_categories
WHERE slug IN ('physical', 'mental', 'emotional');
```

## Troubleshooting

### Connection Issues
- Verify `.env.local` values are correct
- Check if Supabase project is active
- Ensure no typos in environment variables

### Authentication Issues
- Check email confirmation settings
- Verify RLS policies are enabled
- Check Supabase Auth logs

### Database Issues
- Verify migration ran successfully
- Check table names have `axis6_` prefix
- Review RLS policies in Table Editor

## Next Steps

1. Configure custom domain (Production)
2. Set up email provider (Production)
3. Enable additional auth providers (Google, GitHub)
4. Configure backup strategy
5. Set up monitoring and alerts

## Useful Commands

```bash
# Link local project to your shared Supabase instance
npx supabase link --project-ref nqzhxukuvmdlpewqytpv

# Push local migrations
npx supabase db push

# Pull remote schema changes
npx supabase db pull

# Generate TypeScript types from your project
npx supabase gen types typescript --project-ref nqzhxukuvmdlpewqytpv > lib/supabase/types.ts
```

## Multi-Tenant Considerations

### Table Isolation
- All AXIS6 tables use `axis6_` prefix
- RLS policies ensure users only see AXIS6 data
- Functions are prefixed with `axis6_` to avoid conflicts

### Cleanup (if needed)
To remove only AXIS6 tables from the shared project:
```sql
-- WARNING: This will delete all AXIS6 data!
DROP TABLE IF EXISTS axis6_daily_stats CASCADE;
DROP TABLE IF EXISTS axis6_streaks CASCADE;
DROP TABLE IF EXISTS axis6_checkins CASCADE;
DROP TABLE IF EXISTS axis6_categories CASCADE;
DROP TABLE IF EXISTS axis6_profiles CASCADE;
DROP FUNCTION IF EXISTS axis6_calculate_streak CASCADE;
DROP FUNCTION IF EXISTS axis6_update_daily_stats CASCADE;
```

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Project issues: Create issue in repository