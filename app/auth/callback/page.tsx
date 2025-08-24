'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      
      // Get the code from the URL
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      
      if (code) {
        try {
          // Exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Error exchanging code for session:', error)
            setError('Failed to confirm email. Please try logging in.')
            setTimeout(() => router.push('/auth/login'), 3000)
            return
          }
          
          // Successfully confirmed email, redirect to dashboard
          router.push('/dashboard')
        } catch (err) {
          console.error('Callback error:', err)
          setError('An error occurred. Please try logging in.')
          setTimeout(() => router.push('/auth/login'), 3000)
        }
      } else {
        // No code in URL, redirect to login
        router.push('/auth/login')
      }
    }
    
    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
            <p className="text-gray-400">{error}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-4">Confirming your email...</h1>
            <p className="text-gray-400">Please wait while we verify your account.</p>
          </>
        )}
      </div>
    </div>
  )
}