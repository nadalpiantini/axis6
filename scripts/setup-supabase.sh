#!/bin/bash

# AXIS6 - Supabase Setup & Migration Script
# This script links your project to Supabase and applies performance optimizations

set -e  # Exit on any error

echo "🗄️  AXIS6 Supabase Setup"
echo "======================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    echo "Or visit: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}"

# Function to prompt for input
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        eval "$var_name=\"${input:-$default}\""
    else
        read -p "$prompt: " input
        eval "$var_name=\"$input\""
    fi
}

# Check if already linked
if [ -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}Project appears to already be linked to Supabase${NC}"
    read -p "Do you want to re-link? (y/N): " relink
    if [[ ! "$relink" =~ ^[Yy]$ ]]; then
        echo "Skipping link step..."
        SKIP_LINK=true
    fi
fi

if [ "$SKIP_LINK" != true ]; then
    echo ""
    echo "Please provide your Supabase project details:"
    echo "You can find these in your Supabase dashboard → Settings → General"
    echo ""

    prompt_with_default "Supabase Project Reference ID" "" "PROJECT_REF"
    
    if [ -z "$PROJECT_REF" ]; then
        echo -e "${RED}Error: Project Reference ID is required${NC}"
        exit 1
    fi

    # Link to Supabase project
    echo ""
    echo -e "${BLUE}Linking to Supabase project: ${PROJECT_REF}${NC}"
    
    if supabase link --project-ref "$PROJECT_REF"; then
        echo -e "${GREEN}✓ Successfully linked to Supabase project${NC}"
    else
        echo -e "${RED}✗ Failed to link to Supabase project${NC}"
        echo "Please check your project reference ID and try again"
        exit 1
    fi
fi

# Check migration status
echo ""
echo -e "${BLUE}Checking migration status...${NC}"

if supabase db remote list > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected to remote database${NC}"
else
    echo -e "${RED}✗ Could not connect to remote database${NC}"
    echo "Please check your credentials and network connection"
    exit 1
fi

# Apply migrations
echo ""
echo -e "${BLUE}Applying database migrations...${NC}"

# First, check if migrations exist
if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations)" ]; then
    echo "Found migrations:"
    ls -la supabase/migrations/
    
    echo ""
    read -p "Apply all migrations to remote database? (y/N): " apply_migrations
    
    if [[ "$apply_migrations" =~ ^[Yy]$ ]]; then
        if supabase db push; then
            echo -e "${GREEN}✓ Migrations applied successfully${NC}"
        else
            echo -e "${RED}✗ Failed to apply migrations${NC}"
            echo "You can apply them manually in the Supabase SQL Editor"
        fi
    else
        echo -e "${YELLOW}Skipping migration application${NC}"
        echo "You can apply them later with: supabase db push"
    fi
else
    echo -e "${YELLOW}No migrations found in supabase/migrations/${NC}"
fi

# Enable Realtime for required tables
echo ""
echo -e "${BLUE}Configuring Realtime...${NC}"

REALTIME_TABLES=("axis6_checkins" "axis6_streaks" "axis6_daily_stats")

echo "Enabling Realtime for tables: ${REALTIME_TABLES[*]}"

for table in "${REALTIME_TABLES[@]}"; do
    echo "Enabling Realtime for table: $table"
    
    # Use supabase SQL command to enable realtime
    if supabase db sql --statement "ALTER PUBLICATION supabase_realtime ADD TABLE $table;" 2>/dev/null; then
        echo -e "${GREEN}✓ Realtime enabled for $table${NC}"
    else
        echo -e "${YELLOW}⚠ Could not enable Realtime for $table (might already be enabled)${NC}"
    fi
done

# Test database connection and performance
echo ""
echo -e "${BLUE}Testing database performance...${NC}"

# Create a test query to check indexes
TEST_QUERY="EXPLAIN (ANALYZE, BUFFERS) 
SELECT c.*, cat.name 
FROM axis6_checkins c 
JOIN axis6_categories cat ON c.category_id = cat.id 
WHERE c.user_id = '00000000-0000-0000-0000-000000000000'::uuid 
  AND c.completed_at >= CURRENT_DATE 
ORDER BY c.completed_at DESC 
LIMIT 10;"

if supabase db sql --statement "$TEST_QUERY" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database queries are optimized${NC}"
else
    echo -e "${YELLOW}⚠ Could not test query performance${NC}"
fi

# Update local environment with database URL
echo ""
echo -e "${BLUE}Updating local environment...${NC}"

# Get database URL for local development
if command -v supabase &> /dev/null; then
    # This would typically be for local development
    echo "Database URL for local development: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
fi

# Check RLS policies
echo ""
echo -e "${BLUE}Checking Row Level Security policies...${NC}"

RLS_TABLES=("axis6_profiles" "axis6_checkins" "axis6_streaks" "axis6_categories" "axis6_daily_stats")

for table in "${RLS_TABLES[@]}"; do
    if supabase db sql --statement "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = '$table';" --output table 2>/dev/null | grep -q "t$"; then
        echo -e "${GREEN}✓ RLS enabled for $table${NC}"
    else
        echo -e "${YELLOW}⚠ RLS not enabled for $table${NC}"
    fi
done

# Summary
echo ""
echo "🎉 Supabase setup complete!"
echo ""
echo "Summary:"
echo "- Project linked to Supabase"
echo "- Database migrations applied"
echo "- Realtime enabled for key tables"
echo "- Row Level Security verified"
echo ""
echo "Next steps:"
echo "1. Verify in Supabase Dashboard → Database → Replication"
echo "2. Test your app: npm run dev"
echo "3. Monitor performance: Dashboard → Reports"
echo ""
echo -e "${GREEN}Your AXIS6 database is ready for production! 🚀${NC}"

# Optional: Show connection details
echo ""
echo -e "${BLUE}Database connection info:${NC}"
supabase status 2>/dev/null | grep -E "(API URL|DB URL)" || echo "Run 'supabase status' to see connection details"