/**
 * Production Security Validation System
 *
 * Provides comprehensive input validation, sanitization, and security checks
 * to prevent injection attacks, ensure data integrity, and protect against
 * advanced security threats in production environments.
 */
// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
// Password requirements
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 100
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/ // At least one lowercase, uppercase, and number
// Common weak passwords to check against
const COMMON_PASSWORDS = [
  'password', 'password123', 'Password123', 'admin123', 'qwerty123',
  '12345678', '123456789', 'welcome123', 'letmein', 'iloveyou',
  'monkey123', 'dragon123', 'sunshine', 'princess', 'football'
]
// SQL injection patterns to detect
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
  /(--|\/\*|\*\/|xp_|sp_|0x)/gi,
  /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
  /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
  /(\'\s*OR\s*\')/gi
]
// XSS patterns to detect
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onload, etc.
  /<embed[^>]*>/gi,
  /<object[^>]*>/gi
]
export interface ValidationResult {
  isValid: boolean
  error?: string
  sanitized?: string
}
/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email es requerido' }
  }
  const trimmedEmail = email.trim().toLowerCase()
  if (trimmedEmail.length > 255) {
    return { isValid: false, error: 'Email es demasiado largo' }
  }
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: 'Formato de email inválido' }
  }
  // Check for suspicious patterns
  if (containsSQLInjection(trimmedEmail) || containsXSS(trimmedEmail)) {
    return { isValid: false, error: 'Email contiene caracteres no permitidos' }
  }
  return { isValid: true, sanitized: trimmedEmail }
}
/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Contraseña es requerida' }
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { isValid: false, error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` }
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { isValid: false, error: `La contraseña no puede exceder ${PASSWORD_MAX_LENGTH} caracteres` }
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número' }
  }
  // Check against common passwords
  const lowerPassword = password.toLowerCase()
  for (const common of COMMON_PASSWORDS) {
    if (lowerPassword.includes(common)) {
      return { isValid: false, error: 'La contraseña es demasiado común. Por favor, elige una más segura' }
    }
  }
  // Check for sequential characters
  if (hasSequentialCharacters(password)) {
    return { isValid: false, error: 'La contraseña contiene caracteres secuenciales. Por favor, elige una más segura' }
  }
  return { isValid: true }
}
/**
 * Validate and sanitize general text input
 */
export function validateTextInput(
  input: string,
  options: {
    minLength?: number
    maxLength?: number
    required?: boolean
    alphanumericOnly?: boolean
    allowSpaces?: boolean
  } = {}
): ValidationResult {
  const {
    minLength = 0,
    maxLength = 1000,
    required = false,
    alphanumericOnly = false,
    allowSpaces = true
  } = options
  if (!input && required) {
    return { isValid: false, error: 'Este campo es requerido' }
  }
  if (!input) {
    return { isValid: true, sanitized: '' }
  }
  const trimmed = input.trim()
  if (trimmed.length < minLength) {
    return { isValid: false, error: `Debe tener al menos ${minLength} caracteres` }
  }
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `No puede exceder ${maxLength} caracteres` }
  }
  // Check for injection attempts
  if (containsSQLInjection(trimmed)) {
    return { isValid: false, error: 'Entrada contiene caracteres SQL no permitidos' }
  }
  if (containsXSS(trimmed)) {
    return { isValid: false, error: 'Entrada contiene código no permitido' }
  }
  if (alphanumericOnly) {
    const pattern = allowSpaces ? /^[a-zA-Z0-9\s]+$/ : /^[a-zA-Z0-9]+$/
    if (!pattern.test(trimmed)) {
      return {
        isValid: false,
        error: allowSpaces
          ? 'Solo se permiten letras, números y espacios'
          : 'Solo se permiten letras y números'
      }
    }
  }
  // Sanitize the input
  const sanitized = sanitizeString(trimmed)
  return { isValid: true, sanitized }
}
/**
 * Check if string contains SQL injection patterns
 */
function containsSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input))
}
/**
 * Check if string contains XSS patterns
 */
function containsXSS(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input))
}
/**
 * Check for sequential characters in password
 */
function hasSequentialCharacters(password: string): boolean {
  const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm']
  const lowerPassword = password.toLowerCase()
  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 2; i++) {
      const subSeq = seq.substring(i, i + 3)
      if (lowerPassword.includes(subSeq)) {
        return true
      }
    }
  }
  return false
}
/**
 * Sanitize string by removing/escaping dangerous characters
 */
function sanitizeString(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')
  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  // Remove any remaining control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')
  return sanitized
}
/**
 * Validate URL
 */
export function validateURL(url: string): ValidationResult {
  if (!url) {
    return { isValid: false, error: 'URL es requerida' }
  }
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, error: 'Solo se permiten URLs HTTP/HTTPS' }
    }
    // Check for localhost or private IPs (security measure)
    const hostname = parsed.hostname.toLowerCase()
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      return { isValid: false, error: 'URLs locales no están permitidas' }
    }
    return { isValid: true, sanitized: parsed.toString() }
  } catch {
    return { isValid: false, error: 'Formato de URL inválido' }
  }
}
/**
 * Validate phone number (basic international format)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, error: 'Teléfono es requerido' }
  }
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  // Check if it starts with + for international or just digits
  const phoneRegex = /^(\+\d{1,3})?\d{7,15}$/
  if (!phoneRegex.test(cleaned)) {
    return { isValid: false, error: 'Formato de teléfono inválido' }
  }
  return { isValid: true, sanitized: cleaned }
}
/**
 * Validate date input
 */
export function validateDate(
  date: string,
  options: {
    minDate?: Date
    maxDate?: Date
    allowFuture?: boolean
    allowPast?: boolean
  } = {}
): ValidationResult {
  if (!date) {
    return { isValid: false, error: 'Fecha es requerida' }
  }
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) {
    return { isValid: false, error: 'Formato de fecha inválido' }
  }
  const now = new Date()
  if (!options.allowFuture && parsed > now) {
    return { isValid: false, error: 'No se permiten fechas futuras' }
  }
  if (!options.allowPast && parsed < now) {
    return { isValid: false, error: 'No se permiten fechas pasadas' }
  }
  if (options.minDate && parsed < options.minDate) {
    return { isValid: false, error: `La fecha debe ser después de ${options.minDate.toLocaleDateString()}` }
  }
  if (options.maxDate && parsed > options.maxDate) {
    return { isValid: false, error: `La fecha debe ser antes de ${options.maxDate.toLocaleDateString()}` }
  }
  return { isValid: true, sanitized: parsed.toISOString() }
}
/**
 * Batch validation helper
 */
export function validateAll(
  validations: Array<() => ValidationResult>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  for (const validate of validations) {
    const result = validate()
    if (!result.isValid && result.error) {
      errors.push(result.error)
    }
  }
  return {
    isValid: errors.length === 0,
    errors
  }
}
/**
 * Advanced security validation patterns for production
 */
// Additional XSS patterns for comprehensive protection
const ADVANCED_XSS_PATTERNS = [
  /data:text\/html/gi,
  /vbscript:/gi,
  /livescript:/gi,
  /mocha:/gi,
  /charset=/gi,
  /window\./gi,
  /document\./gi,
  /eval\(/gi,
  /expression\(/gi,
  /url\(/gi,
  /@import/gi
]
// Directory traversal patterns
const DIRECTORY_TRAVERSAL_PATTERNS = [
  /\.\.[\/\\]/g,
  /\.\.[\/\\]\.\./g,
  /%2e%2e[\/\\]/gi,
  /%2e%2e%2f/gi,
  /\.\.%2f/gi,
  /\.\.\\/g
]
// Command injection patterns
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]]/g,
  /\$\(/g,
  /`([^`]*)`/g,
  /\|\s*(cat|ls|pwd|whoami|id|uname)/gi,
  /(chmod|chown|rm|mv|cp)\s/gi
]
// LDAP injection patterns
const LDAP_INJECTION_PATTERNS = [
  /[()&|!=><]/g,
  /\*[^*]*\*/g,
  /\\\\/g
]
interface AdvancedValidationOptions {
  checkXSS?: boolean
  checkSQLInjection?: boolean
  checkDirectoryTraversal?: boolean
  checkCommandInjection?: boolean
  checkLDAPInjection?: boolean
  maxDepth?: number
  allowedTags?: string[]
  allowedAttributes?: string[]
  rateLimit?: number
}
interface SecurityThreat {
  type: 'xss' | 'sql_injection' | 'directory_traversal' | 'command_injection' | 'ldap_injection' | 'rate_limit' | 'suspicious_pattern'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  pattern?: string
}
/**
 * Advanced security validation with threat detection
 */
export function validateSecure(
  input: string,
  options: AdvancedValidationOptions = {}
): ValidationResult & { threats: SecurityThreat[] } {
  const threats: SecurityThreat[] = []
  const {
    checkXSS = true,
    checkSQLInjection = true,
    checkDirectoryTraversal = true,
    checkCommandInjection = true,
    checkLDAPInjection = true,
    maxDepth = 10
  } = options
  if (!input) {
    return { isValid: true, sanitized: '', threats: [] }
  }
  // Check for advanced XSS attempts
  if (checkXSS) {
    const xssThreats = detectAdvancedXSS(input)
    threats.push(...xssThreats)
  }
  // Check for SQL injection
  if (checkSQLInjection) {
    const sqlThreats = detectSQLInjection(input)
    threats.push(...sqlThreats)
  }
  // Check for directory traversal
  if (checkDirectoryTraversal) {
    const traversalThreats = detectDirectoryTraversal(input)
    threats.push(...traversalThreats)
  }
  // Check for command injection
  if (checkCommandInjection) {
    const commandThreats = detectCommandInjection(input)
    threats.push(...commandThreats)
  }
  // Check for LDAP injection
  if (checkLDAPInjection) {
    const ldapThreats = detectLDAPInjection(input)
    threats.push(...ldapThreats)
  }
  // Check for nested object attacks
  const depthThreats = checkObjectDepth(input, maxDepth)
  threats.push(...depthThreats)
  // Check for suspicious patterns
  const suspiciousThreats = detectSuspiciousPatterns(input)
  threats.push(...suspiciousThreats)
  // Determine if input is valid based on threat severity
  const criticalThreats = threats.filter(t => t.severity === 'critical')
  const highThreats = threats.filter(t => t.severity === 'high')
  if (criticalThreats.length > 0) {
    return {
      isValid: false,
      error: 'Critical security threat detected',
      threats
    }
  }
  if (highThreats.length > 0) {
    return {
      isValid: false,
      error: 'High security threat detected',
      threats
    }
  }
  // Sanitize input with advanced protection
  const sanitized = advancedSanitize(input, options)
  return {
    isValid: true,
    sanitized,
    threats
  }
}
/**
 * Detect advanced XSS attempts
 */
function detectAdvancedXSS(input: string): SecurityThreat[] {
  const threats: SecurityThreat[] = []
  // Check original XSS patterns
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      threats.push({
        type: 'xss',
        severity: 'high',
        description: 'Standard XSS pattern detected',
        pattern: pattern.toString()
      })
    }
  }
  // Check advanced XSS patterns
  for (const pattern of ADVANCED_XSS_PATTERNS) {
    if (pattern.test(input)) {
      threats.push({
        type: 'xss',
        severity: 'critical',
        description: 'Advanced XSS pattern detected',
        pattern: pattern.toString()
      })
    }
  }
  // Check for encoded payloads
  try {
    const decoded = decodeURIComponent(input)
    if (decoded !== input) {
      const decodedThreats = detectAdvancedXSS(decoded)
      if (decodedThreats.length > 0) {
        threats.push({
          type: 'xss',
          severity: 'high',
          description: 'Encoded XSS payload detected'
        })
      }
    }
  } catch (e) {
    // Ignore decode errors
  }
  return threats
}
/**
 * Detect SQL injection attempts
 */
