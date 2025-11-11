-- Upgrade admin account to premium tier for testing
UPDATE public.profiles
SET 
  subscription_tier = 'premium',
  subscription_status = 'active',
  max_active_stories = 999,
  updated_at = NOW()
WHERE email = 'jzineldin@gmail.com';

-- Verify the update
DO $$
DECLARE
  admin_email TEXT;
  admin_tier TEXT;
BEGIN
  SELECT email, subscription_tier INTO admin_email, admin_tier
  FROM public.profiles
  WHERE email = 'jzineldin@gmail.com';
  
  IF admin_tier = 'premium' THEN
    RAISE NOTICE 'SUCCESS: Admin account % upgraded to premium tier', admin_email;
  ELSE
    RAISE EXCEPTION 'FAILED: Could not upgrade admin account to premium';
  END IF;
END $$;