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
    if (!this.userClient) {
      console.error('User not authenticated - no auth header provided');
      throw new Error('User not authenticated - no auth header provided');
    }
    
    try {
      const { data: { user }, error } = await this.userClient.auth.getUser();
      if (error) {
        console.error('Authentication error (getUser):', error);
      }
      if (user?.id) {
        console.log(`User authenticated successfully: ${user.id}`);
        return user.id;
      }

      // Fallback: decode user ID from JWT if available
      if (this.authHeader) {
        try {
          const raw = this.authHeader.startsWith('Bearer ') ? this.authHeader.slice(7) : this.authHeader;
          const payload = raw.split('.')[1];
          if (payload) {
            const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
            const json = JSON.parse(atob(padded));
            const sub = json?.sub;
            if (sub) {
              console.log(`User ID decoded from JWT: ${sub}`);
              return sub;
            }
          }
        } catch (jwtErr) {
          console.error('JWT decode fallback failed:', jwtErr);
        }
      }

      throw new Error('User not authenticated');
    } catch (error) {
      console.error('Error getting user ID:', error);
      throw new Error(`User authentication failed: ${error.message}`);
    }
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