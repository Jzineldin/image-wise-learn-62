/**
 * Google AI Unified Service - REST API Implementation
 * Rewritten to use direct REST API calls instead of SDK for Deno edge runtime compatibility
 *
 * This service provides a clean, simple interface to Google AI Studio:
 * - Gemini 2.5 Flash for story text (fast & cheap)
 * - Nano Banana (gemini-2.5-flash-image) for illustrations (FREE!)
 * - Gemini TTS for narration (FREE!)
 * - Veo 3.1 for video animation
 */

import { logger } from './logger.ts';

// ============= TYPES =============

export interface StoryConfig {
  childName: string;
  ageGroup: '4-6 years old' | '7-9 years old' | '10-12 years old' | '13+ years old';
  theme: string; // Genre
  character: string;
  traits?: string;
}

export interface Choice {
  choiceText: string;
  nextPrompt: string;
}

export interface StoryPageResult {
  pageText: string;
  choices: Choice[];
}

// ============= RESPONSE SCHEMA =============
// Exact schema from working app (converted from SDK types to plain objects)

const STORY_SCHEMA = {
  type: "OBJECT",
  properties: {
    pageText: {
      type: "STRING",
      description: "The paragraph of the story for the current page. The length and complexity should be appropriate for the target age group specified in the system instructions.",
    },
    choices: {
      type: "ARRAY",
      description: "A list of two choices for the child to make.",
      items: {
        type: "OBJECT",
        properties: {
          choiceText: {
            type: "STRING",
            description: "The text for the button the child will click.",
          },
          nextPrompt: {
            type: "STRING",
            description: "A creative prompt for the AI to generate the next page of the story if this choice is selected.",
          },
        },
        required: ["choiceText", "nextPrompt"],
      },
    },
  },
  required: ["pageText", "choices"],
};

// ============= SERVICE CLASS =============

