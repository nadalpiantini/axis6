#!/bin/bash

# AXIS6 - Sentry Setup Script
# This script helps configure Sentry for error monitoring and performance tracking

set -e  # Exit on any error

echo "🔧 AXIS6 Sentry Setup"
echo "===================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq not found. Install with: brew install jq${NC}"
fi

# Function to prompt for input with default
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

echo "Please provide your Sentry configuration details:"
echo ""

# Get Sentry configuration
prompt_with_default "Sentry DSN" "" "SENTRY_DSN"
prompt_with_default "Sentry Auth Token" "" "SENTRY_AUTH_TOKEN"
prompt_with_default "Sentry Organization" "axis6" "SENTRY_ORG"
prompt_with_default "Sentry Project" "axis6-production" "SENTRY_PROJECT"

# Validate DSN format
if [[ ! "$SENTRY_DSN" =~ ^https://.*@.*\.ingest\.sentry\.io/[0-9]+$ ]] && [[ ! "$SENTRY_DSN" =~ ^https://.*@sentry\.io/[0-9]+$ ]]; then
    echo -e "${RED}Error: Invalid Sentry DSN format${NC}"
    echo "Expected format: https://[key]@[org].ingest.sentry.io/[project-id]"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Configuration validated${NC}"
echo ""

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    cp .env.example .env.local
fi

# Update .env.local with Sentry configuration
echo "Updating .env.local with Sentry configuration..."

# Use sed to update or add Sentry variables
update_env_var() {
    local file="$1"
    local var_name="$2"
    local var_value="$3"
    
    if grep -q "^${var_name}=" "$file"; then
        # Update existing variable
        sed -i.bak "s|^${var_name}=.*|${var_name}=${var_value}|" "$file"
    else
        # Add new variable
        echo "${var_name}=${var_value}" >> "$file"
    fi
}

update_env_var ".env.local" "NEXT_PUBLIC_SENTRY_DSN" "$SENTRY_DSN"
update_env_var ".env.local" "SENTRY_DSN" "$SENTRY_DSN" 
update_env_var ".env.local" "SENTRY_AUTH_TOKEN" "$SENTRY_AUTH_TOKEN"
update_env_var ".env.local" "SENTRY_ORG" "$SENTRY_ORG"
update_env_var ".env.local" "SENTRY_PROJECT" "$SENTRY_PROJECT"

# Clean up backup files
rm -f .env.local.bak

echo -e "${GREEN}✓ .env.local updated${NC}"

# Create Sentry properties file for CLI
cat > .sentryclirc << EOF
[defaults]
org=${SENTRY_ORG}
project=${SENTRY_PROJECT}

[auth]
token=${SENTRY_AUTH_TOKEN}
EOF

echo -e "${GREEN}✓ .sentryclirc created${NC}"

# Create or update sentry.properties for webpack plugin
cat > sentry.properties << EOF
defaults.url=https://sentry.io/
defaults.org=${SENTRY_ORG}
defaults.project=${SENTRY_PROJECT}
auth.token=${SENTRY_AUTH_TOKEN}
EOF

echo -e "${GREEN}✓ sentry.properties created${NC}"

# Add to .gitignore if not already there
GITIGNORE_ENTRIES=(
    ".sentryclirc"
    "sentry.properties"
    ".env.local"
    ".env*.local"
)

for entry in "${GITIGNORE_ENTRIES[@]}"; do
    if ! grep -q "^${entry}$" .gitignore 2>/dev/null; then
        echo "$entry" >> .gitignore
    fi
done

echo -e "${GREEN}✓ Updated .gitignore${NC}"

echo ""
echo "🎉 Sentry configuration complete!"
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Deploy to Vercel with env vars:"
echo "   vercel env add NEXT_PUBLIC_SENTRY_DSN production"
echo "   vercel env add SENTRY_AUTH_TOKEN production" 
echo "3. Monitor dashboard at: https://sentry.io/organizations/${SENTRY_ORG}/projects/${SENTRY_PROJECT}/"
echo ""

# Test Sentry configuration
echo -e "${YELLOW}Testing Sentry configuration...${NC}"
if command -v npm &> /dev/null; then
    echo "Building project to test Sentry integration..."
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Build successful with Sentry integration${NC}"
    else
        echo -e "${RED}⚠ Build failed - check your configuration${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Setup complete! Check the Sentry dashboard for incoming events.${NC}"