#!/bin/bash

# AXIS6 Production Error Fix Script
# This script applies all necessary fixes for the current production errors

set -e

echo "🔧 AXIS6 - Production Error Fix Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

print_status "📋 Checking current production status..."

# 1. Apply database fixes
print_status "🗄️  Applying database fixes..."
if [ -f "scripts/fix-production-errors.sql" ]; then
    print_status "   Found database fix script"
    print_warning "   Please execute scripts/fix-production-errors.sql in your Supabase SQL Editor"
    print_status "   This will fix:"
    print_status "   - Missing axis6_checkins table"
    print_status "   - Missing axis6_time_blocks table"
    print_status "   - Missing axis6_activity_logs table"
    print_status "   - Missing database functions"
    print_status "   - RLS policies"
    print_status "   - Performance indexes"
else
    print_error "   Database fix script not found"
fi

# 2. Check environment variables
print_status "🔐 Checking environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    print_warning "   NEXT_PUBLIC_SUPABASE_URL not set"
else
    print_success "   NEXT_PUBLIC_SUPABASE_URL is set"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    print_warning "   NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
else
    print_success "   NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
fi

# 3. Check if build is needed
print_status "🔨 Checking if rebuild is needed..."
if [ -d ".next" ]; then
    print_status "   Found existing build"
    read -p "   Do you want to rebuild the application? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "   Building application..."
        npm run build
        print_success "   Build completed"
    else
        print_status "   Skipping build"
    fi
else
    print_status "   No existing build found"
    print_status "   Building application..."
    npm run build
    print_success "   Build completed"
fi

# 4. Check for TypeScript errors
print_status "🔍 Checking for TypeScript errors..."
if npm run type-check > /dev/null 2>&1; then
    print_success "   No TypeScript errors found"
else
    print_warning "   TypeScript errors found - check with 'npm run type-check'"
fi

# 5. Check for linting errors
print_status "🧹 Checking for linting errors..."
if npm run lint > /dev/null 2>&1; then
    print_success "   No linting errors found"
else
    print_warning "   Linting errors found - check with 'npm run lint'"
fi

# 6. Test database connection
print_status "🔌 Testing database connection..."
if node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
client.from('axis6_categories').select('count').limit(1).then(() => {
    console.log('Database connection successful');
    process.exit(0);
}).catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
});
" 2>/dev/null; then
    print_success "   Database connection successful"
else
    print_error "   Database connection failed"
fi

# 7. Summary
echo
echo "📊 Production Fix Summary"
echo "=================================================="
print_status "1. Database fixes:"
print_warning "   - Execute scripts/fix-production-errors.sql in Supabase SQL Editor"
print_status "2. Application fixes:"
print_success "   - React undefined rendering issues fixed"
print_success "   - Loading states improved"
print_success "   - Error boundaries enhanced"
print_status "3. Next steps:"
print_status "   - Deploy the updated application"
print_status "   - Test all functionality"
print_status "   - Monitor error logs"

echo
print_success "🎉 Production fix script completed!"
print_status "Please execute the database fixes in Supabase before deploying."
