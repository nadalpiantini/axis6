'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          confirmPassword,
          name 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = data.retryAfter || 3600 // Default to 1 hour
          throw new Error(`${data.error}. Try again in ${Math.ceil(retryAfter / 60)} minutes.`)
        }
        throw new Error(data.error || 'Error creating account')
      }

      setSuccess(true)
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
    } catch (error: any) {
      setError(error.message || 'Error creating account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bgPrimary via-marfil to-arena texture-noise flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-physical via-emotional to-social bg-clip-text text-transparent mb-2">
            AXIS6
          </h1>
          <p className="text-textSecondary">Start your journey to balance</p>
        </div>

        {/* Register Form */}
        <div className="glass-premium rounded-2xl p-8">
          <h2 className="text-2xl font-serif font-semibold text-textPrimary mb-6">Create Account</h2>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-physical/10 border border-physical/20 text-physical px-4 py-3 rounded-lg mb-6"
            >
              Account created successfully! Check your email to confirm your account.
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-navy-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-physical focus:ring-1 focus:ring-physical transition-colors"
                placeholder="Your name"
                disabled={loading || success}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-navy-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-physical focus:ring-1 focus:ring-physical transition-colors"
                placeholder="you@email.com"
                disabled={loading || success}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-navy-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-physical focus:ring-1 focus:ring-physical transition-colors"
                placeholder="Minimum 8 characters"
                disabled={loading || success}
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters, must include uppercase, lowercase and numbers</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-navy-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-physical focus:ring-1 focus:ring-physical transition-colors"
                placeholder="Repeat your password"
                disabled={loading || success}
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-4 bg-gradient-to-r from-physical to-mental text-white font-semibold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-physical focus:ring-offset-2 focus:ring-offset-navy-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : success ? (
                'Account created ✅'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-physical hover:text-mental transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to start your journey of balance in the 6 axes of life: 
              <span className="text-physical"> Physical</span>,
              <span className="text-mental"> Mental</span>,
              <span className="text-emotional"> Emotional</span>,
              <span className="text-social"> Social</span>,
              <span className="text-spiritual"> Spiritual</span> and
              <span className="text-material"> Material</span>.
            </p>
          </div>
        </div>

        {/* Back to home link */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}