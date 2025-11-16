-- Upgrade admin account to premium tier for testing (if exists)
DO $$
DECLARE
  admin_exists BOOLEAN;
  admin_email TEXT;
  admin_tier TEXT;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE email = 'jzineldin@gmail.com')
  INTO admin_exists;

  IF admin_exists THEN
    -- Update user
    UPDATE public.profiles
    SET
      subscription_tier = 'premium',
      subscription_status = 'active',
      max_active_stories = 999,
      updated_at = NOW()
    WHERE email = 'jzineldin@gmail.com';

    -- Verify the update
    SELECT email, subscription_tier INTO admin_email, admin_tier
    FROM public.profiles
    WHERE email = 'jzineldin@gmail.com';

    IF admin_tier = 'premium' THEN
      RAISE NOTICE 'SUCCESS: Admin account % upgraded to premium tier', admin_email;
    ELSE
      RAISE WARNING 'Could not upgrade admin account to premium';
    END IF;
  ELSE
    RAISE NOTICE 'Admin account not found, skipping upgrade (OK in local dev)';
  END IF;
END $$;