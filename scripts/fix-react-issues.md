# Fix React Component Issues

## Problem
The build is failing due to syntax errors in temperament questionnaire components.

## Solution

### Step 1: Fix EnhancedTemperamentQuestionnaire.tsx

1. Open `components/psychology/EnhancedTemperamentQuestionnaire.tsx`
2. Ensure the file ends properly with:
```tsx
      </motion.div>
    </div>
  )
}
```

3. Check for any missing imports at the top of the file
4. Verify all JSX is properly closed

### Step 2: Fix TemperamentQuestionnaire.tsx

1. Open `components/psychology/TemperamentQuestionnaire.tsx`
2. Ensure the file ends properly with:
```tsx
      </motion.div>
    </div>
  )
}
```

3. Check for any missing imports at the top of the file
4. Verify all JSX is properly closed

### Step 3: Alternative Fix

If the files are corrupted, recreate them:

```bash
# Backup current files
cp components/psychology/EnhancedTemperamentQuestionnaire.tsx components/psychology/EnhancedTemperamentQuestionnaire.tsx.backup
cp components/psychology/TemperamentQuestionnaire.tsx components/psychology/TemperamentQuestionnaire.tsx.backup

# Remove corrupted files
rm components/psychology/EnhancedTemperamentQuestionnaire.tsx
rm components/psychology/TemperamentQuestionnaire.tsx

# Recreate from backup
cp components/psychology/EnhancedTemperamentQuestionnaire.tsx.backup components/psychology/EnhancedTemperamentQuestionnaire.tsx
cp components/psychology/TemperamentQuestionnaire.tsx.backup components/psychology/TemperamentQuestionnaire.tsx
```

### Step 4: Test Build

```bash
npm run build
```

## Database Fix

After fixing the React issues, run the database fix:

1. Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
2. Copy and paste the contents of `scripts/EMERGENCY_FIX_ALL_ISSUES.sql`
3. Execute the script

This will fix:
- 404 errors for `get_dashboard_data_optimized`
- 500 errors for `/api/time-blocks`
- 400 errors for `axis6_axis_activities`
- Missing database functions and tables
