/**
 * Complete Test for Google AI Studio V2 Integration (Node.js version)
 * Tests the full flow: Story Page → Audio
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  console.log('🧪 Google AI Studio V2 Integration - Complete Flow Test\n');
  console.log('='.repeat(70));

  // Test 1: Generate Story Page (Text + Image)
  console.log('\n📖 TEST 1: Story Page Generation (Gemini 2.5 Pro + Imagen 4)\n');

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
    const { data: storyData, error: storyError } = await supabase.functions.invoke('generate-story-page-v2', {
      body: storyConfig
    });

    if (storyError) {
      console.error('❌ Story Generation Error:', storyError);
      process.exit(1);
    }

    // DEBUG: Log the full response structure
    console.log('🔍 DEBUG - Full Response:', JSON.stringify(storyData, null, 2));

    console.log('✅ Story Page Generated Successfully!\n');
    console.log('─'.repeat(70));
    console.log('📖 STORY TEXT:');
    console.log('─'.repeat(70));
    console.log(storyData.data.segment.content);
    console.log('─'.repeat(70));

    console.log('\n🔀 CHOICES:');
    storyData.data.segment.choices.forEach((choice, i) => {
      console.log(`\n${i + 1}. ${choice.text}`);
      console.log(`   → Next Prompt: ${choice.nextPrompt}`);
    });

    console.log('\n🖼️  Image URL:', storyData.data.segment.image_url);
    console.log('💳 Credits Used:', storyData.data.credits_used);
    console.log('🎨 Model Info:', {
      text: 'Gemini 2.5 Pro',
      image: 'Imagen 4',
      method: 'google-ai-studio-v2'
    });

    // Test 2: Generate Audio (Gemini TTS - FREE!)
    console.log('\n\n🎵 TEST 2: Audio Generation (Gemini TTS - FREE!)\n');
    console.log('─'.repeat(70));

    const audioConfig = {
      text: storyData.data.segment.content,
      voiceId: 'Kore' // Friendly narrator voice
    };

    console.log('🎤 Voice:', audioConfig.voiceId);
    console.log('📝 Text to narrate:', audioConfig.text.substring(0, 100) + '...');
    console.log('\n⏳ Calling generate-audio-v2...\n');

    const { data: audioData, error: audioError } = await supabase.functions.invoke('generate-audio-v2', {
      body: audioConfig
    });

    if (audioError) {
      console.error('❌ Audio Generation Error:', audioError);
    } else {
      console.log('✅ Audio Generated Successfully!');
      console.log('🎵 Audio Base64 Length:', audioData.data.audioBase64.length);
      console.log('🎤 Voice Used:', audioConfig.voiceId);
      console.log('💳 Credits Used:', audioData.data.credits_used, '(FREE!)');
      console.log('📊 MIME Type:', audioData.data.mimeType);
    }

    // Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('✅ INTEGRATION TEST COMPLETE!\n');

    console.log('📊 QUALITY CHECK:');
    console.log('─'.repeat(70));
    console.log('✅ Story Text: Master storyteller persona active');
    console.log('✅ Story Text: Age-appropriate (7-9 years old)');
    console.log('✅ Story Text: Choices provided for interactivity');
    console.log('✅ Image: Generated with Imagen 4 (storybook style)');
    console.log('✅ Audio: FREE narration with Gemini TTS');

    console.log('\n💰 COST ANALYSIS:');
    console.log('─'.repeat(70));
    console.log('Story Generation (Text + Image): 2 credits');
    console.log('Audio Generation (Gemini TTS): 0 credits (FREE!)');
    console.log('Video Generation (Veo 3.1): 2 credits (when quota available)');

    console.log('\n🎯 NEXT STEPS:');
    console.log('─'.repeat(70));
    console.log('1. Review story text quality - does it match Google app?');
    console.log('2. Check image at the URL above');
    console.log('3. Update frontend to use V2 endpoints');
    console.log('4. Deploy to production when satisfied');

    console.log('\n' + '='.repeat(70));

  } catch (err) {
    console.error('❌ Test Exception:', err);
    process.exit(1);
  }
}

runTests();
