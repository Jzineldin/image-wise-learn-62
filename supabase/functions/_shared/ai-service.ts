/**
 * Centralized AI Service Layer
 * 
 * This module provides a unified interface for all AI operations across edge functions.
 * It handles model selection, fallback strategies, response validation, and error handling.
 */

import { logger } from './logger.ts';

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
    defaultModel: 'thedrummer/cydonia-24b-v4.1',  // Updated to Cydonia 24B for better performance
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

// Helper function to get model configuration for a language and operation type
// This is called dynamically on each request to support environment variable overrides
function getModelConfig(language: string, operationType: string): ModelConfig {
  // Default models by language
  const defaultModels: Record<string, string> = {
    'en': 'thedrummer/cydonia-24b-v4.1',  // Cydonia 24B for English - excellent performance
    'sv': 'anthropic/claude-3.5-sonnet',  // Claude 3.5 Sonnet (paid) - excellent multilingual, reliable
  };

  // Check for environment variable override
  const envKey = `AI_MODEL_${language.toUpperCase()}`;
  const model = Deno.env.get(envKey) || defaultModels[language] || defaultModels['en'];

  // Token limits and temperatures by operation type
  const operationConfigs: Record<string, { maxTokens: number; temperature: number }> = {
    'story-generation': { maxTokens: 2000, temperature: 0.7 },
    'story-seeds': { maxTokens: 700, temperature: 0.6 },
    'story-segments': { maxTokens: 900, temperature: 0.7 },
    'story-titles': { maxTokens: 250, temperature: 0.8 },
  };

  const opConfig = operationConfigs[operationType] || { maxTokens: 2000, temperature: 0.7 };

  return {
    provider: 'openrouter',
    model,
    maxTokens: opConfig.maxTokens,
    temperature: opConfig.temperature,
    supportedFeatures: ['json']
  };
}

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
   * @param operationType - Type of operation (e.g., 'story-generation', 'story-seeds')
   * @param request - AI request with messages, format, etc.
   * @param language - Optional language code (e.g., 'en', 'sv') for language-specific model selection
   */
  async generate<T = any>(
    operationType: string,
    request: AIRequest,
    language?: string
  ): Promise<AIResponse<T>> {
    // Select model config based on language (default to English)
    const languageCode = language || 'en';
    const config = getModelConfig(languageCode, operationType);

    logger.info('AI model selection', {
      operationType,
      language: languageCode,
      model: config.model,
      provider: config.provider,
      operation: 'model-selection'
    });

    // Use the provider specified in the config (no fallback chain)
    const providerKey = config.provider.toLowerCase();
    const provider = this.providers.get(providerKey);

    if (!provider) {
      throw new Error(`Provider '${config.provider}' not found`);
    }

    try {
      logger.info('AI provider attempt', {
        provider: provider.name,
        model: config.model,
        operationType,
        operation: 'ai-generation'
      });

      const result = await this.callProvider(provider, config, request);

      logger.info('AI provider succeeded', {
        provider: provider.name,
        model: result.model,
        operationType,
        operation: 'ai-generation'
      });

      return {
        content: result.content,
        model: result.model,
        provider: provider.name,
        tokensUsed: result.tokensUsed || 0,
        success: true
      };
    } catch (error) {
      logger.error('AI provider failed', error, {
        provider: provider.name,
        model: config.model,
        operationType,
        operation: 'ai-generation'
      });
      throw error;
    }
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

    // Add 120-second timeout using AbortController (increased for slower models like Grok)
    const controller = new AbortController();
    const timeoutMs = 120000; // 120 seconds
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const startTime = Date.now();

    try {
      logger.info('[PERF-AI] API request starting', {
        provider: provider.name,
        model: config.model,
        timeout: `${timeoutMs}ms`,
        requestBodySize: JSON.stringify(body).length,
        operation: 'ai-api-call-start'
      });

      const fetchStartTime = Date.now();
      const response = await fetch(provider.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const fetchDuration = Date.now() - fetchStartTime;

      clearTimeout(timeoutId);

      logger.info('[PERF-AI] Fetch completed, parsing response', {
        provider: provider.name,
        model: config.model,
        status: response.status,
        fetchDuration: `${fetchDuration}ms`,
        operation: 'ai-api-fetch-complete'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${provider.name} API error: ${response.status} ${errorText}`);
      }

      const jsonParseStartTime = Date.now();
      const data = await response.json();
      const jsonParseDuration = Date.now() - jsonParseStartTime;

      const totalDuration = Date.now() - startTime;

      logger.info('[PERF-AI] Response parsed, processing', {
        provider: provider.name,
        model: config.model,
        fetchDuration: `${fetchDuration}ms`,
        jsonParseDuration: `${jsonParseDuration}ms`,
        totalDuration: `${totalDuration}ms`,
        responseSize: JSON.stringify(data).length,
        operation: 'ai-api-response-parsed'
      });

      const parseResponseStartTime = Date.now();
      const result = this.parseResponse(provider, data, request.responseFormat);
      const parseResponseDuration = Date.now() - parseResponseStartTime;

      logger.info('[PERF-AI] Response processing complete', {
        provider: provider.name,
        model: config.model,
        parseResponseDuration: `${parseResponseDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
        operation: 'ai-api-complete'
      });

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (error.name === 'AbortError') {
        logger.error('AI API timeout', error, {
          provider: provider.name,
          model: config.model,
          duration: `${duration}ms`,
          timeout: `${timeoutMs}ms`,
          operation: 'ai-api-call'
        });
        throw new Error(`${provider.name} request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
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
    // Select a provider-compatible model. Use the configured model only when the
    // provider matches; otherwise fall back to the provider's default model.
    const modelForProvider = (provider.name === 'OpenRouter')
      ? config.model
      : provider.defaultModel || config.model;

    logger.info('[PERF-AI] Building request body', {
      provider: provider.name,
      configModel: config.model,
      modelForProvider,
      operation: 'ai-request-body-build'
    });

    const body: any = {
      model: modelForProvider,
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