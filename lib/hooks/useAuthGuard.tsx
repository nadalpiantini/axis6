'use client'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { useUser } from '@/lib/react-query/hooks'
/**
 * Custom hook for protecting routes with authentication
 *
 * This hook handles client-side authentication checking and redirection
 * in a React-compliant way (using useEffect to avoid state updates during render).
 *
 * Note: The middleware already handles server-side authentication redirects,
 * so this hook primarily provides UX improvements and client-side validation.
 *
 * @param redirectTo - The path to redirect unauthenticated users (default: '/auth/login')
 * @returns Object with user, isLoading, and isAuthenticated status
 */
export function useAuthGuard(redirectTo: string = '/auth/login') {
  const { data: user, isLoading: userLoading } = useUser()
  const router = useRouter()
  // Handle authentication redirect in useEffect to avoid state updates during render
  useEffect(() => {
    if (!userLoading && !user) {
      router.push(redirectTo)
    }
  }, [user, userLoading, redirectTo, router])
  return {
    user,
    isLoading: userLoading,
    isAuthenticated: !!user && !userLoading
  }
}
/**
 * Higher-order component for protecting entire pages
 *
 * Usage:
 * export default withAuthGuard(MyProtectedPage)
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/auth/login'
) {
  return function AuthGuardedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useAuthGuard(redirectTo)
    if (isLoading) {
      return (
        <div className="min-h-screen text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Verifying access...</p>
          </div>
        </div>
      )
    }
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Redirecting...</p>
          </div>
        </div>
      )
    }
    return <Component {...props} />
  }
}
