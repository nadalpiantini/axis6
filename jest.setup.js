// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  redirect: jest.fn(),
}))

// Mock framer-motion globally
jest.mock('framer-motion', () => {
  const React = require('react')
  
  const createMockComponent = (elementType) => {
    return React.forwardRef((props, ref) => {
      const { children, whileHover, whileTap, whileInView, initial, animate, exit, transition, variants, ...rest } = props
      return React.createElement(elementType, { ...rest, ref }, children)
    })
  }

  return {
    motion: new Proxy({}, {
      get: (_, elementType) => createMockComponent(elementType)
    }),
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({
      start: jest.fn(),
      stop: jest.fn(),
      set: jest.fn(),
    }),
    useInView: () => [null, true],
  }
})