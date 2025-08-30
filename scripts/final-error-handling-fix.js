#!/usr/bin/env node

/**
 * Final comprehensive fix for all error handling issues
 * This script will ensure all error handling follows the correct pattern
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Comprehensive patterns to fix all remaining issues
const fixes = [
  // Remove malformed comment patterns
  {
    pattern: /\s*\/\/ handleError\(error, \{[^}]*\}\)\s*/g,
    replacement: ''
  },
  
  // Fix broken handleError calls with line breaks in wrong places
  {
    pattern: /handleError\(error, \{\s*\n\s*operation:/g,
    replacement: 'handleError(error, {\n      operation:'
  },
  
  // Fix malformed closing patterns
  {
    pattern: /\}\)\s*\/\/ \}\)/g,
    replacement: '})'
  },
  
  // Fix orphaned console.error calls
  {
    pattern: /console\.error\('[^']*operation failed:', error\)/g,
    replacement: '// Error logged via handleError'
  },
  
  // Fix broken operation syntax
  {
    pattern: /operation: '[^']*',\s*\n\s*component:/g,
    replacement: (match) => {
      return match.replace(/\n\s*/g, ' ');
    }
  },
  
  // Remove duplicate error handling in comment form
  {
    pattern: /\/\/ handleError\(error, \{[^}]*operation: '[^']*',[^}]*component: '[^']*',[^}]*userMessage: '[^']*'[^}]*\}\)/g,
    replacement: ''
  }
];

// Context-aware error handling patterns based on file path
const contextualFixes = {
  'ai': {
    operation: 'ai_operation',
    userMessage: 'AI operation failed. Please try again.'
  },
  'chat': {
    operation: 'chat_operation',
    userMessage: 'Chat operation failed. Please try again.'
  },
  'mantra': {
    operation: 'mantra_operation',
    userMessage: 'Failed to load mantra. Please try again.'
  },
  'psychology': {
    operation: 'psychology_assessment',
    userMessage: 'Psychology assessment failed. Please try again.'
  },
  'my-day': {
    operation: 'my_day_operation',  
    userMessage: 'My Day operation failed. Please try again.'
  },
  'profile': {
    operation: 'profile_operation',
    userMessage: 'Profile operation failed. Please try again.'
  },
  'settings': {
    operation: 'settings_operation',
    userMessage: 'Settings operation failed. Please try again.'
  },
  'supabase': {
    operation: 'database_operation',
    userMessage: 'Database operation failed. Please try again.'
  },
  'auth': {
    operation: 'authentication_operation',
    userMessage: 'Authentication failed. Please try again.'
  }
};

function getContextFromPath(filePath) {
  for (const [key, value] of Object.entries(contextualFixes)) {
    if (filePath.includes(key)) {
      return value;
    }
  }
  return {
    operation: 'general_operation',
    userMessage: 'Operation failed. Please try again.'
  };
}

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  const fileName = path.basename(filePath, path.extname(filePath));
  const context = getContextFromPath(filePath);
  
  // Apply all general fixes first
  fixes.forEach(({ pattern, replacement }) => {
    if (typeof replacement === 'function') {
      content = content.replace(pattern, replacement);
    } else {
      content = content.replace(pattern, replacement);
    }
  });
  
  // Fix 'unknown_operation' with contextual operations
  content = content.replace(
    /operation: 'unknown_operation'/g,
    `operation: '${context.operation}'`
  );
  
  // Fix generic error messages with contextual ones
  content = content.replace(
    /userMessage: 'Something went wrong\. Please try again\.'/g,
    `userMessage: '${context.userMessage}'`
  );
  
  // Fix syntax errors in handleError calls
  content = content.replace(
    /handleError\(error, \{\s*\n\s*operation: '([^']+)',\s*\n\s*component: '([^']+)',\s*\n\s*userMessage: '([^']+)'\s*\n\s*\}\)/g,
    (match, operation, component, userMessage) => {
      return `handleError(error, {
        operation: '${operation}',
        component: '${component}',
        userMessage: '${userMessage}'
      })`;
    }
  );
  
  // Clean up multiple empty lines
  content = content.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  // Remove trailing whitespace
  content = content.replace(/[ \t]+$/gm, '');
  
  // Ensure file ends with newline
  if (content && !content.endsWith('\n')) {
    content += '\n';
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

function getFilesWithErrors() {
  try {
    const result = execSync(
      `find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next`,
      { cwd: process.cwd(), encoding: 'utf8' }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

console.log('🔧 Final Error Handling Fix');
console.log('===========================');

const allFiles = getFilesWithErrors();
console.log(`Processing ${allFiles.length} TypeScript files`);

let fixedCount = 0;

allFiles.forEach(filePath => {
  const fixed = fixFile(filePath);
  if (fixed) {
    fixedCount++;
    console.log(`✅ Fixed: ${filePath}`);
  }
});

console.log(`\n📊 Fix Summary:`);
console.log(`  Files processed: ${allFiles.length}`);
console.log(`  Files fixed: ${fixedCount}`);

// Check for remaining TODO comments
try {
  const remainingTodos = execSync(
    `grep -r "TODO.*error handling" . --include="*.ts" --include="*.tsx" | wc -l`,
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  console.log(`  Remaining TODO comments: ${remainingTodos.trim()}`);
} catch (error) {
  console.log(`  Remaining TODO comments: 0`);
}

console.log('\n🎉 Final fix complete!');
console.log('💡 Next steps:');
console.log('  1. Run TypeScript check: npm run type-check');
console.log('  2. Run ESLint: npm run lint');
console.log('  3. Test the application: npm run dev');