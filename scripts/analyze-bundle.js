#!/usr/bin/env node

/**
 * Enhanced Bundle Analysis Script
 * Analyzes webpack bundle stats and provides performance insights
 */

const fs = require('fs')
const path = require('path')

const ANALYZE_DIR = '.next/analyze'
const CLIENT_STATS = path.join(ANALYZE_DIR, 'client-stats.json')
const SERVER_STATS = path.join(ANALYZE_DIR, 'server-stats.json')

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatPercent(value) {
  return (value * 100).toFixed(1) + '%'
}

function analyzeAssets(assets, title, limit = 10) {
  console.log(`\n📦 ${title}`)
  console.log('=' .repeat(60))
  
  // Sort by size
  const sorted = assets
    .filter(asset => asset.size > 0)
    .sort((a, b) => b.size - a.size)
    .slice(0, limit)
  
  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0)
  
  sorted.forEach((asset, index) => {
    const percentage = formatPercent(asset.size / totalSize)
    console.log(`${(index + 1).toString().padStart(2)}) ${asset.name}`)
    console.log(`    Size: ${formatBytes(asset.size)} (${percentage})`)
    
    // Identify asset types
    if (asset.name.includes('chunk')) {
      console.log(`    Type: ⚡ JavaScript Chunk`)
    } else if (asset.name.includes('.css')) {
      console.log(`    Type: 🎨 CSS Stylesheet`)
    } else if (asset.name.includes('.js')) {
      console.log(`    Type: 📜 JavaScript Module`)
    } else if (asset.name.includes('.map')) {
      console.log(`    Type: 🗺️ Source Map`)
    }
    console.log()
  })
  
  console.log(`📊 Total ${title} Size: ${formatBytes(totalSize)}`)
  
  return { totalSize, assets: sorted }
}

function analyzeModules(modules, title, limit = 15) {
  console.log(`\n📚 ${title}`)
  console.log('=' .repeat(60))
  
  // Sort by size and filter meaningful modules
  const sorted = modules
    .filter(module => {
      // Skip webpack internal modules and very small ones
      return module.size > 1000 && 
             !module.name.includes('webpack/runtime') &&
             !module.name.includes('(webpack)')
    })
    .sort((a, b) => b.size - a.size)
    .slice(0, limit)
  
  const totalSize = modules.reduce((sum, module) => sum + module.size, 0)
  
  sorted.forEach((module, index) => {
    const percentage = formatPercent(module.size / totalSize)
    let name = module.name
    
    // Clean up module names for better readability
    if (name.includes('node_modules')) {
      const match = name.match(/node_modules\/([^\/]+)/)
      if (match) name = `📦 ${match[1]}`
    } else if (name.startsWith('./')) {
      name = `📄 ${name.replace('./', '')}`
    }
    
    console.log(`${(index + 1).toString().padStart(2)}) ${name}`)
    console.log(`    Size: ${formatBytes(module.size)} (${percentage})`)
    console.log()
  })
  
  return { totalSize, modules: sorted }
}

function analyzeDependencies(modules) {
  console.log(`\n📦 Top Dependencies by Size`)
  console.log('=' .repeat(60))
  
  const dependencies = {}
  
  modules.forEach(module => {
    if (module.name.includes('node_modules')) {
      const match = module.name.match(/node_modules\/([^\/]+)/)
      if (match) {
        const dep = match[1]
        dependencies[dep] = (dependencies[dep] || 0) + module.size
      }
    }
  })
  
  const sorted = Object.entries(dependencies)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
  
  const totalDepSize = Object.values(dependencies).reduce((sum, size) => sum + size, 0)
  
  sorted.forEach(([dep, size], index) => {
    const percentage = formatPercent(size / totalDepSize)
    console.log(`${(index + 1).toString().padStart(2)}) ${dep}`)
    console.log(`    Size: ${formatBytes(size)} (${percentage})`)
    
    // Categorize dependencies
    if (['react', 'react-dom'].includes(dep)) {
      console.log(`    Category: ⚛️ React Core`)
    } else if (dep.includes('supabase') || dep.includes('auth')) {
      console.log(`    Category: 🔐 Backend/Auth`)
    } else if (dep.includes('ui') || dep.includes('radix') || dep.includes('framer')) {
      console.log(`    Category: 🎨 UI Components`)
    } else if (dep.includes('query') || dep.includes('tanstack')) {
      console.log(`    Category: 📊 Data Management`)
    }
    console.log()
  })
}

