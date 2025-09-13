import { createClient } from '@supabase/supabase-js';

// Note: In a real app, these would come from environment variables
// For this demo, we'll create a mock client
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

// Create a mock Supabase client for demo purposes
export const supabase = {
  auth: {
    signUp: async (credentials: any) => ({ data: null, error: null }),
    signInWithPassword: async (credentials: any) => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (callback: any) => {
      // Mock implementation
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null })
  })
};

// Uncomment this when you have actual Supabase credentials:
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);