/**
 * Image Generation Service
 * 
 * Provides unified interface for AI image generation using SDXL and other models.
 * Supports multiple providers with fallback strategies.
 */

export interface ImageProvider {
  name: string;
  baseUrl: string;
  defaultModel: string;
  supportedStyles: string[];
  priority: number;
  costPerImage: number; // in credits
}

export interface ImageRequest {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  seed?: number;
}

export interface ImageResponse {
  imageUrl: string;
  provider: string;
  model: string;
  prompt: string;
  seed?: number;
  success: boolean;
  error?: string;
}

// Available image providers
export const IMAGE_PROVIDERS: Record<string, ImageProvider> = {
  ovh: {
    name: 'OVH',
    baseUrl: 'https://stable-diffusion-xl.endpoints.kepler.ai.cloud.ovh.net/api/text2image',
    defaultModel: 'stable-diffusion-xl-base-v10',
    supportedStyles: ['children_book', 'realistic', 'cartoon', 'watercolor'],
    priority: 1,
    costPerImage: 0 // Free on OVH
  },
  replicate: {
    name: 'Replicate',
    baseUrl: 'https://api.replicate.com/v1/predictions',
    defaultModel: 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
    supportedStyles: ['children_book', 'realistic', 'cartoon', 'watercolor'],
    priority: 2,
    costPerImage: 1
  },
  huggingface: {
    name: 'HuggingFace',
    baseUrl: 'https://api-inference.huggingface.co/models',
    defaultModel: 'stabilityai/stable-diffusion-xl-base-1.0',
    supportedStyles: ['children_book', 'realistic', 'artistic'],
    priority: 3,
    costPerImage: 1
  }
};

export class ImageService {
  private providers: Map<string, ImageProvider>;
  private apiKeys: Record<string, string>;

  constructor(apiKeys: Record<string, string>) {
    this.providers = new Map(Object.entries(IMAGE_PROVIDERS));
    this.apiKeys = apiKeys;
  }

  /**
   * Generate image using the best available provider
   */
  async generateImage(request: ImageRequest): Promise<ImageResponse> {
    // Try providers in priority order
    const sortedProviders = Array.from(this.providers.values())
      .sort((a, b) => a.priority - b.priority);

    let lastError: Error | null = null;

    for (const provider of sortedProviders) {
      const apiKey = this.getApiKeyForProvider(provider.name);
      if (!apiKey) {
        console.log(`⚠️  No API key for ${provider.name}, skipping...`);
        continue;
      }

      try {
        console.log(`🎨 Attempting image generation with ${provider.name}...`);
        
        const result = await this.callProvider(provider, request);
        
        console.log(`✅ ${provider.name} succeeded for image generation`);
        return {
          imageUrl: result.imageUrl,
          provider: provider.name,
          model: provider.defaultModel,
          prompt: request.prompt,
          seed: result.seed,
          success: true
        };
      } catch (error) {
        console.error(`❌ ${provider.name} failed:`, error.message);
        lastError = error as Error;
        continue;
      }
    }

    throw new Error(`All image providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Call a specific image provider
   */
  private async callProvider(
    provider: ImageProvider,
    request: ImageRequest
  ): Promise<{ imageUrl: string; seed?: number }> {
    const apiKey = this.getApiKeyForProvider(provider.name);
    if (!apiKey) {
      throw new Error(`API key not found for ${provider.name}`);
    }

    switch (provider.name) {
      case 'OVH':
        return this.callOVH(provider, request, apiKey);
      case 'Replicate':
        return this.callReplicate(provider, request, apiKey);
      case 'HuggingFace':
        return this.callHuggingFace(provider, request, apiKey);
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }

  /**
   * Call OVH AI Endpoints SDXL generation
   */
  private async callOVH(
    provider: ImageProvider,
    request: ImageRequest,
    apiKey: string
  ): Promise<{ imageUrl: string; seed?: number }> {
    // Enhance prompt for children's book style
    const enhancedPrompt = this.enhancePromptForStyle(request.prompt, request.style || 'children_book');
    
    const body = {
      prompt: enhancedPrompt,
      width: request.width || 1024,
      height: request.height || 1024,
      num_inference_steps: request.steps || 25,
      guidance_scale: request.guidance || 7.5,
      seed: request.seed
    };

    const response = await fetch(provider.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OVH API error: ${response.status} - ${errorText}`);
    }

    // Response should contain the image data
    const result = await response.json();
    
