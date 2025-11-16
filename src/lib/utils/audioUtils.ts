/**
 * Audio Utilities for Gemini TTS Playback
 *
 * Handles decoding and playing base64-encoded audio from Gemini TTS API
 * NOTE: Gemini TTS returns raw PCM audio (linear16) WITHOUT WAV headers
 * We need to construct a proper WAV file before the browser can decode it
 */

/**
 * Decodes a base64 string into a Uint8Array
 */
function decodeBase64(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates a WAV file header for raw PCM audio data
 * Gemini TTS returns linear16 PCM at 24kHz, 1 channel (mono)
 */
function createWavHeader(pcmData: Uint8Array): Uint8Array {
  const sampleRate = 24000; // Gemini TTS default sample rate
  const numChannels = 1; // Mono
  const bitsPerSample = 16; // linear16 = 16-bit PCM

  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmData.length;
  const fileSize = 44 + dataSize; // 44 bytes for WAV header + PCM data

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, fileSize - 8, true); // File size - 8
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // data sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true); // Subchunk2Size

  return new Uint8Array(header);
}

/**
 * Audio controller interface for managing playback
 */
export interface AudioController {
  stop: () => void;
  onEnded: (callback: () => void) => void;
}

/**
 * Plays narration from a data URL or storage URL
 * Supports both base64 data URLs and Supabase storage URLs
 *
 * @param audioUrl - Base64 data URL (e.g., "data:audio/wav;base64,...") or storage URL (e.g., "https://...")
 * @returns Promise that resolves with an AudioController to manage playback
 */
export const playNarration = async (audioUrl: string): Promise<AudioController> => {
  // Validate input
  if (!audioUrl) {
    console.error('No audio URL provided');
    throw new Error('No audio URL provided');
  }

  // If it's a storage URL (https://...), fetch and play via AudioContext
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
    try {
      console.log('Fetching audio from storage:', audioUrl);

      // Fetch the audio file
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log('Audio fetched, size:', arrayBuffer.byteLength, 'bytes');

      // Convert to Uint8Array immediately to preserve the data
      // (ArrayBuffer gets "detached" after first decodeAudioData attempt)
      const rawData = new Uint8Array(arrayBuffer);

      // Use AudioContext to decode and play
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      let audioBuffer: AudioBuffer;

      try {
        // Try to decode directly first (for properly formatted WAV files)
        // Need to create a copy of the buffer since decodeAudioData consumes it
        const bufferCopy = rawData.slice().buffer;
        audioBuffer = await audioContext.decodeAudioData(bufferCopy);
        console.log('Audio decoded successfully (standard WAV)');
      } catch (decodeError) {
        // If decode fails, assume it's raw PCM without WAV headers (old files)
        // Construct WAV header and try again
        console.log('Direct decode failed, constructing WAV header for raw PCM data');

        const wavHeader = createWavHeader(rawData);
        const wavFile = new Uint8Array(wavHeader.length + rawData.length);
        wavFile.set(wavHeader, 0);
        wavFile.set(rawData, wavHeader.length);

        audioBuffer = await audioContext.decodeAudioData(wavFile.buffer);
        console.log('Audio decoded successfully (raw PCM with constructed WAV header)');
      }

      console.log('Audio ready to play', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      });

      // Play the decoded audio
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      let endedCallback: (() => void) | null = null;

      source.onended = () => {
        if (endedCallback) {
          endedCallback();
        }
      };

      source.start();
      console.log('Audio playback started successfully');

      return {
        stop: () => {
          try {
            source.stop();
            if (endedCallback) {
              endedCallback();
            }
          } catch (e) {
            console.log('Audio source already stopped');
          }
        },
        onEnded: (callback: () => void) => {
          endedCallback = callback;
        }
      };
    } catch (error) {
      console.error('Failed to load and play audio from storage:', error);
      throw new Error(`Audio playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Otherwise, treat it as a data URL
  if (!audioUrl.startsWith('data:audio/')) {
    console.error('Invalid audio URL provided:', audioUrl?.substring(0, 50));
    throw new Error('Invalid audio URL - must be data URL or https URL');
  }

  try {
    // 1. Get the browser's AudioContext
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // 2. Extract the base64 part of the data URL
    const base64Data = audioUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('No base64 data found in audio URL');
    }

    // 3. Decode base64 to get raw PCM data
    const pcmData = decodeBase64(base64Data);

    console.log('Raw PCM data decoded', {
      pcmLength: pcmData.length,
      firstBytes: Array.from(pcmData.slice(0, 20))
    });

    // 4. Create WAV header for the PCM data
    const wavHeader = createWavHeader(pcmData);

    // 5. Combine WAV header + PCM data to create a complete WAV file
    const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
    wavFile.set(wavHeader, 0);
    wavFile.set(pcmData, wavHeader.length);

    console.log('WAV file constructed', {
      totalLength: wavFile.length,
      headerLength: wavHeader.length,
      pcmLength: pcmData.length
    });

    // 6. Use the browser's decoder to decode the complete WAV file
    const audioBuffer = await audioContext.decodeAudioData(wavFile.buffer);

    // 7. Play the decoded audio
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    let endedCallback: (() => void) | null = null;

    source.onended = () => {
      if (endedCallback) {
        endedCallback();
      }
    };

    source.start();

    console.log('Audio playback started successfully', {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels
    });

    // Return controller interface
    return {
      stop: () => {
        try {
          source.stop();
          if (endedCallback) {
            endedCallback();
          }
        } catch (e) {
          // Source may already be stopped
          console.log('Audio source already stopped');
        }
      },
      onEnded: (callback: () => void) => {
        endedCallback = callback;
      }
    };

  } catch (error) {
    console.error('Failed to decode and play audio:', error);
    throw new Error(`Audio playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets audio duration from a base64 data URL without playing it
 * Constructs proper WAV file from Gemini's raw PCM audio before decoding
 *
 * @param audioUrl - Base64 data URL
 * @returns Duration in seconds
 */
export const getAudioDuration = async (audioUrl: string): Promise<number> => {
  if (!audioUrl || !audioUrl.startsWith('data:audio/')) {
    return 0;
  }

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const base64Data = audioUrl.split(',')[1];
    if (!base64Data) return 0;

    // Decode base64 to get raw PCM data
    const pcmData = decodeBase64(base64Data);

    // Create WAV header
    const wavHeader = createWavHeader(pcmData);

    // Combine to create complete WAV file
    const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
    wavFile.set(wavHeader, 0);
    wavFile.set(pcmData, wavHeader.length);

    // Decode and get duration
    const audioBuffer = await audioContext.decodeAudioData(wavFile.buffer);

    return audioBuffer.duration;
  } catch (error) {
    console.error('Failed to get audio duration:', error);
    return 0;
  }
};
