#!/bin/bash

# AXIS6 Database Deployment Script
# This script helps deploy the database schema to Supabase

echo "🚀 AXIS6 Database Deployment Script"
echo "=================================="
echo ""
echo "This script will help you deploy the database schema to Supabase."
echo ""
echo "IMPORTANT: You need to manually execute the SQL script in Supabase SQL Editor."
echo ""
echo "Steps:"
echo "1. Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql"
echo "2. Click 'New Query'"
echo "3. Copy the contents of scripts/deploy-migrations.sql"
echo "4. Paste it into the SQL Editor"
echo "5. Click 'Run'"
echo ""
echo "The script is idempotent and safe to run multiple times."
echo ""

# Check if the deployment script exists
if [ ! -f "scripts/deploy-migrations.sql" ]; then
    echo "❌ Error: scripts/deploy-migrations.sql not found!"
    exit 1
fi

echo "✅ Deployment script found: scripts/deploy-migrations.sql"
echo ""
echo "📋 Script contents (first 10 lines):"
head -10 scripts/deploy-migrations.sql
echo "..."
echo ""
echo "📝 Full script size: $(wc -l < scripts/deploy-migrations.sql) lines"
echo ""
echo "🔗 Direct link to Supabase SQL Editor:"
echo "https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql"
echo ""
echo "After running the script, the 404 error should be resolved."
echo "The axis6_checkins table and all other AXIS6 tables will be created."
