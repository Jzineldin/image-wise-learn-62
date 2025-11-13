import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MzIxMiwiZXhwIjoyMDczMjY5MjEyfQ.2ZuTzaa-47H2VShaW-onxpcGi93QUsc6yIcgUhYoLgo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkRPCFunctions() {
  console.log('=== Testing use_free_chapter Function ===\n');

  // Get a free user ID
  const { data: freeUser } = await supabase
    .from('profiles')
    .select('id, email, free_chapters_used_today, last_chapter_reset_date')
    .eq('subscription_tier', 'free')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!freeUser) {
    console.log('No free user found');
    return;
  }

  console.log('Testing with user:', freeUser.email);
  console.log('Current state:');
  console.log('  - free_chapters_used_today:', freeUser.free_chapters_used_today);
  console.log('  - last_chapter_reset_date:', freeUser.last_chapter_reset_date);

  // Test use_free_chapter
  console.log('\n--- Testing use_free_chapter ---');
  const { data: useFreeChapterResult, error: useFreeChapterError } = await supabase
    .rpc('use_free_chapter', { user_id: freeUser.id });

  if (useFreeChapterError) {
    console.error('Error:', useFreeChapterError);
  } else {
    console.log('Success:', useFreeChapterResult);
  }

  // Test get_chapter_status
  console.log('\n--- Testing get_chapter_status ---');
  const { data: chapterStatusResult, error: chapterStatusError } = await supabase
    .rpc('get_chapter_status', { user_id: freeUser.id });

  if (chapterStatusError) {
    console.error('Error:', chapterStatusError);
  } else {
    console.log('Success:', chapterStatusResult);
  }

  // Test check_active_stories
  console.log('\n--- Testing check_active_stories ---');
  const { data: activeStoriesResult, error: activeStoriesError } = await supabase
    .rpc('check_active_stories', { user_id: freeUser.id });

  if (activeStoriesError) {
    console.error('Error:', activeStoriesError);
  } else {
    console.log('Success:', activeStoriesResult);
  }

  // Check user state after
  console.log('\n--- User state after tests ---');
  const { data: userAfter } = await supabase
    .from('profiles')
    .select('id, email, free_chapters_used_today, last_chapter_reset_date')
    .eq('id', freeUser.id)
    .single();

  if (userAfter) {
    console.log('  - free_chapters_used_today:', userAfter.free_chapters_used_today);
    console.log('  - last_chapter_reset_date:', userAfter.last_chapter_reset_date);
  }

  // Get user's active stories count
  console.log('\n--- Checking user active stories ---');
  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('id, title, status')
    .eq('user_id', freeUser.id)
    .eq('status', 'active');

  if (storiesError) {
    console.error('Error:', storiesError);
  } else {
    console.log('Active stories count:', stories?.length || 0);
    if (stories && stories.length > 0) {
      console.log('Stories:');
      stories.forEach((story, i) => {
        console.log(`  ${i + 1}. ${story.title} (${story.status})`);
      });
    }
  }
}

checkRPCFunctions().catch(console.error);
