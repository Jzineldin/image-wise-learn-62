-- Create or update the has_role function to work correctly
CREATE OR REPLACE FUNCTION public.has_role(check_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has the specified role
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = check_role
  );
END;
$function$