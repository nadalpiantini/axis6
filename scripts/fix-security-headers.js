#!/usr/bin/env node

/**
 * Security Headers Configuration Script
 * Adds comprehensive security headers to Next.js application
 */

const fs = require('fs');
const path = require('path');

// Security headers configuration
const securityHeaders = `
  // Security headers configuration
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: \`
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: https: blob:;
              media-src 'self' https:;
              connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live https://*.vercel.com;
              frame-src 'self';
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              upgrade-insecure-requests;
            \`.replace(/\\s{2,}/g, ' ').trim()
          }
        ]
      }
    ];
  },`;

console.log('🔒 Adding security headers to Next.js configuration...');

const configPath = path.join(process.cwd(), 'next.config.js');
const config = fs.readFileSync(configPath, 'utf-8');

// Check if headers already exist
if (config.includes('async headers()')) {
  console.log('⚠️ Security headers already configured');
  process.exit(0);
}

// Find the position to insert headers (after reactStrictMode)
const insertPosition = config.indexOf('reactStrictMode: true,');
if (insertPosition === -1) {
  console.error('❌ Could not find insertion point in next.config.js');
  process.exit(1);
}

// Insert security headers
const beforeInsert = config.substring(0, insertPosition + 'reactStrictMode: true,'.length);
const afterInsert = config.substring(insertPosition + 'reactStrictMode: true,'.length);
const newConfig = beforeInsert + '\n  ' + securityHeaders + afterInsert;

// Write updated configuration
fs.writeFileSync(configPath, newConfig);

console.log('✅ Security headers successfully added!');
console.log('📋 Headers configured:');
console.log('  • Strict-Transport-Security (HSTS)');
console.log('  • Content-Security-Policy (CSP)');
console.log('  • X-Frame-Options');
console.log('  • X-Content-Type-Options');
console.log('  • X-XSS-Protection');
console.log('  • Referrer-Policy');
console.log('  • Permissions-Policy');
console.log('\n🚀 Restart your development server to apply changes');