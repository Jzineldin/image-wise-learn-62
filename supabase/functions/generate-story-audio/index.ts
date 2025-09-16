import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, calculateAudioCredits, validateAndDeductCredits } from '../_shared/credit-system.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AudioRequest {
  text: string;
  voice_id?: string;
  story_id?: string;
  segment_id?: string;
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
    console.log(`Processing audio generation for user: ${userId}`);

    // Parse request body
    const { text, voice_id = '21m00Tcm4TlvDq8ikWAM', story_id, segment_id }: AudioRequest = await req.json();

    if (!text) {
      throw new Error('Text is required for audio generation');
    }

    // Calculate and validate credits
    const creditsRequired = calculateAudioCredits(text);
    const creditResult = await validateAndDeductCredits(creditService, userId, 'audioGeneration', { text });
    console.log(`Credits deducted: ${creditResult.creditsUsed}, New balance: ${creditResult.newBalance}`);

    // Generate audio using ElevenLabs
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenlabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenlabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioFile = new Uint8Array(audioBuffer);

    // Upload to Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseKey);
    const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    const filePath = `${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-audio')
      .upload(filePath, audioFile, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to upload audio file');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('story-audio')
      .getPublicUrl(filePath);

    const audioUrl = urlData.publicUrl;

    // Update story segment if segment_id provided
    if (segment_id) {
      const { error: updateError } = await supabase
        .from('story_segments')
        .update({
          audio_url: audioUrl,
          audio_generation_status: 'completed',
        })
        .eq('id', segment_id);

      if (updateError) {
        console.error('Error updating segment:', updateError);
      }
    }

    // Update story if story_id provided
    if (story_id) {
      const { error: storyUpdateError } = await supabase
        .from('stories')
        .update({
          full_story_audio_url: audioUrl,
          audio_generation_status: 'completed',
        })
        .eq('id', story_id);

      if (storyUpdateError) {
        console.error('Error updating story:', storyUpdateError);
      }
    }

    console.log(`Audio generated successfully: ${audioUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        audio_url: audioUrl,
        credits_used: creditResult.creditsUsed,
        credits_remaining: creditResult.newBalance,
        word_count: text.trim().split(/\s+/).length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Audio generation error:', error);
    
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
        error: error.message || 'Failed to generate audio',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});