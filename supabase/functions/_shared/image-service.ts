/**
 * Image Generation Service
 *
 * Provides unified interface for AI image generation using SDXL and other models.
 * Supports multiple providers with fallback strategies.
 */

import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { GoogleGeminiImageService } from './google-gemini-image-service.ts';

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
  negativePrompt?: string;
  referenceImages?: string[]; // Character reference images (max 3) for Freepik Gemini
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
  google_gemini: {
    name: 'GoogleGemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash-image',
    supportedStyles: [
      'digital_storybook', 'watercolor_fantasy', 'gouache', 'soft_painting',
      'flat_illustration', 'magical', 'children_book', 'cartoon', 'watercolor', 'surreal'
    ],
    priority: 0, // Highest priority - best quality with character consistency (FREE for 3 weeks!)
    costPerImage: 1
  },
  ovh: {
    name: 'OVH',
    baseUrl: 'https://stable-diffusion-xl.endpoints.kepler.ai.cloud.ovh.net/api/text2image',
    defaultModel: 'stable-diffusion-xl-base-v10',
    supportedStyles: [
      'digital_storybook',      // PRIMARY: High quality, colorful, NOT photorealistic
      'watercolor_fantasy',     // Soft, dreamy, artistic
      'gouache',                // Vibrant, modern, matte
      'soft_painting',          // Gentle digital painting
      'flat_illustration',      // Modern, graphic, simplified
      'magical',                // Legacy: enchanted illustrated art
      'children_book',          // Legacy: traditional storybook
      'cartoon',                // Bold, expressive
      'watercolor',             // Traditional watercolor
      'surreal'                 // Dreamlike illustration
    ],
    priority: 1,
    costPerImage: 1 // All providers cost 1 credit per image
  },
  replicate: {
    name: 'Replicate',
    baseUrl: 'https://api.replicate.com/v1/predictions',
    defaultModel: 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
    supportedStyles: [
      'digital_storybook', 'watercolor_fantasy', 'gouache', 'soft_painting',
      'flat_illustration', 'magical', 'children_book', 'cartoon', 'watercolor', 'surreal'
    ],
    priority: 2,
    costPerImage: 1
  },
  huggingface: {
    name: 'HuggingFace',
    baseUrl: 'https://api-inference.huggingface.co/models',
    defaultModel: 'stabilityai/stable-diffusion-xl-base-1.0',
    supportedStyles: [
      'digital_storybook', 'watercolor_fantasy', 'gouache', 'soft_painting',
      'flat_illustration', 'magical', 'children_book', 'watercolor', 'surreal'
    ],
    priority: 3,
    costPerImage: 1
  }
};

export class ImageService {
  private providers: Map<string, ImageProvider>;
  private apiKeys: Record<string, string>;
  private googleGeminiService: GoogleGeminiImageService | null = null;

