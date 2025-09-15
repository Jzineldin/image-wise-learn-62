#!/usr/bin/env node
/**
 * Script to update existing stories with preview images from their segments
 * This is a one-time migration script to ensure all stories with segment images
 * have their cover_image fields populated.
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateStoryPreviewImages() {
  console.log('Starting preview image update process...');

  try {
    // Get all stories without cover images
    const { data: storiesWithoutImages, error: fetchError } = await supabase
      .from('stories')
      .select('id, title')
      .or('cover_image.is.null,cover_image.eq.,cover_image_url.is.null,cover_image_url.eq.');

    if (fetchError) {
      console.error('Error fetching stories:', fetchError);
      return;
    }

    if (!storiesWithoutImages || storiesWithoutImages.length === 0) {
      console.log('No stories found without cover images.');
      return;
    }

    console.log(`Found ${storiesWithoutImages.length} stories without cover images`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const story of storiesWithoutImages) {
      // Get the first segment with an image for this story
      const { data: segmentWithImage, error: segmentError } = await supabase
        .from('story_segments')
        .select('image_url')
        .eq('story_id', story.id)
        .not('image_url', 'is', null)
        .neq('image_url', '')
        .order('segment_number', { ascending: true })
        .limit(1)
        .single();

      if (segmentError || !segmentWithImage) {
        console.log(`  ⏭️  Skipped: "${story.title}" (no segment images found)`);
        skippedCount++;
        continue;
      }

      // Update the story with the segment's image
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          cover_image: segmentWithImage.image_url,
          cover_image_url: segmentWithImage.image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', story.id);

      if (updateError) {
        console.error(`  ❌ Error updating "${story.title}":`, updateError);
        continue;
      }

      console.log(`  ✅ Updated: "${story.title}"`);
      updatedCount++;
    }

    console.log('\n========================================');
    console.log(`Update complete!`);
    console.log(`  - Updated: ${updatedCount} stories`);
    console.log(`  - Skipped: ${skippedCount} stories (no images available)`);
    console.log('========================================');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the update
updateStoryPreviewImages()
  .then(() => {
    console.log('\nProcess completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nProcess failed:', error);
    process.exit(1);
  });