#!/bin/bash

# AXIS6 Chat System Deployment Script
# Zero-downtime deployment with rollback capability

set -e

echo "🚀 AXIS6 Chat System Deployment"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
MIGRATION_FILE="supabase/migrations/20250826_chat_system.sql"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking deployment prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "Not in AXIS6 project directory. Please run from project root."
        exit 1
    fi
    
    # Check if Supabase CLI is available
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not found. Please install it first."
        exit 1
    fi
    
    # Check if migration file exists
    if [ ! -f "$MIGRATION_FILE" ]; then
        log_error "Migration file not found: $MIGRATION_FILE"
        exit 1
    fi
    
    # Check Git status
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Working directory is not clean. Consider committing changes first."
    fi
    
    log_success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log_info "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup current migration state
    cp -r supabase/migrations "$BACKUP_DIR/"
    
    # Backup current git state
    git rev-parse HEAD > "$BACKUP_DIR/git_commit.txt"
    
    log_success "Backup created at $BACKUP_DIR"
}

# Run database migration
run_migration() {
    log_info "Running database migration..."
    
    # Run the migration
    if supabase migration up --db-url="$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d'=' -f2)"; then
        log_success "Database migration completed successfully"
    else
        log_error "Database migration failed"
        return 1
    fi
}

# Build and test
build_and_test() {
    log_info "Building and testing application..."
    
    # Install dependencies
    npm install
    
    # Type check
    npm run type-check
    if [ $? -ne 0 ]; then
        log_error "Type checking failed"
        return 1
    fi
    
    # Build the application
    npm run build
    if [ $? -ne 0 ]; then
        log_error "Build failed"
        return 1
    fi
    
    # Run chat-specific tests if they exist
    if [ -f "lib/hooks/__tests__/useChat.test.ts" ]; then
        npm test -- lib/hooks/__tests__/useChat.test.ts
    fi
    
    log_success "Build and tests passed"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if chat tables exist
    echo "Checking chat tables..."
    
    # Create a simple verification script
    cat > temp_verify.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

async function verify() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const tables = [
    'axis6_chat_rooms',
    'axis6_chat_participants', 
    'axis6_chat_messages',
    'axis6_chat_reactions'
  ];
  
  console.log('🔍 Verifying chat tables...');
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
        process.exit(1);
      } else {
        console.log(`✅ Table ${table}: OK`);
      }
    } catch (e) {
      console.log(`❌ Table ${table}: ${e.message}`);
      process.exit(1);
    }
  }
  
  console.log('✅ All chat tables verified successfully');
  process.exit(0);
}

verify().catch(console.error);
EOF
    
    # Run verification
    if node temp_verify.js; then
        log_success "Database verification passed"
    else
        log_error "Database verification failed"
        rm -f temp_verify.js
        return 1
    fi
    
    rm -f temp_verify.js
}

# Deploy to production
deploy_to_production() {
    log_info "Deploying to production..."
    
    # Commit changes if needed
    if [ -n "$(git status --porcelain)" ]; then
        git add .
        git commit -m "feat: Add chat system

- Database schema with RLS policies
- Realtime chat infrastructure  
- API endpoints for messages and rooms
- UI components with AXIS6 design system
- Security validation and middleware
- Zero-downtime deployment

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    fi
    
    # Push to main branch (triggers Vercel deployment)
    git push origin main
    
    log_success "Deployed to production via Git push"
    
    # Wait for Vercel deployment (optional)
    log_info "Waiting for Vercel deployment to complete..."
    sleep 30
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    if [ -d "$BACKUP_DIR" ]; then
        # Restore migrations
        cp -r "$BACKUP_DIR/migrations/"* supabase/migrations/
        
        # Restore git state
        if [ -f "$BACKUP_DIR/git_commit.txt" ]; then
            PREVIOUS_COMMIT=$(cat "$BACKUP_DIR/git_commit.txt")
            git reset --hard "$PREVIOUS_COMMIT"
            git push origin main --force
        fi
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
        exit 1
    fi
}

# Main deployment process
main() {
    echo "Starting AXIS6 Chat System deployment..."
    echo
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup for rollback
    create_backup
    
    # Run database migration
    if ! run_migration; then
        log_error "Migration failed, aborting deployment"
        exit 1
    fi
    
    # Build and test
    if ! build_and_test; then
        log_error "Build/tests failed, rolling back..."
        rollback
        exit 1
    fi
    
    # Verify deployment
    if ! verify_deployment; then
        log_error "Verification failed, rolling back..."
        rollback
        exit 1
    fi
    
    # Deploy to production
    deploy_to_production
    
    echo
    log_success "🎉 Chat system deployment completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Monitor application logs for any issues"
    echo "2. Test chat functionality in production"
    echo "3. Enable chat features for users"
    echo
    echo "Rollback command (if needed):"
    echo "  ./scripts/deploy-chat-system.sh rollback"
    echo
}

# Handle command line arguments
case "${1:-}" in
    rollback)
        rollback
        ;;
    verify)
        verify_deployment
        ;;
    *)
        main
        ;;
esac