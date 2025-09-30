// Quick test script to trigger story generation and check logs
// Run with: node test-story-generation.js

const SUPABASE_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0OTk5NzcsImV4cCI6MjA0MjA3NTk3N30.Ks8Ks_Ks8Ks8Ks8Ks8Ks8Ks8Ks8Ks8Ks8Ks8Ks8Ks8';

async function testStoryGeneration() {
  console.log('🧪 Testing story generation...\n');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-story`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      ageGroup: '7-9',
      genre: 'Fantasy',
      languageCode: 'en',
      hasCharacters: true,
      promptLength: 'medium',
      userPrompt: 'A brave cat explores a magical forest'
    })
  });

  const data = await response.json();
  
  console.log('📊 Response Status:', response.status);
  console.log('📦 Response Data:', JSON.stringify(data, null, 2));
  
  if (data.success && data.data) {
    console.log('\n✅ Story generated successfully!');
    console.log('📝 Story ID:', data.data.story_id);
    console.log('📄 Content type:', typeof data.data.content);
    console.log('📄 Content preview:', data.data.content?.substring(0, 200));
    console.log('🎯 Segments count:', data.data.segments?.length);
    if (data.data.segments && data.data.segments.length > 0) {
      console.log('📄 First segment content type:', typeof data.data.segments[0].content);
      console.log('📄 First segment content preview:', data.data.segments[0].content?.substring(0, 200));
    }
  } else {
    console.log('\n❌ Story generation failed');
    console.log('Error:', data.error || data);
  }
}

testStoryGeneration().catch(console.error);

