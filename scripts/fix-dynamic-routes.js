#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all route files with dynamic segments
const routeFiles = glob.sync('app/api/**/\\[*\\]/**/route.ts', {
  cwd: process.cwd()
});

console.log(`Found ${routeFiles.length} dynamic route files to fix`);

routeFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix the params type for GET, POST, PUT, DELETE, PATCH functions
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  
  methods.forEach(method => {
    // Match the old pattern
    const oldPattern = new RegExp(
      `export async function ${method}\\s*\\([^)]*\\)\\s*{\\s*params\\s*}\\s*:\\s*{\\s*params:\\s*{([^}]+)}\\s*}`,
      'g'
    );
    
    // Simple replacement for common patterns
    if (content.includes(`export async function ${method}`)) {
      // Replace { params: { xxx } } with { params: Promise<{ xxx }> }
      const regex1 = new RegExp(`(export async function ${method}[^{]*{\\s*params\\s*}\\s*:\\s*{\\s*params:\\s*)({[^}]+})`, 'g');
      if (regex1.test(content)) {
        content = content.replace(regex1, '$1Promise<$2>');
        modified = true;
      }
    }
  });

  // Fix params access - replace params.xxx with await params
  if (content.includes('params.')) {
    // Find all instances where we access params.something
    const paramsAccessRegex = /const\s+(\w+)\s*=\s*params\.(\w+)/g;
    content = content.replace(paramsAccessRegex, (match, varName, propName) => {
      // Check if params is already awaited nearby
      if (!content.includes('await params')) {
        return `const { ${propName} } = await params`;
      }
      return match;
    });
    
    // Also handle destructuring patterns
    const destructureRegex = /const\s*{\s*(\w+)\s*}\s*=\s*params/g;
    if (!content.includes('await params') && destructureRegex.test(content)) {
      content = content.replace(destructureRegex, 'const { $1 } = await params');
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`⏭️  Skipped: ${file} (no changes needed)`);
  }
});

console.log('\n✅ Dynamic route fixes complete!');