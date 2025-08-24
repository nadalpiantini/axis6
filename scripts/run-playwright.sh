#!/bin/bash

# AXIS6 Playwright Test Runner Script
# Provides easy commands for different testing scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:6789"
PRODUCTION_URL="https://axis6.app"
STAGING_URL="https://staging-axis6.vercel.app"

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

log_header() {
    echo -e "\n${PURPLE}🎯 $1${NC}"
    echo -e "${PURPLE}$(echo $1 | sed 's/./=/g')${NC}\n"
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed"
        exit 1
    fi
    
    if ! npm list @playwright/test &> /dev/null; then
        log_error "Playwright is not installed. Run: npm install"
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

# Start development server
start_dev_server() {
    log_info "Starting development server..."
    
    # Check if server is already running
    if curl -s "$BASE_URL" > /dev/null 2>&1; then
        log_success "Development server is already running at $BASE_URL"
        return 0
    fi
    
    # Start server in background
    npm run dev > /dev/null 2>&1 &
    DEV_SERVER_PID=$!
    
    # Wait for server to be ready
    log_info "Waiting for server to start..."
    for i in {1..30}; do
        if curl -s "$BASE_URL" > /dev/null 2>&1; then
            log_success "Development server started at $BASE_URL"
            return 0
        fi
        sleep 1
    done
    
    log_error "Failed to start development server"
    kill $DEV_SERVER_PID 2>/dev/null || true
    exit 1
}

# Install Playwright browsers
install_browsers() {
    log_info "Installing Playwright browsers..."
    npx playwright install
    log_success "Browsers installed"
}

# Run specific test suite
run_test_suite() {
    local suite=$1
    local env=${2:-"local"}
    local browser=${3:-"chromium"}
    
    # Set base URL based on environment
    case $env in
        "production"|"prod")
            export PLAYWRIGHT_BASE_URL=$PRODUCTION_URL
            ;;
        "staging")
            export PLAYWRIGHT_BASE_URL=$STAGING_URL
            ;;
        *)
            export PLAYWRIGHT_BASE_URL=$BASE_URL
            start_dev_server
            ;;
    esac
    
    log_header "Running $suite tests on $env environment"
    log_info "Base URL: $PLAYWRIGHT_BASE_URL"
    log_info "Browser: $browser"
    
    case $suite in
        "auth"|"authentication")
            npx playwright test tests/e2e/auth.spec.ts --project=$browser
            ;;
        "dashboard")
            npx playwright test tests/e2e/dashboard.spec.ts --project=$browser
            ;;
        "journey"|"user-journey")
            npx playwright test tests/e2e/user-journey.spec.ts --project=$browser
            ;;
        "performance"|"perf")
            npx playwright test tests/e2e/performance.spec.ts --project=$browser
            ;;
        "accessibility"|"a11y")
            npx playwright test tests/e2e/accessibility.spec.ts --project=$browser
            ;;
        "security"|"sec")
            npx playwright test tests/e2e/security.spec.ts --project=$browser
            ;;
        "visual"|"regression")
            npx playwright test tests/e2e/visual-regression.spec.ts --project=$browser
            ;;
        "smoke")
            npx playwright test tests/e2e/auth.spec.ts tests/e2e/dashboard.spec.ts --project=$browser --grep="should load|should register|should login"
            ;;
        "all"|"full")
            npx playwright test --project=$browser
            ;;
        *)
            log_error "Unknown test suite: $suite"
            show_help
            exit 1
            ;;
    esac
}

# Run cross-browser tests
run_cross_browser() {
    local suite=${1:-"smoke"}
    local env=${2:-"local"}
    
    log_header "Running cross-browser tests ($suite suite)"
    
    for browser in "chromium" "firefox" "webkit"; do
        log_info "Testing on $browser..."
        run_test_suite "$suite" "$env" "$browser" || log_warning "$browser tests failed"
    done
}

