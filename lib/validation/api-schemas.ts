/**
 * AXIS6 API Validation Schemas - Security Hardened
 * Comprehensive input validation for all API endpoints
 * Priority: CRITICAL - Prevents injection attacks and data corruption
 */
import { z } from 'zod'
import { sanitizeInput, sanitizeEmail } from '@/lib/security/sanitize'
// =====================================================
// ENHANCED SECURITY SCHEMAS
// =====================================================
// UUID validation with security checks
const secureUuidSchema = z
  .string()
  .uuid('Invalid UUID format')
  .refine((uuid) => uuid.length === 36, 'UUID must be exactly 36 characters')
// Enhanced password schema with stronger requirements
export const strongPasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  )
  .refine((password) => {
    // Additional security checks
    const commonPasswords = ['password123', 'admin123', 'axis6123']
    return !commonPasswords.some(common => password.toLowerCase().includes(common))
  }, 'Password cannot contain common patterns')
// Secure email with additional validation
export const secureEmailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(320, 'Email is too long') // RFC 5321 limit
  .email('Invalid email format')
  .toLowerCase()
  .trim()
  .transform((email) => sanitizeEmail(email))
  .refine((email) => {
    // Block suspicious email patterns
    const suspiciousPatterns = [
      /.*\+.*\+.*/, // Multiple + signs
      /.*\.\..*/, // Double dots
      /.*script.*/, // Script injection attempts
    ]
    return !suspiciousPatterns.some(pattern => pattern.test(email))
  }, 'Suspicious email pattern detected')
// Secure text input with XSS protection
export const secureTextSchema = z
  .string()
  .max(10000, 'Text is too long')
  .transform((text) => sanitizeInput(text))
  .refine((text) => {
    // Block script tags and dangerous patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /data:text\/html/i,
      /vbscript:/i,
    ]
    return !dangerousPatterns.some(pattern => pattern.test(text))
  }, 'Potentially dangerous content detected')
