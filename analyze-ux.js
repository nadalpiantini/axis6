const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyzeAXIS6UX() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  // Create screenshots directory
  const screenshotDir = path.join(__dirname, 'claudedocs', 'ux-analysis-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const analysis = {
    pages: [],
    engagementOpportunities: [],
    hookedModelAnalysis: {
      triggers: [],
      actions: [],
      variableRewards: [],
      investment: []
    }
  };

  try {
    console.log('🚀 Starting AXIS6 UX Analysis...');
    
    // 1. Landing Page
    console.log('📱 Analyzing Landing Page...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${screenshotDir}/01-landing-page.png`, fullPage: true });
    
    // Analyze landing page elements
    const landingElements = await page.evaluate(() => {
      const elements = {
        ctaButtons: Array.from(document.querySelectorAll('button, a')).length,
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()),
        features: Array.from(document.querySelectorAll('[data-feature], .feature')).length,
        socialProof: Array.from(document.querySelectorAll('[data-testimonial], .testimonial')).length
      };
      return elements;
    });

    analysis.pages.push({
      name: 'Landing Page',
      url: 'http://localhost:3000',
      elements: landingElements,
      engagementScore: 7, // Initial assessment
      notes: 'Entry point - critical for first impressions and conversion'
    });

    // 2. Login Page
    console.log('🔐 Analyzing Login Page...');
    const loginButton = await page.locator('text=Login').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${screenshotDir}/02-login-page.png`, fullPage: true });

      const loginElements = await page.evaluate(() => ({
        fields: Array.from(document.querySelectorAll('input')).length,
        socialLogin: Array.from(document.querySelectorAll('[data-provider], .oauth')).length,
        forgotPassword: document.querySelector('[href*="forgot"]') ? true : false,
        signUpLink: document.querySelector('text=Sign up, [href*="register"]') ? true : false
      }));

      analysis.pages.push({
        name: 'Login Page',
        elements: loginElements,
        engagementScore: 6,
        notes: 'Authentication barrier - needs to be frictionless'
      });
    }

    // 3. Register Page
    console.log('📝 Analyzing Register Page...');
    try {
      await page.goto('http://localhost:3000/auth/register');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${screenshotDir}/03-register-page.png`, fullPage: true });

      const registerElements = await page.evaluate(() => ({
        fields: Array.from(document.querySelectorAll('input')).length,
        passwordStrength: document.querySelector('[data-password-strength]') ? true : false,
        termsAcceptance: document.querySelector('input[type="checkbox"]') ? true : false,
        socialRegister: Array.from(document.querySelectorAll('[data-provider]')).length
      }));

      analysis.pages.push({
        name: 'Register Page',
        elements: registerElements,
        engagementScore: 5,
        notes: 'Critical conversion point - needs clear value proposition'
      });
    } catch (error) {
      console.log('Register page not accessible:', error.message);
    }

    // For demo purposes, let's simulate being logged in by going directly to dashboard
    // In a real test, we'd need valid credentials
    
    // 4. Dashboard (main app page)
    console.log('📊 Analyzing Dashboard...');
    try {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForTimeout(2000); // Wait for any redirects or auth checks
      
      const currentUrl = page.url();
      if (!currentUrl.includes('auth')) {
        await page.screenshot({ path: `${screenshotDir}/04-dashboard.png`, fullPage: true });
        
        const dashboardElements = await page.evaluate(() => ({
          hexagon: document.querySelector('svg, .hexagon') ? true : false,
          categories: Array.from(document.querySelectorAll('[data-category]')).length,
          streaks: Array.from(document.querySelectorAll('[data-streak]')).length,
          checkins: Array.from(document.querySelectorAll('[data-checkin], button')).length,
          todaysProgress: document.querySelector('[data-progress]') ? true : false
        }));

        analysis.pages.push({
          name: 'Dashboard',
          elements: dashboardElements,
          engagementScore: 8,
          notes: 'Core app experience - primary interaction hub'
        });
      } else {
        console.log('Redirected to auth - dashboard requires login');
      }
    } catch (error) {
      console.log('Dashboard analysis error:', error.message);
    }

    // 5. Analytics Page
    console.log('📈 Analyzing Analytics Page...');
    try {
      await page.goto('http://localhost:3000/analytics');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (!currentUrl.includes('auth')) {
        await page.screenshot({ path: `${screenshotDir}/05-analytics.png`, fullPage: true });
        
        const analyticsElements = await page.evaluate(() => ({
          charts: Array.from(document.querySelectorAll('svg, canvas, .chart')).length,
          metrics: Array.from(document.querySelectorAll('[data-metric]')).length,
          timeFilters: Array.from(document.querySelectorAll('select, [data-filter]')).length,
          insights: Array.from(document.querySelectorAll('[data-insight]')).length
        }));

        analysis.pages.push({
          name: 'Analytics',
          elements: analyticsElements,
          engagementScore: 7,
          notes: 'Progress visualization - key for long-term engagement'
        });
      }
    } catch (error) {
      console.log('Analytics analysis error:', error.message);
    }

    // 6. Achievements Page
    console.log('🏆 Analyzing Achievements Page...');
    try {
      await page.goto('http://localhost:3000/achievements');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (!currentUrl.includes('auth')) {
        await page.screenshot({ path: `${screenshotDir}/06-achievements.png`, fullPage: true });
        
        const achievementElements = await page.evaluate(() => ({
          badges: Array.from(document.querySelectorAll('[data-badge], .badge')).length,
          progress: Array.from(document.querySelectorAll('progress, .progress')).length,
          categories: Array.from(document.querySelectorAll('[data-achievement-category]')).length,
          unlocked: Array.from(document.querySelectorAll('.unlocked, [data-unlocked="true"]')).length
        }));

        analysis.pages.push({
          name: 'Achievements',
          elements: achievementElements,
          engagementScore: 9,
          notes: 'Gamification center - high engagement potential'
        });
      }
    } catch (error) {
      console.log('Achievements analysis error:', error.message);
    }

    // 7. Profile/Settings Page
    console.log('⚙️ Analyzing Profile/Settings Page...');
    try {
      await page.goto('http://localhost:3000/profile');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (!currentUrl.includes('auth')) {
        await page.screenshot({ path: `${screenshotDir}/07-profile.png`, fullPage: true });
        
        const profileElements = await page.evaluate(() => ({
          avatar: document.querySelector('[data-avatar], .avatar') ? true : false,
          preferences: Array.from(document.querySelectorAll('input, select')).length,
          notifications: Array.from(document.querySelectorAll('[data-notification]')).length,
          exportData: document.querySelector('[data-export]') ? true : false
        }));

        analysis.pages.push({
          name: 'Profile/Settings',
          elements: profileElements,
          engagementScore: 6,
          notes: 'Personalization hub - important for retention'
        });
      }
    } catch (error) {
      console.log('Profile analysis error:', error.message);
    }

    // Hooked Model Analysis
    analysis.hookedModelAnalysis = {
      triggers: [
        'Daily notification reminders (external trigger)',
        'Streak about to break warning (external trigger)',
        'Habit formation cue (internal trigger)',
        'Completion anxiety (internal trigger)'
      ],
      actions: [
        'Daily check-ins for 6 categories',
        'Mood rating input',
        'Notes/reflection entry',
        'Progress visualization'
      ],
      variableRewards: [
        'Streak achievements (intermittent)',
        'Badge unlocking (unpredictable)',
        'Progress milestones (variable schedule)',
        'Personalized insights (surprise element)'
      ],
      investment: [
        'Daily check-in data accumulation',
        'Personal reflection notes',
        'Streak building effort',
        'Profile customization'
      ]
    };

    // Engagement Opportunities
    analysis.engagementOpportunities = [
      {
        opportunity: 'Onboarding Flow Enhancement',
        priority: 'High',
        description: 'Add interactive tutorial showing hexagon interaction and first check-in',
        hookedElement: 'Action - Make first use immediately rewarding'
      },
      {
        opportunity: 'Smart Notifications',
        priority: 'High',
        description: 'Personalized push notifications based on user patterns and streak status',
        hookedElement: 'Trigger - External triggers that become internal over time'
      },
      {
        opportunity: 'Social Features',
        priority: 'Medium',
        description: 'Friend connections, shared achievements, community challenges',
        hookedElement: 'Variable Reward - Social validation and competition'
      },
      {
        opportunity: 'Micro-Interactions',
        priority: 'Medium',
        description: 'Animations, haptic feedback, sound effects for check-ins',
        hookedElement: 'Action - Make the action more satisfying'
      },
      {
        opportunity: 'Personalized Insights',
        priority: 'Medium',
        description: 'AI-driven weekly/monthly insights about patterns and improvements',
        hookedElement: 'Variable Reward - Unpredictable valuable information'
      },
      {
        opportunity: 'Progressive Achievements',
        priority: 'Medium',
        description: 'Multi-tier achievement system with surprise rewards',
        hookedElement: 'Variable Reward - Intermittent reinforcement'
      },
      {
        opportunity: 'Data Export/Sharing',
        priority: 'Low',
        description: 'Allow users to export data and share progress externally',
        hookedElement: 'Investment - Increase perceived value of accumulated data'
      }
    ];

    console.log('✅ UX Analysis Complete!');
    console.log(`Screenshots saved to: ${screenshotDir}`);
    
    // Save analysis results
    const analysisFile = path.join(__dirname, 'claudedocs', 'ux-analysis-results.json');
    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
    console.log(`Analysis results saved to: ${analysisFile}`);

    return analysis;

  } catch (error) {
    console.error('Error during UX analysis:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzeAXIS6UX()
  .then(analysis => {
    console.log('\n🎯 ENGAGEMENT OPPORTUNITIES SUMMARY:');
    analysis.engagementOpportunities.forEach((opp, index) => {
      console.log(`${index + 1}. ${opp.opportunity} (${opp.priority} Priority)`);
      console.log(`   ${opp.description}`);
      console.log(`   Hooked Model: ${opp.hookedElement}\n`);
    });
  })
  .catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });