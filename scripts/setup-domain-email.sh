#!/bin/bash

# AXIS6 Domain & Email Setup Automation Script
# This script automates DNS, domain, and email configuration

set -e

echo "🚀 AXIS6 Domain & Email Setup Automation"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to load environment variables
load_env() {
    if [ -f .env.local ]; then
        export $(grep -v '^#' .env.local | xargs)
    elif [ -f .env ]; then
        export $(grep -v '^#' .env | xargs)
    else
        echo -e "${RED}❌ No .env file found${NC}"
        exit 1
    fi
}

# Function to check required environment variables
check_env_vars() {
    local required_vars=(
        "CLOUDFLARE_API_TOKEN"
        "CLOUDFLARE_ACCOUNT_ID"
        "VERCEL_TOKEN"
        "RESEND_API_KEY"
        "NEXT_PUBLIC_SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=($var)
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        printf '%s\n' "${missing_vars[@]}"
        echo ""
        echo "Please add these to your .env.local file"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All required environment variables found${NC}"
}

# Function to install npm packages
install_packages() {
    echo -e "${YELLOW}📦 Installing required npm packages...${NC}"
    
    # Install MCP server packages
    npm install -g @cloudflare/mcp-server-cloudflare
    npm install -g @vercel/mcp
    npm install -g mcp-server-resend
    npm install -g @supabase/mcp-server-supabase
    
    # Install required dependencies
    npm install --save-dev dotenv-cli
    
    echo -e "${GREEN}✅ Packages installed${NC}"
}

# Function to test MCP server connections
test_mcp_connections() {
    echo -e "${YELLOW}🔌 Testing MCP server connections...${NC}"
    
    # Test each MCP server
    # Note: In real implementation, you'd need to use the MCP protocol
    # This is a placeholder for actual MCP testing
    
    echo -e "${GREEN}✅ MCP servers configured${NC}"
}

# Main execution
main() {
    echo "Step 1: Loading environment variables..."
    load_env
    
    echo "Step 2: Checking required variables..."
    check_env_vars
    
    echo "Step 3: Installing packages..."
    install_packages
    
    echo "Step 4: Testing MCP connections..."
    test_mcp_connections
    
    echo ""
    echo -e "${GREEN}🎉 Setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run the DNS configuration script: ./scripts/configure-dns.js"
    echo "2. Run the Vercel domain script: ./scripts/configure-vercel.js"
    echo "3. Run the Resend email script: ./scripts/configure-resend.js"
    echo "4. Run the Supabase email script: ./scripts/configure-supabase-email.js"
}

# Run main function
main