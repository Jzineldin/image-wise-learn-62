import { logger } from '../_shared/logger.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, validateAndDeductCredits, calculateAudioCredits } from '../_shared/credit-system.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateAudioRequest {
  text: string;
  voiceId?: string;
  languageCode?: string;
  storyId?: string;
  segmentId?: string;
  modelId?: string;
  settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
  };
}

// ElevenLabs voice mapping with high-quality voices
// Note: ElevenLabs Multilingual v2 model supports Swedish with all voices
// The voices below work particularly well with Swedish pronunciation
const voiceMapping = {
  en: [
    { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Young, clear female voice' },
    { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Warm male narrator' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Gentle female storyteller' },
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Friendly young male' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', description: 'Calm female narrator' }
  ],
  sv: [
    // These same voices work with Swedish using eleven_multilingual_v2 model
    { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Ung, tydlig kvinnlig röst' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Mjuk kvinnlig berättarröst' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', description: 'Lugn kvinnlig berättare' },
    { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Varm manlig berättare' },
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Vänlig ung man' }
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting generate-story-audio function');

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

    if (!elevenLabsApiKey) {
      console.error('ELEVENLABS_API_KEY environment variable is not set');
      throw new Error('ElevenLabs API key not configured');
    }

    console.log('ElevenLabs API key found');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Parsing request body');
    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody));

    const {
      text,
      voiceId = '9BWtsMINqrJLrRacOk9x', // Default to Aria
      languageCode = 'en',
      storyId,
      segmentId,
      modelId = 'eleven_multilingual_v2',
      settings = {}
    }: GenerateAudioRequest = requestBody;

    console.log('Parsed parameters:', { voiceId, languageCode, storyId, segmentId, modelId });

    // Get authorization header for user authentication
    const authHeader = req.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      console.error('Authorization header is missing');
      throw new Error('Authorization header missing');
    }

    console.log('Initializing credit service');
    // Initialize credit service and validate credits
    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);
    console.log('Getting user ID');
    const userId = await creditService.getUserId();
    console.log('User ID obtained:', userId);

    // Calculate required credits based on text length
    const requiredCredits = calculateAudioCredits(text);
    
    // Validate and deduct credits for audio generation
    const creditResult = await validateAndDeductCredits(
      creditService,
      userId,
      'audioGeneration',
      { text }
    );

    console.log(`Audio credits deducted: ${creditResult.creditsUsed}, New balance: ${creditResult.newBalance}`);

    const requestId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.audioGeneration(segmentId || 'unknown', requestId, voiceId || 'default');

    // Check permissions for audio generation
    // Allow any user to generate audio for segments without audio
    // For public/featured stories, check if user is admin or owner
    if (segmentId) {
      // Get story and segment information
      const { data: segmentData, error: segmentError } = await supabase
        .from('story_segments')
        .select(`
          id,
          audio_url,
          story_id,
          stories!inner(
            id,
            user_id,
            author_id,
            visibility,
            status
          )
        `)
        .eq('id', segmentId)
        .single();

      if (segmentError || !segmentData) {
        throw new Error('Segment not found or access denied');
      }

      const story = segmentData.stories;

      // Get user from credit service to ensure proper authentication
      const authenticatedUserId = await creditService.getUserId();

      // Check if user can generate audio for this segment
      const isOwner = story.user_id === authenticatedUserId || story.author_id === authenticatedUserId;
      const isPublicStory = story.visibility === 'public';
      
      if (isPublicStory && !isOwner) {
        // For public stories, check if user is admin
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authenticatedUserId)
          .eq('role', 'admin')
          .single();
        
        if (!userRoles) {
          throw new Error('Admin privileges required to generate audio for public stories');
        }
      }

      // Mark generation as in progress
      await supabase
        .from('story_segments')
        .update({ audio_generation_status: 'generating' })
        .eq('id', segmentId);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for audio generation');
    }

    // Validate voice for language
    const availableVoices = voiceMapping[languageCode as keyof typeof voiceMapping] || voiceMapping.en;
    const selectedVoice = availableVoices.find(v => v.id === voiceId) || availableVoices[0];

    // ElevenLabs TTS settings optimized for children's content
    const audioSettings = {
      stability: settings.stability || 0.5,
      similarity_boost: settings.similarity_boost || 0.75,
      style: settings.style || 0.0,
      use_speaker_boost: true
    };

    logger.info('Using ElevenLabs voice', { 
      voiceName: selectedVoice.name, 
      voiceId: selectedVoice.id,
      requestId 
    });

    // Generate speech using ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice.id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: audioSettings
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('ElevenLabs TTS failed', new Error(errorText), { requestId, segmentId });
      throw new Error(`TTS generation failed: ${response.status} - ${errorText}`);
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer();
    const audioArray = new Uint8Array(audioBuffer);

    // Upload to Supabase Storage
    let audioUrl = '';
    if (storyId) {
      const fileName = segmentId 
        ? `${storyId}/segment_${segmentId}_${Date.now()}.mp3`
        : `${storyId}/full_story_${Date.now()}.mp3`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('story-audio')
        .upload(fileName, audioArray, {
          contentType: 'audio/mpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload audio to storage');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('story-audio')
        .getPublicUrl(fileName);

      audioUrl = publicUrl;
      console.log('Audio uploaded to:', audioUrl);

      // Update database with audio URL
      if (segmentId) {
        const { error: updateError } = await supabase
          .from('story_segments')
          .update({ 
            audio_url: audioUrl,
            audio_generation_status: 'completed'
          })
          .eq('id', segmentId);
        
        if (updateError) {
          console.error('Failed to update segment with audio URL:', updateError);
          throw new Error('Failed to save audio URL to database');
        }
      } else {
        const { error: updateError } = await supabase
          .from('stories')
          .update({ 
            full_story_audio_url: audioUrl,
            audio_generation_status: 'completed',
            selected_voice_id: selectedVoice.id,
            selected_voice_name: selectedVoice.name
          })
          .eq('id', storyId);
        
        if (updateError) {
          console.error('Failed to update story with audio URL:', updateError);
          throw new Error('Failed to save audio URL to database');
        }
      }
    }

    // Convert to base64 for immediate playback option (chunked to prevent stack overflow)
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < audioArray.length; i += chunkSize) {
      const chunk = audioArray.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    const base64Audio = btoa(binaryString);

    // Estimate duration (rough calculation)
    const estimatedDuration = Math.ceil(text.length / 14); // ~14 chars per second

    console.log('Audio generated successfully with ElevenLabs');

    return new Response(JSON.stringify({ 
      audioContent: base64Audio,
      audioUrl: audioUrl,
      voice: {
        id: selectedVoice.id,
        name: selectedVoice.name,
        description: selectedVoice.description
      },
      language: languageCode,
      duration: estimatedDuration,
      model: modelId,
      settings: audioSettings
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-story-audio function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Audio generation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to get available voices for a language
export function getAvailableVoices(languageCode: string) {
  return voiceMapping[languageCode as keyof typeof voiceMapping] || voiceMapping.en;
}