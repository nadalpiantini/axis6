#!/usr/bin/env node

/**
 * Automated TODO Error Handling Replacement Script
 * Systematically replaces all "TODO: Replace with proper error handling" comments
 * with standardized error handling patterns for AXIS6
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define replacement patterns based on file context
const replacements = [
  // Standard error handling pattern
  {
    pattern: /(\s+)\/\/ TODO: Replace with proper error handling\n\s+\/\/ \/\/ TODO: Replace with proper error handling\n\s+\/\/ console\.error\([^)]+\);?/g,
    replacement: (match, indent) => {
      return `${indent}handleError(error, {\n${indent}  operation: 'unknown_operation',\n${indent}  component: 'ComponentName',\n${indent}  userMessage: 'Something went wrong. Please try again.'\n${indent}})`;
    }
  },
  
  // Console.error only pattern
  {
    pattern: /(\s+)\/\/ TODO: Replace with proper error handling\n\s+\/\/ \/\/ TODO: Replace with proper error handling\n\s+\/\/ \/\/ TODO: Replace with proper error handling\n\s+\/\/ console\.error\([^)]+\);?/g,
    replacement: (match, indent) => {
      return `${indent}handleError(error, {\n${indent}  operation: 'unknown_operation',\n${indent}  component: 'ComponentName',\n${indent}  userMessage: 'Something went wrong. Please try again.'\n${indent}})`;
    }
  },

  // Just TODO comments pattern
  {
    pattern: /(\s+)\/\/ TODO: Replace with proper error handling\n\s+\/\/ \/\/ TODO: Replace with proper error handling\n\s+\/\/ \/\/ TODO: Replace with proper error handling/g,
    replacement: (match, indent) => {
      return `${indent}handleError(error, {\n${indent}  operation: 'unknown_operation',\n${indent}  component: 'ComponentName',\n${indent}  userMessage: 'Something went wrong. Please try again.'\n${indent}})`;
    }
  }
];

// Files that need the standard error handler import
const filesToAddImport = new Set();

// File-specific context patterns for better error messages
const contextPatterns = {
  'chat': {
    operation: 'chat_operation',
    userMessage: 'Chat operation failed. Please try again.'
  },
  'profile': {
    operation: 'profile_operation', 
    userMessage: 'Profile operation failed. Please try again.'
  },
  'settings': {
    operation: 'settings_operation',
    userMessage: 'Settings operation failed. Please try again.'
  },
  'timer': {
    operation: 'timer_operation',
    userMessage: 'Timer operation failed. Please try again.'
  },
  'mantra': {
    operation: 'mantra_operation',
    userMessage: 'Daily mantra operation failed. Please try again.'
  },
  'psychology': {
    operation: 'psychology_operation',
    userMessage: 'Psychology assessment operation failed. Please try again.'
  },
  'my-day': {
    operation: 'my_day_operation',
    userMessage: 'My Day operation failed. Please try again.'
  },
  'ai': {
    operation: 'ai_operation',
    userMessage: 'AI operation failed. Please try again.'
  }
};

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Determine component name and context from file path
  const fileName = path.basename(filePath, path.extname(filePath));
  const dirName = path.dirname(filePath).split(path.sep).slice(-1)[0];
  
  // Find context based on path
  let context = { operation: 'unknown_operation', userMessage: 'Something went wrong. Please try again.' };
  for (const [key, value] of Object.entries(contextPatterns)) {
    if (filePath.includes(key) || dirName.includes(key)) {
      context = value;
      break;
    }
  }
  
  // Replace TODO patterns with contextualized error handling
  replacements.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, (match, indent) => {
      // Need to add import to this file
      filesToAddImport.add(filePath);
      
      return `${indent}handleError(error, {\n${indent}  operation: '${context.operation}',\n${indent}  component: '${fileName}',\n${indent}  userMessage: '${context.userMessage}'\n${indent}})`;
    });
  });
  
  // Check if content changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

function addImportToFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if import already exists
  if (content.includes('handleError') && content.includes('@/lib/error/standardErrorHandler')) {
    return false;
  }
  
  // Find the last import statement
  const importRegex = /import\s+.*\s+from\s+['"][^'"]+['"];?\s*\n/g;
  const imports = [...content.matchAll(importRegex)];
  
  if (imports.length === 0) {
    // No imports found, add after 'use client' or at top
    const useClientMatch = content.match(/['"]use client['"];?\s*\n/);
    if (useClientMatch) {
      const insertIndex = useClientMatch.index + useClientMatch[0].length;
      content = content.slice(0, insertIndex) + 
                "\nimport { handleError } from '@/lib/error/standardErrorHandler'\n" +
                content.slice(insertIndex);
    } else {
      content = "import { handleError } from '@/lib/error/standardErrorHandler'\n" + content;
    }
  } else {
    // Add after last import
    const lastImport = imports[imports.length - 1];
    const insertIndex = lastImport.index + lastImport[0].length;
    content = content.slice(0, insertIndex) + 
              "import { handleError } from '@/lib/error/standardErrorHandler'\n" +
              content.slice(insertIndex);
  }
  
  fs.writeFileSync(filePath, content);
  return true;
}

// Find all TypeScript/React files with TODO error handling comments
function findFilesWithTodos() {
  try {
    const result = execSync(
      `grep -r "TODO.*error handling" . --include="*.ts" --include="*.tsx" -l`,
      { cwd: process.cwd(), encoding: 'utf8' }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.log('No files with TODO error handling found');
    return [];
  }
}

// Main execution
console.log('🔧 AXIS6 TODO Error Handling Batch Fix');
console.log('==========================================');

const filesToProcess = findFilesWithTodos();
console.log(`Found ${filesToProcess.length} files with TODO error handling comments`);

let processedCount = 0;
let importAddedCount = 0;

// Process each file
filesToProcess.forEach((filePath) => {
  console.log(`Processing: ${filePath}`);
  const processed = processFile(filePath);
  if (processed) {
    processedCount++;
    console.log(`  ✅ Replaced TODO comments`);
  }
});

// Add imports to files that need them
console.log('\n📦 Adding imports to modified files...');
Array.from(filesToAddImport).forEach((filePath) => {
  const added = addImportToFile(filePath);
  if (added) {
    importAddedCount++;
    console.log(`  ✅ Added import to: ${filePath}`);
  }
});

console.log('\n📊 Summary:');
console.log(`  Files processed: ${processedCount}`);
console.log(`  Imports added: ${importAddedCount}`);

// Final count check
try {
  const remaining = execSync(
    `grep -r "TODO.*error handling" . --include="*.ts" --include="*.tsx" | wc -l`,
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  console.log(`  Remaining TODOs: ${remaining.trim()}`);
} catch (error) {
  console.log('  Remaining TODOs: 0');
}

console.log('\n🎉 Batch fix complete!');
console.log('💡 Next steps:');
console.log('  1. Review the auto-generated error handling');
console.log('  2. Customize operation names and messages as needed');
console.log('  3. Run TypeScript check: npm run type-check');
console.log('  4. Run linting: npm run lint');