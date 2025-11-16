/**
 * Direct Video Generation Test
 * Tests the generate-video-v2 function to verify stack overflow is fixed
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Service role key from Supabase

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVideoGeneration() {
  console.log('🎬 Direct Video Generation Test\n');
  console.log('='.repeat(70));

  // Create a simple base64 test image (1x1 red pixel PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

  const videoConfig = {
    segment_id: 'test_segment_123',
    imageBase64: testImageBase64,
    prompt: 'A magical glowing acorn in an enchanted forest',
    includeNarration: false
  };

  console.log('📝 Video Config:');
  console.log('  - Segment ID:', videoConfig.segment_id);
  console.log('  - Image Size:', testImageBase64.length, 'bytes (base64)');
  console.log('  - Prompt:', videoConfig.prompt);
  console.log('  - Include Narration:', videoConfig.includeNarration);
  console.log();
  console.log('⏳ Calling generate-video-v2 function...\n');
  console.log('🔍 WATCH FOR DEBUG LOGS IN DOCKER CONTAINER!\n');

  try {
    const { data, error } = await supabase.functions.invoke('generate-video-v2', {
      body: videoConfig
    });

    if (error) {
      console.error('❌ Video Generation Error:', error);
      console.error('\n📊 Error Details:');
      console.error(JSON.stringify(error, null, 2));
      process.exit(1);
    }

    console.log('✅ Video Generated Successfully!\n');
    console.log('📊 Response:');
    console.log(JSON.stringify(data, null, 2));

  } catch (exception) {
    console.error('❌ Test Exception:', exception);
    process.exit(1);
  }
}

// Run the test
testVideoGeneration();
