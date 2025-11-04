// Simple test to check if Google AI SDK works
import { GoogleGenAI, Modality } from "https://esm.sh/@google/genai@latest";

const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY') || 'AIzaSyD9v5Vm-ccH1hx4hW-jpbjVb8ChWzuaU28';

console.log('Testing Google AI SDK...');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');

try {
  const ai = new GoogleGenAI({ apiKey });
  console.log('✓ GoogleGenAI initialized successfully');

  // Test simple text generation
  console.log('\nTesting text generation...');
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: "Say hello in one word",
  });

  console.log('✓ Text generation successful');
  console.log('Response:', response.text);

  // Test TTS
  console.log('\nTesting TTS generation...');
  const ttsResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: "Narrate cheerfully: Hello world!" }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  console.log('✓ TTS generation successful');
  const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  console.log('Audio data length:', audioData ? audioData.length : 0);

} catch (error) {
  console.error('✗ Error:', error.message);
  console.error('Stack:', error.stack);
}