# Run mobile tests
run_mobile_tests() {
    local env=${1:-"local"}
    
    log_header "Running mobile tests"
    
    # Set base URL
    case $env in
        "production"|"prod")
            export PLAYWRIGHT_BASE_URL=$PRODUCTION_URL
            ;;
        "staging")
            export PLAYWRIGHT_BASE_URL=$STAGING_URL
            ;;
        *)
            export PLAYWRIGHT_BASE_URL=$BASE_URL
            start_dev_server
            ;;
    esac
    
    npx playwright test tests/e2e/auth.spec.ts tests/e2e/dashboard.spec.ts \
        --project="Mobile Chrome" --project="Mobile Safari"
}

# Run performance audit
run_performance_audit() {
    local env=${1:-"local"}
    
    log_header "Running performance audit"
    
    case $env in
        "production"|"prod")
            export PLAYWRIGHT_BASE_URL=$PRODUCTION_URL
            ;;
        "staging")
            export PLAYWRIGHT_BASE_URL=$STAGING_URL
            ;;
        *)
            export PLAYWRIGHT_BASE_URL=$BASE_URL
            start_dev_server
            ;;
    esac
    
    # Run performance tests with detailed reporting
    npx playwright test tests/e2e/performance.spec.ts --project=chromium --reporter=html
    
    log_success "Performance audit completed. Check playwright-report/index.html for results."
}

# Run accessibility audit
run_accessibility_audit() {
    local env=${1:-"local"}
    
    log_header "Running accessibility audit"
    
    case $env in
        "production"|"prod")
            export PLAYWRIGHT_BASE_URL=$PRODUCTION_URL
            ;;
        "staging")
            export PLAYWRIGHT_BASE_URL=$STAGING_URL
            ;;
        *)
            export PLAYWRIGHT_BASE_URL=$BASE_URL
            start_dev_server
            ;;
    esac
    
    npx playwright test tests/e2e/accessibility.spec.ts --project=chromium --reporter=html
    
    log_success "Accessibility audit completed. Check playwright-report/index.html for results."
}

# Run security tests
run_security_tests() {
    local env=${1:-"local"}
    
    log_header "Running security tests"
    
    case $env in
        "production"|"prod")
            export PLAYWRIGHT_BASE_URL=$PRODUCTION_URL
            ;;
        "staging")
            export PLAYWRIGHT_BASE_URL=$STAGING_URL
            ;;
        *)
            export PLAYWRIGHT_BASE_URL=$BASE_URL
            start_dev_server
            ;;
    esac
    
    npx playwright test tests/e2e/security.spec.ts --project=chromium --reporter=html
    
    log_success "Security tests completed. Check playwright-report/index.html for results."
}

# Generate comprehensive report
generate_report() {
    log_header "Generating comprehensive test report"
    
    # Run full test suite with custom reporter
    npx playwright test --reporter=./tests/utils/reporter.ts
    
    log_success "Comprehensive report generated in axis6-test-reports/"
    log_info "HTML Report: axis6-test-reports/index.html"
    log_info "JSON Data: axis6-test-reports/results.json"
    log_info "Markdown Summary: axis6-test-reports/summary.md"
}

# Debug mode with UI
run_debug() {
    local suite=${1:-"auth"}
    
    log_header "Running tests in debug mode"
    log_info "Opening Playwright UI for interactive debugging"
    
    export PLAYWRIGHT_BASE_URL=$BASE_URL
    start_dev_server
    
    case $suite in
        "auth") npx playwright test tests/e2e/auth.spec.ts --ui ;;
        "dashboard") npx playwright test tests/e2e/dashboard.spec.ts --ui ;;
        "journey") npx playwright test tests/e2e/user-journey.spec.ts --ui ;;
        *) npx playwright test $suite --ui ;;
    esac
}

# Show test results
show_results() {
    log_header "Opening test results"
    
    if [[ -f "playwright-report/index.html" ]]; then
        if command -v open &> /dev/null; then
            open playwright-report/index.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open playwright-report/index.html
        else
            log_info "Open playwright-report/index.html in your browser"
        fi
    else
        log_warning "No test results found. Run tests first."
    fi
    
    if [[ -f "axis6-test-reports/index.html" ]]; then
        if command -v open &> /dev/null; then
            open axis6-test-reports/index.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open axis6-test-reports/index.html
        else
            log_info "Open axis6-test-reports/index.html in your browser"
        fi
    fi
}

