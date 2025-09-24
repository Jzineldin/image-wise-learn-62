/**
 * Shared Supabase client utility for edge functions
 * Provides a centralized way to create Supabase clients with proper error handling
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

export const createSupabaseClient = (useServiceRole: boolean = false) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = useServiceRole 
    ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    : Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey);
};

export const createAdminSupabaseClient = () => {
  return createSupabaseClient(true);
};