#!/usr/bin/env node

/**
 * Fix unused parameter issues by prefixing with underscore
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const patterns = [
  'lib/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'app/**/*.{ts,tsx}',
];

const excludes = [
  '**/node_modules/**',
  '**/.next/**',
  '**/tests/**',
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Fix common unused parameter patterns
    content = content.replace(/\(([^,)]+),\s*([a-zA-Z_][a-zA-Z0-9_]*)\)\s*=>/g, (match, p1, p2) => {
      // If parameter name doesn't start with underscore, add it
      if (!p2.startsWith('_')) {
        return match.replace(p2, `_${p2}`);
      }
      return match;
    });
    
    // Fix callback patterns like onError: (err, variables, context)
    content = content.replace(/onError:\s*\(([^)]+)\)\s*=>/g, (match, params) => {
      const paramList = params.split(',').map(p => {
        const trimmed = p.trim();
        if (!trimmed.startsWith('_') && trimmed !== 'variables' && trimmed !== 'context') {
          return `_${trimmed}`;
        }
        return trimmed;
      });
      return `onError: (${paramList.join(', ')}) =>`;
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}: ${error.message}`);
  }
}

function main() {
  console.log('🔧 Fixing unused parameter issues...\n');
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: excludes });
    files.forEach(processFile);
  });
  
  console.log('\n✅ Unused parameter fixes complete!');
}

main();