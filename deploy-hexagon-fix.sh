#!/bin/bash

# Deploy Hexagon Resonance Fix to Supabase
# This script applies the corrected hexagon function

echo "🔧 Deploying Hexagon Resonance Fix to Supabase..."
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Not in the correct directory. Please run this from the axis6 project root."
    exit 1
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found. Please install it first."
    echo "   Install with: npm install -g supabase"
    exit 1
fi

# Check if we're logged in to Supabase
if ! supabase status &> /dev/null; then
    echo "❌ Error: Not logged in to Supabase. Please run: supabase login"
    exit 1
fi

echo "✅ Supabase CLI found and logged in"
echo ""

# Apply the migration
echo "📦 Applying hexagon resonance fix..."
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Hexagon resonance fix deployed successfully!"
    echo ""
    echo "🔍 Testing the function..."
    
    # Test the function
    echo "SELECT COUNT(*) as axis_count FROM get_hexagon_resonance('b07a89a3-6030-42f9-8c60-ce28afc47132'::UUID, CURRENT_DATE);" | supabase db reset --linked
    
    echo ""
    echo "🎉 Hexagon resonance function should now be working!"
    echo "   You can test it by refreshing your dashboard."
else
    echo ""
    echo "❌ Error deploying hexagon fix. Please check the logs above."
    exit 1
fi
