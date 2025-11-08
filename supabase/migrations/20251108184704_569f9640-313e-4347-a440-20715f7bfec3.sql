-- Fix dependencies on is_admin column before removing it

-- Update user_feedback policies to use user_roles table instead of profiles.is_admin
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admins can update all feedback" ON public.user_feedback;

-- Recreate policies using user_roles table
CREATE POLICY "Admins can view all feedback"
ON public.user_feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all feedback"
ON public.user_feedback
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Now safely remove is_admin column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin CASCADE;

-- Verification
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'is_admin';