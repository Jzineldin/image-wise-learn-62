import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, validateAndDeductCredits, CREDIT_COSTS } from '../_shared/credit-system.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateImageRequest {
  storyContent: string;
  storyTitle?: string;
  ageGroup: string;
  genre: string;
  segmentNumber?: number;
  storyId?: string;
  segmentId?: string;
  characters?: Array<{
    name: string;
    description: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ovhToken = Deno.env.get('OVH_AI_ENDPOINTS_ACCESS_TOKEN');
    
    if (!ovhToken) {
      throw new Error('OVH AI Endpoints access token not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      storyContent,
      storyTitle,
      ageGroup, 
      genre, 
      segmentNumber = 1,
      storyId,
      segmentId,
      characters = []
    }: GenerateImageRequest = await req.json();

    // Get authorization header for user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Initialize credit service and validate credits
    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);
    const userId = await creditService.getUserId();

    // Validate and deduct credits for image generation
    try {
      const creditResult = await validateAndDeductCredits(
        creditService,
        userId,
        'imageGeneration'
      );
      console.log(`Image credits deducted: ${creditResult.creditsUsed}, New balance: ${creditResult.newBalance}`);
    } catch (error) {
      if (error.message === 'Insufficient credits') {
        // Return successful response with error flag for insufficient credits
        return new Response(JSON.stringify({
          success: false,
          error_code: 'INSUFFICIENT_CREDITS',
          error: 'Insufficient credits to generate image',
          required: CREDIT_COSTS.imageGeneration,
          available: await creditService.checkUserCredits(userId, CREDIT_COSTS.imageGeneration).then(result => result.currentCredits)
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }

    console.log('Image generation request:', { 
      contentLength: storyContent.length, 
      ageGroup, 
      genre, 
      segmentNumber 
    });

    // Mark generation as in progress
    if (segmentId) {
      await supabase
        .from('story_segments')
        .update({ image_generation_status: 'generating' })
        .eq('id', segmentId);
    }

    // Create enhanced image prompt based on story content
    const characterDesc = characters.map(char => 
      `${char.name}: ${char.description}`
    ).join(', ');

    // Extract key visual elements from story content
    const visualPrompt = createImagePrompt(storyContent, {
      title: storyTitle,
      ageGroup,
      genre,
      characters: characterDesc,
      segmentNumber
    });

    console.log('Generated image prompt:', visualPrompt);

    // Generate image using OVH SDXL
    console.log('Calling OVH SDXL API with prompt:', visualPrompt.prompt);
    
    const imageResponse = await fetch('https://stable-diffusion-xl.endpoints.kepler.ai.cloud.ovh.net/api/text2image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ovhToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/octet-stream',
      },
      body: JSON.stringify({
        prompt: visualPrompt.prompt,
        negative_prompt: visualPrompt.negativePrompt,
        width: 1024,
        height: 1024,
        steps: 20,
        guidance_scale: 7.5
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('OVH SDXL error:', errorText);
      throw new Error(`Image generation failed: ${imageResponse.status}`);
    }

    // Get image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageArray = new Uint8Array(imageBuffer);

    // Upload to Supabase Storage
    let imageUrl = '';
    if (storyId) {
      const fileName = segmentId 
        ? `${storyId}/segment_${segmentNumber}_${Date.now()}.jpg`
        : `${storyId}/cover_${Date.now()}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(fileName, imageArray, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload image to storage');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('story-images')
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
      console.log('Image uploaded to:', imageUrl);

      // Update database with image URL
      if (segmentId) {
        const { error: updateError } = await supabase
          .from('story_segments')
          .update({ 
            image_url: imageUrl,
            image_generation_status: 'completed',
            image_prompt: visualPrompt.prompt
          })
          .eq('id', segmentId);
        
        if (updateError) {
          console.error('Failed to update segment with image URL:', updateError);
          throw new Error('Failed to save image URL to database');
        }
      } else {
        const { error: updateError } = await supabase
          .from('stories')
          .update({ 
            cover_image: imageUrl,
            cover_image_url: imageUrl
          })
          .eq('id', storyId);
        
        if (updateError) {
          console.error('Failed to update story with image URL:', updateError);
          throw new Error('Failed to save image URL to database');
        }
      }
    }

    // Convert to base64 for immediate display (in chunks to avoid stack overflow)
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < imageArray.length; i += chunkSize) {
      const chunk = imageArray.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    const base64Image = btoa(binaryString);

    console.log('Image conversion completed, base64 length:', base64Image.length);

    console.log('Image generated successfully');

    return new Response(JSON.stringify({ 
      success: true,
      imageUrl: imageUrl,
      imageData: base64Image,
      prompt: visualPrompt.prompt,
      fileName: storyId ? `segment_${segmentNumber}` : 'cover',
      metadata: {
        ageGroup,
        genre,
        segmentNumber,
        characters: characterDesc
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-story-image function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Image generation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createImagePrompt(storyContent: string, metadata: any): { prompt: string; negativePrompt: string } {
  const { ageGroup, genre, characters, segmentNumber, title } = metadata;
  
  // Extract key visual elements from story content
  const contentWords = storyContent.toLowerCase();
  
  // Common visual elements to look for
  const visualElements = {
    settings: ['forest', 'castle', 'garden', 'ocean', 'mountain', 'village', 'cave', 'tower', 'house', 'school'],
    objects: ['book', 'sword', 'crown', 'flower', 'tree', 'star', 'moon', 'sun', 'door', 'bridge'],
    animals: ['dragon', 'unicorn', 'cat', 'dog', 'bird', 'rabbit', 'fox', 'bear', 'deer', 'butterfly'],
    weather: ['rain', 'snow', 'sunshine', 'clouds', 'storm', 'rainbow', 'wind'],
    emotions: ['happy', 'sad', 'scared', 'excited', 'surprised', 'calm', 'brave']
  };

  const foundElements = [];
  for (const [category, items] of Object.entries(visualElements)) {
    for (const item of items) {
      if (contentWords.includes(item)) {
        foundElements.push(item);
      }
    }
  }

  // Style based on age group and genre
  const ageStyles = {
    '3-5': 'cute, simple, bright colors, cartoon style',
    '6-8': 'colorful, friendly, storybook illustration',
    '9-12': 'detailed, adventure style, fantasy art',
    '13+': 'detailed, mature themes, realistic fantasy art'
  };

  const genreStyles = {
    fantasy: 'magical, mystical, fantasy art style',
    adventure: 'dynamic, exciting, action-packed',
    mystery: 'atmospheric, mysterious, moody lighting',
    comedy: 'bright, fun, whimsical',
    friendship: 'warm, heartwarming, cozy',
    educational: 'clear, informative, engaging'
  };

  const baseStyle = ageStyles[ageGroup as keyof typeof ageStyles] || ageStyles['6-8'];
  const genreStyle = genreStyles[genre as keyof typeof genreStyles] || '';

  // Build the prompt
  let prompt = `${baseStyle}, ${genreStyle}, storybook illustration, `;
  
  if (characters) {
    prompt += `featuring ${characters}, `;
  }
  
  if (foundElements.length > 0) {
    prompt += `with ${foundElements.slice(0, 3).join(', ')}, `;
  }
  
  prompt += 'child-friendly, safe for children, wholesome, beautiful lighting, digital art, high quality, detailed, 4k';

  const negativePrompt = 'scary, dark, violent, inappropriate, adult content, horror, nightmare, ugly, distorted, bad anatomy, extra limbs, blurry, low quality, watermark, text, signature';

  return { prompt, negativePrompt };
}