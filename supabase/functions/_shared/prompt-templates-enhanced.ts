/**
 * ENHANCED Prompt Templates - High Quality Version
 * Based on proven techniques from the "insanely good quality" app
 *
 * Key improvements:
 * 1. Master storyteller persona (role-playing)
 * 2. Personalization with child's name
 * 3. Layered, front-loaded image prompts
 * 4. Style analogies for better visual consistency
 * 5. Emotional engagement optimization
 *
 * USE THIS FOR LOCAL TESTING ONLY INITIALLY
 * Enable via FEATURE_ENHANCED_PROMPTS=true
 */

import { AGE_GUIDELINES, GENRE_VOCABULARY, PromptContext, PromptTemplate } from './prompt-templates.ts';

export class EnhancedPromptTemplateManager {

  /**
   * Helper method to determine proper character reference
   */
  static getCharacterReference(character: any): string {
    if (!character?.name) return 'the character';

    const name = character.name.trim();

    const descriptiveWords = [
      'dragon', 'cat', 'dog', 'rabbit', 'bear', 'lion', 'tiger', 'wolf', 'fox', 'bird', 'owl',
      'wizard', 'witch', 'fairy', 'princess', 'prince', 'knight', 'king', 'queen',
      'hero', 'warrior', 'guardian', 'explorer', 'adventurer',
      'girl', 'boy', 'child', 'kid', 'student', 'teacher', 'friend',
      'magic', 'magical', 'enchanted', 'mysterious', 'ancient', 'wise', 'brave', 'clever',
      'friendly', 'curious', 'happy', 'sad', 'angry', 'gentle', 'fierce', 'tiny', 'giant',
      'young', 'old', 'little', 'big', 'small', 'great'
    ];

    const hasDescriptiveWords = descriptiveWords.some(word =>
      name.toLowerCase().includes(word.toLowerCase())
    );

    const properNamePattern = /^[A-Z][a-z]+( [A-Z][a-z]+)*$/;
    const looksLikeProperName = properNamePattern.test(name) && !hasDescriptiveWords;

    if (looksLikeProperName) {
      return name;
    } else {
      const lowerName = name.toLowerCase();
      if (lowerName.startsWith('the ')) {
        return lowerName;
      }
      return `the ${lowerName}`;
    }
  }