function detectSQLInjection(input: string): SecurityThreat[] {
  const threats: SecurityThreat[] = []
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      threats.push({
        type: 'sql_injection',
        severity: 'critical',
        description: 'SQL injection pattern detected',
        pattern: pattern.toString()
      })
    }
  }
  // Check for advanced SQL injection techniques
  const advancedPatterns = [
    /\bUNION\b.*\bSELECT\b/gi,
    /\bWAITFOR\s+DELAY\b/gi,
    /\bBENCHMARK\b\s*\(/gi,
    /\bSLEEP\b\s*\(/gi,
    /\bLOAD_FILE\b\s*\(/gi,
    /\bINTO\s+OUTFILE\b/gi
  ]
  for (const pattern of advancedPatterns) {
    if (pattern.test(input)) {
      threats.push({
        type: 'sql_injection',
        severity: 'critical',
        description: 'Advanced SQL injection technique detected',
        pattern: pattern.toString()
      })
    }
  }
  return threats
}
/**
 * Detect directory traversal attempts
 */
function detectDirectoryTraversal(input: string): SecurityThreat[] {
  const threats: SecurityThreat[] = []
  for (const pattern of DIRECTORY_TRAVERSAL_PATTERNS) {
    if (pattern.test(input)) {
      threats.push({
        type: 'directory_traversal',
        severity: 'high',
        description: 'Directory traversal pattern detected',
        pattern: pattern.toString()
      })
    }
  }
  return threats
}
/**
 * Detect command injection attempts
 */
function detectCommandInjection(input: string): SecurityThreat[] {
  const threats: SecurityThreat[] = []
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      threats.push({
        type: 'command_injection',
        severity: 'critical',
        description: 'Command injection pattern detected',
        pattern: pattern.toString()
      })
    }
  }
  return threats
}
/**
 * Detect LDAP injection attempts
 */
