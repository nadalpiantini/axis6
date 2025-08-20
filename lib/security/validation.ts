/**
 * Input Validation Utilities
 * 
 * Provides comprehensive input validation and sanitization
 * to prevent injection attacks and ensure data integrity.
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