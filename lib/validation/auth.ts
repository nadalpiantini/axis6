export interface ValidationResult {
  isValid: boolean
  error?: string
}
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }
  return { isValid: true }
}
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' }
  }
  return { isValid: true }
}
export const validatePasswordStrength = (password: string): {
  score: number
  feedback: string[]
} => {
  const feedback: string[] = []
  let score = 0
  if (password.length >= 8) {
    score++
  } else {
    feedback.push('Use at least 8 characters')
  }
  if (/[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('Include an uppercase letter')
  }
  if (/[a-z]/.test(password)) {
    score++
  } else {
    feedback.push('Include a lowercase letter')
  }
  if (/\d/.test(password)) {
    score++
  } else {
    feedback.push('Include a number')
  }
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++
  } else {
    feedback.push('Include a special character')
  }
  return { score, feedback }
}
export const validatePasswordMatch = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' }
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' }
  }
  return { isValid: true }
}
export const validateName = (name: string): ValidationResult => {
  if (!name) {
    return { isValid: false, error: 'Name is required' }
  }
  if (name.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' }
  }
  if (name.length > 50) {
    return { isValid: false, error: 'Name must be less than 50 characters' }
  }
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/
  if (!nameRegex.test(name)) {
    return { isValid: false, error: 'Name contains invalid characters' }
  }
  return { isValid: true }
}
export const validateRegistrationForm = (data: {
  name: string
  email: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}
  const nameValidation = validateName(data.name)
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error!
  }
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!
  }
  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error!
  }
  const passwordMatchValidation = validatePasswordMatch(data.password, data.confirmPassword)
  if (!passwordMatchValidation.isValid) {
    errors.confirmPassword = passwordMatchValidation.error!
  }
  if (!data.termsAccepted) {
    errors.terms = 'You must accept the terms and conditions'
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
