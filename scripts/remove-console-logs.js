#!/usr/bin/env node

/**
 * Script to remove or replace console.log statements with production-safe logger
 * Run: node scripts/remove-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Directories to process
const INCLUDE_PATTERNS = [
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}',
  'hooks/**/*.{ts,tsx}',
];

// Files to exclude
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/logger.ts', // Don't modify the logger itself
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
];

// Statistics
let stats = {
  filesProcessed: 0,
  consolesRemoved: 0,
  consolesReplaced: 0,
  errors: [],
};

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;

    // Pattern to match console statements
    const consolePatterns = [
      // Simple console.log/warn/error/info/debug
      /console\.(log|warn|error|info|debug)\s*\(/g,
      // Console with method chaining or property access
      /console\.\w+\s*\(/g,
    ];

    // Check if file already imports logger
    const hasLoggerImport = content.includes('from \'@/lib/utils/logger\'') || 
                           content.includes('from "@/lib/utils/logger"');

    // Count console statements
    const consoleCount = (content.match(/console\.\w+\s*\(/g) || []).length;

    if (consoleCount > 0) {
      // For critical files (error handling, auth), replace with logger
      const isCriticalFile = filePath.includes('/auth/') || 
                            filePath.includes('/api/') ||
                            filePath.includes('error') ||
                            filePath.includes('Error');

      if (isCriticalFile && !hasLoggerImport) {
        // Add logger import at the top of the file
        const importStatement = `import { logger } from '@/lib/utils/logger';\n`;
        
        // Find the right place to add import (after 'use client' if present)
        if (content.includes('\'use client\'')) {
          content = content.replace(
            /('use client'[\s\S]*?)\n\n/,
            `$1\n\n${importStatement}\n`
          );
        } else if (content.includes('"use client"')) {
          content = content.replace(
            /("use client"[\s\S]*?)\n\n/,
            `$1\n\n${importStatement}\n`
          );
        } else {
          // Add at the very beginning
          content = importStatement + '\n' + content;
        }
        modified = true;
      }

      // Replace console statements
      if (isCriticalFile) {
        // Replace with logger for critical files
        content = content.replace(/console\.log\s*\(/g, 'logger.log(');
        content = content.replace(/console\.warn\s*\(/g, 'logger.warn(');
        content = content.replace(/console\.error\s*\(/g, 'logger.error(');
        content = content.replace(/console\.info\s*\(/g, 'logger.info(');
        content = content.replace(/console\.debug\s*\(/g, 'logger.debug(');
        stats.consolesReplaced += consoleCount;
      } else {
        // Remove console statements for non-critical files
        // But keep error logging
        content = content.replace(/console\.log\s*\([^)]*\);?\s*\n?/g, '');
        content = content.replace(/console\.info\s*\([^)]*\);?\s*\n?/g, '');
        content = content.replace(/console\.debug\s*\([^)]*\);?\s*\n?/g, '');
        content = content.replace(/console\.warn\s*\([^)]*\);?\s*\n?/g, '');
        
        // Keep console.error but comment it for review
        content = content.replace(
          /console\.error\s*\(([^)]*)\);?/g,
          '// TODO: Replace with proper error handling\n    // console.error($1);'
        );
        
        stats.consolesRemoved += consoleCount;
      }
      
      modified = true;
    }

    // Write back if modified
    if (modified && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesProcessed++;
      console.log(`✓ Processed: ${filePath} (${consoleCount} console statements)`);
    }
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`✗ Error processing ${filePath}: ${error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning for console statements...\n');

  // Get all files matching patterns
  const files = [];
  for (const pattern of INCLUDE_PATTERNS) {
    const matches = glob.sync(pattern, {
      ignore: EXCLUDE_PATTERNS,
      nodir: true,
    });
    files.push(...matches);
  }

  console.log(`Found ${files.length} files to process\n`);

  // Process each file
  files.forEach(processFile);

  // Print statistics
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('='.repeat(50));
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Console statements removed: ${stats.consolesRemoved}`);
  console.log(`Console statements replaced with logger: ${stats.consolesReplaced}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }

  console.log('\n✅ Console cleanup complete!');
  console.log('💡 Tip: Run "npm run build" to verify the changes');
}

// Run the script
main().catch(console.error);