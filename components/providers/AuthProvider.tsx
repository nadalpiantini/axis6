'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/useAppStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { setUser, setSession, setIsLoading } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          setSession(session)
        }
      } catch (error) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
          console.error('Error checking session:', error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        setSession(session)
      } else {
        setUser(null)
        setSession(null)
        // Only redirect to login if we're on a protected route
        const publicPaths = ['/', '/auth', '/login', '/register']
        const currentPath = window.location.pathname
        const isPublicPath = publicPaths.some(path => 
          currentPath === path || currentPath.startsWith(`${path}/`)
        )
        
        if (!isPublicPath) {
          router.push('/auth/login')
        }
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, setUser, setSession, setIsLoading])

  return <>{children}</>
}