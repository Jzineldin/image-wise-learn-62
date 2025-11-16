// ============= CREDIT SYSTEM CONFIGURATION =============

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logger } from './logger.ts';

// Import from local edge functions copy
import { CREDIT_COSTS as SHARED_COSTS, calculateAudioCredits as sharedCalculateAudioCredits } from './credit-costs.ts';

export interface CreditCosts {
  storyGeneration: number;
  storySegment: number;
  audioGeneration: number;
  imageGeneration: number;
  storyTitle: number;
}

// Use shared credit costs (aligned with frontend)
export const CREDIT_COSTS: CreditCosts = {
  storyGeneration: SHARED_COSTS.storyGeneration,
  storySegment: SHARED_COSTS.segment,
  audioGeneration: SHARED_COSTS.audioGeneration,
  imageGeneration: SHARED_COSTS.image,
  storyTitle: SHARED_COSTS.storyTitle,
};

// Calculate audio credits based on word count (use shared implementation)
export function calculateAudioCredits(text: string): number {
  return sharedCalculateAudioCredits(text);
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
      logger.error('Failed to fetch user credits', error, { userId, operation: 'credit-check' });
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
      logger.error('Credit deduction failed', error, { userId, amount, operation: 'credit-deduction' });
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
      logger.error('Failed to update story credits', error, { storyId, creditsUsed, operation: 'story-update' });
    }
  }

  // Get user ID from auth context with proper verification
  async getUserId(): Promise<string> {
    if (!this.authHeader) {
      throw new Error('User authentication failed: Missing Authorization header');
    }

    // Extract bearer token
    const token = this.authHeader.startsWith('Bearer ')
      ? this.authHeader.slice('Bearer '.length)
      : this.authHeader;

    if (!this.userClient) {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
      if (!anonKey) {
        logger.error('SUPABASE_ANON_KEY is not set', null, { operation: 'auth-setup' });
      }
      throw new Error('User authentication failed: Auth client not initialized');
    }

    try {
      const { data, error } = await this.userClient.auth.getUser(token);
      if (error || !data?.user) {
        logger.error('JWT validation failed', error, { operation: 'auth-validation' });
        throw new Error('User authentication failed: Invalid or expired token');
      }
      return data.user.id;
    } catch (e) {
      logger.error('Error validating JWT token', e, { operation: 'auth-validation' });
      throw new Error('User authentication failed: Token validation error');
    }
  }
}

// Credit validation (check only, don't deduct yet)
export async function validateCredits(
  creditService: CreditService,
  userId: string,
  operation: keyof CreditCosts,
  additionalParams?: { text?: string }
): Promise<{ success: boolean; creditsRequired: number; currentCredits: number }> {
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

  // Check if user has sufficient credits (don't deduct yet)
  const { hasCredits, currentCredits } = await creditService.checkUserCredits(userId, creditsRequired);

  if (!hasCredits) {
    const error = new Error(`Insufficient credits. Required: ${creditsRequired}, Available: ${currentCredits}`) as any;
    error.code = 'INSUFFICIENT_CREDITS';
    error.required = creditsRequired;
    error.available = currentCredits;
    throw error;
  }

  return {
    success: true,
    creditsRequired,
    currentCredits
  };
}

// Deduct credits after successful operation
export async function deductCreditsAfterSuccess(
  creditService: CreditService,
  userId: string,
  operation: keyof CreditCosts,
  creditsRequired: number,
  referenceId?: string,
  metadata?: any
): Promise<{ success: boolean; newBalance: number }> {
  const result = await creditService.deductCredits(
    userId,
    creditsRequired,
    `${operation} operation`,
    referenceId,
    operation,
    { operation, creditsRequired, ...metadata }
  );

  return result;
}

// Refund credits for failed operations (if already deducted)
export async function refundCredits(
  creditService: CreditService,
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string
): Promise<{ success: boolean; newBalance: number }> {
  // Use the existing add_credits RPC function
  // Use a separate Supabase client for refund operations
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { data, error } = await supabase.rpc('add_credits', {
    user_uuid: userId,
    credits_to_add: amount,
    description_text: `Credit refund: ${reason}`,
    ref_id: referenceId,
    ref_type: 'refund',
    transaction_metadata: { reason, refund: true }
  });

  if (error) {
    logger.error('Credit refund failed', error, { userId, amount, operation: 'credit-refund' });
    throw new Error(`Failed to refund credits: ${error.message}`);
  }

  // Get updated balance
  const { data: userCredits } = await supabase
    .from('user_credits')
    .select('current_balance')
    .eq('user_id', userId)
    .single();

  return {
    success: true,
    newBalance: userCredits?.current_balance || 0
  };
}

// Legacy function for backward compatibility (now validates and deducts)
export async function validateAndDeductCredits(
  creditService: CreditService,
  userId: string,
  operation: keyof CreditCosts,
  additionalParams?: { text?: string }
): Promise<{ success: boolean; creditsUsed: number; newBalance: number }> {
  const validation = await validateCredits(creditService, userId, operation, additionalParams);
  const result = await deductCreditsAfterSuccess(creditService, userId, operation, validation.creditsRequired);
  
  return {
    success: result.success,
    creditsUsed: validation.creditsRequired,
    newBalance: result.newBalance
  };
}