import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MzIxMiwiZXhwIjoyMDczMjY5MjEyfQ.2ZuTzaa-47H2VShaW-onxpcGi93QUsc6yIcgUhYoLgo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkChapterTracking() {
  console.log('=== Checking Chapter Tracking Columns ===\n');

  // Check if columns exist
  const { data: columns, error: columnsError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT
          column_name,
          data_type,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name IN ('free_chapters_used_today', 'last_chapter_reset_date', 'max_active_stories')
        ORDER BY column_name;
      `
    });

  if (columnsError) {
    console.log('Using alternative method to check columns...\n');

    // Try direct table query to see what columns exist
    const { data: profileSample, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      console.error('Error querying profiles:', profileError);
    } else if (profileSample && profileSample.length > 0) {
      console.log('Sample profile columns:', Object.keys(profileSample[0]));
      console.log('\nChecking for chapter tracking columns:');
      console.log('- free_chapters_used_today:', 'free_chapters_used_today' in profileSample[0] ? 'EXISTS' : 'MISSING');
      console.log('- last_chapter_reset_date:', 'last_chapter_reset_date' in profileSample[0] ? 'EXISTS' : 'MISSING');
      console.log('- max_active_stories:', 'max_active_stories' in profileSample[0] ? 'EXISTS' : 'MISSING');
    }
  } else {
    console.log('Column check results:', columns);
  }

  console.log('\n=== Checking RPC Functions ===\n');

  // Check for RPC functions by trying to call them
  const functions = ['use_free_chapter', 'get_chapter_status', 'check_active_stories'];

  for (const funcName of functions) {
    try {
      const { data, error } = await supabase.rpc(funcName as any, {});
      if (error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`❌ Function ${funcName}: DOES NOT EXIST`);
        } else {
          console.log(`✓ Function ${funcName}: EXISTS (error calling it: ${error.message})`);
        }
      } else {
        console.log(`✓ Function ${funcName}: EXISTS and callable`);
      }
    } catch (e: any) {
      console.log(`❌ Function ${funcName}: ${e.message}`);
    }
  }

  console.log('\n=== Checking Recent Free User Data ===\n');

  // Get most recent free user
  const { data: freeUser, error: freeUserError } = await supabase
    .from('profiles')
    .select('id, email, subscription_tier, created_at, free_chapters_used_today, last_chapter_reset_date, max_active_stories')
    .eq('subscription_tier', 'free')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (freeUserError) {
    console.error('Error fetching free user:', freeUserError);
  } else if (freeUser) {
    console.log('Most recent free user:');
    console.log(JSON.stringify(freeUser, null, 2));
  } else {
    console.log('No free users found');
  }

  console.log('\n=== Checking All Profiles Table Structure ===\n');

  // Get all columns from profiles table
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (allProfilesError) {
    console.error('Error:', allProfilesError);
  } else if (allProfiles && allProfiles.length > 0) {
    console.log('All columns in profiles table:');
    Object.keys(allProfiles[0]).forEach(col => {
      const value = allProfiles[0][col];
      const type = typeof value;
      console.log(`  - ${col}: ${type} = ${JSON.stringify(value)}`);
    });
  }
}

checkChapterTracking().catch(console.error);
