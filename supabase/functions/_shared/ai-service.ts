/**
 * Centralized AI Service Layer
 * 
 * This module provides a unified interface for all AI operations across edge functions.
 * It handles model selection, fallback strategies, response validation, and error handling.
 */

// ============= TYPES & INTERFACES =============

export interface AIProvider {
  name: string;
  baseUrl: string;
  defaultModel: string;
  supportedFeatures: string[];
  priority: number;
}

export interface ModelConfig {
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
  supportedFeatures: string[];
}

export interface AIRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  responseFormat?: 'json' | 'text';
  schema?: any;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse<T = any> {
  content: T;
  model: string;
  provider: string;
  tokensUsed: number;
  success: boolean;
  error?: string;
}

// ============= CONFIGURATION =============

export const AI_PROVIDERS: Record<string, AIProvider> = {
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'openrouter/sonoma-dusk-alpha',
    supportedFeatures: ['json', 'text'],
    priority: 1
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    supportedFeatures: ['json', 'text', 'structured'],
    priority: 2
  },
  ovh: {
    name: 'OVH Llama',
    baseUrl: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
    defaultModel: 'Meta-Llama-3_3-70B-Instruct',
    supportedFeatures: ['text'],
    priority: 3
  }
};

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'story-generation': {
    provider: 'openrouter',
    model: 'openrouter/sonoma-dusk-alpha',
    maxTokens: 2000,
    temperature: 0.7,
    supportedFeatures: ['json']
  },
  'story-seeds': {
    provider: 'openrouter',
    model: 'openrouter/sonoma-dusk-alpha',
    maxTokens: 1000,
    temperature: 0.7,
    supportedFeatures: ['json']
  },
  'story-segments': {
    provider: 'openrouter',
    model: 'openrouter/sonoma-dusk-alpha',
    maxTokens: 1000,
    temperature: 0.8,
    supportedFeatures: ['json']
  },
  'story-titles': {
    provider: 'openrouter',
    model: 'openrouter/sonoma-dusk-alpha',
    maxTokens: 300,
    temperature: 0.9,
    supportedFeatures: ['json']
  }
};

// ============= CORE AI SERVICE CLASS =============

export class AIServiceManager {
  private providers: Map<string, AIProvider>;
  private apiKeys: Record<string, string>;

  constructor(apiKeys: Record<string, string>) {
    this.providers = new Map(Object.entries(AI_PROVIDERS));
    this.apiKeys = apiKeys;
  }

  /**
   * Generate content using the specified configuration
   */
  async generate<T = any>(
    operationType: string,
    request: AIRequest
  ): Promise<AIResponse<T>> {
    const config = MODEL_CONFIGS[operationType];
    if (!config) {
      throw new Error(`Unknown operation type: ${operationType}`);
    }

    // Try providers in priority order
    const sortedProviders = Array.from(this.providers.values())
      .sort((a, b) => a.priority - b.priority);

    let lastError: Error | null = null;

    for (const provider of sortedProviders) {
      try {
        console.log(`Attempting ${provider.name} for ${operationType}...`);
        
        const result = await this.callProvider(provider, config, request);
        
        console.log(`✅ ${provider.name} succeeded for ${operationType}`);
        return {
          content: result.content,
          model: result.model,
          provider: provider.name,
          tokensUsed: result.tokensUsed || 0,
          success: true
        };
      } catch (error) {
        console.error(`❌ ${provider.name} failed:`, error.message);
        lastError = error as Error;
        continue;
      }
    }

    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Call a specific AI provider
   */
  private async callProvider(
    provider: AIProvider,
    config: ModelConfig,
    request: AIRequest
  ): Promise<{ content: any; model: string; tokensUsed?: number }> {
    const apiKey = this.getApiKeyForProvider(provider.name);
    if (!apiKey) {
      throw new Error(`API key not found for ${provider.name}`);
    }

    const headers = this.buildHeaders(provider, apiKey);
    const body = this.buildRequestBody(provider, config, request);

    const response = await fetch(provider.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${provider.name} API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return this.parseResponse(provider, data, request.responseFormat);
  }

  /**
   * Build request headers for a provider
   */
  private buildHeaders(provider: AIProvider, apiKey: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    // Provider-specific headers
    if (provider.name === 'OpenRouter') {
      headers['HTTP-Referer'] = 'https://taleforge.app';
      headers['X-Title'] = 'Tale Forge - AI Story Generator';
    }

    return headers;
  }

  /**
   * Build request body for a provider
   */
  private buildRequestBody(
    provider: AIProvider,
    config: ModelConfig,
    request: AIRequest
  ): any {
    const body: any = {
      model: config.model,
      messages: request.messages,
      max_tokens: request.maxTokens || config.maxTokens,
      temperature: request.temperature ?? config.temperature
    };

    // OpenAI structured outputs
    if (provider.name === 'OpenAI' && request.responseFormat === 'json' && request.schema) {
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: "response",
          schema: request.schema
        }
      };
    } else if (provider.name === 'OpenAI' && request.responseFormat === 'json') {
      body.response_format = { type: "json_object" };
    }

    return body;
  }

