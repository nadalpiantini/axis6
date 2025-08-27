import { NextRequest, NextResponse } from 'next/server'

import { withChatAuth } from '@/lib/middleware/chat-auth'

/**
 * GET /api/chat/attachments/[id]
 * Get attachment details and signed URL
 */
export const GET = withChatAuth(async (context, request, { params }) => {
  try {
    const { user } = context
    const attachmentId = params.id

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      )
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get attachment details
    const { data: attachment, error } = await supabase
      .from('axis6_chat_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('upload_status', 'ready')
      .is('deleted_at', null)
      .single()

    if (error || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      )
    }

    // Generate signed URL for download
    const { data: urlData } = await supabase.storage
      .from('chat-files')
      .createSignedUrl(attachment.storage_path, 3600) // 1 hour expiry

    return NextResponse.json({
      attachment,
      download_url: urlData?.signedUrl || null
    })

  } catch (error) {
    console.error('Attachment GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * PUT /api/chat/attachments/[id]
 * Finalize file upload
 */
export const PUT = withChatAuth(async (context, request, { params }) => {
  try {
    const { user } = context
    const attachmentId = params.id
    const body = await request.json()
    const { width, height, duration } = body

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      )
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Finalize upload
    const { data, error } = await supabase.rpc('finalize_file_upload', {
      p_attachment_id: attachmentId,
      p_width: width,
      p_height: height,
      p_duration: duration
    })

    if (error || !data) {
      console.error('Failed to finalize upload:', error)
      return NextResponse.json(
        { error: 'Failed to finalize upload' },
        { status: 500 }
      )
    }

    // Get updated attachment
    const { data: attachment } = await supabase
      .from('axis6_chat_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single()

    return NextResponse.json({ attachment })

  } catch (error) {
    console.error('Attachment PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * DELETE /api/chat/attachments/[id]
 * Delete attachment
 */
export const DELETE = withChatAuth(async (context, request, { params }) => {
  try {
    const { user } = context
    const attachmentId = params.id

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      )
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get attachment to verify ownership
    const { data: attachment, error: fetchError } = await supabase
      .from('axis6_chat_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found or access denied' },
        { status: 404 }
      )
    }

    // Soft delete attachment
    const { error: deleteError } = await supabase
      .from('axis6_chat_attachments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', attachmentId)

    if (deleteError) {
      console.error('Failed to delete attachment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete attachment' },
        { status: 500 }
      )
    }

    // Delete from storage (non-blocking)
    supabase.storage
      .from('chat-files')
      .remove([attachment.storage_path])
      .catch(error => console.warn('Storage deletion failed:', error))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Attachment DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})