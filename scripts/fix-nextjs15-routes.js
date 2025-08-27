#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all route files with dynamic params
const routeFiles = glob.sync('app/api/**/**/\\[*\\]/**/route.ts', {
  cwd: process.cwd()
});

console.log(`Found ${routeFiles.length} route files with dynamic params to fix`);

let fixedCount = 0;

routeFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix GET function signature
  if (content.includes('{ params }: { params: { ')) {
    const oldPattern = /export async function (GET|POST|PUT|DELETE|PATCH)\s*\(\s*request:\s*NextRequest,?\s*{\s*params\s*}:\s*{\s*params:\s*{\s*([^}]+)\s*}\s*}\s*\)/g;
    const newContent = content.replace(oldPattern, (match, method, paramTypes) => {
      modified = true;
      return `export async function ${method}(\n  request: NextRequest,\n  { params }: { params: Promise<{ ${paramTypes} }> }\n)`;
    });
    
    if (modified) {
      // Also fix the params access
      const paramPattern = /const\s+(\w+)\s*=\s*params\.(\w+)/g;
      content = newContent.replace(paramPattern, (match, varName, paramName) => {
        if (varName === paramName) {
          // If extracting single param with same name
          return `const { ${paramName} } = await params`;
        }
        return match;
      });
      
      // Fix destructuring pattern
      const destructPattern = /const\s+{\s*([^}]+)\s*}\s*=\s*params(?!\s*\.)/g;
      content = content.replace(destructPattern, 'const { $1 } = await params');
      
      // Fix direct access pattern
      const accessPattern = /params\.(\w+)(?!\s*=)/g;
      content = content.replace(accessPattern, (match, prop) => {
        // Check if params is already awaited nearby
        if (content.includes('await params')) {
          return match; // Keep as is if already handling await
        }
        return `(await params).${prop}`;
      });
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
      fixedCount++;
    }
  }
});

console.log(`\n✨ Fixed ${fixedCount} route files for Next.js 15 compatibility`);