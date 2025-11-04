-- Fix database security warnings from linter

-- 1. Fix function search paths (set stable search paths for security)
ALTER FUNCTION public.get_prompt_template(text, text) SET search_path = public;
ALTER FUNCTION public.get_user_language(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.spend_credits(uuid, integer, text, text, text, jsonb) SET search_path = public;
ALTER FUNCTION public.add_credits(uuid, integer, text, text, text, jsonb) SET search_path = public;
ALTER FUNCTION public.has_role(text) SET search_path = public;
ALTER FUNCTION public.get_featured_stories(integer) SET search_path = public;

-- Add missing indexes for performance optimization (without CONCURRENTLY since we're in a transaction)
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON public.stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_status_visibility ON public.stories(status, visibility);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_story_segments_story_id ON public.story_segments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_segments_story_segment ON public.story_segments(story_id, segment_number);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);

CREATE INDEX IF NOT EXISTS idx_featured_stories_active ON public.featured_stories(is_active, priority DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles(subscription_tier, subscription_status);