'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ChevronRight, ArrowLeft } from 'lucide-react'
import { LogoFull } from '@/components/ui/Logo'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        console.error('Password reset error:', error)
        setError(error.message)
        return
      }

      setSuccess(true)
    } catch (error) {
      console.error('Password reset failed:', error)
      setError('Failed to send password reset email. Please try again.')
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
              Reset Your Password
            </h1>
            <p className="text-gray-400">
              Enter your email and we'll send you instructions
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {success ? (
            <div role="status" className="text-center">
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
                Password reset email sent! Check your inbox.
              </div>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending...' : 'Send Reset Email'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/auth/login" className="text-purple-400 hover:text-purple-300">
                  <span className="inline-flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}