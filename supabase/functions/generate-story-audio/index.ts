import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateAudioRequest {
  text: string;
  voice?: string;
  languageCode?: string;
  storyId?: string;
  segmentId?: string;
}

// Voice mapping for different languages
const voiceMapping = {
  en: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
  sv: ['alloy', 'nova'], // Swedish works better with these voices
  // Add more language-specific voice mappings as needed
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      text, 
      voice = 'alloy',
      languageCode = 'en',
      storyId,
      segmentId
    }: GenerateAudioRequest = await req.json();

    console.log('Audio generation request:', { textLength: text.length, voice, languageCode });

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for audio generation');
    }

    // Validate voice for language
    const availableVoices = voiceMapping[languageCode as keyof typeof voiceMapping] || voiceMapping.en;
    const selectedVoice = availableVoices.includes(voice) ? voice : availableVoices[0];

    // Generate speech using OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // Use HD model for better quality
        input: text,
        voice: selectedVoice,
        response_format: 'mp3',
        speed: 0.9 // Slightly slower for children's content
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS error:', errorText);
      throw new Error(`TTS generation failed: ${response.status}`);
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
        await supabase
          .from('story_segments')
          .update({ 
            audio_url: audioUrl,
            audio_generation_status: 'completed'
          })
          .eq('id', segmentId);
      } else {
        await supabase
          .from('stories')
          .update({ 
            full_story_audio_url: audioUrl,
            audio_generation_status: 'completed'
          })
          .eq('id', storyId);
      }
    }

    // Convert to base64 for immediate playback option
    const base64Audio = btoa(
      String.fromCharCode(...audioArray)
    );

    console.log('Audio generated successfully');

    return new Response(JSON.stringify({ 
      audioContent: base64Audio,
      audioUrl: audioUrl,
      voice: selectedVoice,
      language: languageCode,
      duration: Math.ceil(text.length / 15) // Rough estimate: ~15 chars per second
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