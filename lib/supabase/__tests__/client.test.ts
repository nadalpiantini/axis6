import { createClient } from '../client'

// Mock the Supabase SSR module
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn((url, key) => ({
    url,
    key,
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}))

describe('Supabase Client', () => {
  it('creates a client with correct environment variables', () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    
    const client = createClient()
    
    expect(client).toBeDefined()
    expect(client.url).toBe('https://test.supabase.co')
    expect(client.key).toBe('test-anon-key')
    
    // Restore original values
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
  })
})