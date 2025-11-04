/**
 * Generate Story Page V2 - Google AI Studio Edition
 *
 * This edge function uses the proven Google AI Studio approach
 * from the working copy-of-tale-forge app.
 *
 * Features:
 * - Gemini 2.5 Pro for story text (master storyteller prompts)
 * - Imagen 4 for beautiful illustrations
 * - Simple, clean implementation
 * - No complex character reference system
 */

import { GoogleAIUnifiedService } from '../_shared/google-ai-unified-service.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { ResponseHandler } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';

interface GenerateStoryPageRequest {
  story_id?: string;
  childName: string;
  ageGroup: '4-6 years old' | '7-9 years old' | '10-12 years old' | '13+ years old';
  theme: string; // Genre
  character: string;
  traits?: string;
  prompt?: string; // User's choice or initial prompt
  segment_number?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Skip credit validation for now (like audio V2 and video V2)
    // TODO: Add credit validation when user auth is properly set up
    logger.info('Skipping credit validation for V2', { operation: 'story-page-generation' });

    logger.info('Story page generation V2 started', { requestId });

    // Parse request
    const body: GenerateStoryPageRequest = await req.json();
    const {
      story_id,
      childName,
      ageGroup,
      theme,
      character,
      traits,
      prompt,
      segment_number
    } = body;

    // Initialize Google AI Studio
    const googleApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google AI Studio API key not configured');
    }

    const googleAI = new GoogleAIUnifiedService(googleApiKey);

    // Build story config (from working app)
    const storyConfig = {
      childName: childName || 'the reader',
      ageGroup,
      theme,
      character,
      traits
    };

    // Generate prompt if not provided
    const generationPrompt = prompt || `Create the very first page of the story based on the system instructions.`;

    logger.info('Generating story page with Google AI Studio', { childName, ageGroup, theme });

    const tStart = Date.now();

    // Generate story page (text + choices)
    const storyPage = await googleAI.generateStoryPage(storyConfig, generationPrompt);
    const tText = Date.now();
    logger.info('Story page generated', { textLength: storyPage.pageText.length, choicesCount: storyPage.choices.length, ms: tText - tStart });

    // Generate image (Gemini 2.5 Flash Image)
    const imageBase64 = await googleAI.generateImage(storyPage.pageText);
    const tImage = Date.now();
    logger.info('Image generated with Gemini 2.5 Flash Image', { ms: tImage - tText });

    // Upload image to Supabase Storage
    const supabase = createSupabaseClient(true);

    // Decode base64 to binary
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileName = `${story_id || 'temp'}_segment_${segment_number || 1}_${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-images')
      .upload(fileName, bytes, {
        contentType: 'image/png',
        upsert: false
      });

    let imageUrl = '';
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('story-images')
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }
    const tUpload = Date.now();
    logger.info('Image uploaded to storage', { imageUrl, ms: tUpload - tImage });

    // Convert choices to Tale Forge format
    const choices = storyPage.choices.map((choice, index) => ({
      id: index + 1,
      text: choice.choiceText,
      nextPrompt: choice.nextPrompt
    }));

    // Save to database if story_id provided
    let segmentId = null;
    if (story_id) {
      const tInsertStart = Date.now();
      const { data: segment, error: segmentError } = await supabase
        .from('story_segments')
        .insert({
          story_id,
          segment_number: segment_number || 1,
          content: storyPage.pageText,
          segment_text: storyPage.pageText,
          choices: choices,
          is_ending: choices.length === 0,
          image_url: imageUrl,
          image_generation_status: 'completed',
          metadata: {
            generatedWith: 'google-ai-studio-v2',
            model: 'gemini-2.5-pro',
            imageModel: 'imagen-4'
          }
        })
        .select()
        .single();

      const tInsertEnd = Date.now();
      if (segmentError) {
        logger.error('Failed to save segment', { error: segmentError.message, ms: tInsertEnd - tInsertStart });
      } else {
        segmentId = segment.id;
        logger.info('Segment saved', { segmentId, ms: tInsertEnd - tInsertStart });
      }
    }

    // Skip credit deduction for V2 (like audio V2 and video V2)
    // TODO: Add credit deduction when user auth is properly set up

    logger.info('Story page V2 generated successfully', { requestId, segmentId });

    return ResponseHandler.success({
      success: true,
      segment: {
        id: segmentId,
        content: storyPage.pageText,
        choices: choices,
        image_url: imageUrl,
        is_ending: choices.length === 0
      },
      credits_used: 0  // Free for now (V2 functions skip credit system)
    });

  } catch (error) {
    logger.error('Story page V2 generation failed', { error: (error as Error).message, requestId });
    return ResponseHandler.error(
      (error as Error).message || 'Failed to generate story page',
      500,
      { requestId }
    );
  }
});