    if (!result.generated_image) {
      throw new Error('No image generated from OVH API');
    }

    return {
      imageUrl: result.generated_image,
      seed: request.seed
    };
  }

  /**
   * Call Replicate API for SDXL generation
   */
  private async callReplicate(
    provider: ImageProvider,
    request: ImageRequest,
    apiKey: string
  ): Promise<{ imageUrl: string; seed?: number }> {
    // Enhance prompt for children's book style
    const enhancedPrompt = this.enhancePromptForStyle(request.prompt, request.style || 'children_book');
    
    const body = {
      version: provider.defaultModel.split(':')[1],
      input: {
        prompt: enhancedPrompt,
        width: request.width || 1024,
        height: request.height || 1024,
        num_inference_steps: request.steps || 25,
        guidance_scale: request.guidance || 7.5,
        scheduler: "DPMSolverMultistep",
        num_outputs: 1,
        seed: request.seed
      }
    };

    const response = await fetch(provider.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
    }

    const prediction = await response.json();
    
    // Poll for completion
    const result = await this.pollReplicatePrediction(prediction.id, apiKey);
    
    if (!result.output || !result.output[0]) {
      throw new Error('No image generated');
    }

    return {
      imageUrl: result.output[0],
      seed: result.input?.seed
    };
  }

  /**
   * Poll Replicate prediction until complete
   */
  private async pollReplicatePrediction(predictionId: string, apiKey: string): Promise<any> {
    const maxAttempts = 60; // 5 minutes max
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to poll prediction: ${response.status}`);
      }

      const prediction = await response.json();

      if (prediction.status === 'succeeded') {
        return prediction;
      }

      if (prediction.status === 'failed') {
        throw new Error(`Image generation failed: ${prediction.error}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Image generation timed out');
  }

  /**
   * Call HuggingFace API for image generation
   */
  private async callHuggingFace(
    provider: ImageProvider,
    request: ImageRequest,
    apiKey: string
  ): Promise<{ imageUrl: string; seed?: number }> {
    const enhancedPrompt = this.enhancePromptForStyle(request.prompt, request.style || 'children_book');
    
    const response = await fetch(`${provider.baseUrl}/${provider.defaultModel}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: enhancedPrompt,
        parameters: {
          width: request.width || 1024,
          height: request.height || 1024,
          num_inference_steps: request.steps || 25,
          guidance_scale: request.guidance || 7.5,
          seed: request.seed
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
    }

    // Convert blob to base64 data URL
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    return {
      imageUrl: `data:image/png;base64,${base64}`,
      seed: request.seed
    };
  }

  /**
   * Enhance prompt based on style
   */
  private enhancePromptForStyle(prompt: string, style: string): string {
    const stylePrompts: Record<string, string> = {
      children_book: "children's book illustration, colorful, friendly, safe for children, digital art, high quality",
      realistic: "photorealistic, detailed, high resolution, professional photography",
      cartoon: "cartoon style, animated, vibrant colors, stylized",
      watercolor: "watercolor painting, soft colors, artistic, traditional media"
    };

    const styleAddition = stylePrompts[style] || stylePrompts.children_book;
    return `${prompt}, ${styleAddition}`;
  }

  /**
   * Get API key for provider
   */
  private getApiKeyForProvider(providerName: string): string | null {
    const keyMap: Record<string, string> = {
      'OVH': this.apiKeys.OVH_AI_ENDPOINTS_ACCESS_TOKEN,
      'Replicate': this.apiKeys.REPLICATE_API_KEY,
      'HuggingFace': this.apiKeys.HUGGINGFACE_API_KEY
    };

    return keyMap[providerName] || null;
  }

  /**
   * Get cost for image generation
   */
  getCostForProvider(providerName: string): number {
    const provider = this.providers.get(providerName.toLowerCase());
    return provider?.costPerImage || 1;
  }
}

/**
 * Create image service with environment variables
 */
export function createImageService(): ImageService {
  const apiKeys = {
    OVH_AI_ENDPOINTS_ACCESS_TOKEN: Deno.env.get('OVH_AI_ENDPOINTS_ACCESS_TOKEN') || '',
    REPLICATE_API_KEY: Deno.env.get('REPLICATE_API_KEY') || '',
    HUGGINGFACE_API_KEY: Deno.env.get('HUGGINGFACE_API_KEY') || ''
  };

  return new ImageService(apiKeys);
}