# Clean up test artifacts
cleanup() {
    log_info "Cleaning up test artifacts..."
    
    rm -rf playwright-report/
    rm -rf test-results/
    rm -rf axis6-test-reports/
    
    # Kill dev server if running
    if [[ -n "${DEV_SERVER_PID:-}" ]]; then
        kill $DEV_SERVER_PID 2>/dev/null || true
    fi
    
    log_success "Cleanup completed"
}

# Show help
show_help() {
    echo -e "${CYAN}AXIS6 Playwright Test Runner${NC}"
    echo -e "${CYAN}============================${NC}\n"
    
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  auth [env] [browser]       Run authentication tests"
    echo "  dashboard [env] [browser]  Run dashboard tests"
    echo "  journey [env] [browser]    Run user journey tests"
    echo "  performance [env]          Run performance audit"
    echo "  accessibility [env]        Run accessibility audit"
    echo "  security [env]             Run security tests"
    echo "  visual [env] [browser]     Run visual regression tests"
    echo "  smoke [env] [browser]      Run smoke tests"
    echo "  all [env] [browser]        Run all tests"
    echo ""
    echo "  cross-browser [suite] [env]  Run tests across browsers"
    echo "  mobile [env]                 Run mobile device tests"
    echo ""
    echo "  debug [suite]           Run tests in debug mode with UI"
    echo "  report                  Generate comprehensive report"
    echo "  results                 Open test results in browser"
    echo ""
    echo "  install                 Install Playwright browsers"
    echo "  cleanup                 Clean up test artifacts"
    echo "  help                    Show this help message"
    echo ""
    echo "Environments:"
    echo "  local (default)         Test against local development server"
    echo "  staging                 Test against staging environment"
    echo "  production/prod         Test against production environment"
    echo ""
    echo "Browsers:"
    echo "  chromium (default)      Google Chrome/Chromium"
    echo "  firefox                 Mozilla Firefox"
    echo "  webkit                  Safari/WebKit"
    echo ""
    echo "Examples:"
    echo "  $0 auth                        # Run auth tests locally"
    echo "  $0 performance production      # Run perf tests on production"
    echo "  $0 cross-browser smoke staging # Run smoke tests on staging across browsers"
    echo "  $0 debug dashboard             # Debug dashboard tests interactively"
    echo "  $0 all local firefox           # Run all tests locally on Firefox"
}

# Main script logic
main() {
    case ${1:-help} in
        "install")
            check_dependencies
            install_browsers
            ;;
        "auth"|"authentication")
            check_dependencies
            run_test_suite "auth" "${2:-local}" "${3:-chromium}"
            ;;
        "dashboard")
            check_dependencies
            run_test_suite "dashboard" "${2:-local}" "${3:-chromium}"
            ;;
        "journey"|"user-journey")
            check_dependencies
            run_test_suite "journey" "${2:-local}" "${3:-chromium}"
            ;;
        "performance"|"perf")
            check_dependencies
            run_performance_audit "${2:-local}"
            ;;
        "accessibility"|"a11y")
            check_dependencies
            run_accessibility_audit "${2:-local}"
            ;;
        "security"|"sec")
            check_dependencies
            run_security_tests "${2:-local}"
            ;;
        "visual"|"regression")
            check_dependencies
            run_test_suite "visual" "${2:-local}" "${3:-chromium}"
            ;;
        "smoke")
            check_dependencies
            run_test_suite "smoke" "${2:-local}" "${3:-chromium}"
            ;;
        "all"|"full")
            check_dependencies
            run_test_suite "all" "${2:-local}" "${3:-chromium}"
            ;;
        "cross-browser")
            check_dependencies
            run_cross_browser "${2:-smoke}" "${3:-local}"
            ;;
        "mobile")
            check_dependencies
            run_mobile_tests "${2:-local}"
            ;;
        "debug")
            check_dependencies
            run_debug "${2:-auth}"
            ;;
        "report")
            check_dependencies
            generate_report
            ;;
        "results")
            show_results
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Trap to cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"