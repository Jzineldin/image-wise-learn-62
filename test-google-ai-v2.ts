/**
 * Test script for Google AI Studio V2 integration
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStoryPageGeneration() {
  console.log('🧪 Testing Google AI Studio V2 - Story Page Generation\n');

  const testData = {
    childName: 'Emma',
    ageGroup: '7-9 years old',
    theme: 'Fantasy',
    character: 'a brave squirrel named Squeaky',
    traits: 'curious and adventurous',
    prompt: 'Create the very first page of the story based on the system instructions.',
    segment_number: 1
  };

  console.log('📝 Test Data:', JSON.stringify(testData, null, 2));
  console.log('\n⏳ Calling generate-story-page-v2...\n');

  try {
    const { data, error } = await supabase.functions.invoke('generate-story-page-v2', {
      body: testData
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Success!\n');
    console.log('📖 Story Text:');
    console.log('─'.repeat(60));
    console.log(data.segment.content);
    console.log('─'.repeat(60));
    console.log('\n🔀 Choices:');
    data.segment.choices.forEach((choice: any, i: number) => {
      console.log(`\n${i + 1}. ${choice.text}`);
      console.log(`   → ${choice.nextPrompt}`);
    });
    console.log('\n🖼️  Image URL:', data.segment.image_url);
    console.log('💳 Credits Used:', data.credits_used);

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

async function testAudioGeneration() {
  console.log('\n\n🧪 Testing Google AI Studio V2 - Audio Generation (Gemini TTS)\n');

  const testText = 'Once upon a time, in a magical forest, there lived a brave squirrel named Squeaky. Squeaky loved to explore and discover new things!';

  console.log('📝 Text to narrate:', testText);
  console.log('\n⏳ Calling generate-audio-v2...\n');

  try {
    const { data, error } = await supabase.functions.invoke('generate-audio-v2', {
      body: {
        text: testText,
        voiceId: 'Kore'
      }
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Audio Generated!');
    console.log('🎵 Audio Base64 length:', data.audioBase64.length);
    console.log('🎤 Voice:', 'Kore');
    console.log('💳 Credits Used:', data.credits_used, '(FREE!)');

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

// Run tests
console.log('🚀 Google AI Studio V2 Integration Tests\n');
console.log('=' .repeat(60));

await testStoryPageGeneration();
await testAudioGeneration();

console.log('\n' + '='.repeat(60));
console.log('✅ Tests Complete!');