  constructor(apiKeys: Record<string, string>) {
    this.providers = new Map(Object.entries(IMAGE_PROVIDERS));
    this.apiKeys = apiKeys;

    // Initialize Google Gemini service if API key is available
    if (apiKeys.GOOGLE_GEMINI_API_KEY) {
      try {
        this.googleGeminiService = new GoogleGeminiImageService(apiKeys.GOOGLE_GEMINI_API_KEY);
      } catch (error) {
        console.warn('⚠️  Failed to initialize Google Gemini service:', (error as Error)?.message);
      }
    }
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
        console.error(`❌ ${provider.name} failed:`, (error as Error)?.message || error);
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
      case 'GoogleGemini':
        return this.callGoogleGemini(provider, request);
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
   * Call Google Gemini 2.5 Flash Image for image generation
   */
  private async callGoogleGemini(
    provider: ImageProvider,
    request: ImageRequest
  ): Promise<{ imageUrl: string; seed?: number }> {
    if (!this.googleGeminiService) {
      throw new Error('Google Gemini service not initialized');
    }

    // Enhance prompt for children's book style
    const enhancedPrompt = this.enhancePromptForStyle(request.prompt, request.style || 'digital_storybook');

    // Generate image with reference images
    const result = await this.googleGeminiService.generateImage({
      prompt: enhancedPrompt,
      referenceImages: request.referenceImages || [],
      aspectRatio: '1:1' // Default to square images
    });

    if (!result.success || !result.imageData) {
      throw new Error(result.error || 'Google Gemini image generation failed');
    }

    // Convert base64 to data URL
    const imageUrl = `data:image/png;base64,${result.imageData}`;

    return {
      imageUrl,
      seed: request.seed
    };
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
    const negative = request.negativePrompt || this.getDefaultNegativePrompt(request.style);

    const body = {
      prompt: enhancedPrompt,
      negative_prompt: negative,
      width: request.width || 1024,
      height: request.height || 1024,
      num_inference_steps: request.steps || 40,
      guidance_scale: request.guidance ?? 6.5,
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

    // Check content type to handle both JSON and binary responses
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
      // Binary image response - convert to base64 data URL safely
      const imageBlob = await response.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64 = encodeBase64(uint8Array);

      return {
        imageUrl: `data:image/png;base64,${base64}`,
        seed: request.seed
      };
    } else {
      // JSON response with image URL or base64
      try {
        const result = await response.json();

        if (!result.generated_image && !result.image && !result.data) {
          throw new Error('No image generated from OVH API');
        }

        const imageUrl = result.generated_image || result.image || result.data;

        return {
          imageUrl,
          seed: result.seed || request.seed
        };
      } catch (jsonError) {
        throw new Error(`OVH API returned invalid JSON: ${(jsonError as Error)?.message || jsonError}`);
      }
    }
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
    const negative = request.negativePrompt || this.getDefaultNegativePrompt(request.style);

    const body = {
      version: provider.defaultModel.split(':')[1],
      input: {
        prompt: enhancedPrompt,
        negative_prompt: negative,
        width: request.width || 1024,
        height: request.height || 1024,
        num_inference_steps: request.steps || 40,
        guidance_scale: request.guidance ?? 6.5,
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
    const negative = request.negativePrompt || this.getDefaultNegativePrompt(request.style);

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
          num_inference_steps: request.steps || 40,
          guidance_scale: request.guidance ?? 6.5,
          seed: request.seed,
          negative_prompt: negative
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
   *
   * Updated to provide better non-photorealistic styles for children's stories
   */
  private enhancePromptForStyle(prompt: string, style: string): string {
    const stylePrompts: Record<string, string> = {
      // PRIMARY RECOMMENDED STYLE: Digital Storybook Illustration
      // High quality, colorful, NOT photorealistic, NOT overly cartoonish
      digital_storybook: "digital storybook illustration, painterly style, soft brush strokes, vibrant children's book art, warm color palette, gentle lighting, whimsical but sophisticated, picture book quality, hand-painted feel, storybook aesthetic, charming illustration, professional children's book art, colorful and inviting, safe for children, age-appropriate",

      // ALTERNATIVE STYLES

      // Soft Watercolor Fantasy - dreamy, gentle, artistic
      watercolor_fantasy: "soft watercolor illustration, gentle watercolor painting, delicate brush work, pastel fantasy colors, dreamy watercolor art, light washes, ethereal watercolor style, children's watercolor book, flowing colors, artistic watercolor, storybook watercolor, safe for children",

      // Gouache Illustration - vibrant, modern, matte finish
      gouache: "gouache illustration style, opaque paint aesthetic, matte finish illustration, vibrant gouache colors, textured illustration, modern storybook art, flat color illustration, contemporary children's book style, hand-painted gouache feel, colorful and inviting",

      // Soft Digital Painting - gentle realism, warm and inviting
      soft_painting: "soft digital painting, gentle brush work, painted illustration, warm digital art, blended colors, soft edges, illustrated painting style, storybook painting, artistic digital illustration, hand-painted digital art, safe for children",

      // Flat Illustration - modern, graphic, simplified
      flat_illustration: "flat illustration style, textured flat colors, modern children's illustration, simplified shapes, graphic storybook art, contemporary flat design, bold illustration, clean geometric style, textured digital illustration, colorful and friendly",

      // LEGACY STYLES (kept for backward compatibility)

      // Magical - updated to be less photorealistic
      magical: "magical illustrated art, enchanted storybook style, whimsical fantasy illustration, vibrant magical colors, dreamy atmosphere, painterly fantasy art, illustrated magic, storybook magic aesthetic, colorful and mystical, safe for children",

      // Children's Book - enhanced with more keywords
      children_book: "children's book illustration, storybook art style, illustrated story, colorful picture book, friendly illustration, warm children's art, picture book aesthetic, hand-drawn feel, safe for children, age-appropriate",

      // Cartoon - bold and expressive
      cartoon: "cartoon illustration style, bold cartoon colors, expressive cartoon art, clean cartoon lines, friendly cartoon style, animated storybook feel, playful illustration",

      // Watercolor - traditional style
      watercolor: "watercolor painting style, soft watercolor textures, artistic watercolor, gentle brush strokes, flowing watercolor colors, traditional watercolor illustration",

      // Surreal - dreamlike but illustrated
      surreal: "surreal illustration, dreamlike storybook art, fantastical illustrated scene, otherworldly picture book style, magical realism illustration, ethereal storybook aesthetic, mystical illustrated art, vibrant fantasy colors",

      // Realistic - DEPRECATED (too photorealistic for children's stories)
      realistic: "illustrated scene, detailed artwork, high quality illustration, artistic rendering"
    };

    const styleAddition = stylePrompts[style] || stylePrompts.digital_storybook;
    return `${prompt}, ${styleAddition}`;
  }
  /**
   * Default negative prompt tuned for SDXL and child-friendly outputs
   *
   * Updated to strongly prevent photorealism and enforce illustrated styles
   */
  private getDefaultNegativePrompt(style?: string): string {
    const base = [
      // Quality issues
      'low quality', 'worst quality', 'blurry', 'pixelated', 'jpeg artifacts', 'noise',
      'grainy', 'overexposed', 'underexposed', 'compression artifacts',

      // Anatomical issues
      'deformed', 'distorted', 'extra limbs', 'mutated hands', 'bad anatomy', 'crooked eyes',
      'disfigured', 'malformed', 'extra fingers', 'missing limbs',

      // Unwanted elements
      'text', 'caption', 'logo', 'watermark', 'signature', 'username', 'artist name',

      // Child safety
      'nsfw', 'gore', 'scary', 'horror', 'violent', 'blood', 'weapons', 'nudity',
      'disturbing', 'creepy', 'nightmare', 'terrifying',

      // ANTI-PHOTOREALISM (key addition to prevent realistic images)
      'photorealistic', 'photo', 'photograph', 'realistic photography', '3d render',
      'CGI', 'hyperrealistic', 'camera', 'lens', 'depth of field', 'bokeh',
      'film grain', 'cinematic photography', 'DSLR', 'photographic'
    ];

    // Style-specific exclusions
    if (style === 'children_book' || style === 'digital_storybook') {
      base.push('dark atmosphere', 'gritty', 'harsh shadows', 'overly detailed', 'complex background');
    } else if (style === 'magical' || style === 'surreal') {
      base.push('ugly', 'boring', 'plain', 'dull colors', 'monochrome');
    } else if (style === 'watercolor' || style === 'watercolor_fantasy') {
      base.push('sharp edges', 'hard lines', 'digital', 'vector art');
    } else if (style === 'flat_illustration') {
      base.push('3d', 'shadows', 'gradients', 'realistic lighting');
    }

    return base.join(', ');
  }


  /**
   * Get API key for provider
   */
  private getApiKeyForProvider(providerName: string): string | null {
    const keyMap: Record<string, string> = {
      'GoogleGemini': this.apiKeys.GOOGLE_GEMINI_API_KEY,
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
    GOOGLE_GEMINI_API_KEY: Deno.env.get('GOOGLE_GEMINI_API_KEY') || '',
    OVH_AI_ENDPOINTS_ACCESS_TOKEN: Deno.env.get('OVH_AI_ENDPOINTS_ACCESS_TOKEN') || '',
    REPLICATE_API_KEY: Deno.env.get('REPLICATE_API_KEY') || '',
    HUGGINGFACE_API_KEY: Deno.env.get('HUGGINGFACE_API_KEY') || ''
  };

  return new ImageService(apiKeys);
}