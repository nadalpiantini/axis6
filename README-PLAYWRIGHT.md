# 🎯 AXIS6 Playwright Testing Suite

Comprehensive end-to-end testing and auditing system for AXIS6 using Playwright.

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
npm run test:e2e:install  # Install Playwright browsers
```

### Run Tests
```bash
# Run all tests
npm run test:e2e

# Run specific test suites
npm run test:e2e:auth          # Authentication tests
npm run test:e2e:dashboard     # Dashboard functionality
npm run test:e2e:performance   # Performance audits
npm run test:e2e:accessibility # Accessibility compliance
npm run test:e2e:security     # Security validation
npm run test:e2e:visual       # Visual regression tests

# Cross-browser testing
npm run test:e2e:cross-browser

# Mobile device testing
npm run test:e2e:mobile

# Interactive debugging
npm run test:e2e:debug
```

## 📁 Test Structure

```
tests/
├── e2e/                          # End-to-end test specs
│   ├── auth.spec.ts             # Authentication flow tests
│   ├── dashboard.spec.ts        # Dashboard functionality tests
│   ├── user-journey.spec.ts     # Complete user journey tests
│   ├── performance.spec.ts      # Performance audits
│   ├── accessibility.spec.ts    # Accessibility compliance
│   ├── security.spec.ts         # Security validation
│   └── visual-regression.spec.ts # Visual regression tests
├── fixtures/                     # Test fixtures and data
│   └── auth-fixtures.ts         # Authentication fixtures
├── utils/                        # Utility functions
│   ├── page-objects.ts          # Page object models
│   └── reporter.ts              # Custom test reporter
├── global-setup.ts              # Global setup before tests
└── global-teardown.ts           # Global cleanup after tests
```

## 🧪 Test Categories

### 1. Authentication Flow Tests
- Landing page navigation
- User registration with validation
- User login with error handling
- Password reset functionality  
- Session management
- Form validation and UX

### 2. Dashboard Functionality Tests
- Dashboard loading and navigation
- Hexagon visualization
- Daily check-ins
- Streak tracking
- Responsiveness
- Error handling
- Data persistence

### 3. User Journey Tests  
- Complete new user onboarding flow
- Returning user experience
- Multi-category check-ins
- Weekly progress patterns
- Error recovery scenarios
- Progressive Web App functionality

### 4. Performance Audits
- Page load performance budgets
- Resource optimization validation
- Runtime performance monitoring
- Network performance testing
- Mobile performance optimization
- Core Web Vitals measurement

### 5. Accessibility Compliance
- Keyboard navigation support
- Screen reader compatibility
- Visual accessibility standards
- Motor accessibility features
- Cognitive accessibility support
- WCAG 2.1 AA compliance

### 6. Security Validation
- Authentication security
- Input validation and XSS prevention
- CSRF protection
- Content Security Policy
- Data privacy compliance
- Session security
- Error handling security

### 7. Visual Regression Tests
- Landing page visuals
- Authentication page layouts
- Dashboard visual consistency
- Responsive design validation
- Interactive state visuals
- Cross-browser visual consistency

## 🔧 Configuration

### Environment Variables
```bash
# Required for testing
PLAYWRIGHT_BASE_URL=http://localhost:6789  # Test target URL
NODE_ENV=test                              # Test environment

# For production testing  
PLAYWRIGHT_BASE_URL=https://axis6.app
NODE_ENV=production
```

### Test Environments
- **Local**: `http://localhost:6789` (default)
- **Staging**: `https://staging-axis6.vercel.app`
- **Production**: `https://axis6.app`

### Browser Support
- **Chromium** (Google Chrome) ✅
- **Firefox** (Mozilla Firefox) ✅
- **WebKit** (Safari) ✅
- **Mobile Chrome** (Android) ✅
- **Mobile Safari** (iOS) ✅

## 📊 Reports and Results

### Viewing Reports
```bash
npm run test:e2e:results  # Open HTML reports in browser
npm run test:e2e:report   # Generate comprehensive report
```

### Report Types
1. **HTML Report**: Interactive test results with screenshots
2. **JSON Report**: Machine-readable test data
3. **Markdown Summary**: Human-readable test summary
4. **JUnit XML**: CI/CD integration format

