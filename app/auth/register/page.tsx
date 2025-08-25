'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, ChevronRight, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { LogoFull } from '@/components/ui/Logo'
import { shouldBypassRateLimit, shouldBypassEmailConfirmation } from '@/lib/test-config'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { validateEmail, validateName, validatePasswordMatch } from '@/lib/validation/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [newsletterSubscribe, setNewsletterSubscribe] = useState(false)
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null)

  // Real-time validation helpers
  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors }
    
    switch (field) {
      case 'name':
        const nameValidation = validateName(value)
        if (!nameValidation.isValid) {
          errors.name = nameValidation.error!
        } else {
          delete errors.name
        }
        break
      case 'email':
        const emailValidation = validateEmail(value)
        if (!emailValidation.isValid) {
          errors.email = emailValidation.error!
        } else {
          delete errors.email
        }
        break
      case 'confirmPassword':
        if (value && password) {
          const matchValidation = validatePasswordMatch(password, value)
          if (!matchValidation.isValid) {
            errors.confirmPassword = matchValidation.error!
          } else {
            delete errors.confirmPassword
          }
        }
        break
    }
    
    setFieldErrors(errors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})
    
    // Check if still rate limited (bypass in test mode)
    if (!shouldBypassRateLimit() && rateLimitedUntil && Date.now() < rateLimitedUntil) {
      const remainingSeconds = Math.ceil((rateLimitedUntil - Date.now()) / 1000)
      setError(`Please wait ${remainingSeconds} seconds before trying again`)
      setLoading(false)
      return
    }
    
    // Validate all fields
    const errors: Record<string, string> = {}
    
    const nameValidation = validateName(name)
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error!
    }
    
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error!
    }
    
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    
    const passwordMatchValidation = validatePasswordMatch(password, confirmPassword)
    if (!passwordMatchValidation.isValid) {
      errors.confirmPassword = passwordMatchValidation.error!
    }
    
    if (!termsAccepted) {
      errors.terms = 'You must accept the terms and conditions'
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setLoading(false)
      return
    }
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            newsletter_subscribed: newsletterSubscribe,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Registration error:', error)
        
        // Handle email confirmation errors gracefully
        if (error.message.includes('Error sending confirmation email')) {
          // User was created but email failed - try to sign them in
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          
          if (!signInError && signInData.user) {
            // Sign in successful after registration
            router.push('/auth/onboarding')
            return
          }
          
          // Show success message even if email failed
          setError('Account created successfully! You can now sign in.')
          setTimeout(() => router.push('/auth/login'), 2000)
          return
        }
        
        // Handle rate limiting specifically (bypass in test mode)
        if (!shouldBypassRateLimit() && error.message.toLowerCase().includes('rate limit')) {
          // Set rate limit for 60 seconds
          const cooldownTime = Date.now() + 60000
          setRateLimitedUntil(cooldownTime)
          setError('Too many registration attempts. Please wait 60 seconds before trying again.')
          
          // Clear rate limit after cooldown
          setTimeout(() => {
            setRateLimitedUntil(null)
          }, 60000)
        } else if (error.message.includes('User already registered')) {
          setError('This email is already registered. Please sign in instead.')
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        // Check if we have a session (email confirmations disabled) or not (enabled)
        if (data.session) {
          // Direct login - email confirmations are disabled
          router.push('/auth/onboarding')
        } else {
          // Email confirmation required
          setError('Please check your email to confirm your account.')
          setTimeout(() => router.push('/auth/login'), 3000)
        }
      }
    } catch (error) {
      console.error('Registration failed:', error)
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">
              <LogoFull size="lg" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Create Your Account
            </h1>
            <p className="text-gray-400">Begin your journey toward balance</p>
          </div>

          {error && (
            <div role="alert" className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  data-testid="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    validateField('name', e.target.value)
                  }}
                  onBlur={(e) => validateField('name', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl focus:outline-none text-white placeholder-gray-400 transition-all duration-200 ${
                    fieldErrors.name 
                      ? 'border-red-500/50 focus:border-red-400' 
                      : 'border-white/20 focus:border-purple-400'
                  }`}
                  placeholder="Your name"
                  aria-label="Name"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                  required
                />
              </div>
              {fieldErrors.name && (
                <p id="name-error" className="mt-1 text-xs text-red-400">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  data-testid="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    validateField('email', e.target.value)
                  }}
                  onBlur={(e) => validateField('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl focus:outline-none text-white placeholder-gray-400 transition-all duration-200 ${
                    fieldErrors.email 
                      ? 'border-red-500/50 focus:border-red-400' 
                      : 'border-white/20 focus:border-purple-400'
                  }`}
                  placeholder="your@email.com"
                  aria-label="Email"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  required
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="mt-1 text-xs text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  data-testid="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (confirmPassword) {
                      validateField('confirmPassword', confirmPassword)
                    }
                  }}
                  className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-xl focus:outline-none text-white placeholder-gray-400 transition-all duration-200 ${
                    fieldErrors.password 
                      ? 'border-red-500/50 focus:border-red-400' 
                      : 'border-white/20 focus:border-purple-400'
                  }`}
                  placeholder="Minimum 8 characters"
                  aria-label="Password"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby="password-requirements"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-400">
                  {fieldErrors.password}
                </p>
              )}
              {password && (
                <div className="mt-3" id="password-requirements">
                  <PasswordStrength password={password} />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  data-testid="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    validateField('confirmPassword', e.target.value)
                  }}
                  onBlur={(e) => validateField('confirmPassword', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-xl focus:outline-none text-white placeholder-gray-400 transition-all duration-200 ${
                    fieldErrors.confirmPassword 
                      ? 'border-red-500/50 focus:border-red-400' 
                      : 'border-white/20 focus:border-purple-400'
                  }`}
                  placeholder="Confirm your password"
                  aria-label="Confirm Password"
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirm-password-error" className="mt-1 text-xs text-red-400">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked)
                    if (fieldErrors.terms) {
                      const errors = { ...fieldErrors }
                      delete errors.terms
                      setFieldErrors(errors)
                    }
                  }}
                  className="mt-0.5 rounded border-gray-600 text-purple-500 focus:ring-purple-500" 
                  required 
                />
                <span>
                  I accept the{' '}
                  <Link href="/terms" className="text-purple-400 hover:text-purple-300 underline">
                    terms and conditions
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                    privacy policy
                  </Link>
                </span>
              </label>
              {fieldErrors.terms && (
                <p className="text-xs text-red-400 ml-6">
                  {fieldErrors.terms}
                </p>
              )}
              
              <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={newsletterSubscribe}
                  onChange={(e) => setNewsletterSubscribe(e.target.checked)}
                  className="mt-0.5 rounded border-gray-600 text-purple-500 focus:ring-purple-500" 
                />
                <span>
                  Send me tips and updates to help me maintain balance (optional)
                </span>
              </label>
            </div>

            <button
              type="submit"
              data-testid="register-submit"
              disabled={loading || Object.keys(fieldErrors).length > 0}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Free Account'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}