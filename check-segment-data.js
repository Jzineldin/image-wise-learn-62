import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hlrvpuqwurtdbjkramcp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3OTQxMTUsImV4cCI6MjA1MjM3MDExNX0.aJEcm6s7hD1MDj2nJUXLrpVW5cj-0kJsaNu9-y3vSlE'
);

async function checkSegment() {
  // Check the specific segment from the logs
  const { data, error } = await supabase
    .from('story_segments')
    .select('id, segment_number, audio_url, video_url, image_url')
    .eq('id', 'd47d310f-52d0-48f5-b05c-12a706c6c7d1')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Segment data from database:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\nField check:');
  console.log('- audio_url exists:', !!data.audio_url);
  console.log('- video_url exists:', !!data.video_url);
  console.log('- image_url exists:', !!data.image_url);
  
  if (data.audio_url) {
    console.log('- audio_url length:', data.audio_url.length);
    console.log('- audio_url prefix:', data.audio_url.substring(0, 50));
  }
  
  if (data.video_url) {
    console.log('- video_url:', data.video_url);
  }
}

checkSegment();
