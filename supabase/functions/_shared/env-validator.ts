/**
 * Environment Variable Validator for Supabase Edge Functions
 * 
 * Validates required environment variables at function startup
 * to fail fast with clear error messages.
 * 
 * Best Practices:
 * - Fail fast: Catch configuration errors immediately
 * - Clear errors: Provide actionable error messages
 * - Type safety: Ensure all required vars are present
 * - Production ready: Prevents silent failures
 */

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  error?: string;
}

/**
 * Validates that all required environment variables are present
 * 
 * @param required - Array of required environment variable names
 * @returns Validation result with missing variables
 * 
 * @example
 * ```typescript
 * const result = validateEnv(['SUPABASE_URL', 'OPENAI_API_KEY']);
 * if (!result.valid) {
 *   throw new Error(result.error);
 * }
 * ```
 */
export function validateEnv(required: string[]): EnvValidationResult {
  const missing = required.filter(key => {
    const value = Deno.env.get(key);
    return !value || value.trim() === '';
  });

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    console.error('❌ Environment validation failed:', error);
    
    return {
      valid: false,
      missing,
      error,
    };
  }

  console.log('✅ Environment validation passed');
  return {
    valid: true,
    missing: [],
  };
}

/**
 * Validates environment variables and throws if any are missing
 * 
 * @param required - Array of required environment variable names
 * @throws Error if any required variables are missing
 * 
 * @example
 * ```typescript
 * // At the top of your edge function:
 * requireEnv(['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENAI_API_KEY']);
 * ```
 */
export function requireEnv(required: string[]): void {
  const result = validateEnv(required);
  
  if (!result.valid) {
    throw new Error(result.error);
  }
}

/**
 * Gets an environment variable with a default value
 * 
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns Environment variable value or default
 * 
 * @example
 * ```typescript
 * const timeout = getEnvWithDefault('TIMEOUT_MS', '30000');
 * ```
 */
export function getEnvWithDefault(key: string, defaultValue: string): string {
  return Deno.env.get(key) || defaultValue;
}

/**
 * Gets an environment variable as a number
 * 
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set or invalid
 * @returns Environment variable as number or default
 * 
 * @example
 * ```typescript
 * const maxRetries = getEnvAsNumber('MAX_RETRIES', 3);
 * ```
 */
export function getEnvAsNumber(key: string, defaultValue: number): number {
  const value = Deno.env.get(key);
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Gets an environment variable as a boolean
 * 
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns Environment variable as boolean or default
 * 
 * @example
 * ```typescript
 * const debugMode = getEnvAsBoolean('DEBUG', false);
 * ```
 */
export function getEnvAsBoolean(key: string, defaultValue: boolean): boolean {
  const value = Deno.env.get(key);
  if (!value) return defaultValue;
  
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Common environment variable sets for different function types
 */
export const ENV_SETS = {
  /**
   * Basic Supabase environment variables
   */
  SUPABASE_BASIC: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ],

  /**
   * Supabase with service role (for admin operations)
   */
  SUPABASE_ADMIN: [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],

  /**
   * OpenAI API integration
   */
  OPENAI: [
    'OPENAI_API_KEY',
  ],

  /**
   * Replicate API integration
   */
  REPLICATE: [
    'REPLICATE_API_TOKEN',
  ],

  /**
   * ElevenLabs API integration
   */
  ELEVENLABS: [
    'ELEVENLABS_API_KEY',
  ],
} as const;

/**
 * Validates environment for a story generation function
 * 
 * @example
 * ```typescript
 * // In generate-story-segment/index.ts:
 * validateStoryGenerationEnv();
 * ```
 */
export function validateStoryGenerationEnv(): void {
  requireEnv([
    ...ENV_SETS.SUPABASE_BASIC,
    ...ENV_SETS.OPENAI,
  ]);
}

/**
 * Validates environment for an image generation function
 * 
 * @example
 * ```typescript
 * // In generate-story-image/index.ts:
 * validateImageGenerationEnv();
 * ```
 */
export function validateImageGenerationEnv(): void {
  requireEnv([
    ...ENV_SETS.SUPABASE_BASIC,
    ...ENV_SETS.REPLICATE,
  ]);
}

/**
 * Validates environment for an audio generation function
 * 
 * @example
 * ```typescript
 * // In generate-story-audio/index.ts:
 * validateAudioGenerationEnv();
 * ```
 */
export function validateAudioGenerationEnv(): void {
  requireEnv([
    ...ENV_SETS.SUPABASE_BASIC,
    ...ENV_SETS.ELEVENLABS,
  ]);
}

/**
 * Logs all environment variables (for debugging)
 * WARNING: Only use in development, never in production!
 * 
 * @param maskSecrets - Whether to mask secret values
 */
export function logEnvironment(maskSecrets = true): void {
  if (Deno.env.get('DENO_DEPLOYMENT_ID')) {
    console.warn('⚠️ logEnvironment() called in production - skipping');
    return;
  }

  console.log('📋 Environment Variables:');
  
  const secretKeys = ['KEY', 'SECRET', 'TOKEN', 'PASSWORD'];
  
  for (const [key, value] of Object.entries(Deno.env.toObject())) {
    const isSecret = secretKeys.some(secret => key.includes(secret));
    const displayValue = maskSecrets && isSecret 
      ? '***' + value.slice(-4) 
      : value;
    
    console.log(`  ${key}: ${displayValue}`);
  }
}

