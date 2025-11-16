/**
 * Check and create story-audio storage bucket if needed
 */

import { createClient } from '@supabase/supabase-js';

// Hardcode credentials from .env.local (for this one-time check)
const supabaseUrl = 'https://hlrvpuqwurtdbjkramcp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTMyMTIsImV4cCI6MjA3MzI2OTIxMn0._B9fXNzIgIvCUpH6_4Wkt3YZ5pbCffMadldBdeEBUFQ';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStorageBucket() {
  try {
    console.log('🔍 Checking for story-audio bucket...\n');

    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    console.log('📦 Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    const storyAudioBucket = buckets.find(b => b.name === 'story-audio');

    if (storyAudioBucket) {
      console.log('\n✅ story-audio bucket exists!');
      console.log('   Public:', storyAudioBucket.public);
      console.log('   ID:', storyAudioBucket.id);
    } else {
      console.log('\n❌ story-audio bucket does NOT exist');
      console.log('\n⚠️  This is likely why audio generation is failing.');
      console.log('💡 You need to create the bucket in Supabase Dashboard:');
      console.log('   1. Go to: https://hlrvpuqwurtdbjkramcp.supabase.co/project/hlrvpuqwurtdbjkramcp/storage/buckets');
      console.log('   2. Click "New bucket"');
      console.log('   3. Name: story-audio');
      console.log('   4. Public: Yes (enable public access)');
      console.log('   5. Click "Create bucket"');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkStorageBucket();
