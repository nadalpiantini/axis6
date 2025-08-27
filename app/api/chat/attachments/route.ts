import { NextRequest, NextResponse } from 'next/server'

import { withChatAuth } from '@/lib/middleware/chat-auth'

/**
 * GET /api/chat/attachments
 * Get attachments for a message
 */
export const GET = withChatAuth(async (context, request) => {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('message_id')
    
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    const { user } = context
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get attachments for the message
    const { data: attachments, error } = await supabase
      .from('axis6_chat_attachments')
      .select('*')
      .eq('message_id', messageId)
      .eq('upload_status', 'ready')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to get attachments:', error)
      return NextResponse.json(
        { error: 'Failed to get attachments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ attachments: attachments || [] })

  } catch (error) {
    console.error('Attachments API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/chat/attachments
 * Initialize file upload
 */
export const POST = withChatAuth(async (context, request) => {
  try {
    const { user } = context
    const body = await request.json()
    const { message_id, file_name, file_size, mime_type } = body

    if (!message_id || !file_name || !file_size || !mime_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file size (50MB limit)
    if (file_size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      )
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Initialize upload
    const { data, error } = await supabase.rpc('initialize_file_upload', {
      p_message_id: message_id,
      p_file_name: file_name,
      p_file_size: file_size,
      p_mime_type: mime_type
    })

    if (error) {
      console.error('Failed to initialize file upload:', error)
      return NextResponse.json(
        { error: 'Failed to initialize file upload' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('File upload initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})