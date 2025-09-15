// ============= CREDIT SYSTEM CONFIGURATION =============

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export interface CreditCosts {
  storyGeneration: number;
  storySegment: number;
  audioGeneration: number; // per 100 words
  imageGeneration: number;
  storyTitle: number;
}

// Credit cost configuration
export const CREDIT_COSTS: CreditCosts = {
  storyGeneration: 2,     // 2 credits for initial story generation
  storySegment: 1,        // 1 credit per story segment
  audioGeneration: 1,     // 1 credit per 100 words of audio
  imageGeneration: 1,     // 1 credit per image
  storyTitle: 0           // Free
};

// Calculate audio credits based on word count
export function calculateAudioCredits(text: string): number {
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / 100); // 1 credit per 100 words, rounded up
}

// Credit validation and deduction service
export class CreditService {
  private supabase: any;
  private userClient: any;
  private authHeader?: string;

  constructor(supabaseUrl: string, supabaseKey: string, authHeader?: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.authHeader = authHeader;
    // Create a separate client for user authentication if auth header is provided
    if (authHeader) {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
      if (anonKey) {
        // Create client that forwards the user's Authorization header
        this.userClient = createClient(supabaseUrl, anonKey, {
          global: {
            headers: {
              // Use proper header casing; some libraries expect this
              Authorization: authHeader,
            }
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        });
      }
    }
  }

  // Check if user has sufficient credits
  async checkUserCredits(userId: string, requiredCredits: number): Promise<{ hasCredits: boolean; currentCredits: number }> {
    const { data: userCredits, error } = await this.supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single();

    if (error || !userCredits) {
      console.error('Failed to fetch user credits:', error);
      throw new Error('Failed to fetch user credits');
    }

    // Treat null credits as 0
    const currentCredits = userCredits.current_balance || 0;

    return {
      hasCredits: currentCredits >= requiredCredits,
      currentCredits
    };
  }

  // Deduct credits from user account
  async deductCredits(
    userId: string, 
    amount: number, 
    description: string, 
    referenceId?: string, 
    referenceType?: string,
    metadata?: any
  ): Promise<{ success: boolean; newBalance: number }> {
    const { data, error } = await this.supabase.rpc('spend_credits', {
      user_uuid: userId,
      credits_to_spend: amount,
      description_text: description,
      ref_id: referenceId,
      ref_type: referenceType,
      transaction_metadata: metadata
    });

    if (error) {
      console.error('Credit deduction failed:', error);
      throw new Error(`Failed to deduct credits: ${error.message}`);
    }

    if (!data) {
      throw new Error('Insufficient credits');
    }

    // Get updated balance
    const { data: userCredits } = await this.supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single();

    return {
      success: true,
      newBalance: userCredits?.current_balance || 0
    };
  }

  // Update story credits used
  async updateStoryCreditsUsed(storyId: string, creditsUsed: number): Promise<void> {
    const { error } = await this.supabase
      .from('stories')
      .update({ credits_used: creditsUsed })
      .eq('id', storyId);

    if (error) {
      console.error('Failed to update story credits:', error);
    }
  }

  // Get user ID from auth context
  async getUserId(): Promise<string> {
    // Extract user ID directly from the JWT token
    if (this.authHeader) {
      try {
        // Remove 'Bearer ' prefix if present
        const token = this.authHeader.replace('Bearer ', '');

        // Decode JWT token (base64)
        const parts = token.split('.');
        if (parts.length === 3) {
          // Decode the payload (second part) with proper padding
          const payload = parts[1];
          const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
          const json = JSON.parse(atob(padded));

          if (json.sub) {
            console.log(`User ID extracted from JWT: ${json.sub}`);
            return json.sub;
          }
        }
      } catch (e) {
        console.error('Error decoding JWT token:', e);
      }
    }

    console.error('Error getting user ID: User not authenticated or invalid JWT');
    throw new Error('User authentication failed: User not authenticated');
  }
}

// Credit validation middleware for edge functions
export async function validateAndDeductCredits(
  creditService: CreditService,
  userId: string,
  operation: keyof CreditCosts,
  additionalParams?: { text?: string }
): Promise<{ success: boolean; creditsUsed: number; newBalance: number }> {
  let creditsRequired: number;

  switch (operation) {
    case 'audioGeneration':
      if (!additionalParams?.text) {
        throw new Error('Text required for audio credit calculation');
      }
      creditsRequired = calculateAudioCredits(additionalParams.text);
      break;
    default:
      creditsRequired = CREDIT_COSTS[operation];
  }

  // Check if user has sufficient credits
  const { hasCredits, currentCredits } = await creditService.checkUserCredits(userId, creditsRequired);

  if (!hasCredits) {
    throw new Error(`Insufficient credits. Required: ${creditsRequired}, Available: ${currentCredits}`);
  }

  // Deduct credits
  const result = await creditService.deductCredits(
    userId,
    creditsRequired,
    `${operation} operation`,
    undefined,
    operation,
    { operation, creditsRequired }
  );

  return {
    success: result.success,
    creditsUsed: creditsRequired,
    newBalance: result.newBalance
  };
}