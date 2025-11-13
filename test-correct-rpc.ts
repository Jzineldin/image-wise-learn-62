import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MzIxMiwiZXhwIjoyMDczMjY5MjEyfQ.2ZuTzaa-47H2VShaW-onxpcGi93QUsc6yIcgUhYoLgo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testRPCWithCorrectParams() {
  console.log('=== Testing RPC Functions with Correct Parameter Names ===\n');

  // Get a free user ID
  const { data: freeUser } = await supabase
    .from('profiles')
    .select('id, email, free_chapters_used_today, last_chapter_reset_date, max_active_stories')
    .eq('subscription_tier', 'free')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!freeUser) {
    console.log('No free user found');
    return;
  }

  console.log('Testing with user:', freeUser.email);
  console.log('User ID:', freeUser.id);
  console.log('Current state:');
  console.log('  - free_chapters_used_today:', freeUser.free_chapters_used_today);
  console.log('  - last_chapter_reset_date:', freeUser.last_chapter_reset_date);
  console.log('  - max_active_stories:', freeUser.max_active_stories);

  // Test get_chapter_status with user_uuid
  console.log('\n--- Testing get_chapter_status(user_uuid) ---');
  const { data: chapterStatusResult, error: chapterStatusError } = await supabase
    .rpc('get_chapter_status', { user_uuid: freeUser.id });

  if (chapterStatusError) {
    console.error('❌ Error:', chapterStatusError);
  } else {
    console.log('✅ Success:', JSON.stringify(chapterStatusResult, null, 2));
  }

  // Test check_active_stories with user_uuid
  console.log('\n--- Testing check_active_stories(user_uuid) ---');
  const { data: activeStoriesResult, error: activeStoriesError } = await supabase
    .rpc('check_active_stories', { user_uuid: freeUser.id });

  if (activeStoriesError) {
    console.error('❌ Error:', activeStoriesError);
  } else {
    console.log('✅ Success:', JSON.stringify(activeStoriesResult, null, 2));
  }

  // Test use_free_chapter with user_uuid
  console.log('\n--- Testing use_free_chapter(user_uuid) ---');
  const { data: useFreeChapterResult, error: useFreeChapterError } = await supabase
    .rpc('use_free_chapter', { user_uuid: freeUser.id });

  if (useFreeChapterError) {
    console.error('❌ Error:', useFreeChapterError);
  } else {
    console.log('✅ Success:', JSON.stringify(useFreeChapterResult, null, 2));
  }

  // Check user state after
  console.log('\n--- User state after use_free_chapter ---');
  const { data: userAfter } = await supabase
    .from('profiles')
    .select('id, email, free_chapters_used_today, last_chapter_reset_date')
    .eq('id', freeUser.id)
    .single();

  if (userAfter) {
    console.log('  - free_chapters_used_today:', userAfter.free_chapters_used_today);
    console.log('  - last_chapter_reset_date:', userAfter.last_chapter_reset_date);
    console.log('  - Change:', userAfter.free_chapters_used_today - freeUser.free_chapters_used_today, 'chapters used');
  }

  // Test the function again to increment further
  console.log('\n--- Testing use_free_chapter again ---');
  const { data: secondUseResult, error: secondUseError } = await supabase
    .rpc('use_free_chapter', { user_uuid: freeUser.id });

  if (secondUseError) {
    console.error('❌ Error:', secondUseError);
  } else {
    console.log('✅ Success:', JSON.stringify(secondUseResult, null, 2));
  }

  // Final state
  console.log('\n--- Final user state ---');
  const { data: userFinal } = await supabase
    .from('profiles')
    .select('id, email, free_chapters_used_today, last_chapter_reset_date')
    .eq('id', freeUser.id)
    .single();

  if (userFinal) {
    console.log('  - free_chapters_used_today:', userFinal.free_chapters_used_today);
    console.log('  - last_chapter_reset_date:', userFinal.last_chapter_reset_date);
  }
}

testRPCWithCorrectParams().catch(console.error);
