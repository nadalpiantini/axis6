/**
 * Enhanced Input Sanitization System
 * Comprehensive protection against injection attacks
 * Priority: CRITICAL - Prevents XSS, SQL injection, and other attacks
 */
import DOMPurify from 'isomorphic-dompurify'
import { logger } from '@/lib/logger'
// =====================================================
// SANITIZATION CONFIGURATION
// =====================================================
const SANITIZATION_CONFIG = {
  // HTML sanitization for rich content
  html: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
  },
  // Plain text sanitization
  text: {
    MAX_LENGTH: 10000,
    STRIP_HTML: true,
    NORMALIZE_UNICODE: true,
  },
  // Email sanitization
  email: {
    MAX_LENGTH: 320, // RFC 5321 limit
    NORMALIZE: true,
  },
  // URL sanitization
  url: {
    ALLOWED_PROTOCOLS: ['http:', 'https:', 'mailto:'],
    MAX_LENGTH: 2048,
  },
} as const
// =====================================================
// DANGEROUS PATTERN DETECTION
// =====================================================
const SECURITY_PATTERNS = {
  // XSS patterns
  xss: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi, // Event handlers
    /data:text\/html/gi,
    /data:text\/javascript/gi,
  ],
  // SQL injection patterns
  sql: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(;|\||&|\$|\?)/g,
    /(--)|(\/\*)|(\*\/)/g,
    /(\bOR\b|\bAND\b).*?=.*?=/gi,
  ],
  // Path traversal patterns
  pathTraversal: [
    /\.\.\//g,
    /\.\.\\x2f/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi,
  ],
  // Command injection patterns
  command: [
    /(\b(eval|exec|system|shell_exec|passthru|``|\\$\\(|\\${))/gi,
    /(;|\||&|\$|\?|\n|\r)/g,
  ],
  // Template injection patterns
  template: [
    /\{\{.*?\}\}/g,
    /\${.*?}/g,
    /<\?.*?\?>/g,
    /<%.*?%>/g,
  ],
} as const
// =====================================================
// DETECTION FUNCTIONS
// =====================================================
/**
 * Detect potential security threats in input
 */
export function detectSecurityThreats(input: string): {
  threats: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  safe: boolean
} {
  const threats: string[] = []
  // Check each pattern category
  Object.entries(SECURITY_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach((pattern) => {
      if (pattern.test(input)) {
        threats.push(category)
      }
    })
  })
  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  if (threats.includes('xss') || threats.includes('sql')) {
    severity = 'critical'
  } else if (threats.includes('command') || threats.includes('template')) {
    severity = 'high'
  } else if (threats.includes('pathTraversal')) {
    severity = 'medium'
  }
  return {
    threats: [...new Set(threats)], // Remove duplicates
    severity,
    safe: threats.length === 0,
  }
}
// =====================================================
// ENHANCED SANITIZATION FUNCTIONS
// =====================================================
/**
 * Sanitize plain text input with comprehensive protection
 */
export function sanitizeText(input: string, maxLength = SANITIZATION_CONFIG.text.MAX_LENGTH): string {
  if (!input || typeof input !== 'string') return ''
  // Detect threats first
  const threatAnalysis = detectSecurityThreats(input)
  if (!threatAnalysis.safe) {
    logger.warn('Security threats detected in text input', {
      threats: threatAnalysis.threats,
      severity: threatAnalysis.severity,
      inputLength: input.length,
    })
    // For critical threats, return empty string
    if (threatAnalysis.severity === 'critical') {
      logger.error('Critical security threat blocked', {
        threats: threatAnalysis.threats,
        input: input.substring(0, 100) + '...',
      })
      return ''
    }
  }
  let sanitized = input
  // Remove HTML tags
  sanitized = DOMPurify.sanitize(sanitized, { 
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true 
  })
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, '')
  // Normalize unicode
  sanitized = sanitized.normalize('NFKC')
  // Trim whitespace
  sanitized = sanitized.trim()
  // Enforce length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
    logger.info('Input truncated due to length limit', {
      originalLength: input.length,
      maxLength,
    })
  }
  return sanitized
}
/**
 * Sanitize HTML content with strict whitelist
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  // Detect threats
  const threatAnalysis = detectSecurityThreats(input)
  if (threatAnalysis.severity === 'critical') {
    logger.error('Critical HTML threat blocked', {
      threats: threatAnalysis.threats,
    })
    return ''
  }
  // Sanitize with strict configuration
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: SANITIZATION_CONFIG.html.ALLOWED_TAGS,
    ALLOWED_ATTR: SANITIZATION_CONFIG.html.ALLOWED_ATTR,
    KEEP_CONTENT: SANITIZATION_CONFIG.html.KEEP_CONTENT,
    ALLOW_DATA_ATTR: SANITIZATION_CONFIG.html.ALLOW_DATA_ATTR,
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  })
  return sanitized
}
/**
 * Enhanced email sanitization
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return ''
  let email = input.toLowerCase().trim()
  // Remove dangerous characters
  email = email.replace(/[<>"'`\\x00-\\x1f\\x7f-\\xff]/g, '')
  // Validate basic email structure
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) {
    logger.warn('Invalid email format detected', { input: input.substring(0, 50) })
    return ''
  }
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\\+.*\\+/, // Multiple + signs
    /\\.\\./, // Double dots
    /script/i, // Script in email
  ]
  if (suspiciousPatterns.some(pattern => pattern.test(email))) {
    logger.warn('Suspicious email pattern detected', { email })
    return ''
  }
  // Enforce length limit
  if (email.length > SANITIZATION_CONFIG.email.MAX_LENGTH) {
    return ''
  }
  return email
}
/**
 * Sanitize URL with protocol validation
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return ''
  try {
    const url = new URL(input)
    // Check allowed protocols
    if (!SANITIZATION_CONFIG.url.ALLOWED_PROTOCOLS.includes(url.protocol)) {
      logger.warn('Dangerous URL protocol detected', {
        protocol: url.protocol,
        input: input.substring(0, 100),
      })
      return ''
    }
    // Remove dangerous characters from URL
    const sanitizedUrl = url.toString().replace(/[\\x00-\\x1f\\x7f-\\xff]/g, '')
    // Enforce length limit
    if (sanitizedUrl.length > SANITIZATION_CONFIG.url.MAX_LENGTH) {
      return ''
    }
    return sanitizedUrl
  } catch (error) {
    logger.warn('Invalid URL format', { input: input.substring(0, 100) })
    return ''
  }
}
/**
 * Sanitize JSON data recursively
 */