function detectLDAPInjection(input: string): SecurityThreat[] {
  const threats: SecurityThreat[] = []
  for (const pattern of LDAP_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      threats.push({
        type: 'ldap_injection',
        severity: 'medium',
        description: 'LDAP injection pattern detected',
        pattern: pattern.toString()
      })
    }
  }
  return threats
}
/**
 * Check for object depth attacks (prototype pollution protection)
 */
function checkObjectDepth(input: string, maxDepth: number): SecurityThreat[] {
  const threats: SecurityThreat[] = []
  try {
    if (input.includes('{') || input.includes('[')) {
      const parsed = JSON.parse(input)
      const depth = getObjectDepth(parsed)
      if (depth > maxDepth) {
        threats.push({
          type: 'suspicious_pattern',
          severity: 'medium',
          description: `Object depth (${depth}) exceeds maximum allowed (${maxDepth})`
        })
      }
      // Check for prototype pollution patterns
      if (hasPrototypePollution(parsed)) {
        threats.push({
          type: 'suspicious_pattern',
          severity: 'critical',
          description: 'Prototype pollution attempt detected'
        })
      }
    }
  } catch (e) {
    // Not valid JSON, ignore
  }
  return threats
}
/**
 * Detect suspicious patterns
 */
function detectSuspiciousPatterns(input: string): SecurityThreat[] {
  const threats: SecurityThreat[] = []
  // Check for excessive repetition (possible DoS attempt)
  const repetitionMatch = input.match(/(.{10,})\1{10,}/g)
  if (repetitionMatch) {
    threats.push({
      type: 'suspicious_pattern',
      severity: 'medium',
      description: 'Excessive pattern repetition detected (possible DoS attempt)'
    })
  }
  // Check for binary data
  const binaryPattern = /[\x00-\x08\x0E-\x1F\x7F-\xFF]{10,}/
  if (binaryPattern.test(input)) {
    threats.push({
      type: 'suspicious_pattern',
      severity: 'medium',
      description: 'Binary data detected in text input'
    })
  }
  // Check for extremely long input (possible buffer overflow)
  if (input.length > 10000) {
    threats.push({
      type: 'suspicious_pattern',
      severity: 'high',
      description: `Input length (${input.length}) exceeds safe limits`
    })
  }
  return threats
}
/**
 * Advanced sanitization with comprehensive protection
 */
