// Google Gemini 2.5 Flash Image (Nano Banana) Service
// Supports character consistency with reference images (up to 3)

import { logger } from './logger.ts';

export interface GeminiImageRequest {
  prompt: string;
  referenceImages?: string[]; // Up to 3 character reference image URLs
  aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
}

export interface GeminiImageResponse {
  imageUrl?: string;
  imageData?: string; // Base64 encoded image
  success: boolean;
  error?: string;
}

export class GoogleGeminiImageService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Generate an image using Google Gemini 2.5 Flash Image
   */
  async generateImage(request: GeminiImageRequest): Promise<GeminiImageResponse> {
    try {
      logger.info('Generating image with Google Gemini', {
        promptLength: request.prompt.length,
        referenceImageCount: request.referenceImages?.length || 0,
        aspectRatio: request.aspectRatio || '1:1'
      });

      // Build the request parts
      const parts: any[] = [];

      // Add reference images first (if provided)
      if (request.referenceImages && request.referenceImages.length > 0) {
        const imageCount = Math.min(request.referenceImages.length, 3); // Max 3 images
        logger.info(`Using ${imageCount} character reference images`);

        for (let i = 0; i < imageCount; i++) {
          const imageUrl = request.referenceImages[i];
          
          try {
            // Fetch the image and convert to base64
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
              logger.warn(`Failed to fetch reference image ${i + 1}`, { url: imageUrl });
              continue;
            }

            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
            
            parts.push({
              inlineData: {
                mimeType: 'image/png',
                data: base64Image
              }
            });
          } catch (error) {
            logger.warn(`Error processing reference image ${i + 1}`, { error: (error as Error).message });
          }
        }
      }

      // Add the text prompt
      parts.push({
        text: request.prompt
      });

      // Build the request body
      const requestBody: any = {
        contents: [{
          parts: parts
        }]
      };

      // Add generation config if aspect ratio is specified
      if (request.aspectRatio) {
        requestBody.generationConfig = {
          imageConfig: {
            aspectRatio: request.aspectRatio
          },
          responseModalities: ['Image'] // Only return image, no text
        };
      }

      // Make the API request
      const response = await fetch(
        `${this.baseUrl}/models/gemini-2.5-flash-image:generateContent`,
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Google Gemini API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Google Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Extract the generated image from the response
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              logger.info('Image generated successfully with Google Gemini');
              
              return {
                imageData: part.inlineData.data, // Base64 encoded image
                success: true
              };
            }
          }
        }
      }

      logger.error('No image data in Google Gemini response', { response: data });
      throw new Error('No image data in response');

    } catch (error) {
      logger.error('Failed to generate image with Google Gemini', {
        error: (error as Error).message
      });

      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Upload base64 image data to Supabase Storage
   */
  async uploadImageToStorage(
    imageData: string,
    supabaseClient: any,
    storyId: string,
    segmentNumber: number
  ): Promise<string> {
    try {
      // Decode base64 to binary
      const binaryString = atob(imageData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Generate filename
      const filename = `${storyId}/segment-${segmentNumber}-${Date.now()}.png`;

      // Upload to Supabase Storage
      const { data, error } = await supabaseClient.storage
        .from('story-images')
        .upload(filename, bytes, {
          contentType: 'image/png',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabaseClient.storage
        .from('story-images')
        .getPublicUrl(filename);

      logger.info('Image uploaded to Supabase Storage', { url: urlData.publicUrl });
      return urlData.publicUrl;

    } catch (error) {
      logger.error('Failed to upload image to storage', {
        error: (error as Error).message
      });
      throw error;
    }
  }
}

