/**
 * Test script to measure Swedish story generation performance
 * Run with: deno run --allow-net --allow-env test-swedish-story-perf.ts
 */

const SUPABASE_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NzI5NzcsImV4cCI6MjA1MTE0ODk3N30.kKqGvJqQxJPqQQqQQqQqQqQqQqQqQqQqQqQqQqQqQqQ';

async function testSwedishStoryGeneration() {
  console.log('🧪 Testing Swedish story generation performance...\n');

  // First, sign in to get a valid session
  const signInResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      email: 'jzineldin@gmail.com',
      password: 'Rashzin1996!'
    })
  });

  if (!signInResponse.ok) {
    console.error('❌ Sign in failed:', await signInResponse.text());
    return;
  }

  const { access_token } = await signInResponse.json();
  console.log('✅ Signed in successfully\n');

  // Create a story first
  const createStoryResponse = await fetch(`${SUPABASE_URL}/rest/v1/stories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${access_token}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      age_group: '7-9',
      genre: 'fantasy',
      language_code: 'sv',
      story_type: 'short',
      status: 'draft'
    })
  });

  if (!createStoryResponse.ok) {
    console.error('❌ Create story failed:', await createStoryResponse.text());
    return;
  }

  const [story] = await createStoryResponse.json();
  console.log(`✅ Created story: ${story.id}\n`);

  // Now call generate-story
  console.log('⏱️  Calling generate-story Edge Function...\n');
  const startTime = Date.now();

  const generateResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-story`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    body: JSON.stringify({
      storyId: story.id,
      ageGroup: '7-9',
      genre: 'fantasy',
      languageCode: 'sv',
      prompt: 'En magisk skog där träden kan prata',
      characters: []
    })
  });

  const duration = Date.now() - startTime;

  if (!generateResponse.ok) {
    console.error('❌ Generate story failed:', await generateResponse.text());
    return;
  }

  const result = await generateResponse.json();
  
  console.log('\n✅ Story generated successfully!');
  console.log(`⏱️  Total duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
  console.log(`📊 Model used: ${result.model_used || 'unknown'}`);
  console.log(`📝 Content length: ${result.data?.content?.length || 0} characters`);
  console.log(`🎯 Choices: ${result.data?.segments?.[0]?.choices?.length || 0}`);
  
  console.log('\n📋 Check Supabase logs for detailed timing breakdown');
  console.log(`   https://supabase.com/dashboard/project/hlrvpuqwurtdbjkramcp/logs/edge-functions`);
}

testSwedishStoryGeneration().catch(console.error);

