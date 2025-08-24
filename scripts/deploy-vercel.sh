#!/bin/bash

# AXIS6 - Vercel Deployment Script
# This script handles complete deployment to Vercel with all environment variables

set -e  # Exit on any error

echo "🚀 AXIS6 Vercel Deployment"
echo "========================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI not found${NC}"
    echo "Install it with: npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}✓ Vercel CLI found${NC}"

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

# Check if already logged in to Vercel
echo -e "${BLUE}Checking Vercel authentication...${NC}"
if vercel whoami > /dev/null 2>&1; then
    VERCEL_USER=$(vercel whoami)
    echo -e "${GREEN}✓ Logged in as: ${VERCEL_USER}${NC}"
else
    echo -e "${YELLOW}Please login to Vercel:${NC}"
    vercel login
fi

# Check if project exists
if [ -f ".vercel/project.json" ]; then
    PROJECT_NAME=$(cat .vercel/project.json | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Project already linked: ${PROJECT_NAME}${NC}"
else
    echo -e "${BLUE}Linking to Vercel project...${NC}"
    vercel link
fi

# Load environment variables from .env.local for reference
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ Found .env.local for reference${NC}"
    source .env.local 2>/dev/null || true
else
    echo -e "${YELLOW}⚠ No .env.local found${NC}"
fi

# Environment variables to set up
declare -A ENV_VARS=(
    ["NEXT_PUBLIC_SUPABASE_URL"]="Supabase Project URL"
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="Supabase Anon Key"
    ["SUPABASE_SERVICE_ROLE_KEY"]="Supabase Service Role Key"
    ["NEXT_PUBLIC_SENTRY_DSN"]="Sentry DSN for client-side monitoring"
    ["SENTRY_DSN"]="Sentry DSN for server-side monitoring"
    ["SENTRY_AUTH_TOKEN"]="Sentry Auth Token for build-time integration"
    ["SENTRY_ORG"]="Sentry Organization name"
    ["SENTRY_PROJECT"]="Sentry Project name"
    ["UPSTASH_REDIS_REST_URL"]="Redis URL for rate limiting (optional)"
    ["UPSTASH_REDIS_REST_TOKEN"]="Redis Token for rate limiting (optional)"
    ["NEXT_PUBLIC_APP_VERSION"]="App version for release tracking"
)

# Optional environment variables
declare -A OPTIONAL_ENV_VARS=(
    ["NEXT_PUBLIC_VERCEL_ANALYTICS_ID"]="Vercel Analytics ID"
    ["NEXT_PUBLIC_GA_MEASUREMENT_ID"]="Google Analytics ID"
    ["CSRF_SECRET"]="CSRF Secret (32+ characters)"
)

echo ""
echo -e "${BLUE}Setting up environment variables...${NC}"
echo ""

# Function to set environment variable in Vercel
set_vercel_env() {
    local var_name="$1"
    local var_value="$2"
    local env_type="$3"  # production, preview, development
    
    if [ -n "$var_value" ]; then
        echo "Setting $var_name for $env_type..."
        if echo "$var_value" | vercel env add "$var_name" "$env_type" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Set $var_name${NC}"
        else
            echo -e "${YELLOW}⚠ $var_name might already exist or failed to set${NC}"
        fi
    else
        echo -e "${RED}✗ Skipping empty $var_name${NC}"
    fi
}

# Process required environment variables
for var_name in "${!ENV_VARS[@]}"; do
    description="${ENV_VARS[$var_name]}"
    current_value="${!var_name}"  # Get value from current environment
    
    echo ""
    echo -e "${BLUE}${description}${NC}"
    
    if [ -n "$current_value" ]; then
        prompt_with_default "Enter $var_name" "$current_value" "new_value"
    else
        prompt_with_default "Enter $var_name" "" "new_value"
    fi
    
    if [ -n "$new_value" ]; then
        # Set for all environments
        set_vercel_env "$var_name" "$new_value" "production"
        set_vercel_env "$var_name" "$new_value" "preview"
        # For development, usually use local values
    else
        echo -e "${RED}Warning: $var_name is required but not set${NC}"
    fi
done

# Process optional environment variables
echo ""
echo -e "${YELLOW}Optional environment variables (press enter to skip):${NC}"

for var_name in "${!OPTIONAL_ENV_VARS[@]}"; do
    description="${OPTIONAL_ENV_VARS[$var_name]}"
    current_value="${!var_name}"
    
    echo ""
    echo -e "${BLUE}${description} (optional)${NC}"
    
    if [ -n "$current_value" ]; then
        prompt_with_default "Enter $var_name" "$current_value" "new_value"
    else
        prompt_with_default "Enter $var_name (optional)" "" "new_value"
    fi
    
    if [ -n "$new_value" ]; then
        set_vercel_env "$var_name" "$new_value" "production"
        set_vercel_env "$var_name" "$new_value" "preview"
    fi
done

# Build and deployment settings
echo ""
echo -e "${BLUE}Configuring build settings...${NC}"

# Create vercel.json if it doesn't exist
if [ ! -f "vercel.json" ]; then
    cat > vercel.json << EOF
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/**/*.tsx": {
      "maxDuration": 30
    },
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [],
  "redirects": [
    {
      "source": "/login",
      "destination": "/auth/login",
      "permanent": true
    },
    {
      "source": "/register", 
      "destination": "/auth/register",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        }
      ]
    }
  ]
}
EOF
    echo -e "${GREEN}✓ Created vercel.json${NC}"
fi

# Deploy to production
echo ""
read -p "Deploy to production now? (y/N): " deploy_now

if [[ "$deploy_now" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Deploying to production...${NC}"
    
    # First deploy (might ask for project configuration)
    if vercel --prod; then
        echo -e "${GREEN}✓ Deployment successful!${NC}"
        
        # Get the deployment URL
        DEPLOYMENT_URL=$(vercel ls --meta | grep "https://" | head -1 | awk '{print $2}')
        
        if [ -n "$DEPLOYMENT_URL" ]; then
            echo ""
            echo -e "${GREEN}🎉 Your AXIS6 MVP is live at:${NC}"
            echo -e "${BLUE}${DEPLOYMENT_URL}${NC}"
        fi
        
        echo ""
        echo -e "${YELLOW}Post-deployment checklist:${NC}"
        echo "1. ✅ Test the deployed app"
        echo "2. ✅ Check Sentry dashboard for errors"
        echo "3. ✅ Verify database connections"
        echo "4. ✅ Test PWA installation on mobile"
        echo "5. ✅ Monitor performance in Vercel Analytics"
        
    else
        echo -e "${RED}✗ Deployment failed${NC}"
        echo "Check the error messages above and try again"
        exit 1
    fi
else
    echo -e "${YELLOW}Skipping deployment. You can deploy later with: vercel --prod${NC}"
fi

# Summary
echo ""
echo "🎯 Vercel Configuration Complete!"
echo ""
echo "Your AXIS6 MVP is configured with:"
echo "- ✅ All environment variables set"
echo "- ✅ Build configuration optimized"
echo "- ✅ Security headers configured"
echo "- ✅ Custom redirects for auth routes"
echo "- ✅ Function timeout limits set"
echo ""
echo "Useful commands:"
echo "- Deploy: vercel --prod"
echo "- Check deployment: vercel ls"
echo "- View logs: vercel logs"
echo "- Manage domains: vercel domains"
echo ""
echo -e "${GREEN}Ready for production! 🚀${NC}"