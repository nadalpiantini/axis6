#!/usr/bin/env node

/**
 * AXIS6 Chat Storage Setup Script
 * Creates and configures the chat-files Supabase Storage bucket
 * Run with: node scripts/setup-chat-storage.js
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupChatStorage() {
  console.log('🚀 AXIS6 Chat Storage Setup')
  console.log('==========================\n')

  try {
    // 1. Check if bucket exists
    console.log('📦 Checking if chat-files bucket exists...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError)
      return false
    }

    const chatBucket = buckets?.find(bucket => bucket.id === 'chat-files')
    
    if (chatBucket) {
      console.log('✅ chat-files bucket already exists')
    } else {
      // 2. Create the bucket
      console.log('📦 Creating chat-files bucket...')
      const { data: bucket, error: createError } = await supabase.storage.createBucket('chat-files', {
        public: false, // Private bucket
        fileSizeLimit: 52428800, // 50MB limit
        allowedMimeTypes: [
          // Images
          'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
          // Videos  
          'video/mp4', 'video/webm', 'video/quicktime',
          // Audio
          'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
          // Documents
          'application/pdf', 'text/plain', 'application/json',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          // Archives
          'application/zip', 'application/x-zip-compressed'
        ]
      })

      if (createError) {
        console.error('❌ Failed to create bucket:', createError)
        return false
      }

      console.log('✅ Successfully created chat-files bucket')
    }

    // 3. Test file operations
    console.log('\n🧪 Testing file operations...')
    
    // Test upload
    const testContent = 'AXIS6 Chat Storage Test File'
    const testPath = 'test/storage-test.txt'
    
    const { error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(testPath, new Blob([testContent], { type: 'text/plain' }), {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError && !uploadError.message.includes('duplicate')) {
      console.error('❌ Upload test failed:', uploadError)
      return false
    }
    console.log('✅ File upload test: OK')

    // Test signed URL generation  
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('chat-files')
      .createSignedUrl(testPath, 60)

    if (urlError) {
      console.error('❌ Signed URL test failed:', urlError)
      return false
    }
    console.log('✅ Signed URL generation test: OK')

    // Test file listing
    const { data: files, error: listFilesError } = await supabase.storage
      .from('chat-files')
      .list('test', { limit: 10 })

    if (listFilesError) {
      console.error('❌ File listing test failed:', listFilesError)
      return false
    }
    console.log('✅ File listing test: OK')

    // Clean up test file
    await supabase.storage
      .from('chat-files')
      .remove([testPath])

    console.log('✅ Test cleanup completed')

    // 4. Storage bucket statistics
    console.log('\n📊 Storage Configuration:')
    console.log('   Bucket ID: chat-files')
    console.log('   Visibility: Private')
    console.log('   File Size Limit: 50MB')
    console.log('   Allowed Types: Images, Videos, Audio, Documents, Archives')
    
    console.log('\n✅ Chat storage setup completed successfully!')
    console.log('\n📝 Next Steps:')
    console.log('   1. Run the SQL script: scripts/complete-chat-system.sql in Supabase SQL Editor')
    console.log('   2. Test file uploads in the chat interface')
    console.log('   3. Verify RLS policies are working correctly')
    
    return true

  } catch (error) {
    console.error('❌ Unexpected error during setup:', error)
    return false
  }
}

// Run the setup
setupChatStorage()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })