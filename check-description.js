import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlrvpuqwurtdbjkramcp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NTYwMTcsImV4cCI6MjA0NjMzMjAxN30.TKPWqbEXG9h8Uo3gj-Y-DfNNrbnrvQPOqTCLEbZmw2g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDescription() {
  const { data, error } = await supabase
    .from('stories')
    .select('id, title, description')
    .ilike('title', '%ADVENTURE%')
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Story description:');
  console.log('---');
  console.log(data.description);
  console.log('---');
  console.log('Length:', data.description?.length);
}

checkDescription();
