#!/bin/bash

# AXIS6 Complete Database Deployment Script
# This script helps deploy the complete database schema to Supabase

echo "🚀 AXIS6 Complete Database Deployment Script"
echo "============================================"
echo ""
echo "This script will help you deploy the COMPLETE database schema to Supabase."
echo "This includes all missing tables that are causing 404, 400, and 406 errors."
echo ""
echo "IMPORTANT: You need to manually execute the SQL script in Supabase SQL Editor."
echo ""
echo "Steps:"
echo "1. Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql"
echo "2. Click 'New Query'"
echo "3. Copy the contents of scripts/deploy-complete-database.sql"
echo "4. Paste it into the SQL Editor"
echo "5. Click 'Run'"
echo ""
echo "The script is idempotent and safe to run multiple times."
echo ""

# Check if the deployment script exists
if [ ! -f "scripts/deploy-complete-database.sql" ]; then
    echo "❌ Error: scripts/deploy-complete-database.sql not found!"
    exit 1
fi

echo "✅ Complete deployment script found: scripts/deploy-complete-database.sql"
echo ""
echo "📋 Script contents (first 10 lines):"
head -10 scripts/deploy-complete-database.sql
echo "..."
echo ""
echo "📝 Full script size: $(wc -l < scripts/deploy-complete-database.sql) lines"
echo ""
echo "🔗 Direct link to Supabase SQL Editor:"
echo "https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql"
echo ""
echo "This will fix ALL the following errors:"
echo "✅ 404 errors for axis6_checkins"
echo "✅ 400 errors for axis6_profiles"
echo "✅ 406 errors for axis6_temperament_profiles"
echo "✅ 400 errors for axis6_temperament_responses"
echo "✅ WebSocket connection failures"
echo "✅ React component errors"
echo ""
echo "After running the script, all tables will be created with proper RLS policies"
echo "and realtime subscriptions enabled."
