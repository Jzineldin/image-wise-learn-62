import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MzIxMiwiZXhwIjoyMDczMjY5MjEyfQ.2ZuTzaa-47H2VShaW-onxpcGi93QUsc6yIcgUhYoLgo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function resetTestUser() {
  const { data: freeUser } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', 'cormac@kamrok.com')
    .single();

  if (!freeUser) {
    console.log('User not found');
    return;
  }

  console.log(`Resetting counter for ${freeUser.email}...`);

  const { error } = await supabase
    .from('profiles')
    .update({
      free_chapters_used_today: 0,
      last_chapter_reset_date: new Date().toISOString().split('T')[0]
    })
    .eq('id', freeUser.id);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Counter reset successfully');

    // Verify
    const { data: updated } = await supabase
      .from('profiles')
      .select('email, free_chapters_used_today, last_chapter_reset_date')
      .eq('id', freeUser.id)
      .single();

    console.log('Current state:', updated);
  }
}

resetTestUser().catch(console.error);
