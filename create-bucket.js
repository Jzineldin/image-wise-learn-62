/**
 * Create story-audio storage bucket
 */

import { createClient } from '@supabase/supabase-js';

// Service role key needed for admin operations
const supabaseUrl = 'https://hlrvpuqwurtdbjkramcp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2];

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('Usage: node create-bucket.js <service-role-key>');
  console.error('Or set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBucket() {
  try {
    console.log('📦 Creating story-audio bucket...\n');

    const { data, error } = await supabase.storage.createBucket('story-audio', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg']
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists (which is good!)');
        return;
      }
      throw error;
    }

    console.log('✅ Successfully created story-audio bucket!');
    console.log('   ID:', data.name);
    console.log('   Public: Yes');
    console.log('   Max file size: 10MB');
    console.log('   Allowed types: audio/wav, audio/mpeg, audio/mp3, audio/ogg');
    console.log('\n🎉 Audio generation should now work!');

  } catch (error) {
    console.error('❌ Error creating bucket:', error.message);
    console.error('\n💡 Alternative: Create manually in Supabase Dashboard:');
    console.error('   https://hlrvpuqwurtdbjkramcp.supabase.co/project/hlrvpuqwurtdbjkramcp/storage/buckets');
    process.exit(1);
  }
}

createBucket();