export class GoogleAIUnifiedService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google AI Studio API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Generate story page with text and choices
   * Uses EXACT prompts from the working app
   */
  async generateStoryPage(
    config: StoryConfig,
    prompt: string
  ): Promise<StoryPageResult> {
    try {
      // Age-specific instructions (exact from working app)
      let ageSpecificInstructions = 'Keep the language simple, magical, and engaging for a young child. Each page should be a short paragraph (3-5 sentences).';

      switch (config.ageGroup) {
        case '4-6 years old':
          ageSpecificInstructions = 'The child is 4-6 years old. Write in simple, clear language with short sentences. Each page should be a short paragraph of 2-3 sentences. Focus on clear actions and simple emotions.';
          break;
        case '7-9 years old':
          ageSpecificInstructions = 'The child is 7-9 years old. Use slightly more descriptive language and varied sentence structures. Each page should be a paragraph of 3-4 sentences. You can introduce simple challenges and resolutions.';
          break;
        case '10-12 years old':
          ageSpecificInstructions = 'The child is 10-12 years old. Introduce more complex vocabulary and compound sentences. The story can be more detailed. Each page should be a substantial paragraph of 4-5 sentences. Feel free to explore more nuanced character feelings and plot points.';
          break;
        case '13+ years old':
          ageSpecificInstructions = 'The reader is 13 or older. Write for a young adult audience. Use rich, evocative vocabulary, complex sentences, and explore more mature themes like friendship, courage, and identity (while still being family-friendly). Each page can be a longer paragraph of 5-7 sentences.';
          break;
      }

      // System instruction (exact from working app)
      let systemInstruction = `You are a master storyteller for a child named ${config.childName}. ${ageSpecificInstructions}`;
      systemInstruction += ` The story's genre is ${config.theme}. It is about a character named or described as "${config.character}".`;
      if (config.traits) {
        systemInstruction += ` This character is ${config.traits}.`;
      }

      logger.info('Generating story page with Gemini 2.5 Flash (fast & cheap)', {
        childName: config.childName,
        ageGroup: config.ageGroup,
        genre: config.theme
      });

      // REST API call instead of SDK
      const response = await fetch(
        `${this.baseUrl}/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: STORY_SCHEMA,
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Extract text from response
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No text in Gemini response');
      }

      const data = JSON.parse(text.trim());

      // Ensure choices is always an array
      if (!data.choices || !Array.isArray(data.choices)) {
        data.choices = [];
      }

      logger.info('Story page generated successfully');
      return data;

    } catch (error) {
      logger.error('Failed to generate story page', { error: (error as Error).message });

      // Fallback story page (from working app)
      return {
        pageText: "Once upon a time, in a land of wonder, a brave hero went on an adventure! What should they do next?",
        choices: [
          { choiceText: "Explore a sparkly cave", nextPrompt: "The hero decides to explore a nearby sparkly cave." },
          { choiceText: "Climb a rainbow mountain", nextPrompt: "The hero decides to climb the tall rainbow mountain." },
        ],
      };
    }
  }

  /**
   * Generate image using Nano Banana (Gemini 2.5 Flash Image)
   * FREE during preview! Much cheaper than Imagen 4
   */
  async generateImage(scenePrompt: string): Promise<string> {
    try {
      // Exact prompt from working app - this is the "secret sauce"
      const fullPrompt = `A beautiful, whimsical, and vibrant storybook illustration for a child's tale. The style is friendly, colorful, and painterly, like a classic fairytale book. Scene: ${scenePrompt}`;

      logger.info('Generating image with Nano Banana (FREE!)');

      // REST API call instead of SDK
      const response = await fetch(
        `${this.baseUrl}/models/gemini-2.5-flash-image:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: fullPrompt }]
              }
            ],
            generationConfig: {
              responseModalities: ['IMAGE'],
              imageConfig: {
                aspectRatio: '16:9'
              }
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Nano Banana API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Extract base64 image from response
      const imagePart = result.candidates?.[0]?.content?.parts?.find(
        (part: any) => part.inlineData?.data
      );

      if (!imagePart?.inlineData?.data) {
        throw new Error('No image data in Nano Banana response');
      }

      const imageBase64 = imagePart.inlineData.data;
      logger.info('Image generated successfully with Nano Banana (FREE!)');

      return imageBase64;

    } catch (error) {
      logger.error('Failed to generate image', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate narration using Gemini TTS (FREE!)
   */
  async generateNarration(text: string, voiceId: string = 'Kore'): Promise<string> {
    try {
      const cheerfulPrompt = `Narrate cheerfully: ${text}`;

      logger.info('Generating narration with Gemini TTS', { voiceId });

      // REST API call instead of SDK
      const response = await fetch(
        `${this.baseUrl}/models/gemini-2.5-flash-preview-tts:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: cheerfulPrompt }]
              }
            ],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceId }
                }
              }
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini TTS API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Extract audio base64 from response
      const audioBase64 = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? "";

      if (!audioBase64) {
        throw new Error('No audio data in Gemini TTS response');
      }

      logger.info('Narration generated successfully');
      return audioBase64;

    } catch (error) {
      logger.error('Failed to generate narration', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate video using Veo 3.1 Fast
   * Uses Google AI Studio REST API with simple API key authentication
   * Fast variant optimized for speed while maintaining quality
   */
  async generateVideo(
    imageBase64: string,
    scenePrompt: string,
    includeNarration: boolean = false
  ): Promise<string> {
    try {
      const videoPrompt = includeNarration
        ? `Animate this storybook scene, including narration of the text: ${scenePrompt}`
        : `Animate this storybook scene visually without any sound or narration. It should be a silent animation. Scene description: ${scenePrompt}`;

      logger.info('Generating video with Veo 3.1 Fast', { includeNarration });

      // Call Gemini API for Veo 3.1 Fast (optimized for speed)
      // Google AI Studio API expects simple image structure (not referenceImages)
      const response = await fetch(
        `${this.baseUrl}/models/veo-3.1-fast-generate-preview:predictLongRunning`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify({
            instances: [{
              prompt: videoPrompt,
              image: {
                bytesBase64Encoded: imageBase64,
                mimeType: 'image/png',
              }
            }],
            parameters: {
              aspectRatio: '16:9',
              durationSeconds: 8,
              sampleCount: 1
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Veo API error: ${response.status} - ${errorText}`);
      }

      const operation = await response.json();

      // Check if we got a valid operation
      if (!operation || !operation.name) {
        logger.error('Invalid operation response from Veo API', { operation });
        throw new Error('Veo API did not return a valid operation. The API may not be available yet.');
      }

      logger.info('Veo operation started', { operationName: operation.name });

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 10 minutes max
      let operationResult = operation;

      while (!operationResult.done && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;

        // Poll for operation status
        // Operation name already includes the full path (e.g., "models/veo-3.0-generate-001/operations/12345")
        const pollResponse = await fetch(
          `${this.baseUrl}/${operationResult.name}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': this.apiKey,
            }
          }
        );

        if (!pollResponse.ok) {
          const errorText = await pollResponse.text();
          logger.error('Polling failed', { status: pollResponse.status, error: errorText, attempt: attempts });
          throw new Error(`Failed to poll Veo operation: ${pollResponse.status} - ${errorText}`);
        }

        operationResult = await pollResponse.json();

        logger.info('Veo video generation polling', {
          attempt: attempts,
          done: operationResult.done,
          hasError: !!operationResult.error
        });

        // Check for errors in the operation result
        if (operationResult.error) {
          throw new Error(`Veo operation failed: ${JSON.stringify(operationResult.error)}`);
        }
      }

      if (!operationResult.done) {
        throw new Error('Video generation timeout after 10 minutes');
      }

      // Extract video URI from Gemini API response format
      const downloadLink = operationResult.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      if (!downloadLink) {
        logger.error('No video URI in response', { response: operationResult.response });
        throw new Error("Video generation failed, no download link found in response");
      }

      logger.info('Video generated successfully with Veo 3.1 Fast', { downloadLink });
      return downloadLink;

    } catch (error) {
      logger.error('Failed to generate video', { error: (error as Error).message });
      throw error;
    }
  }
}
