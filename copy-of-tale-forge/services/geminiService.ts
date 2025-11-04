
// FIX: Added `Modality` to the import from "@google/genai" to be used in `generateNarration`.
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { StoryConfig, Choice } from '../types';

// FIX: Removed `declare global` for `window.aistudio` to resolve a TypeScript error caused by a conflicting global type definition.
/*
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
*/

// Do not instantiate here, create a new one for each API call to get latest key
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const STORY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    pageText: {
      type: Type.STRING,
      description: "The paragraph of the story for the current page. The length and complexity should be appropriate for the target age group specified in the system instructions.",
    },
    choices: {
      type: Type.ARRAY,
      description: "A list of two choices for the child to make.",
      items: {
        type: Type.OBJECT,
        properties: {
          choiceText: {
            type: Type.STRING,
            description: "The text for the button the child will click.",
          },
          nextPrompt: {
            type: Type.STRING,
            description: "A creative prompt for the AI to generate the next page of the story if this choice is selected.",
          },
        },
        required: ["choiceText", "nextPrompt"],
      },
    },
  },
  required: ["pageText", "choices"],
};

export async function generateStoryPage(
  config: StoryConfig,
  prompt: string
): Promise<{ pageText: string; choices: Choice[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let ageSpecificInstructions = 'Keep the language simple, magical, and engaging for a young child. Each page should be a short paragraph (3-5 sentences).';
    if (config.ageGroup) {
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
    }

    let systemInstruction = `You are a master storyteller for a child named ${config.childName}. ${ageSpecificInstructions}`;
    systemInstruction += ` The story's genre is ${config.theme}. It is about a character named or described as "${config.character}".`;
    if (config.traits) {
      systemInstruction += ` This character is ${config.traits}.`;
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: STORY_SCHEMA,
        },
    });

    try {
        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText);
        // Ensure choices is always an array
        if (!data.choices || !Array.isArray(data.choices)) {
            data.choices = [];
        }
        return data;
    } catch (e) {
        console.error("Failed to parse story JSON:", e);
        console.error("Raw response text:", response.text);
        // Return a fallback story page
        return {
            pageText: "Once upon a time, in a land of wonder, a brave hero went on an adventure! What should they do next?",
            choices: [
                { choiceText: "Explore a sparkly cave", nextPrompt: "The hero decides to explore a nearby sparkly cave." },
                { choiceText: "Climb a rainbow mountain", nextPrompt: "The hero decides to climb the tall rainbow mountain." },
            ],
        };
    }
}


export async function generateImage(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fullPrompt = `A beautiful, whimsical, and vibrant storybook illustration for a child's tale. The style is friendly, colorful, and painterly, like a classic fairytale book. Scene: ${prompt}`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
            numberOfImages: 1,
            aspectRatio: '16:9',
        },
    });

    return response.generatedImages[0].image.imageBytes;
}

export async function generateNarration(text: string, voiceId: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Emotion is added to the prompt. A more advanced implementation could analyze text sentiment.
    const cheerfulPrompt = `Narrate cheerfully: ${text}`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: cheerfulPrompt }] }],
        config: {
            // FIX: Replaced the string 'AUDIO' with the `Modality.AUDIO` enum for `responseModalities` to align with best practices.
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceId },
                },
            },
        },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? "";
}

export async function generateVideo(imageB64: string, prompt: string, includeNarration: boolean): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const videoPrompt = includeNarration
      ? `Animate this storybook scene, including narration of the text: ${prompt}`
      : `Animate this storybook scene visually without any sound or narration. It should be a silent animation. Scene description: ${prompt}`;

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt,
        image: {
            imageBytes: imageB64,
            mimeType: 'image/png',
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9',
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed, no download link found.");
    }

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
}