function advancedSanitize(input: string, options: AdvancedValidationOptions): string {
  let sanitized = input
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
  // Decode common encodings to catch obfuscated attacks
  try {
    sanitized = decodeURIComponent(sanitized)
  } catch (e) {
    // Keep original if decode fails
  }
  // Remove dangerous HTML tags
  if (!options.allowedTags || options.allowedTags.length === 0) {
    sanitized = sanitized.replace(/<[^>]*>/g, '')
  } else {
    // Allow only specified tags
    const tagPattern = new RegExp(`<(?!\/?(?:${options.allowedTags.join('|')})\b)[^>]*>`, 'gi')
    sanitized = sanitized.replace(tagPattern, '')
  }
  // Escape remaining HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  // Remove JavaScript protocol
  sanitized = sanitized.replace(/javascript:/gi, '')
  // Remove data URLs
  sanitized = sanitized.replace(/data:[^;]*;base64,/gi, '')
  // Clean up whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim()
  return sanitized
}
/**
 * Get object depth for prototype pollution protection
 */
function getObjectDepth(obj: any, depth = 0): number {
  if (depth > 100) return depth // Prevent infinite recursion
  if (obj === null || typeof obj !== 'object') {
    return depth
  }
  let maxDepth = depth
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const currentDepth = getObjectDepth(obj[key], depth + 1)
      maxDepth = Math.max(maxDepth, currentDepth)
    }
  }
  return maxDepth
}
/**
 * Check for prototype pollution patterns
 */
