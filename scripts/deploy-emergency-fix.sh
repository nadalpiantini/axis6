#!/bin/bash

# =====================================================
# AXIS6 EMERGENCY FIX DEPLOYMENT SCRIPT
# =====================================================
# This script applies the emergency database fixes for 400/500 errors
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "🚨 Starting AXIS6 Emergency Fix Deployment"
print_status "This will fix all 400/500 errors in production"

# Step 1: Apply database fixes
print_status "Step 1: Applying database schema fixes..."
print_warning "Please execute the following SQL in Supabase Dashboard:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new"
echo "2. Copy and paste the contents of: scripts/EMERGENCY_FIX_400_500_ERRORS.sql"
echo "3. Click 'Run' to execute the SQL"
echo ""
read -p "Press Enter after you've executed the SQL in Supabase..."

# Step 2: Deploy code changes
print_status "Step 2: Deploying code fixes to production..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Deploy to production
print_status "Deploying to Vercel production..."
vercel --prod

print_success "✅ Emergency fix deployment completed!"
print_status "The following issues have been resolved:"
echo "  • 400 errors on axis6_checkins (constraint issues)"
echo "  • 500 errors on /api/time-blocks (missing table)"
echo "  • 400 errors on axis6_profiles (constraint issues)"
echo "  • Missing database functions and RLS policies"

print_status "Please test the application to verify all errors are resolved."
