import { z } from "zod"

export const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s\u00C0-\u017F-']+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),

  email: z
    .string()
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters"),

  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, '')), {
      message: "Please enter a valid phone number"
    }),

  bio: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= 500, {
      message: "Bio must be less than 500 characters"
    }),

  about: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= 1000, {
      message: "About section must be less than 1000 characters"
    }),

  location: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= 100, {
      message: "Location must be less than 100 characters"
    }),

  city: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= 100, {
      message: "City must be less than 100 characters"
    }),

  timezone: z
    .string()
    .min(1, "Please select a timezone")
    .default("America/Santo_Domingo"),

  birthday: z
    .date()
    .optional()
    .refine((val) => {
      if (!val) return true
      const today = new Date()
      const age = today.getFullYear() - val.getFullYear()
      return age >= 13 && age <= 120
    }, {
      message: "You must be between 13 and 120 years old"
    }),
})

export type ProfileFormData = z.infer<typeof profileFormSchema>

export const settingsFormSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    daily_reminders: z.boolean().default(true),
    weekly_summary: z.boolean().default(true),
    achievement_alerts: z.boolean().default(true),
  }),

  privacy: z.object({
    profile_visibility: z.enum(["public", "private"]).default("private"),
    data_sharing: z.boolean().default(false),
    analytics: z.boolean().default(true),
  }),

  appearance: z.object({
    theme: z.enum(["dark", "light", "system"]).default("dark"),
    compact_mode: z.boolean().default(false),
    animations: z.boolean().default(true),
  }),

  accessibility: z.object({
    high_contrast: z.boolean().default(false),
    reduce_motion: z.boolean().default(false),
    screen_reader: z.boolean().default(false),
    font_size: z.enum(["small", "medium", "large"]).default("medium"),
  }),
})

export type SettingsFormData = z.infer<typeof settingsFormSchema>

// Common validation patterns
export const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
export const nameRegex = /^[a-zA-Z\s\u00C0-\u017F-']+$/

// Timezone options (common ones for now)
export const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Santo_Domingo", label: "Atlantic Time (AST)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AEST)" },
] as const
