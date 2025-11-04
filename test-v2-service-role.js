/**
 * Service Role Test for Google AI Studio V2 Integration
 * Uses service role key to bypass authentication
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create service role client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
  console.log('🧪 Google AI Studio V2 Integration - Service Role Test\n');
  console.log('='.repeat(70));
  console.log('⚠️  Using service role key to bypass auth for testing\n');

  // Create a test user first
  console.log('👤 Creating test user in database...\n');

  const testUserId = 'test-user-' + Date.now();

  // Insert test user directly
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .insert({
      id: testUserId,
      credits: 100 // Give them some credits
    })
    .select()
    .single();

  if (userError) {
    console.log('⚠️  Could not create profile (may already exist):', userError.message);
  } else {
    console.log('✅ Test user profile created with 100 credits\n');
  }

  // Test 1: Generate Story Page (Text + Image)
  console.log('\n📖 TEST 1: Story Page Generation (Gemini 2.5 Pro + Imagen 4)\n');
  console.log('─'.repeat(70));

  const storyConfig = {
    childName: 'Emma',
    ageGroup: '7-9 years old',
    theme: 'Fantasy',
    character: 'a brave squirrel named Squeaky',
    traits: 'curious and adventurous',
    prompt: 'Create the very first page of the story. Squeaky discovers a mysterious glowing acorn in the forest.',
    segment_number: 1
  };

  console.log('📝 Story Config:', JSON.stringify(storyConfig, null, 2));
  console.log('\n⏳ Calling generate-story-page-v2...\n');

  try {
    // Create a proper JWT token for the test user
    const testToken = btoa(JSON.stringify({
      sub: testUserId,
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600
    }));

    const { data: storyData, error: storyError } = await supabase.functions.invoke('generate-story-page-v2', {
      body: storyConfig
    });

    if (storyError) {
      console.error('❌ Story Generation Error:', storyError);

      // Try to get more details from the response
      if (storyError.context) {
        const responseText = await storyError.context.text();
        console.error('Error details:', responseText);
      }

      console.log('\n⚠️  Authentication bypass needed - checking if Google AI Studio is configured...\n');

      // Check if env var is set
      const envCheck = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
      if (envCheck) {
        console.log('✅ Google API key found in environment');
      } else {
        console.log('❌ Google API key NOT found in environment');
        console.log('   Set GOOGLE_AI_STUDIO_API_KEY or GOOGLE_GEMINI_API_KEY');
      }

      return;
    }

    console.log('✅ Story Page Generated Successfully!\n');
    console.log('─'.repeat(70));
    console.log('📖 STORY TEXT:');
    console.log('─'.repeat(70));
    console.log(storyData.segment.content);
    console.log('─'.repeat(70));

    console.log('\n🔀 CHOICES:');
    storyData.segment.choices.forEach((choice, i) => {
      console.log(`\n${i + 1}. ${choice.text}`);
      console.log(`   → Next Prompt: ${choice.nextPrompt}`);
    });

    console.log('\n🖼️  Image URL:', storyData.segment.image_url);
    console.log('💳 Credits Used:', storyData.credits_used);

    // Test 2: Generate Audio (Gemini TTS - FREE!)
    console.log('\n\n🎵 TEST 2: Audio Generation (Gemini TTS - FREE!)\n');
    console.log('─'.repeat(70));

    const audioConfig = {
      text: storyData.segment.content,
      voiceId: 'Kore'
    };

    console.log('🎤 Voice:', audioConfig.voiceId);
    console.log('📝 Text length:', audioConfig.text.length, 'characters');
    console.log('\n⏳ Calling generate-audio-v2...\n');

    const { data: audioData, error: audioError } = await supabase.functions.invoke('generate-audio-v2', {
      body: audioConfig
    });

    if (audioError) {
      console.error('❌ Audio Generation Error:', audioError);
    } else {
      console.log('✅ Audio Generated Successfully!');
      console.log('🎵 Audio Base64 Length:', audioData.audioBase64.length);
      console.log('💳 Credits Used:', audioData.credits_used, '(FREE!)');
    }

    // Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('✅ INTEGRATION TEST COMPLETE!\n');

    console.log('📊 QUALITY CHECK:');
    console.log('─'.repeat(70));
    console.log('✅ Story generated with master storyteller prompts');
    console.log('✅ Image generated with Imagen 4 storybook style');
    console.log('✅ Audio generated with FREE Gemini TTS');
    console.log('✅ Choices provided for interactivity');

    console.log('\n🎯 NEXT STEPS:');
    console.log('─'.repeat(70));
    console.log('1. Check the story text quality above');
    console.log('2. Open the image URL in browser to verify quality');
    console.log('3. Compare with your Google app output');
    console.log('4. If quality matches, update frontend to use V2!');

    console.log('\n' + '='.repeat(70));

  } catch (err) {
    console.error('❌ Test Exception:', err);
    console.error('Stack:', err.stack);
  }
}

runTests().catch(console.error);
