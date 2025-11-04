/**
 * Test Video Generation with Large Image (Similar to Imagen 4 output)
 * Tests that the btoa() stack overflow fix works
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithLargeImage() {
  console.log('🎬 Testing Video Generation with LARGE Image\n');
  console.log('='.repeat(70));

  // Use the actual Imagen 4 image from the user's test
  const actualImageUrl = 'https://hlrvpuqwurtdbjkramcp.supabase.co/storage/v1/object/public/story-images/3dd59df2-3ea9-4243-850e-b77fa9dc918b_1762098973754.png';

  console.log('📝 Video Config:');
  console.log('  - Segment ID: test_large_image');
  console.log('  - Image URL:', actualImageUrl);
  console.log('  - Image Size: ~1.4 MB (confirmed via Content-Length)');
  console.log('  - Prompt: A magical glowing acorn in an enchanted forest');
  console.log();
  console.log('⏳ Calling generate-video-v2 function...');
  console.log('   (This will fetch and convert the 1.4MB image)');
  console.log('   (If btoa() fix works, this should NOT crash)');
  console.log();

  try {
    const { data, error } = await supabase.functions.invoke('generate-video-v2', {
      body: {
        segment_id: 'test_large_image',
        imageUrl: actualImageUrl,
        prompt: 'A magical glowing acorn in an enchanted forest',
        includeNarration: false
      }
    });

    if (error) {
      console.error('❌ Video Generation Error:', error);
      console.error('\n📊 Error Details:');
      console.error(JSON.stringify(error, null, 2));

      // Check if it's the stack overflow error
      if (error.message && error.message.includes('Maximum call stack size exceeded')) {
        console.error('\n🔴 BTOA() FIX DID NOT WORK - Still getting stack overflow!');
      }

      process.exit(1);
    }

    console.log('✅ Video Generated Successfully!\n');
    console.log('🎉 BTOA() FIX CONFIRMED WORKING!');
    console.log('📊 Response:');
    console.log(JSON.stringify(data, null, 2));

  } catch (exception) {
    console.error('❌ Test Exception:', exception);

    if (exception.message && exception.message.includes('Maximum call stack size exceeded')) {
      console.error('\n🔴 BTOA() FIX DID NOT WORK - Still getting stack overflow!');
    }

    process.exit(1);
  }
}

// Run the test
testWithLargeImage();
