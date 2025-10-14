/**
 * Freepik Image Generation Service
 * 
 * Provides unified interface for image generation using Freepik Gemini 2.5 Flash API.
 * Supports character consistency via reference images (up to 3 characters).
 */

export interface ImageProvider {
  name: string;
  endpoint: string;
  model: string;
  maxReferenceImages: number;
  isUnlimited: boolean;
  priority: number;
}

export interface FreepikImageRequest {
  prompt: string;
  referenceImages?: string[]; // URLs of character images (max 3)
}

export interface FreepikImageResponse {
  imageUrl?: string;
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  provider: string;
  model: string;
  success: boolean;
  error?: string;
}

export const FREEPIK_IMAGE_PROVIDERS: Record<string, ImageProvider> = {
  gemini_flash: {
    name: 'Freepik Gemini 2.5 Flash',
    endpoint: '/v1/ai/gemini-2-5-flash-image-preview',
    model: 'gemini-2.5-flash',
    maxReferenceImages: 3,
    isUnlimited: true, // Within 10,000 RPD limit
    priority: 0 // Highest priority
  }
};

export class FreepikImageService {
  private apiKey: string;
  private baseUrl = 'https://api.freepik.com';
  private providers: Map<string, ImageProvider>;

  constructor() {
    const apiKey = Deno.env.get('FREEPIK_API_KEY');
    if (!apiKey) {
      throw new Error('FREEPIK_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    this.providers = new Map(Object.entries(FREEPIK_IMAGE_PROVIDERS));
  }

  /**
   * Generate image using Freepik Gemini 2.5 Flash
   */
  async generateImage(request: FreepikImageRequest): Promise<FreepikImageResponse> {
    // Use Gemini 2.5 Flash provider
    const provider = this.providers.get('gemini_flash');
    if (!provider) {
      throw new Error('Gemini 2.5 Flash provider not found');
    }

    try {
      console.log(`🎨 Initiating image generation with ${provider.name}...`);
      
      // Limit reference images to max supported (3)
      const referenceImages = (request.referenceImages || []).slice(0, provider.maxReferenceImages);
      
      if (referenceImages.length > 0) {
        console.log(`📸 Using ${referenceImages.length} reference image(s) for character consistency`);
      }

      const result = await this.callProvider(provider, request);
      
      console.log(`✅ ${provider.name} image generation initiated`);
      return {
        taskId: result.taskId,
        status: 'processing',
        provider: provider.name,
        model: provider.model,
        success: true
      };
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, (error as Error)?.message || error);
      throw error;
    }
  }

  /**
   * Call Freepik API to initiate image generation
   */
  private async callProvider(
    provider: ImageProvider,
    request: FreepikImageRequest
  ): Promise<{ taskId: string }> {
    const url = `${this.baseUrl}${provider.endpoint}`;
    
    const body: any = {
      prompt: request.prompt
    };

    // Add reference images if provided
    if (request.referenceImages && request.referenceImages.length > 0) {
      body.reference_images = request.referenceImages;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-freepik-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Freepik API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.data?.task_id) {
      throw new Error('No task ID returned from Freepik API');
    }

    return {
      taskId: result.data.task_id
    };
  }

  /**
   * Poll for image generation status until complete
   */
  async pollImageStatus(taskId: string, providerName: string): Promise<FreepikImageResponse> {
    const provider = Array.from(this.providers.values()).find(p => p.name === providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getImageStatus(taskId, providerName);

      if (status.status === 'completed') {
        console.log(`✅ Image generation completed for task ${taskId}`);
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(`Image generation failed: ${status.error || 'Unknown error'}`);
      }

      // Still processing, wait before next poll
      console.log(`⏳ Image generation in progress (attempt ${attempt + 1}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Image generation timed out after 5 minutes');
  }

  /**
   * Get current status of image generation task
   */
  async getImageStatus(taskId: string, providerName: string): Promise<FreepikImageResponse> {
    const provider = Array.from(this.providers.values()).find(p => p.name === providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const url = `${this.baseUrl}${provider.endpoint}/${taskId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-freepik-api-key': this.apiKey,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Freepik API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.data) {
      throw new Error('Invalid response from Freepik API');
    }

    const status = result.data.status?.toUpperCase();

    // Map Freepik status to our status
    let mappedStatus: 'processing' | 'completed' | 'failed';
    if (status === 'COMPLETED') {
      mappedStatus = 'completed';
    } else if (status === 'FAILED') {
      mappedStatus = 'failed';
    } else {
      mappedStatus = 'processing';
    }

    return {
      taskId,
      status: mappedStatus,
      provider: provider.name,
      model: provider.model,
      imageUrl: result.data.generated?.[0], // First generated image
      success: mappedStatus === 'completed',
      error: mappedStatus === 'failed' ? 'Generation failed' : undefined
    };
  }

  /**
   * Get provider information
   */
  getProvider(providerName: string): ImageProvider | undefined {
    return Array.from(this.providers.values()).find(p => p.name === providerName);
  }
}

/**
 * Create Freepik image service with environment variables
 */
export function createFreepikImageService(): FreepikImageService {
  return new FreepikImageService();
}