### Report Locations
- `playwright-report/` - Standard Playwright HTML reports
- `axis6-test-reports/` - Comprehensive custom reports
- `test-results/` - Screenshots, videos, and traces

## 🎨 Advanced Usage

### Testing Specific Environments
```bash
# Test against staging
./scripts/run-playwright.sh auth staging

# Test against production
./scripts/run-playwright.sh performance production

# Cross-browser testing on staging
./scripts/run-playwright.sh cross-browser smoke staging
```

### Debugging Tests
```bash
# Interactive debugging with UI
npm run test:e2e:debug

# Debug specific test suite
./scripts/run-playwright.sh debug dashboard

# Run with verbose logging
PLAYWRIGHT_DEBUG=1 npm run test:e2e:auth
```

### Custom Test Runs
```bash
# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests matching pattern
npx playwright test --grep "should login"

# Run tests on specific browser
npx playwright test --project=firefox

# Run tests in headed mode
npx playwright test --headed

# Record new test
npx playwright codegen localhost:6789
```

## 🏗️ CI/CD Integration

The test suite is integrated with GitHub Actions for:

- **Pull Request Validation**: All tests run on PR creation
- **Cross-Browser Testing**: Tests run across Chrome, Firefox, Safari
- **Mobile Testing**: Tests run on mobile viewports
- **Performance Monitoring**: Daily performance checks on production
- **Visual Regression**: Automated screenshot comparisons
- **Security Scanning**: Automated security validation

### Workflow Triggers
- Push to `main` or `develop` branches
- Pull request creation/updates
- Daily scheduled runs (2 AM UTC)
- Manual dispatch with environment selection

## 📈 Performance Budgets

The test suite enforces performance budgets:

- **Landing Page Load**: < 3 seconds
- **Dashboard Load**: < 4 seconds  
- **First Contentful Paint**: < 1.8 seconds
- **JavaScript Bundle**: < 1MB
- **Images**: < 500KB each
- **API Response Time**: < 200ms

## ♿ Accessibility Standards

Tests validate compliance with:

- **WCAG 2.1 AA** standards
- **Keyboard Navigation** support
- **Screen Reader** compatibility
- **Color Contrast** ratios (4.5:1 minimum)
- **Touch Targets** (44px minimum)
- **Focus Indicators** visible and clear

## 🔒 Security Validations

Security tests check for:

- **Authentication** bypass attempts
- **XSS** vulnerability prevention
- **CSRF** protection implementation
- **Input Validation** on all forms
- **Session Management** security
- **Data Privacy** compliance
- **Error Information** disclosure prevention

## 🚨 Troubleshooting

### Common Issues

**Tests failing with "Server not ready"**
```bash
# Ensure dev server is running
npm run dev
# Wait for http://localhost:6789 to be accessible
```

**Browser installation issues**
```bash
npx playwright install --force
npx playwright install-deps  # Linux only
```

**Visual tests failing**
```bash
# Update visual baselines (use carefully)
npx playwright test --update-snapshots tests/e2e/visual-regression.spec.ts
```

**Tests timing out**
```bash
# Increase timeout in playwright.config.ts
timeout: 60 * 1000  # 60 seconds
```

### Debug Commands
```bash
# Show Playwright version
npx playwright --version

# List installed browsers  
npx playwright list

# Run system requirements check
npx playwright doctor

# Generate test trace
npx playwright test --trace=on

# Open trace viewer
npx playwright show-trace test-results/trace.zip
```

## 🤝 Contributing

When adding new tests:

1. Follow existing page object patterns
2. Use descriptive test names
3. Add proper error handling
4. Include accessibility checks
5. Test across multiple viewports
6. Update documentation

### Test Naming Convention
```typescript
test.describe('Feature Name', () => {
  test('should perform specific action successfully', async () => {
    // Test implementation
  });
  
  test('should handle error case appropriately', async () => {
    // Error case testing
  });
});
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [AXIS6 Testing Guide](./docs/TESTING.md)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Performance Best Practices](https://web.dev/performance/)
- [Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

**🎯 AXIS6 Testing Team** - Ensuring quality, performance, and accessibility across all user experiences.