function generateRecommendations(clientStats, serverStats) {
  console.log(`\n💡 Performance Recommendations`)
  console.log('=' .repeat(60))
  
  const recommendations = []
  
  // Analyze client bundle size
  const clientSize = clientStats.assets.reduce((sum, asset) => sum + asset.size, 0)
  if (clientSize > 3 * 1024 * 1024) { // 3MB
    recommendations.push('🚨 Client bundle is large (>3MB). Consider code splitting.')
  }
  
  // Find large dependencies
  const deps = {}
  clientStats.modules.forEach(module => {
    if (module.name.includes('node_modules')) {
      const match = module.name.match(/node_modules\/([^\/]+)/)
      if (match) {
        deps[match[1]] = (deps[match[1]] || 0) + module.size
      }
    }
  })
  
  const largeDeps = Object.entries(deps)
    .filter(([, size]) => size > 500 * 1024) // 500KB
    .sort(([,a], [,b]) => b - a)
  
  if (largeDeps.length > 0) {
    recommendations.push(`📦 Large dependencies found: ${largeDeps.slice(0, 3).map(([name]) => name).join(', ')}`)
  }
  
  // Check for duplicate dependencies
  const reactModules = clientStats.modules.filter(m => m.name.includes('react'))
  if (reactModules.length > 50) {
    recommendations.push('⚛️ Many React modules detected. Check for duplicate React imports.')
  }
  
  // General recommendations
  recommendations.push('✅ Use dynamic imports for non-critical components')
  recommendations.push('✅ Implement tree shaking for unused exports')
  recommendations.push('✅ Consider lazy loading routes and heavy components')
  recommendations.push('✅ Use the production build for accurate size measurements')
  
  recommendations.forEach((rec, index) => {
    console.log(`${(index + 1).toString().padStart(2)}) ${rec}`)
  })
}

async function main() {
  console.log('📊 AXIS6 Bundle Analysis Report\n')
  console.log('=' .repeat(60))
  
  // Check if analysis files exist
  if (!fs.existsSync(CLIENT_STATS) || !fs.existsSync(SERVER_STATS)) {
    console.log('❌ Bundle analysis files not found.')
    console.log('   Run "npm run analyze" first to generate bundle stats.')
    console.log('\n📚 Available Commands:')
    console.log('• npm run analyze       - Generate bundle analysis')
    console.log('• npm run analyze:clean - Clean analysis files')
    console.log('• node scripts/analyze-bundle.js - This report')
    return
  }
  
  try {
    // Load stats
    const clientStats = JSON.parse(fs.readFileSync(CLIENT_STATS, 'utf8'))
    const serverStats = JSON.parse(fs.readFileSync(SERVER_STATS, 'utf8'))
    
    console.log('🎯 Bundle Overview')
    console.log(`• Generated: ${new Date().toLocaleString()}`)
    console.log(`• Client Chunks: ${clientStats.assets.length}`)
    console.log(`• Server Chunks: ${serverStats.assets.length}`)
    console.log(`• Client Modules: ${clientStats.modules.length}`)
    console.log(`• Server Modules: ${serverStats.modules.length}`)
    
    // Analyze client assets
    const clientResults = analyzeAssets(clientStats.assets, 'Client-Side Assets (Most Important)')
    
    // Analyze server assets
    const serverResults = analyzeAssets(serverStats.assets, 'Server-Side Assets')
    
    // Analyze client modules (most important for performance)
    analyzeModules(clientStats.modules, 'Client-Side Modules (Impact on Load Time)')
    
    // Dependency analysis
    analyzeDependencies(clientStats.modules)
    
    // Recommendations
    generateRecommendations(clientStats, serverStats)
    
    console.log(`\n📋 Quick Summary:`)
    console.log(`• Total Client Size: ${formatBytes(clientResults.totalSize)}`)
    console.log(`• Total Server Size: ${formatBytes(serverResults.totalSize)}`)
    console.log(`• Combined Size: ${formatBytes(clientResults.totalSize + serverResults.totalSize)}`)
    
    console.log(`\n🔗 View Detailed Reports:`)
    console.log(`• Client: open .next/analyze/client.html`)
    console.log(`• Server: open .next/analyze/server.html`)
    
  } catch (error) {
    console.error('❌ Error analyzing bundle stats:', error.message)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { analyzeAssets, analyzeModules }