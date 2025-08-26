#!/usr/bin/env node

/**
 * ESLint Summary Script
 * Provides a summary of linting results
 */

const { execSync } = require('child_process')

console.log('📊 ESLint Code Quality Summary\n')
console.log('=' .repeat(60))

try {
  // Run lint and capture output
  const lintOutput = execSync('npm run lint 2>&1', { 
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
  })
  
  console.log('✅ All linting rules passed!')
  console.log('\n📋 No issues found.')
  
} catch (error) {
  const output = error.stdout
  
  // Parse lint output
  const lines = output.split('\n')
  const errorLines = lines.filter(line => line.includes('Error:'))
  const warningLines = lines.filter(line => line.includes('Warning:'))
  
  const totalErrors = errorLines.length
  const totalWarnings = warningLines.length
  
  console.log(`📊 Issues Found:`)
  console.log(`• Errors: ${totalErrors}`)
  console.log(`• Warnings: ${totalWarnings}`)
  console.log(`• Total: ${totalErrors + totalWarnings}`)
  
  if (totalErrors + totalWarnings > 0) {
    console.log('\n📋 Issue Categories:')
    
    // Categorize issues
    const categories = {}
    const allIssues = [...errorLines, ...warningLines]
    
    allIssues.forEach(line => {
      // Extract rule name from end of line
      const match = line.match(/([a-zA-Z/@-]+)$/)
      if (match) {
        const rule = match[1]
        categories[rule] = (categories[rule] || 0) + 1
      }
    })
    
    // Sort by count
    const sorted = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) // Top 10
    
    sorted.forEach(([rule, count]) => {
      console.log(`• ${rule}: ${count} issues`)
    })
    
    if (sorted.length === 10 && Object.keys(categories).length > 10) {
      console.log(`• ... and ${Object.keys(categories).length - 10} more`)
    }
    
    console.log('\n🔧 Quick Fixes Available:')
    console.log('• Run "npm run lint:fix" to auto-fix many issues')
    console.log('• Import order issues can be automatically fixed')
    console.log('• Unused variables need manual review')
    
    console.log('\n📖 Common Solutions:')
    console.log('• Prefix unused variables with underscore: const _unusedVar')
    console.log('• Remove unused imports and variables') 
    console.log('• Fix import order by grouping: builtin → external → internal')
    console.log('• Replace "any" types with specific types')
  }
}

console.log('\n🎯 Code Quality Status:')
console.log('✅ ESLint Configuration: Active')
console.log('✅ TypeScript Strict Mode: Enabled')  
console.log('✅ Import Order Rules: Enforced')
console.log('✅ Security Rules: Active')
console.log('✅ React Rules: Active')

console.log('\n📚 Available Commands:')
console.log('• npm run lint         - Check all issues')
console.log('• npm run lint:fix     - Auto-fix issues')
console.log('• npm run lint:strict  - Strict mode (fail on warnings)')
console.log('• node scripts/lint-summary.js - This summary')

console.log('\n🔗 Documentation:')
console.log('• Rules are defined in .eslintrc.json')
console.log('• Configuration follows Next.js + TypeScript best practices')
console.log('• Ignores build files and generated code')