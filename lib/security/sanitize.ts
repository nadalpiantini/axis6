import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitization configuration for different content types
 */
const SANITIZE_CONFIGS = {
  // Basic text - remove all HTML
  text: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  
  // Rich text - allow formatting tags
  richText: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span'],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true,
  },
  
  // Markdown-like content
  markdown: {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 's',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'img'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  },
  
  // Strict - for user inputs in forms
  strict: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  }
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(dirty: string, config: keyof typeof SANITIZE_CONFIGS = 'text'): string {
  const sanitizeConfig = SANITIZE_CONFIGS[config]
  return DOMPurify.sanitize(dirty, sanitizeConfig)
}

/**
 * Sanitize user input for database storage
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    return String(input)
  }
  
  // Remove any HTML tags and trim whitespace
  const cleaned = sanitizeHTML(input, 'strict')
  
  // Additional sanitization for common injection patterns
  return cleaned
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Sanitize object with multiple string fields
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fieldsToSanitize?: (keyof T)[]
): T {
  const sanitized = { ...obj }
  const fields = fieldsToSanitize || Object.keys(obj)
  
  fields.forEach(field => {
    const value = obj[field as keyof T]
    if (typeof value === 'string') {
      sanitized[field as keyof T] = sanitizeInput(value) as T[keyof T]
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[field as keyof T] = sanitizeObject(value as Record<string, unknown>) as T[keyof T]
    }
  })
  
  return sanitized
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeInput(email).toLowerCase()
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format')
  }
  
  return sanitized
}

/**
 * Validate and sanitize URL
 */
export function sanitizeURL(url: string): string {
  const sanitized = sanitizeInput(url)
  
  try {
    const urlObj = new URL(sanitized)
    
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol')
    }
    
    return urlObj.toString()
  } catch {
    throw new Error('Invalid URL format')
  }
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  return sanitizeInput(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255) // Limit length
}

/**
 * SQL injection prevention for dynamic queries
 * Note: Always prefer parameterized queries over this
 */
export function escapeSQLString(str: string): string {
  return str
    .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case '\0': return '\\0'
        case '\x08': return '\\b'
        case '\x09': return '\\t'
        case '\x1a': return '\\z'
        case '\n': return '\\n'
        case '\r': return '\\r'
        case '"':
        case "'":
        case '\\':
        case '%':
          return `\\${  char}`
        default:
          return char
      }
    })
}

/**
 * XSS prevention for rendering user content
 */
export function escapeHTML(str: string): string {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}

/**
 * Create a sanitized error message (no sensitive data)
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose stack traces or sensitive paths
    return error.message.replace(/\/[^\s]+/g, '[path]')
  }
  return 'An error occurred'
}