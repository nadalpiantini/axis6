import { z } from 'zod'

import { sanitizeEmail, sanitizeInput } from '@/lib/security/sanitize'

// Common schemas
export const emailSchema = z
  .string()
  .min(1, 'Email es requerido')
  .email('Email inválido')
  .toLowerCase()
  .trim()
  .transform((email) => sanitizeEmail(email))

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(100, 'La contraseña es demasiado larga')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'La contraseña debe contener mayúsculas, minúsculas y números'
  )

export const nameSchema = z
  .string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre es demasiado largo')
  .trim()
  .transform((name) => sanitizeInput(name))
  .refine((name) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name), 'El nombre solo puede contener letras y espacios')

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña es requerida')
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  name: nameSchema.optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

export const forgotPasswordSchema = z.object({
  email: emailSchema
})

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  accessToken: z.string().min(1, 'Token de acceso es requerido'),
  refreshToken: z.string().min(1, 'Token de actualización es requerido')
})

// Mantra schemas
export const completeMantraSchema = z.object({
  action: z.enum(['complete', 'skip'], {
    errorMap: () => ({ message: 'Acción inválida' })
  }),
  timestamp: z.string().datetime().optional()
})

// Check-in schemas
export const checkInSchema = z.object({
  categoryId: z.string().uuid('ID de categoría inválido'),
  completed: z.boolean(),
  date: z.string().datetime().optional()
})

export const bulkCheckInSchema = z.object({
  checkIns: z.array(checkInSchema).min(1).max(10)
})

// Streak schemas
export const streakQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// Profile schemas
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  avatarUrl: z.string().url().optional(),
  preferences: z.object({
    language: z.enum(['es', 'en']).optional(),
    timezone: z.string().optional(),
    notifications: z.boolean().optional()
  }).optional()
})

// Helper function for validating request body
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: string }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { error: firstError.message }
    }
    return { error: 'Datos inválidos' }
  }
}

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CompleteMantraInput = z.infer<typeof completeMantraSchema>
export type CheckInInput = z.infer<typeof checkInSchema>
export type BulkCheckInInput = z.infer<typeof bulkCheckInSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
