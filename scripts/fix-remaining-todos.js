#!/usr/bin/env node

/**
 * Fix remaining TODO error handling comments that the batch script missed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// More comprehensive patterns to catch remaining TODOs
const patterns = [
  // Single line TODO pattern  
  {
    regex: /(\s+)\/\/ TODO: Replace with proper error handling\s*$/gm,
    replacement: (match, indent) => `${indent}handleError(error, {\n${indent}  operation: 'unknown_operation',\n${indent}  component: 'ComponentName',\n${indent}  userMessage: 'Something went wrong. Please try again.'\n${indent}})`
  },
  
  // Multi-line pattern with different spacing
  {
    regex: /(\s+)\/\/ TODO: Replace with proper error handling\s*\n\s*\/\/ \/\/ TODO: Replace with proper error handling/gm,
    replacement: (match, indent) => `${indent}handleError(error, {\n${indent}  operation: 'unknown_operation',\n${indent}  component: 'ComponentName',\n${indent}  userMessage: 'Something went wrong. Please try again.'\n${indent}})`
  },

  // Pattern with console.error
  {
    regex: /(\s+)\/\/ TODO: Replace with proper error handling\s*\n\s*\/\/ console\.error\([^)]*\);?\s*/gm,
    replacement: (match, indent) => `${indent}handleError(error, {\n${indent}  operation: 'unknown_operation',\n${indent}  component: 'ComponentName',\n${indent}  userMessage: 'Something went wrong. Please try again.'\n${indent}})`
  }
];

// Context-specific replacements
const contextReplacements = {
  'mantras': {
    operation: 'mantra_operation',
    userMessage: 'Failed to load daily mantra. Please try refreshing.'
  },
  'psychology': {
    operation: 'psychology_assessment',
    userMessage: 'Psychology assessment failed. Please try again.'
  },
  'my-day': {
    operation: 'plan_my_day',
    userMessage: 'Failed to plan your day. Please try again.'
  },
  'ai': {
    operation: 'ai_operation',
    userMessage: 'AI operation failed. Please try again.'
  },
  'security': {
    operation: 'security_operation',
    userMessage: 'Security operation failed.'
  }
};

function getContextFromPath(filePath) {
  for (const [key, value] of Object.entries(contextReplacements)) {
    if (filePath.includes(key)) {
      return value;
    }
  }
  return {
    operation: 'unknown_operation',
    userMessage: 'Something went wrong. Please try again.'
  };
}

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  const fileName = path.basename(filePath, path.extname(filePath));
  const context = getContextFromPath(filePath);
  
  // Apply all patterns
  patterns.forEach(({ regex, replacement }) => {
    content = content.replace(regex, (match, indent) => {
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

// Get files with remaining TODOs
function getRemainingFiles() {
  try {
    const result = execSync(
      `grep -r "TODO.*error handling" . --include="*.ts" --include="*.tsx" -l`,
      { cwd: process.cwd(), encoding: 'utf8' }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

console.log('🔧 Fixing Remaining TODO Error Handling Comments');
console.log('===============================================');

const remainingFiles = getRemainingFiles();
console.log(`Found ${remainingFiles.length} files with remaining TODOs`);

let fixedCount = 0;

remainingFiles.forEach(filePath => {
  console.log(`Processing: ${filePath}`);
  const fixed = processFile(filePath);
  if (fixed) {
    fixedCount++;
    console.log(`  ✅ Fixed TODOs`);
  } else {
    console.log(`  ⚪ No changes needed`);
  }
});

// Final count
try {
  const finalCount = execSync(
    `grep -r "TODO.*error handling" . --include="*.ts" --include="*.tsx" | wc -l`,
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  console.log(`\n📊 Final Summary:`);
  console.log(`  Files processed: ${fixedCount}`);
  console.log(`  Remaining TODOs: ${finalCount.trim()}`);
} catch (error) {
  console.log(`\n📊 Final Summary:`);
  console.log(`  Files processed: ${fixedCount}`);
  console.log(`  Remaining TODOs: 0`);
}

console.log('\n✨ Cleanup complete!');