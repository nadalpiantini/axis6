'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, ChevronRight } from 'lucide-react'
import { LogoFull } from '@/components/ui/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Check if still rate limited
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      const remainingSeconds = Math.ceil((rateLimitedUntil - Date.now()) / 1000)
      setError(`Please wait ${remainingSeconds} seconds before trying again`)
      setLoading(false)
      return
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
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
        
        // Handle rate limiting specifically
        if (error.message.toLowerCase().includes('rate limit')) {
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
            <div role="alert" className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
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
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-purple-400 text-white placeholder-gray-400"
                  placeholder="Your name"
                  aria-label="Name"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-purple-400 text-white placeholder-gray-400"
                  placeholder="tu@email.com"
                  aria-label="Email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-purple-400 text-white placeholder-gray-400"
                  placeholder="Minimum 8 characters"
                  aria-label="Password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-purple-400 text-white placeholder-gray-400"
                  placeholder="Confirm your password"
                  aria-label="Confirm Password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-300">
              <input type="checkbox" className="mr-2 rounded" required />
              <span>
                I accept the{' '}
                <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                  terms and conditions
                </Link>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-2"
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