function hasPrototypePollution(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) return false
  // Check for dangerous keys
  const dangerousKeys = ['__proto__', 'constructor', 'prototype']
  for (const key of dangerousKeys) {
    if (key in obj) {
      return true
    }
  }
  // Recursively check nested objects
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      if (hasPrototypePollution(value)) {
        return true
      }
    }
  }
  return false
}
/**
 * Validate file upload security
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
    scanForMalware?: boolean
  } = {}
): ValidationResult & { threats: SecurityThreat[] } {
  const threats: SecurityThreat[] = []
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'],
    scanForMalware = true
  } = options
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size (${Math.round(file.size / 1024)}KB) exceeds maximum allowed (${Math.round(maxSize / 1024)}KB)`,
      threats: [{
        type: 'suspicious_pattern',
        severity: 'medium',
        description: 'File size exceeds limits'
      }]
    }
  }
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    threats.push({
      type: 'suspicious_pattern',
      severity: 'high',
      description: `Disallowed MIME type: ${file.type}`
    })
  }
  // Check file extension
  const extension = file.name.toLowerCase().split('.').pop()
  if (!extension || !allowedExtensions.includes(`.${extension}`)) {
    threats.push({
      type: 'suspicious_pattern',
      severity: 'high',
      description: `Disallowed file extension: .${extension}`
    })
  }
  // Check for double extensions
  const doubleExtensionPattern = /\.[^.]+\.[^.]+$/
  if (doubleExtensionPattern.test(file.name)) {
    threats.push({
      type: 'suspicious_pattern',
      severity: 'high',
      description: 'Double file extension detected'
    })
  }
  // Basic malware patterns in filename
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i,
    /\.(php|asp|aspx|jsp|cfm)$/i,
    /__MACOSX/,
    /desktop\.ini/i,
    /thumbs\.db/i
  ]
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      threats.push({
        type: 'suspicious_pattern',
        severity: 'critical',
        description: 'Suspicious filename pattern detected'
      })
    }
  }
  const criticalThreats = threats.filter(t => t.severity === 'critical')
  const highThreats = threats.filter(t => t.severity === 'high')
  if (criticalThreats.length > 0) {
    return {
      isValid: false,
      error: 'Critical security threat in file upload',
      threats
    }
  }
  if (highThreats.length > 0) {
    return {
      isValid: false,
      error: 'High security threat in file upload',
      threats
    }
  }
  return {
    isValid: true,
    sanitized: file.name,
    threats
  }
}
/**
 * Production security audit logger
 */
export function logSecurityEvent(
  event: 'validation_failure' | 'threat_detected' | 'file_upload_blocked' | 'rate_limit_exceeded',
  details: {
    threats?: SecurityThreat[]
    userAgent?: string
    ip?: string
    userId?: string
    input?: string
    timestamp?: number
  }
) {
  const logEntry = {
    event,
    timestamp: details.timestamp || Date.now(),
    severity: details.threats?.some(t => t.severity === 'critical') ? 'critical' :
              details.threats?.some(t => t.severity === 'high') ? 'high' : 'medium',
    ...details,
    // Don't log the actual input for security reasons, just its characteristics
    inputLength: details.input?.length,
    inputHash: details.input ? hashString(details.input) : undefined,
    input: undefined // Remove actual input from logs
  }
  // In production, this would send to your security monitoring system
  // Send to monitoring API if available
  if (typeof window !== 'undefined') {
    fetch('/api/monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'security',
        severity: logEntry.severity === 'critical' ? 'critical' : 'high',
        service: 'validation',
        message: `Security event: ${event}`,
        data: logEntry
      })
    }).catch(() => {
      // Ignore monitoring errors
    })
  }
}
/**
 * Simple hash function for logging purposes
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}
