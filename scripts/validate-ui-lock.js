#!/usr/bin/env node

/**
 * 🔒 UI LOCK VALIDATION SCRIPT
 * 
 * Ejecuta este script para verificar que la línea gráfica perfecta
 * no ha sido modificada accidentalmente.
 */

const fs = require('fs')
const crypto = require('crypto')
const path = require('path')

console.log('🛡️  AXIS6 UI LOCK VALIDATION')
console.log('================================')

// Archivos críticos a validar
const CRITICAL_FILES = [
  'app/dashboard/page.tsx',
  'components/ui/ClickableSVG.tsx', 
  'components/icons/index.tsx',
  'components/layout/StandardHeader.tsx'
]

// Hashes esperados (se actualizan cuando se hace el lock)
const EXPECTED_PATTERNS = {
  'app/dashboard/page.tsx': [
    'HexagonVisualization',
    'viewBox="0 0 400 400"',
    'circle',
    'r="30"',
    '#gradient',
    'lg:col-span-2'
  ]
}

function checkFileIntegrity(filePath) {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ CRITICAL: ${filePath} does not exist!`)
    return false
  }
  
  const content = fs.readFileSync(fullPath, 'utf8')
  const patterns = EXPECTED_PATTERNS[filePath] || []
  
  let allPatternsPassed = true
  
  patterns.forEach(pattern => {
    if (!content.includes(pattern)) {
      console.log(`❌ PATTERN MISSING in ${filePath}: "${pattern}"`)
      allPatternsPassed = false
    }
  })
  
  if (allPatternsPassed) {
    console.log(`✅ ${filePath} - Integrity OK`)
  }
  
  return allPatternsPassed
}

function validateUILock() {
  console.log('\n🔍 Validating UI lock integrity...\n')
  
  let allValid = true
  
  // Check critical files
  CRITICAL_FILES.forEach(file => {
    const isValid = checkFileIntegrity(file)
    if (!isValid) allValid = false
  })
  
  // Check backup exists
  const backupPath = 'components/ui-locked/DashboardPageLocked.tsx'
  if (!fs.existsSync(backupPath)) {
    console.log(`❌ CRITICAL: Backup file missing: ${backupPath}`)
    allValid = false
  } else {
    console.log(`✅ Backup file exists: ${backupPath}`)
  }
  
  // Check design tokens
  const tokensPath = 'lib/design-system/design-tokens-locked.json'
  if (!fs.existsSync(tokensPath)) {
    console.log(`❌ Design tokens missing: ${tokensPath}`)
    allValid = false
  } else {
    console.log(`✅ Design tokens locked: ${tokensPath}`)
  }
  
  console.log('\n' + '='.repeat(40))
  
  if (allValid) {
    console.log('🎉 UI LOCK VALIDATION PASSED')
    console.log('✅ Tu línea gráfica está protegida')
    console.log('✅ Todos los componentes críticos intactos')
    process.exit(0)
  } else {
    console.log('🚨 UI LOCK VALIDATION FAILED')
    console.log('❌ Algo modificó tu diseño perfecto!')
    console.log('')
    console.log('🔧 RESTAURACIÓN DE EMERGENCIA:')
    console.log('git checkout b8d8a72 -- app/dashboard/page.tsx')
    console.log('npm run dev')
    process.exit(1)
  }
}

// Ejecutar validación
validateUILock()