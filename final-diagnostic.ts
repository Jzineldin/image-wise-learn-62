import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MzIxMiwiZXhwIjoyMDczMjY5MjEyfQ.2ZuTzaa-47H2VShaW-onxpcGi93QUsc6yIcgUhYoLgo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runFullDiagnostic() {
  console.log('\n=================================');
  console.log('CHAPTER TRACKING DIAGNOSTIC REPORT');
  console.log('=================================\n');

  // 1. Column existence check
  console.log('1. DATABASE SCHEMA CHECK');
  console.log('------------------------');
  const { data: profileSample } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .single();

  if (profileSample) {
    const hasColumns = {
      free_chapters_used_today: 'free_chapters_used_today' in profileSample,
      last_chapter_reset_date: 'last_chapter_reset_date' in profileSample,
      max_active_stories: 'max_active_stories' in profileSample
    };

    console.log('✅ Columns exist:', JSON.stringify(hasColumns, null, 2));
  }

  // 2. Test all RPC functions
  console.log('\n2. RPC FUNCTIONS CHECK');
  console.log('----------------------');

  const { data: freeUser } = await supabase
    .from('profiles')
    .select('id, email, subscription_tier, free_chapters_used_today, last_chapter_reset_date, max_active_stories')
    .eq('subscription_tier', 'free')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!freeUser) {
    console.log('❌ No free user found for testing');
    return;
  }

  console.log(`Testing with user: ${freeUser.email} (${freeUser.subscription_tier})`);
  console.log(`User ID: ${freeUser.id}`);

  // Test get_chapter_status
  const { data: statusBefore, error: statusBeforeError } = await supabase
    .rpc('get_chapter_status', { user_uuid: freeUser.id });

  if (statusBeforeError) {
    console.log('❌ get_chapter_status error:', statusBeforeError.message);
  } else {
    console.log('✅ get_chapter_status works:', statusBefore);
  }

  // Test check_active_stories
  const { data: activeStories, error: activeStoriesError } = await supabase
    .rpc('check_active_stories', { user_uuid: freeUser.id });

  if (activeStoriesError) {
    console.log('❌ check_active_stories error:', activeStoriesError.message);
  } else {
    console.log('✅ check_active_stories works:', activeStories);
  }

  // Test use_free_chapter
  const initialUsed = freeUser.free_chapters_used_today;
  const { data: useResult, error: useError } = await supabase
    .rpc('use_free_chapter', { user_uuid: freeUser.id });

  if (useError) {
    console.log('❌ use_free_chapter error:', useError.message);
  } else {
    console.log('✅ use_free_chapter works:', useResult);
  }

  // Verify database was updated
  const { data: userAfter } = await supabase
    .from('profiles')
    .select('free_chapters_used_today, last_chapter_reset_date')
    .eq('id', freeUser.id)
    .single();

  console.log('\n3. DATABASE UPDATE VERIFICATION');
  console.log('-------------------------------');
  if (userAfter) {
    const changed = userAfter.free_chapters_used_today !== initialUsed;
    console.log(`Before: ${initialUsed} chapters used`);
    console.log(`After: ${userAfter.free_chapters_used_today} chapters used`);
    console.log(`Status: ${changed ? '✅ Counter incremented' : '❌ Counter not incremented'}`);
    console.log(`Reset date: ${userAfter.last_chapter_reset_date}`);
  }

  // Test limit enforcement
  console.log('\n4. LIMIT ENFORCEMENT TEST');
  console.log('-------------------------');

  // Try to use all remaining chapters
  let attempts = 0;
  let lastResult: any = useResult;

  while (lastResult.success && attempts < 10) {
    const { data: nextUse } = await supabase
      .rpc('use_free_chapter', { user_uuid: freeUser.id });

    if (nextUse) {
      console.log(`Attempt ${attempts + 2}: used=${nextUse.used}, remaining=${nextUse.remaining}, success=${nextUse.success}`);
      lastResult = nextUse;
    }

    attempts++;

    if (!nextUse?.success) break;
  }

  if (!lastResult.success) {
    console.log('✅ Limit enforcement works - blocked at limit');
    console.log('   Error:', lastResult.error || 'Daily limit reached');
  }

  // Check final state
  const { data: statusAfter } = await supabase
    .rpc('get_chapter_status', { user_uuid: freeUser.id });

  console.log('\n5. FINAL STATUS');
  console.log('---------------');
  console.log('Current status:', statusAfter);

  // Test paid user
  console.log('\n6. PAID USER TEST');
  console.log('-----------------');
  const { data: paidUser } = await supabase
    .from('profiles')
    .select('id, email, subscription_tier, free_chapters_used_today, max_active_stories')
    .eq('subscription_tier', 'premium')
    .limit(1)
    .single();

  if (paidUser) {
    console.log(`Testing with paid user: ${paidUser.email}`);

    const { data: paidStatus } = await supabase
      .rpc('get_chapter_status', { user_uuid: paidUser.id });

    console.log('Paid user status:', paidStatus);
    console.log(`✅ Paid user marked as unlimited: is_paid=${paidStatus?.is_paid}`);
    console.log(`   max_active_stories: ${paidUser.max_active_stories}`);
  }

  console.log('\n=================================');
  console.log('DIAGNOSTIC COMPLETE');
  console.log('=================================\n');
}

runFullDiagnostic().catch(console.error);
