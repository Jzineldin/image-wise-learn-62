import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, CREDIT_COSTS, validateAndDeductCredits } from '../_shared/credit-system.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageRequest {
  prompt: string;
  story_id?: string;
  segment_id?: string;
  style?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);

    // Get user ID
    const userId = await creditService.getUserId();
    console.log(`Processing image generation for user: ${userId}`);

    // Parse request body
    const { prompt, story_id, segment_id, style = 'children_book' }: ImageRequest = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required for image generation');
    }

    // Validate and deduct credits
    const creditResult = await validateAndDeductCredits(creditService, userId, 'imageGeneration');
    console.log(`Credits deducted: ${creditResult.creditsUsed}, New balance: ${creditResult.newBalance}`);

    // Generate image using OpenAI DALL-E
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Enhance prompt for children's book style
    const enhancedPrompt = `${prompt}, children's book illustration style, colorful, friendly, safe for children, high quality digital art`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0]?.url;

    if (!imageUrl) {
      throw new Error('Failed to generate image');
    }

    // Download and upload to Supabase Storage
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageFile = new Uint8Array(imageBuffer);

    // Upload to Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseKey);
    const fileName = `image_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    const filePath = `${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-images')
      .upload(filePath, imageFile, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to upload image file');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('story-images')
      .getPublicUrl(filePath);

    const finalImageUrl = urlData.publicUrl;

    // Update story segment if segment_id provided
    if (segment_id) {
      const { error: updateError } = await supabase
        .from('story_segments')
        .update({
          image_url: finalImageUrl,
          image_prompt: prompt,
          image_generation_status: 'completed',
        })
        .eq('id', segment_id);

      if (updateError) {
        console.error('Error updating segment:', updateError);
      }
    }

    // Update story cover if story_id provided
    if (story_id) {
      const { error: storyUpdateError } = await supabase
        .from('stories')
        .update({
          cover_image: finalImageUrl,
        })
        .eq('id', story_id);

      if (storyUpdateError) {
        console.error('Error updating story:', storyUpdateError);
      }
    }

    console.log(`Image generated successfully: ${finalImageUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        image_url: finalImageUrl,
        original_prompt: prompt,
        enhanced_prompt: enhancedPrompt,
        credits_used: creditResult.creditsUsed,
        credits_remaining: creditResult.newBalance,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Image generation error:', error);
    
    // Handle insufficient credits error
    if (error.message?.includes('Insufficient credits')) {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: 'INSUFFICIENT_CREDITS',
          error: error.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate image',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});