export function sanitizeJson(input: any, maxDepth = 10, currentDepth = 0): any {
  if (currentDepth >= maxDepth) {
    logger.warn('JSON depth limit exceeded during sanitization')
    return null
  }
  if (input === null || input === undefined) {
    return input
  }
  if (typeof input === 'string') {
    return sanitizeText(input)
  }
  if (typeof input === 'number' || typeof input === 'boolean') {
    return input
  }
  if (Array.isArray(input)) {
    // Limit array size
    if (input.length > 1000) {
      logger.warn('Large array truncated during sanitization', { originalSize: input.length })
      return input.slice(0, 1000).map(item => sanitizeJson(item, maxDepth, currentDepth + 1))
    }
    return input.map(item => sanitizeJson(item, maxDepth, currentDepth + 1))
  }
  if (typeof input === 'object') {
    const sanitized: any = {}
    const keys = Object.keys(input)
    // Limit object size
    if (keys.length > 100) {
      logger.warn('Large object truncated during sanitization', { originalKeys: keys.length })
      keys.splice(100)
    }
    keys.forEach(key => {
      // Sanitize key names
      const sanitizedKey = sanitizeText(key, 100)
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeJson(input[key], maxDepth, currentDepth + 1)
      }
    })
    return sanitized
  }
  return null
}
/**
 * Enhanced sanitization for specific contexts
 */
export function sanitizeForContext(
  input: string,
  context: 'database' | 'html' | 'url' | 'filename' | 'json'
): string {
  if (!input || typeof input !== 'string') return ''
  switch (context) {
    case 'database':
      // Extra protection for database inputs
      return sanitizeText(input)
        .replace(/['"`;\\\\]/g, '') // Remove SQL metacharacters
        .replace(/\\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\\b/gi, '') // Remove SQL keywords
    case 'html':
      return sanitizeHtml(input)
    case 'url':
      return sanitizeUrl(input)
    case 'filename':
      return input
        .replace(/[^a-zA-Z0-9._-]/g, '') // Only allow safe filename characters
        .replace(/\\.\\.+/g, '.') // Prevent double dots
        .substring(0, 255) // File system limit
    case 'json':
      try {
        const parsed = JSON.parse(input)
        return JSON.stringify(sanitizeJson(parsed))
      } catch {
        return ''
      }
    default:
      return sanitizeText(input)
  }
}
/**
 * Batch sanitization for form data
 */
export function sanitizeFormData(formData: Record<string, any>): {
  sanitized: Record<string, any>
  threats: string[]
  rejected: string[]
} {
  const sanitized: Record<string, any> = {}
  const threats: string[] = []
  const rejected: string[] = []
  Object.entries(formData).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const threatAnalysis = detectSecurityThreats(value)
      if (!threatAnalysis.safe) {
        threats.push(...threatAnalysis.threats)
        if (threatAnalysis.severity === 'critical') {
          rejected.push(key)
          logger.error('Critical threat in form field rejected', {
            field: key,
            threats: threatAnalysis.threats,
          })
          return
        }
      }
      sanitized[key] = sanitizeText(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeJson(value)
    } else {
      sanitized[key] = value
    }
  })
  return {
    sanitized,
    threats: [...new Set(threats)],
    rejected,
  }
}
// =====================================================
// LEGACY COMPATIBILITY
// =====================================================
// Export original functions for backward compatibility
export function sanitizeInput(input: string): string {
  return sanitizeText(input)
}
export { sanitizeEmail } // Re-export enhanced email sanitization
// =====================================================
// VALIDATION AND REPORTING
// =====================================================
/**
 * Comprehensive input validation with threat reporting
 */
