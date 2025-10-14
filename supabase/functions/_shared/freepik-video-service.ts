/**
 * Freepik Video Generation Service
 * 
 * Provides unified interface for video generation using Freepik API.
 * Supports Wan v2.2 (480p) and Hailuo 2 (512p) with unlimited generation.
 */

export interface VideoProvider {
  name: string;
  endpoint: string;
  resolution: string;
  isUnlimited: boolean;
  priority: number;
}

export interface VideoRequest {
  imageUrl: string;
  prompt?: string;
  duration?: number; // in seconds
}

export interface VideoResponse {
  videoUrl?: string;
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  provider: string;
  resolution: string;
  success: boolean;
  error?: string;
}

export const VIDEO_PROVIDERS: Record<string, VideoProvider> = {
  freepik_hailuo: {
    name: 'Freepik Hailuo 2 (512p)',
    endpoint: '/v1/ai/image-to-video/minimax-hailuo-02-768p', // Using 768p as closest to 512p
    resolution: '768p',
    isUnlimited: true,
    priority: 1 // Primary choice - better quality
  },
  freepik_wan: {
    name: 'Freepik Wan v2.2 (480p)',
    endpoint: '/v1/ai/image-to-video/wan-v2-2-480p',
    resolution: '480p',
    isUnlimited: true,
    priority: 2 // Fallback option
  }
};

export class FreepikVideoService {
  private apiKey: string;
  private baseUrl = 'https://api.freepik.com';
  private providers: Map<string, VideoProvider>;

  constructor() {
    const apiKey = Deno.env.get('FREEPIK_API_KEY');
    if (!apiKey) {
      throw new Error('FREEPIK_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    this.providers = new Map(Object.entries(VIDEO_PROVIDERS));
  }

  /**
   * Generate video from image using the best available provider
   */
  async generateVideo(request: VideoRequest): Promise<VideoResponse> {
    // Try providers in priority order
    const sortedProviders = Array.from(this.providers.values())
      .sort((a, b) => a.priority - b.priority);

    let lastError: Error | null = null;

    for (const provider of sortedProviders) {
      try {
        console.log(`🎬 Attempting video generation with ${provider.name}...`);
        
        const result = await this.callProvider(provider, request);
        
        console.log(`✅ ${provider.name} video generation initiated`);
        return {
          taskId: result.taskId,
          status: 'processing',
          provider: provider.name,
          resolution: provider.resolution,
          success: true
        };
      } catch (error) {
        console.error(`❌ ${provider.name} failed:`, (error as Error)?.message || error);
        lastError = error as Error;
        continue;
      }
    }

    throw new Error(`All video providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Call a specific video provider to initiate generation
   */
  private async callProvider(
    provider: VideoProvider,
    request: VideoRequest
  ): Promise<{ taskId: string }> {
    const url = `${this.baseUrl}${provider.endpoint}`;
    
    const body: any = {
      image: request.imageUrl
    };

    // Add optional prompt if provided
    if (request.prompt) {
      body.prompt = request.prompt;
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
    
    // Freepik returns a task ID for async processing
    if (!result.id && !result.task_id) {
      throw new Error('No task ID returned from Freepik API');
    }

    return {
      taskId: result.id || result.task_id
    };
  }

  /**
   * Poll for video generation completion
   */
  async pollVideoStatus(
    taskId: string,
    providerName: string,
    maxAttempts = 60,
    intervalMs = 5000
  ): Promise<VideoResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    const url = `${this.baseUrl}${provider.endpoint}/${taskId}`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'x-freepik-api-key': this.apiKey,
          }
        });

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const result = await response.json();
        
        // Check status
        if (result.status === 'completed' || result.state === 'completed') {
          return {
            videoUrl: result.video_url || result.output?.video_url || result.url,
            taskId,
            status: 'completed',
            provider: provider.name,
            resolution: provider.resolution,
            success: true
          };
        }

        if (result.status === 'failed' || result.state === 'failed') {
          return {
            taskId,
            status: 'failed',
            provider: provider.name,
            resolution: provider.resolution,
            success: false,
            error: result.error || 'Video generation failed'
          };
        }

        // Still processing, wait and retry
        console.log(`⏳ Video generation in progress (attempt ${attempt + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));

      } catch (error) {
        console.error(`Error checking video status:`, error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error(`Video generation timed out after ${maxAttempts} attempts`);
  }

  /**
   * Get video generation status without polling
   */
  async getVideoStatus(taskId: string, providerName: string): Promise<VideoResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    const url = `${this.baseUrl}${provider.endpoint}/${taskId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-freepik-api-key': this.apiKey,
      }
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const result = await response.json();

    const status = result.status === 'completed' || result.state === 'completed' 
      ? 'completed' 
      : result.status === 'failed' || result.state === 'failed'
      ? 'failed'
      : 'processing';

    return {
      videoUrl: result.video_url || result.output?.video_url || result.url,
      taskId,
      status,
      provider: provider.name,
      resolution: provider.resolution,
      success: status === 'completed',
      error: result.error
    };
  }
}

/**
 * Factory function to create video service instance
 */
export function createVideoService(): FreepikVideoService {
  return new FreepikVideoService();
}

