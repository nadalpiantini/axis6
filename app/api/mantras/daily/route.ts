import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Check if user already has a mantra for today
    const { data: existingMantra, error: existingError } = await supabase
      .from('axis6_user_mantras')
      .select(`
        *,
        axis6_mantras (
          id,
          content,
          author,
          category_id,
          axis6_categories (
            name,
            slug
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('shown_date', today)
      .single()
    
    if (existingMantra && existingMantra.axis6_mantras) {
      return NextResponse.json({
        mantra: {
          id: existingMantra.axis6_mantras.id,
          content: existingMantra.axis6_mantras.content,
          author: existingMantra.axis6_mantras.author,
          category: existingMantra.axis6_mantras.axis6_categories?.name?.en || 'General'
        },
        completed: existingMantra.completed || false
      })
    }
    
    // Get a random active mantra
    const { data: mantras, error: mantrasError } = await supabase
      .from('axis6_mantras')
      .select(`
        id,
        content,
        author,
        category_id,
        axis6_categories (
          name,
          slug
        )
      `)
      .eq('is_active', true)
    
    if (mantrasError || !mantras || mantras.length === 0) {
      // Return a default mantra if none exist in database
      return NextResponse.json({
        mantra: {
          id: 0,
          content: {
            en: "Every step forward is progress, no matter how small.",
            es: "Cada paso adelante es progreso, sin importar cuán pequeño sea."
          },
          author: "AXIS6",
          category: "Motivation"
        },
        completed: false
      })
    }
    
    // Select a random mantra
    const randomMantra = mantras[Math.floor(Math.random() * mantras.length)]
    
    // Create user mantra record
    const { error: insertError } = await supabase
      .from('axis6_user_mantras')
      .insert([
        {
          user_id: user.id,
          mantra_id: randomMantra.id,
          shown_date: today,
          completed: false
        }
      ])
    
    if (insertError) {
      console.error('Failed to create user mantra record:', insertError)
    }
    
    return NextResponse.json({
      mantra: {
        id: randomMantra.id,
        content: randomMantra.content,
        author: randomMantra.author,
        category: (randomMantra.axis6_categories as any)?.name?.en || 'General'
      },
      completed: false
    })
    
  } catch (error) {
    console.error('Error fetching daily mantra:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}