  /**
   * Parse provider response
   */
  private parseResponse(
    provider: AIProvider,
    data: any,
    responseFormat?: string
  ): { content: any; model: string; tokensUsed?: number } {
    const rawContent = data.choices[0].message.content;
    const model = data.model || 'unknown';
    const tokensUsed = data.usage?.total_tokens;

    if (responseFormat === 'json') {
      // Try to parse JSON
      try {
        const parsed = JSON.parse(rawContent);
        return { content: parsed, model, tokensUsed };
      } catch {
        // Extract JSON from text (for providers that wrap JSON in text)
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return { content: parsed, model, tokensUsed };
        }
        throw new Error('Invalid JSON response');
      }
    }

    return { content: rawContent, model, tokensUsed };
  }

  /**
   * Get API key for a provider
   */
  private getApiKeyForProvider(providerName: string): string | null {
    const keyMap: Record<string, string> = {
      'OpenRouter': this.apiKeys.OPENROUTER_API_KEY,
      'OpenAI': this.apiKeys.OPENAI_API_KEY,
      'OVH Llama': this.apiKeys.OVH_AI_ENDPOINTS_ACCESS_TOKEN
    };

    return keyMap[providerName] || null;
  }
}

// ============= RESPONSE VALIDATION =============

export class ResponseValidator {
  /**
   * Validate story seeds response
   */
  static validateStorySeeds(response: any): boolean {
    return (
      response &&
      Array.isArray(response.seeds) &&
      response.seeds.length > 0 &&
      response.seeds.every((seed: any) => 
        seed.id && seed.title && seed.description
      )
    );
  }

  /**
   * Validate story segment response
   */
  static validateStorySegment(response: any): boolean {
    return (
      response &&
      typeof response.content === 'string' &&
      response.content.length > 0 &&
      Array.isArray(response.choices) &&
      response.choices.every((choice: any) =>
        choice.id !== undefined && choice.text && choice.impact
      )
    );
  }

  /**
   * Validate story titles response
   */
  static validateStoryTitles(response: any): boolean {
    return (
      response &&
      Array.isArray(response.titles) &&
      response.titles.length >= 3 &&
      response.recommended &&
      typeof response.recommended === 'string'
    );
  }
}

// ============= UTILITY FUNCTIONS =============

/**
 * Create AI service manager with environment variables
 */
export function createAIService(): AIServiceManager {
  const apiKeys = {
    OPENROUTER_API_KEY: Deno.env.get('OPENROUTER_API_KEY') || '',
    OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY') || '',
    OVH_AI_ENDPOINTS_ACCESS_TOKEN: Deno.env.get('OVH_AI_ENDPOINTS_ACCESS_TOKEN') || ''
  };

  // Validate that we have at least one API key
  const hasAnyKey = Object.values(apiKeys).some(key => key.length > 0);
  if (!hasAnyKey) {
    throw new Error('No AI API keys configured');
  }

  return new AIServiceManager(apiKeys);
}

/**
 * Normalize response to ensure consistent format
 */
export function normalizeResponse<T>(
  response: any,
  validator: (data: any) => boolean,
  fallbackGenerator?: () => T
): T {
  if (validator(response)) {
    return response as T;
  }

  if (fallbackGenerator) {
    console.warn('Response validation failed, using fallback');
    return fallbackGenerator();
  }

  throw new Error('Invalid response format and no fallback provided');
}