  /**
   * ENHANCED: Story Segment Generation with Master Storyteller Persona
   */
  static generateStorySegment(context: PromptContext & {
    childName?: string;
    previousContent: string;
    choiceText: string;
    segmentNumber: number;
    shouldBeEnding?: boolean;
  }): PromptTemplate {
    const ageGuide = AGE_GUIDELINES[context.ageGroup as keyof typeof AGE_GUIDELINES] || AGE_GUIDELINES['10-12'];
    const genreWords = GENRE_VOCABULARY[context.genre as keyof typeof GENRE_VOCABULARY] || 'engaging, interesting';

    // Process characters using the same logic as original
    const processedCharacters = context.characters?.map(char => ({
      ...char,
      reference: EnhancedPromptTemplateManager.getCharacterReference(char),
      originalName: char.name
    }));

    const characterNames = processedCharacters?.map(c => c.reference).join(' and ') || 'the main character';
    const childName = context.childName || 'the reader';

    // Language instructions
    const languageInstructions = context.language === 'sv' ? `
🚨 CRITICAL SWEDISH LANGUAGE REQUIREMENT:
Write EVERYTHING in Swedish (Svenska). This is a Swedish story for Swedish children.
- Story content: 100% Swedish
- Choice text: 100% Swedish
- Choice impacts: 100% Swedish
- Use natural, fluent Swedish for age ${context.ageGroup}
- NEVER mix English and Swedish

EXAMPLES:
✅ CORRECT: "Den vänliga draken leker i skogen."
❌ WRONG: "The friendly dragon leker i skogen."
` : context.language && context.language !== 'en' ? `
🚨 CRITICAL LANGUAGE REQUIREMENT:
Generate ALL content in ${context.language}
- Story content, choices, and impacts must be in ${context.language}
- Use natural, fluent language for age ${context.ageGroup}
` : '';

    // Character reference instructions
    const characterInstructions = processedCharacters && processedCharacters.length > 0 ? `
👥 CHARACTERS IN THIS STORY:
${processedCharacters.map((c, i) => `${i + 1}. **${c.reference}**: ${c.description}${c.personality_traits ? ` (${c.personality_traits.join(', ')})` : ''}`).join('\n')}

🚨 CHARACTER REFERENCE RULES:
${processedCharacters.map(char =>
  `- ALWAYS use "${char.reference}" (never "${char.originalName}" alone in descriptions)`
).join('\n')}

Use these characters naturally and consistently throughout the story.
` : '';

    // ========== ENHANCED SYSTEM INSTRUCTION ==========
    const systemPrompt = `You are a **master storyteller** crafting a magical interactive adventure for a child named **${childName}**.

${languageInstructions}

🎭 YOUR ROLE:
You are not just writing a story - you are creating a personalized adventure that makes ${childName} feel like they are truly part of this ${context.genre} world. Every word should spark their imagination and make them excited to turn the page.

📖 THE STORY:
- **Genre**: ${context.genre} (use ${genreWords} language)
- **About**: ${characterNames}
- **Age**: ${context.ageGroup} years old
- **Language**: ${context.language || 'English'}

${characterInstructions}

🎯 AGE-SPECIFIC WRITING STYLE for ${context.ageGroup}:
- **Vocabulary**: ${ageGuide.vocabulary}
- **Sentence Structure**: ${ageGuide.sentence}
- **Themes**: ${ageGuide.themes}
- **Story Complexity**: ${ageGuide.complexity}
- **Word Count**: ${ageGuide.wordCount} (COUNT CAREFULLY - this is critical!)

📝 WRITING PRINCIPLES:
1. **Immersive**: Make ${childName} feel like they are IN the story
2. **Emotional**: Create moments of wonder, excitement, or gentle challenge
3. **Choice-Driven**: Each segment must lead naturally to meaningful choices
4. **Age-Perfect**: Language and themes perfectly matched to ${context.ageGroup}
5. **Engaging**: Every sentence should pull the reader forward
6. **Show, Don't Tell**: Use vivid descriptions and action

⚠️ CRITICAL REQUIREMENTS:
- Stay within ${ageGuide.wordCount} word limit
- ALWAYS provide ${context.ageGroup === '4-6' ? '2' : '3'} clear choices at the end
- NEVER use violence, fear, or inappropriate themes for ${context.ageGroup}
- ALWAYS maintain a ${genreWords} tone appropriate for ${context.genre}
- Follow the character reference rules exactly

Remember: You are creating a magical experience for ${childName}. Make it unforgettable.`;

    // ========== USER PROMPT ==========
    const userPrompt = `Continue the story for ${childName}.

${context.previousContent ? `
📚 STORY SO FAR:
${context.previousContent.slice(-800)}

${context.choiceText ? `
🎯 ${childName.toUpperCase()} CHOSE: "${context.choiceText}"

Continue the story based on this choice. Show the immediate consequence and move the plot forward.
` : ''}
` : `
🌟 BEGIN THE ADVENTURE:
This is the first page of ${childName}'s story. Create an exciting opening that immediately draws them into the ${context.genre} world featuring ${characterNames}.
`}

✍️ WRITE THE NEXT SEGMENT:
- Length: ${ageGuide.wordCount} (COUNT EVERY WORD!)
- Create an engaging scene that flows naturally
- Build towards a natural decision point
- End with ${context.ageGroup === '4-6' ? '2' : '3'} clear, exciting choices

${context.shouldBeEnding ? `
🎬 ENDING: This should be a satisfying conclusion to ${childName}'s adventure.
Provide a warm, rewarding ending with no choices (empty choices array).
` : `
🔀 CHOICES: Each choice should:
- Be clear and understandable for ${context.ageGroup} readers
- Lead to meaningfully different story directions
- Feel exciting and make ${childName} curious about what happens next
- Include a brief "impact" description showing what this choice leads to
`}

Return your response as JSON with this EXACT structure:
{
  "content": "The story segment text here...",
  "choices": [
    {
      "id": 1,
      "text": "Choice text",
      "impact": "Brief description of what this choice leads to"
    }
  ]
}`;

    return {
      system: systemPrompt,
      user: userPrompt,
      schema: {
        type: "object",
        properties: {
          content: { type: "string" },
          choices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                text: { type: "string" },
                impact: { type: "string" }
              },
              required: ["id", "text"]
            }
          }
        },
        required: ["content", "choices"]
      }
    };
  }

  /**
   * ENHANCED: Image Generation with Layered Style Instructions
   * Front-loads all artistic direction before the scene description
   */
  static generateImagePrompt(context: PromptContext & {
    storySegment: string;
    characters?: Array<{ name: string; description: string; character_type?: string }>;
    style?: string;
  }): string {
    const { ageGroup, genre, storySegment, characters = [] } = context;

    // ========== STYLE ANALOGY MAPPING ==========
    // Use cultural references the AI knows
    const styleAnalogyMap: Record<string, string> = {
      '4-6': 'like a classic Eric Carle or Dr. Seuss picture book - simple, bold, colorful, joyful',
      '7-9': 'like a Magic Tree House or Roald Dahl illustration - vibrant, adventurous, full of wonder',
      '10-12': 'like a Harry Potter or Percy Jackson chapter book cover - rich, detailed, immersive',
      '13+': 'like a His Dark Materials or Hunger Games cover - sophisticated, cinematic, atmospheric'
    };

    const styleAnalogy = styleAnalogyMap[ageGroup] || styleAnalogyMap['7-9'];

    // ========== GENRE-SPECIFIC MOOD WORDS ==========
    const genreMoodMap: Record<string, string> = {
      'Fantasy': 'magical, enchanted, wondrous, mystical, dreamlike',
      'Adventure': 'exciting, dynamic, bold, courageous, thrilling',
      'Mystery': 'intriguing, atmospheric, curious, secretive, shadowy',
      'Superhero Stories': 'heroic, powerful, dramatic, action-packed, vibrant',
      'Animal Stories': 'gentle, natural, warm, playful, charming',
      'Fairy Tales': 'timeless, magical, whimsical, enchanting, storybook',
      'Educational': 'bright, clear, engaging, colorful, inviting'
    };

    const genreMood = genreMoodMap[genre] || 'engaging, colorful, inviting';

    // ========== FRONT-LOADED STYLE PROMPT ==========
    // All artistic direction comes FIRST, then the scene
    const prompt = `A beautiful, whimsical, and vibrant storybook illustration for a child's ${genre} tale.

🎨 ARTISTIC STYLE:
The illustration style is ${styleAnalogy}.
The artwork is friendly, colorful, and painterly with:
- Rich, saturated colors that pop off the page
- Soft edges and warm lighting
- A sense of wonder and magic
- Professional children's book quality
- ${genreMood} atmosphere

📐 COMPOSITION:
- Age group: ${ageGroup} (tailor detail level accordingly)
- Clear focal point with engaging visual storytelling
- Safe, friendly, age-appropriate imagery
- Storybook illustration aesthetic

${characters.length > 0 ? `
👥 CHARACTERS TO FEATURE:
${characters.map(c => `- ${c.name}: ${c.description}${c.character_type ? ` (${c.character_type})` : ''}`).join('\n')}

Ensure character consistency with their descriptions.
` : ''}

🎬 SCENE TO ILLUSTRATE:
${storySegment.slice(0, 400)}

⛔ AVOID:
- Photorealism (keep it illustrative and storybook-like)
- Dark, scary, or violent imagery
- Text, captions, or speech bubbles
- Watermarks or logos
- Anything inappropriate for children aged ${ageGroup}

Remember: This is going into a magical storybook that a child will treasure. Make it beautiful!`;

    return prompt;
  }

  /**
   * ENHANCED: Story Seeds with Better Persona
   */
  static generateStorySeeds(context: PromptContext & {
    childName?: string;
  }): PromptTemplate {
    const ageGuide = AGE_GUIDELINES[context.ageGroup as keyof typeof AGE_GUIDELINES] || AGE_GUIDELINES['10-12'];
    const childName = context.childName || 'a young reader';

    // Process characters
    const processedCharacters = context.characters?.map(char => ({
      ...char,
      reference: EnhancedPromptTemplateManager.getCharacterReference(char),
      originalName: char.name
    }));

    const characterNames = processedCharacters?.map(c => c.reference).join(' and ') || 'exciting new characters';

    const languageInstructions = context.language === 'sv' ? `
🚨 CRITICAL SWEDISH LANGUAGE REQUIREMENT - MANDATORY:
Generate ALL content in Swedish (Svenska):
- Seed titles: 100% Swedish
- Seed descriptions: 100% Swedish
- Use natural, fluent Swedish for age ${context.ageGroup}
- NEVER mix English and Swedish

EXAMPLES:
✅ CORRECT: "Den vänliga draken hittar en skattkarta i skogen."
❌ WRONG: "The friendly dragon hittar en skattkarta i skogen."
` : context.language && context.language !== 'en' ? `
🚨 CRITICAL LANGUAGE REQUIREMENT:
Generate ALL content in ${context.language}
` : '';

    const characterContext = processedCharacters && processedCharacters.length > 0
      ? `CHARACTERS TO FEATURE:
${processedCharacters.map(char =>
  `- Use "${char.reference}" (original: "${char.originalName}"): ${char.description}`
).join('\n')}

🚨 CHARACTER REFERENCE RULES:
${processedCharacters.map(char =>
  `- ALWAYS use "${char.reference}" (never "${char.originalName}" alone)`
).join('\n')}`
      : 'Create engaging characters appropriate for the age group.';

    const systemPrompt = `You are a **creative genius** at coming up with exciting story ideas for children.

${languageInstructions}

Your mission: Create 3 AMAZING story seeds that will make ${childName} say "I want to read THAT one!"

Each seed should be:
- **Instantly captivating** - hooks the reader in the first sentence
- **Age-perfect** - tailored precisely for ${context.ageGroup} year olds
- **Choice-worthy** - sets up an exciting decision point
- **Different** - each seed explores completely different settings and plots

📚 Story Details:
- **For**: ${childName}, age ${context.ageGroup}
- **Genre**: ${context.genre}
- **Characters**: ${characterNames}
- **Length**: ${ageGuide.wordCount} per seed

${characterContext}`;

    const userPrompt = `Generate 3 unique, exciting story seeds for ${childName}.

Requirements for each seed:
- **Title**: Maximum 4 words, super catchy
- **Description**: ${ageGuide.wordCount}
- **Hook**: Start with immediate action or intrigue
- **Theme**: ${context.genre} with ${ageGuide.themes}
- **Ending**: Set up a clear choice point

${processedCharacters && processedCharacters.length > 0 ? `
MANDATORY: Feature these characters using EXACT references: ${processedCharacters.map(c => c.reference).join(', ')}
` : ''}

Make ${childName} EXCITED to start their adventure!

Return as JSON:
{
  "seeds": [
    { "id": "seed-1", "title": "...", "description": "..." },
    { "id": "seed-2", "title": "...", "description": "..." },
    { "id": "seed-3", "title": "...", "description": "..." }
  ]
}`;

    return {
      system: systemPrompt,
      user: userPrompt,
      schema: {
        type: "object",
        properties: {
          seeds: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string" }
              },
              required: ["id", "title", "description"]
            },
            minItems: 3,
            maxItems: 3
          }
        },
        required: ["seeds"]
      }
    };
  }
}
