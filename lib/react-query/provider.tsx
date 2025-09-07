'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useState } from 'react'
// Dynamically import DevTools only in development to avoid SSR issues
const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((mod) => ({
    default: mod.ReactQueryDevtools,
  })),
  {
    ssr: false,
  }
)
// Wrapper component that uses the QueryClient from context
function DevToolsWrapper() {
  if (process.env['NODE_ENV'] !== 'development') {
    return null
  }
  return <ReactQueryDevtools initialIsOpen={false} />
}
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds - optimized for dashboard
            gcTime: 10 * 60 * 1000, // 10 minutes - longer cache retention
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors (client errors)
              if (error?.status >= 400 && error?.status < 500) return false
              // Retry up to 2 times for other errors
              return failureCount < 2
            },
            // Optimize for preventing duplicate requests
            refetchOnWindowFocus: false, // Disable to prevent duplicates on tab switch
            refetchOnReconnect: true, // Refetch when coming back online
            refetchOnMount: false, // Use cached data if available and fresh
            // Disable automatic background refetching
            refetchInterval: false,
            refetchIntervalInBackground: false,
            // Enable request deduplication
            networkMode: 'online',
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // Don't retry mutations on client errors
              if (error?.status >= 400 && error?.status < 500) return false
              return failureCount < 1 // Only retry once for mutations
            },
            // Global error handling for mutations
            onError: (error: any, variables, context) => {
              // Log errors in development
              if (process.env.NODE_ENV === 'development') {
                // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Mutation failed:', error, { variables, context });
              }
            },
          },
        },
      })
  )
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env['NODE_ENV'] === 'development' && <DevToolsWrapper />}
    </QueryClientProvider>
  )
}
