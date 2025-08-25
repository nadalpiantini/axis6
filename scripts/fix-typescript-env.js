#!/usr/bin/env node

/**
 * Fix TypeScript strict mode issues with process.env properties
 * Converts process.env.VAR to process.env['VAR']
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to process
const patterns = [
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}', 
  'lib/**/*.{ts,tsx}',
  'middleware.ts',
];

// Exclude patterns
const excludes = [
  '**/node_modules/**',
  '**/.next/**',
  '**/tests/**',
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
];

// Process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Replace process.env.VAR_NAME with process.env['VAR_NAME']
    content = content.replace(/process\.env\.([A-Z_][A-Z0-9_]*)/g, "process.env['$1']");
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}: ${error.message}`);
  }
}

// Main execution
function main() {
  console.log('🔧 Fixing TypeScript process.env issues...\n');
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: excludes });
    files.forEach(processFile);
  });
  
  console.log('\n✅ TypeScript fixes complete!');
}

main();