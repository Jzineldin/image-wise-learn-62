/**
 * Vertex AI Service for Veo Video Generation
 *
 * Veo 3.1 is ONLY available through Vertex AI, not Google AI Studio.
 *
 * Authentication: Uses service account key (JSON file) or OAuth2
 * Endpoint: aiplatform.googleapis.com
 *
 * References:
 * - https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation
 */

import { logger } from './logger.ts';

interface VertexAIConfig {
  projectId: string;
  location: string; // e.g., 'us-central1'
  serviceAccountKey?: any; // Service account JSON
  accessToken?: string; // Or OAuth2 token
}

interface VeoVideoRequest {
  prompt: string;
  imageBase64?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  durationSeconds?: number;
  resolution?: '360p' | '720p' | '1080p';
  sampleCount?: number;
  generateAudio?: boolean;
}

interface VeoOperation {
  name: string;
  done: boolean;
  metadata?: any;
  response?: any;
  error?: any;
}

export class VertexAIService {
  private config: VertexAIConfig;
  private baseUrl: string;
  private accessToken?: string;

  constructor(config: VertexAIConfig) {
    this.config = config;
    this.baseUrl = `https://${config.location}-aiplatform.googleapis.com/v1`;
  }

  /**
   * Get OAuth2 access token using service account key
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    if (this.config.accessToken) {
      this.accessToken = this.config.accessToken;
      return this.accessToken;
    }

    if (!this.config.serviceAccountKey) {
      throw new Error('No service account key or access token provided');
    }

    // Create JWT for service account
    const serviceAccount = this.config.serviceAccountKey;

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: serviceAccount.private_key_id
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/cloud-platform'
    };

    // Sign JWT (requires crypto module)
    // For Deno, we'll use a simpler approach: require pre-generated token
    throw new Error('Service account JWT signing not implemented. Please provide accessToken directly.');
  }

  /**
   * Generate video using Veo 3.1 (image-to-video)
   *
   * @param request Video generation parameters
   * @returns Storage URI where video will be saved
   */
  async generateVideo(request: VeoVideoRequest): Promise<{ operationName: string; storageUri?: string }> {
    try {
      const accessToken = await this.getAccessToken();

      // Construct request body according to Vertex AI Veo API spec
      const requestBody = {
        instances: [
          {
            prompt: request.prompt,
            ...(request.imageBase64 && {
              image: {
                bytesBase64Encoded: request.imageBase64,
                mimeType: 'image/png'
              }
            })
          }
        ],
        parameters: {
          aspectRatio: request.aspectRatio || '16:9',
          durationSeconds: request.durationSeconds || 5,
          resolution: request.resolution || '720p',
          sampleCount: request.sampleCount || 1,
          generateAudio: request.generateAudio || false,
          // Storage URI is required for Vertex AI
          // Format: gs://bucket-name/path/to/output
          storageUri: `gs://${this.config.projectId}-veo-output/videos/${Date.now()}`
        }
      };

      logger.info('Calling Vertex AI Veo API', {
        projectId: this.config.projectId,
        location: this.config.location,
        model: 'veo-3.1-generate-preview'
      });

      // Make request to Vertex AI
      const endpoint = `${this.baseUrl}/projects/${this.config.projectId}/locations/${this.config.location}/publishers/google/models/veo-3.1-generate-preview:predictLongRunning`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Vertex AI Veo API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Vertex AI error: ${response.status} - ${errorText}`);
      }

      const operation: VeoOperation = await response.json();

      logger.info('Veo operation started', {
        operationName: operation.name,
        storageUri: requestBody.parameters.storageUri
      });

      return {
        operationName: operation.name,
        storageUri: requestBody.parameters.storageUri
      };

    } catch (error) {
      logger.error('Failed to start Veo video generation', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Poll operation status
   *
   * @param operationName Full operation name from generateVideo
   * @returns Operation result
   */
  async pollOperation(operationName: string, maxWaitSeconds: number = 600): Promise<VeoOperation> {
    try {
      const accessToken = await this.getAccessToken();
      const startTime = Date.now();
      const maxWaitMs = maxWaitSeconds * 1000;

      while (true) {
        // Check operation status
        const response = await fetch(
          `${this.baseUrl}/${operationName}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to poll operation: ${response.status} - ${errorText}`);
        }

        const operation: VeoOperation = await response.json();

        if (operation.done) {
          if (operation.error) {
            logger.error('Veo operation failed', { error: operation.error });
            throw new Error(`Veo generation failed: ${JSON.stringify(operation.error)}`);
          }

          logger.info('Veo operation completed', { operationName });
          return operation;
        }

        // Check timeout
        if (Date.now() - startTime > maxWaitMs) {
          throw new Error(`Operation timeout after ${maxWaitSeconds} seconds`);
        }

        // Wait before next poll (10 seconds)
        logger.info('Veo operation in progress, polling...', { operationName });
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

    } catch (error) {
      logger.error('Failed to poll Veo operation', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate video and wait for completion
   *
   * @param request Video generation parameters
   * @returns Video bytes or storage URI
   */
  async generateVideoAndWait(request: VeoVideoRequest): Promise<{ videoBytes?: string; storageUri?: string }> {
    const { operationName, storageUri } = await this.generateVideo(request);

    const operation = await this.pollOperation(operationName);

    // Extract video from response
    // Format: operation.response.predictions[0].bytesBase64Encoded or storageUri
    const predictions = operation.response?.predictions || [];

    if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
      return { videoBytes: predictions[0].bytesBase64Encoded };
    }

    // Video is stored in GCS
    return { storageUri };
  }
}
