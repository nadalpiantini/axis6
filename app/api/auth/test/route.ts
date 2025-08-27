import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Try to create a simple client
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
    
    // Test a simple query
    const { data, error } = await supabase.from('axis6_categories').select('count')
    
    return NextResponse.json({
      status: 'ok',
      env: {
        hasUrl,
        hasAnon,
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)  }...`
      },
      test: {
        querySuccess: !error,
        error: error?.message || null
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message || 'Unknown error'
    })
  }
}