// Secure JSON input
export const secureJsonSchema = z
  .any()
  .refine((data) => {
    // Validate JSON depth to prevent DoS
    const jsonString = JSON.stringify(data)
    const depth = (jsonString.match(/{|\[/g) || []).length
    return depth <= 10 && jsonString.length <= 50000
  }, 'JSON structure too complex or large')
// =====================================================
// AUTHENTICATION SCHEMAS
// =====================================================
export const secureLoginSchema = z.object({
  email: secureEmailSchema,
  password: z.string().min(1, 'Password is required').max(128),
  remember: z.boolean().optional().default(false),
  captcha: z.string().optional(), // For future captcha implementation
})
export const secureRegisterSchema = z.object({
  email: secureEmailSchema,
  password: strongPasswordSchema,
  confirmPassword: z.string(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .trim()
    .transform((name) => sanitizeInput(name))
    .refine((name) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/.test(name), 'Name contains invalid characters'),
  terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
  captcha: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})
export const passwordResetSchema = z.object({
  email: secureEmailSchema,
  captcha: z.string().optional(),
})
// =====================================================
// CHECKIN SCHEMAS WITH ENHANCED VALIDATION
// =====================================================
export const secureCheckinSchema = z.object({
  categoryId: secureUuidSchema,
  completed: z.boolean(),
  mood: z.number().int().min(1).max(10).optional(),
  notes: secureTextSchema.optional(),
  date: z.string().datetime().optional(),
  metadata: secureJsonSchema.optional(),
})
export const bulkCheckinSchema = z.object({
  checkins: z.array(secureCheckinSchema).min(1).max(6), // Max 6 categories
})
// =====================================================
// PROFILE AND SETTINGS SCHEMAS
// =====================================================
export const secureProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .trim()
    .transform(sanitizeInput)
    .optional(),
  timezone: z
    .string()
    .max(50)
    .refine((tz) => {
      // Validate against known timezone patterns
      return /^[A-Za-z_\/]+$/.test(tz)
    }, 'Invalid timezone format')
    .optional(),
  preferences: z.object({
    language: z.enum(['en', 'es']).optional(),
    notifications: z.boolean().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    privacy: z.object({
      shareProgress: z.boolean().optional(),
      publicProfile: z.boolean().optional(),
    }).optional(),
  }).optional(),
  avatar_url: z.string().url().max(500).optional(),
})
// =====================================================
// CHAT SYSTEM SCHEMAS
// =====================================================
export const secureChatMessageSchema = z.object({
  content: secureTextSchema.max(2000, 'Message too long'),
  room_id: secureUuidSchema,
  reply_to: secureUuidSchema.optional(),
  attachments: z.array(z.object({
    type: z.enum(['image', 'file']),
    url: z.string().url().max(500),
    name: z.string().max(255),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
  })).max(5).optional(),
})
export const secureChatRoomSchema = z.object({
  name: z.string().min(1).max(100).transform(sanitizeInput),
  description: secureTextSchema.max(500).optional(),
  type: z.enum(['direct', 'group', 'public']),
  participants: z.array(secureUuidSchema).max(50).optional(),
})
// =====================================================
// TIME BLOCKS AND ACTIVITIES SCHEMAS
// =====================================================
export const secureTimeBlockSchema = z.object({
  date: z.string().datetime(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  activity_name: z.string().min(1).max(200).transform(sanitizeInput),
  category_id: secureUuidSchema.optional(),
  notes: secureTextSchema.max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
})
// =====================================================
// ANALYTICS AND EXPORT SCHEMAS
// =====================================================
export const analyticsQuerySchema = z.object({
  period: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(365)),
  categoryId: secureUuidSchema.optional(),
  includePersonalData: z.boolean().optional().default(false),
  format: z.enum(['json', 'csv']).optional().default('json'),
})
export const exportDataSchema = z.object({
  format: z.enum(['json', 'csv']),
  includeAllData: z.boolean().optional().default(false),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  categories: z.array(secureUuidSchema).optional(),
})
// =====================================================
// ADMIN AND MONITORING SCHEMAS
// =====================================================
export const adminActionSchema = z.object({
  action: z.enum(['reset_rate_limit', 'clear_cache', 'force_logout']),
  target: z.string().max(100).optional(),
  reason: z.string().max(500).optional(),
})
// =====================================================
// API ENDPOINT VALIDATION HELPERS
// =====================================================
/**
 * Enhanced request validation with security logging
 */
export async function validateSecureRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: string; violations?: string[] }> {
  try {
    const body = await request.json()
    // Log potential security violations
    const violations: string[] = []
    // Check for common injection patterns
    const bodyString = JSON.stringify(body)
    const injectionPatterns = [
      { pattern: /<script/i, name: 'XSS Script Tag' },
      { pattern: /javascript:/i, name: 'JavaScript URL' },
      { pattern: /on\w+\s*=/i, name: 'Event Handler' },
      { pattern: /union\s+select/i, name: 'SQL Injection' },
      { pattern: /drop\s+table/i, name: 'SQL Drop' },
      { pattern: /delete\s+from/i, name: 'SQL Delete' },
    ]
    injectionPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(bodyString)) {
        violations.push(name)
      }
    })
    // Log violations for monitoring
    if (violations.length > 0) {
}
    const data = schema.parse(body)
    return { data, violations }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { 
        error: firstError.message,
        violations: []
      }
    }
    return { 
      error: 'Invalid request data',
      violations: []
    }
  }
}
/**
 * Validate query parameters with security checks
 */
export function validateSecureQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { data?: T; error?: string } {
  try {
    const params: Record<string, any> = {}
    // Convert URLSearchParams to object
    for (const [key, value] of searchParams.entries()) {
      // Basic sanitization of query parameters
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '')
      const sanitizedValue = sanitizeInput(value)
      params[sanitizedKey] = sanitizedValue
    }
    const data = schema.parse(params)
    return { data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { error: firstError.message }
    }
    return { error: 'Invalid query parameters' }
  }
}
// =====================================================
// TYPE EXPORTS
// =====================================================
export type SecureLoginInput = z.infer<typeof secureLoginSchema>
export type SecureRegisterInput = z.infer<typeof secureRegisterSchema>
export type SecureCheckinInput = z.infer<typeof secureCheckinSchema>
export type SecureProfileInput = z.infer<typeof secureProfileSchema>
export type SecureChatMessageInput = z.infer<typeof secureChatMessageSchema>
export type SecureTimeBlockInput = z.infer<typeof secureTimeBlockSchema>
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>
export type ExportDataInput = z.infer<typeof exportDataSchema>