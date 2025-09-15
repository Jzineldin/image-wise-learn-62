# Preview Image Implementation Test Guide

## Overview
This implementation automatically assigns story preview images from generated segment images.

## Components Updated

### 1. Database Layer
- **Migration File**: `supabase/migrations/20250915204351_auto_preview_image.sql`
  - Creates trigger `auto_update_story_cover_image` that fires when segment images are added
  - Function `update_story_cover_image()` updates story cover when segment gets image
  - Function `update_existing_story_previews()` updates existing stories
  - Updated `get_featured_stories()` function to include fallback logic

### 2. Frontend Components
- **StoryCard.tsx**: Already handles both `cover_image` and `cover_image_url` fields
- **FeaturedStoriesCarousel.tsx**: Uses `preview_image_url` from database function
- **MyStories.tsx**: Uses StoryCard component with proper variant selection
- **Discover.tsx**: Uses StoryCard component for displaying public stories

### 3. Utility Functions
- **src/lib/story-preview-utils.ts**: Helper functions for preview image management
  - `getStoryPreviewImage()`: Gets preview URL with fallback logic
  - `ensureStoryPreviewImage()`: Ensures story has preview image
  - `formatStoryWithPreview()`: Formats story data consistently

### 4. Migration Script
- **scripts/update-preview-images.ts**: One-time script to update existing stories
- Run with: `npm run update:preview-images`

## Testing Steps

### 1. Apply Database Migration
```bash
# If Supabase is linked
supabase db push

# Or apply directly to your database
psql -U your_user -d your_database -f supabase/migrations/20250915204351_auto_preview_image.sql
```

### 2. Test Automatic Preview Assignment
1. Create a new story
2. Generate an image for any segment
3. Verify the story's `cover_image` and `cover_image_url` are automatically updated
4. Check that the image appears in:
   - My Stories page
   - Discover page
   - Featured Stories carousel (if featured)

### 3. Update Existing Stories
```bash
# Set environment variables if needed
export VITE_SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Run the update script
npm run update:preview-images
```

### 4. Verify Display
- **My Stories Page**: Stories with images should show with 'background' variant
- **Discover Page**: Public stories should display preview images
- **Featured Carousel**: Should display preview images with proper fallback

## Expected Behavior

1. **New Stories**: When a segment image is generated, it automatically becomes the story preview
2. **Existing Stories**: Database function provides fallback to first segment image
3. **No Images**: Stories without any segment images display default placeholder
4. **Performance**: Preview images are cached at story level to avoid repeated queries

## Troubleshooting

### Preview Images Not Showing
1. Check browser console for errors
2. Verify image URLs are accessible
3. Check database for proper `cover_image` values

### Migration Issues
1. Ensure database user has proper permissions
2. Check for existing triggers with same name
3. Verify Supabase connection

### Update Script Fails
1. Check environment variables are set
2. Verify Supabase credentials
3. Check network connectivity

## Code Integration Points

The preview image system integrates at these key points:
1. **Image Generation** (`generate-story-image/index.ts`): Updates segment `image_url`
2. **Database Trigger**: Automatically copies to story `cover_image`
3. **Frontend Display**: Components use `cover_image` or `cover_image_url`
4. **Fallback Logic**: Database functions provide segment image fallback