export function validateAndSanitize(
  input: any,
  context: 'database' | 'html' | 'url' | 'filename' | 'json' = 'database'
): {
  sanitized: any
  isValid: boolean
  threats: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  message?: string
} {
  if (!input) {
    return {
      sanitized: input,
      isValid: true,
      threats: [],
      severity: 'low'
    }
  }
  if (typeof input === 'string') {
    const threatAnalysis = detectSecurityThreats(input)
    const sanitized = sanitizeForContext(input, context)
    return {
      sanitized,
      isValid: threatAnalysis.safe,
      threats: threatAnalysis.threats,
      severity: threatAnalysis.severity,
      message: threatAnalysis.safe ? undefined : `Security threats detected: ${threatAnalysis.threats.join(', ')}`
    }
  }
  if (typeof input === 'object') {
    const formResult = sanitizeFormData(input)
    return {
      sanitized: formResult.sanitized,
      isValid: formResult.threats.length === 0,
      threats: formResult.threats,
      severity: formResult.threats.length > 0 ? 'high' : 'low',
      message: formResult.rejected.length > 0 ? `Rejected fields: ${formResult.rejected.join(', ')}` : undefined
    }
  }
  return {
    sanitized: input,
    isValid: true,
    threats: [],
    severity: 'low'
  }
}
/**
 * Security audit for entire request payload
 */
export function auditRequestSecurity(requestBody: any, headers: Record<string, string>): {
  securityScore: number
  threats: string[]
  recommendations: string[]
  blocked: boolean
} {
  const threats: string[] = []
  const recommendations: string[] = []
  let securityScore = 100
  // Audit request body
  if (requestBody) {
    const bodyValidation = validateAndSanitize(requestBody)
    threats.push(...bodyValidation.threats)
    if (bodyValidation.severity === 'critical') {
      securityScore -= 50
      recommendations.push('Block request due to critical threats')
    } else if (bodyValidation.severity === 'high') {
      securityScore -= 20
    } else if (bodyValidation.severity === 'medium') {
      securityScore -= 10
    }
  }
  // Audit headers
  Object.entries(headers).forEach(([name, value]) => {
    const headerValidation = validateAndSanitize(value)
    if (!headerValidation.isValid) {
      threats.push(`header_${name}`)
      securityScore -= 5
    }
  })
  // Security recommendations based on score
  if (securityScore < 70) {
    recommendations.push('Implement additional input validation')
  }
  if (threats.length > 0) {
    recommendations.push('Monitor for repeated security violations')
  }
  return {
    securityScore: Math.max(0, securityScore),
    threats: [...new Set(threats)],
    recommendations,
    blocked: securityScore < 50, // Block if security score too low
  }
}
// =====================================================
// MIDDLEWARE INTEGRATION
// =====================================================
/**
 * Express/Next.js middleware for automatic sanitization
 */
export function createSanitizationMiddleware(options: {
  logThreats?: boolean
  blockCritical?: boolean
  auditMode?: boolean
} = {}) {
  return async (request: any, response: any, next: any) => {
    const { logThreats = true, blockCritical = true, auditMode = false } = options
    try {
      // Sanitize query parameters
      if (request.query) {
        const queryResult = sanitizeFormData(request.query)
        request.query = queryResult.sanitized
        if (queryResult.threats.length > 0 && logThreats) {
          logger.warn('Threats in query parameters', {
            path: request.url,
            threats: queryResult.threats,
          })
        }
      }
      // Sanitize request body
      if (request.body) {
        const bodyValidation = validateAndSanitize(request.body)
        if (blockCritical && bodyValidation.severity === 'critical') {
          return response.status(400).json({
            error: 'Request blocked due to security threats',
            threats: bodyValidation.threats,
          })
        }
        request.body = bodyValidation.sanitized
        if (bodyValidation.threats.length > 0 && logThreats) {
          logger.warn('Threats in request body', {
            path: request.url,
            threats: bodyValidation.threats,
            severity: bodyValidation.severity,
          })
        }
      }
      // Add security audit to request context
      if (auditMode) {
        const audit = auditRequestSecurity(request.body, request.headers)
        request.securityAudit = audit
        if (audit.blocked) {
          return response.status(403).json({
            error: 'Request blocked by security audit',
            score: audit.securityScore,
            threats: audit.threats,
          })
        }
      }
      next()
    } catch (error) {
      logger.error('Sanitization middleware error', error)
      next(error)
    }
  }
}
/**
 * Quick sanitization for common use cases
 */
export const quickSanitize = {
  text: (input: string) => sanitizeText(input),
  email: (input: string) => sanitizeEmail(input),
  html: (input: string) => sanitizeHtml(input),
  url: (input: string) => sanitizeUrl(input),
  filename: (input: string) => sanitizeForContext(input, 'filename'),
}