/**
 * Utility functions for handling story preview images
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Get the preview image URL for a story
 * Checks cover_image, cover_image_url, and falls back to first segment image
 */
export async function getStoryPreviewImage(storyId: string): Promise<string | null> {
  try {
    // First, check if the story has a cover image
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('cover_image, cover_image_url')
      .eq('id', storyId)
      .single();

    if (storyError) {
      console.error('Error fetching story:', storyError);
      return null;
    }

    // Return cover image if available
    if (story?.cover_image_url || story?.cover_image) {
      return story.cover_image_url || story.cover_image;
    }

    // Otherwise, try to get the first segment's image
    const { data: segment, error: segmentError } = await supabase
      .from('story_segments')
      .select('image_url')
      .eq('story_id', storyId)
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .order('segment_number', { ascending: true })
      .limit(1)
      .single();

    if (segmentError || !segment) {
      return null;
    }

    // Update the story with this image for future use
    // This is a background operation, we don't wait for it
    supabase
      .from('stories')
      .update({
        cover_image: segment.image_url,
        cover_image_url: segment.image_url
      })
      .eq('id', storyId)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating story preview image:', error);
        }
      });

    return segment.image_url;
  } catch (error) {
    console.error('Error getting story preview image:', error);
    return null;
  }
}

/**
 * Ensure a story has a preview image, attempting to set one if missing
 */
export async function ensureStoryPreviewImage(storyId: string): Promise<void> {
  try {
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('cover_image, cover_image_url')
      .eq('id', storyId)
      .single();

    if (storyError) {
      console.error('Error fetching story:', storyError);
      return;
    }

    // If story already has a cover image, we're done
    if (story?.cover_image_url || story?.cover_image) {
      return;
    }

    // Try to get the first segment's image
    const { data: segment, error: segmentError } = await supabase
      .from('story_segments')
      .select('image_url')
      .eq('story_id', storyId)
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .order('segment_number', { ascending: true })
      .limit(1)
      .single();

    if (segmentError || !segment?.image_url) {
      return;
    }

    // Update the story with this image
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        cover_image: segment.image_url,
        cover_image_url: segment.image_url
      })
      .eq('id', storyId);

    if (updateError) {
      console.error('Error updating story preview image:', updateError);
    }
  } catch (error) {
    console.error('Error ensuring story preview image:', error);
  }
}

/**
 * Format story data to ensure preview image fields are consistent
 */
export function formatStoryWithPreview(story: any): any {
  // Ensure we have a consistent image URL field
  const imageUrl = story.cover_image_url || story.cover_image || story.preview_image_url;

  return {
    ...story,
    cover_image: imageUrl,
    cover_image_url: imageUrl,
    preview_image_url: imageUrl
  };
}