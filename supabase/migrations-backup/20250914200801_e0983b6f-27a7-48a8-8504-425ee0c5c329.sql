-- Phase 2: Database Security Hardening

-- 1. Remove overly permissive policy from story_segments
DROP POLICY IF EXISTS "Anyone can read story segments" ON public.story_segments;

-- 2. Create proper public story segment access policy
CREATE POLICY "Public can view segments of public stories only" 
ON public.story_segments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.stories s 
    WHERE s.id = story_segments.story_id 
    AND s.visibility = 'public'
    AND s.status = 'completed'
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.stories s 
    WHERE s.id = story_segments.story_id 
    AND (s.user_id = auth.uid() OR s.author_id = auth.uid())
  )
);

-- 3. Update stories table to standardize on visibility field only
-- Remove any policies that reference is_public
DROP POLICY IF EXISTS "Anyone can read public and own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can view own stories" ON public.stories;

-- Create updated policies using only visibility field
CREATE POLICY "Users can view accessible stories" 
ON public.stories 
FOR SELECT 
USING (
  visibility = 'public' 
  OR user_id = auth.uid() 
  OR author_id = auth.uid()
);

-- 4. Update featured stories policies for consistency
DROP POLICY IF EXISTS "Featured stories public read" ON public.featured_stories;

CREATE POLICY "Anyone can view active featured stories" 
ON public.featured_stories 
FOR SELECT 
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.stories s 
    WHERE s.id = featured_stories.story_id 
    AND s.visibility = 'public'
    AND s.status = 'completed'
  )
);