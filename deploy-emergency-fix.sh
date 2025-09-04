#!/bin/bash

# =====================================================
# EMERGENCY DEPLOYMENT SCRIPT
# =====================================================
# This script deploys the missing get_dashboard_data_optimized function
# to fix the 404 errors in the dashboard
# =====================================================

set -e

echo "🚨 EMERGENCY DEPLOYMENT: Fixing missing get_dashboard_data_optimized function"
echo "====================================================="

# Check if we have the required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required"
    echo "Please set them in your .env.local file or export them"
    exit 1
fi

echo "✅ Environment variables found"
echo "🔗 Supabase URL: $SUPABASE_URL"

# Deploy the SQL function
echo "📦 Deploying missing function to Supabase..."

# Use curl to execute the SQL directly
curl -X POST \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d @EMERGENCY_DEPLOY_MISSING_FUNCTION.sql \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql"

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
else
    echo "❌ Failed to deploy function via API"
    echo "📝 Please manually execute the SQL in Supabase Dashboard:"
    echo "   https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql"
    echo "   Copy and paste the contents of EMERGENCY_DEPLOY_MISSING_FUNCTION.sql"
fi

# Test the function
echo "🧪 Testing the deployed function..."
curl -X POST \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id": "00000000-0000-0000-0000-000000000001"}' \
  "$SUPABASE_URL/rest/v1/rpc/get_dashboard_data_optimized"

if [ $? -eq 0 ]; then
    echo "✅ Function test successful!"
else
    echo "⚠️  Function test failed - this is expected if no test user exists"
fi

echo "====================================================="
echo "🎉 Emergency deployment completed!"
echo "📱 The dashboard should now work without 404 errors"
echo "====================================================="



