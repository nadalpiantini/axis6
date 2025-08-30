#!/bin/bash

# AXIS6 Emergency Fix Deployment Script
# This script helps deploy the emergency fix for all current issues

echo "🚨 AXIS6 EMERGENCY FIX DEPLOYMENT"
echo "=================================="
echo ""
echo "This script will help you fix ALL current issues:"
echo "✅ Sentry import errors (already fixed in code)"
echo "✅ 404 errors for get_dashboard_data_optimized function"
echo "✅ 400 errors for axis6_profiles table queries"
echo "✅ Missing database functions and indexes"
echo ""
echo "IMPORTANT: You need to manually execute the SQL script in Supabase SQL Editor."
echo ""

# Check if the emergency fix script exists
if [ ! -f "scripts/EMERGENCY_FIX_ALL_ISSUES.sql" ]; then
    echo "❌ Error: scripts/EMERGENCY_FIX_ALL_ISSUES.sql not found!"
    exit 1
fi

echo "✅ Emergency fix script found: scripts/EMERGENCY_FIX_ALL_ISSUES.sql"
echo ""
echo "📋 Steps to deploy:"
echo "1. Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql"
echo "2. Click 'New Query'"
echo "3. Copy the contents of scripts/EMERGENCY_FIX_ALL_ISSUES.sql"
echo "4. Paste it into the SQL Editor"
echo "5. Click 'Run'"
echo ""
echo "📝 Script contents (first 10 lines):"
head -10 scripts/EMERGENCY_FIX_ALL_ISSUES.sql
echo "..."
echo ""
echo "📊 Full script size: $(wc -l < scripts/EMERGENCY_FIX_ALL_ISSUES.sql) lines"
echo ""
echo "🔗 Direct link to Supabase SQL Editor:"
echo "https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql"
echo ""
echo "⚠️  WARNING: This script will:"
echo "   - Drop and recreate all axis6_* tables"
echo "   - Delete all existing data"
echo "   - Create fresh tables with correct structure"
echo "   - Deploy all missing functions"
echo "   - Set up proper RLS policies"
echo ""
echo "🔄 After running the SQL script:"
echo "1. Restart your development server: npm run dev"
echo "2. Test the application"
echo "3. All errors should be resolved"
echo ""
echo "📞 If you need help, check the verification queries at the end of the SQL script"
echo ""

# Show the script location
echo "📁 Script location: $(pwd)/scripts/EMERGENCY_FIX_ALL_ISSUES.sql"
echo ""
echo "🚀 Ready to deploy! Follow the steps above."
