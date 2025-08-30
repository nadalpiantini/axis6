'use client'

import { Mail, Lock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { LogoFull } from '@/components/ui/Logo'
import { shouldBypassRateLimit } from '@/lib/test-config'
import { logger } from '@/lib/utils/logger';

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logger.error('Login error:', error)

        // Handle specific error cases with user-friendly messages
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (!shouldBypassRateLimit() && error.message.toLowerCase().includes('rate limit')) {
          setError('Too many login attempts. Please wait a minute before trying again.')
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          setError('Please check your email to confirm your account before logging in.')
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        // Login successful, redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      logger.error('Login failed:', error)
      setError('Login failed. Please check your internet connection and try again.')
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
              Welcome Back
            </h1>
            <p className="text-gray-400">Continue your balance journey</p>
          </div>

          {error && (
            <div role="alert" className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-purple-400 text-white placeholder-gray-400"
                  placeholder="your@email.com"
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
                  data-testid="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:border-purple-400 text-white placeholder-gray-400"
                  placeholder="••••••••"
                  aria-label="Password"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-300">
                <input type="checkbox" className="mr-2 rounded" />
                Remember me
              </label>
              <Link href="/auth/forgot" className="text-purple-400 hover:text-purple-300">
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              data-testid="login-submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-purple-400 hover:text-purple-300 font-semibold">
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
