-- Optimize credit deduction to prevent slowdowns
-- Remove the FOR UPDATE lock that was causing blocking issues

CREATE OR REPLACE FUNCTION public.spend_credits(
  user_uuid uuid, 
  credits_to_spend integer, 
  description_text text, 
  ref_id text DEFAULT NULL, 
  ref_type text DEFAULT NULL, 
  transaction_metadata jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_credits INTEGER;
  new_balance INTEGER;
  update_result INTEGER;
BEGIN
  -- Get current balance (without lock for better performance)
  SELECT current_balance INTO current_credits
  FROM public.user_credits
  WHERE user_id = user_uuid;
  
  -- Check if user has enough credits
  IF current_credits < credits_to_spend THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance
  new_balance := current_credits - credits_to_spend;
  
  -- Use atomic update with concurrent safety
  UPDATE public.user_credits
  SET 
    current_balance = current_balance - credits_to_spend,
    total_spent = total_spent + credits_to_spend,
    updated_at = NOW()
  WHERE user_id = user_uuid 
    AND current_balance >= credits_to_spend;
  
  GET DIAGNOSTICS update_result = ROW_COUNT;
  
  -- If update failed due to insufficient credits, return false
  IF update_result = 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Record transaction with simple approach (no duplicate check for performance)
  INSERT INTO public.credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    reference_id,
    reference_type,
    metadata
  ) VALUES (
    user_uuid,
    'spend',
    -credits_to_spend,
    new_balance,
    description_text,
    ref_id,
    ref_type,
    transaction_metadata
  );
  
  RETURN TRUE;
END;
$function$;