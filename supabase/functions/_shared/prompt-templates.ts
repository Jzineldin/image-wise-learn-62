/**
 * Centralized Prompt Template System
 * 
 * This module provides reusable, configurable prompt templates for different story types,
 * age groups, and AI operations. It ensures consistency across all AI interactions.
 */

// ============= TYPES & INTERFACES =============

export interface PromptContext {
  ageGroup: string;
  genre: string;
  language?: string;
  characters?: Array<{
    name: string;
    description: string;
    role?: string;
    personality_traits?: string[];
  }>;
  [key: string]: any;
}

export interface PromptTemplate {
  system: string;
  user: string;
  schema?: any;
}

// ============= AGE-SPECIFIC CONFIGURATIONS =============

export const AGE_GUIDELINES = {
  '4-6': {
    wordCount: '30-60 words',
    vocabulary: 'very simple words, present tense, basic emotions',
    sentence: 'short, simple sentences (5-8 words each)',
    themes: 'friendship, family, animals, familiar places',
    choices: 'simple A/B choices with clear outcomes',
    complexity: 'one clear problem or adventure'
  },
  '7-9': {
    wordCount: '80-110 words',
    vocabulary: 'elementary vocabulary, simple past tense, clear cause-effect',
    sentence: 'medium sentences (8-12 words each)',
    themes: 'school adventures, mild mystery, teamwork, problem-solving',
    choices: '2-3 clear choices with different paths',
    complexity: 'simple problems with clear solutions'
  },
  '10-12': {
    wordCount: '120-150 words',
    vocabulary: 'intermediate vocabulary, varied sentence structure, emotional depth',
    sentence: 'varied sentence length (8-15 words)',
    themes: 'friendship challenges, adventure quests, self-discovery, moral choices',
    choices: '3 meaningful choices with significant story impact',
    complexity: 'meaningful choices and consequences'
  },
  '13+': {
    wordCount: '150-200 words',
    vocabulary: 'advanced vocabulary, complex sentence structure, nuanced themes',
    sentence: 'complex and varied sentences',
    themes: 'identity, relationships, moral dilemmas, complex adventures',
    choices: '3 complex choices with deep story consequences',
    complexity: 'nuanced problems with multiple solutions'
  }
};

export const GENRE_VOCABULARY = {
  'Fantasy': 'magical, enchanted, mystical, wondrous, spellbinding',
  'Adventure': 'thrilling, exciting, daring, courageous, bold',
  'Mystery': 'puzzling, mysterious, curious, intriguing, secretive',
  'Superhero Stories': 'heroic, powerful, brave, extraordinary, remarkable',
  'Animal Stories': 'playful, loyal, wild, gentle, natural',
  'Fairy Tales': 'magical, wonderful, charming, timeless, enchanting',
  'Educational': 'learning, discovering, exploring, understanding, growing'
};

// ============= PROMPT TEMPLATES =============

export class PromptTemplateManager {
  
  /**
   * Helper method to determine proper character reference
   */
  static getCharacterReference(character: any): string {
    if (!character?.name) return 'the character';
    
    const name = character.name.trim();
    
    // Expanded list of descriptive words that indicate a character type rather than proper name
    const descriptiveWords = [
      'dragon', 'cat', 'dog', 'rabbit', 'bear', 'lion', 'tiger', 'wolf', 'fox', 'bird', 'owl',
      'wizard', 'witch', 'fairy', 'princess', 'prince', 'knight', 'king', 'queen',
      'hero', 'warrior', 'guardian', 'explorer', 'adventurer',
      'girl', 'boy', 'child', 'kid', 'student', 'teacher', 'friend',
      'magic', 'magical', 'enchanted', 'mysterious', 'ancient', 'wise', 'brave', 'clever',
      'friendly', 'curious', 'happy', 'sad', 'angry', 'gentle', 'fierce', 'tiny', 'giant',
      'young', 'old', 'little', 'big', 'small', 'great'
    ];
    
    // Check if name contains any descriptive words
    const hasDescriptiveWords = descriptiveWords.some(word => 
      name.toLowerCase().includes(word.toLowerCase())
    );
    
    // Check if it matches a proper name pattern (capitalized words, no descriptive terms)
    const properNamePattern = /^[A-Z][a-z]+( [A-Z][a-z]+)*$/;
    const looksLikeProperName = properNamePattern.test(name) && !hasDescriptiveWords;
    
    if (looksLikeProperName) {
      return name; // Use as proper name: "Luna", "Max", "Spark"
    } else {
      // Convert to descriptive reference: "the curious cat", "the friendly dragon"
      const lowerName = name.toLowerCase();
      // Handle cases where name might already start with "the"
      if (lowerName.startsWith('the ')) {
        return lowerName;
      }
      return `the ${lowerName}`;
    }
  }

  /**
   * Generate story seeds prompt
   */
  static generateStorySeeds(context: PromptContext): PromptTemplate {
    const ageGuide = AGE_GUIDELINES[context.ageGroup as keyof typeof AGE_GUIDELINES] || AGE_GUIDELINES['10-12'];
    const genreWords = GENRE_VOCABULARY[context.genre as keyof typeof GENRE_VOCABULARY] || 'engaging, interesting';
    
    // Pre-process characters to use proper references
    const processedCharacters = context.characters?.map(char => ({
      ...char,
      reference: PromptTemplateManager.getCharacterReference(char),
      originalName: char.name
    }));

    const characterContext = processedCharacters && processedCharacters.length > 0
      ? `CHARACTERS TO FEATURE:\n${processedCharacters.map(char => 
          `- Use "${char.reference}" (original: "${char.originalName}"): ${char.description} (${char.role || 'character'}${char.personality_traits ? `, traits: ${char.personality_traits.join(', ')}` : ''})`
        ).join('\n')}\n\n🚨 CRITICAL CHARACTER REFERENCE RULES:\n- ALWAYS use the processed character references shown above\n- NEVER use the original character names in descriptions\n- For proper names like "Luna" or "Max": use the name directly, then vary with pronouns\n- For descriptive types like "the curious cat": NEVER say "Curious Cat discovers..." - ALWAYS say "The curious cat discovers..."\n- Use natural pronoun flow: first mention → pronoun → descriptive reference → pronoun\n- Example: "The brave knight walked through the forest. He discovered a hidden cave. The knight cautiously entered..."`
      : 'No specific characters selected - create engaging characters appropriate for the age group.';

    const languageInstructions = context.language === 'sv' ? `
🚨 CRITICAL SWEDISH LANGUAGE REQUIREMENT - MANDATORY:
Generate ALL content in Swedish (Svenska):
- The seed titles must be 100% in Swedish - NO English words
- The seed descriptions must be 100% in Swedish - NO English words
- Translate ALL character descriptions to Swedish (e.g., "the friendly dragon" → "den vänliga draken")
- Use natural, fluent Swedish appropriate for children aged ${context.ageGroup}
- Prefer Swedish names and cultural references when natural
- NEVER mix English and Swedish in the same sentence

EXAMPLES:
✅ CORRECT: "Den vänliga draken hittar en skattkarta i skogen."
❌ WRONG: "The friendly dragon hittar en skattkarta i skogen." ← NEVER DO THIS

` : context.language && context.language !== 'en' ? `
🚨 CRITICAL LANGUAGE REQUIREMENT - MANDATORY:
Generate ALL content in ${context.language}:
- The seed titles must be in ${context.language}
- The seed descriptions must be in ${context.language}
- Use natural, fluent language appropriate for children aged ${context.ageGroup}

` : '';

    const system = `You are a creative storytelling AI that generates ultra-concise story seeds for interactive children's stories.

${languageInstructions}🚨 ABSOLUTE CHARACTER REFERENCE REQUIREMENTS:
${processedCharacters && processedCharacters.length > 0 
  ? `YOU MUST USE THESE EXACT CHARACTER REFERENCES:\n${processedCharacters.map(char => 
      `- NEVER say "${char.originalName}" - ALWAYS say "${char.reference}"`
    ).join('\n')}\n\n❌ WRONG EXAMPLES:\n${processedCharacters.map(char => 
      `- "${char.originalName} discovers..." ← NEVER DO THIS`
    ).join('\n')}\n\n✅ CORRECT EXAMPLES:\n${processedCharacters.map(char => 
      `- "${char.reference} discovers..." ← ALWAYS DO THIS`
    ).join('\n')}\n` 
  : ''}

CRITICAL REQUIREMENTS:
1. Each seed description must be between ${ageGuide.wordCount} (aim for the midpoint)
2. Use ${ageGuide.vocabulary} appropriate for ${context.ageGroup} readers
3. Focus on ${ageGuide.themes} and ${ageGuide.complexity}
4. Incorporate the selected genre: ${context.genre} (use words like: ${genreWords})
5. ${processedCharacters && processedCharacters.length > 0 
      ? `Feature these characters using their EXACT references: ${processedCharacters.map(c => c.reference).join(', ')}` 
      : 'Create engaging characters appropriate for the age group'}
6. Set up ONE clear premise that leads to choices
7. NO detailed explanations - just the core exciting premise
8. Each seed must be completely different in plot and setting

${characterContext}

WORD COUNT IS CRITICAL: Count every word in each description. Do not exceed the limits.

REFERENCE EXAMPLES FOR ${context.ageGroup}:
- 4-6: "${processedCharacters && processedCharacters.length > 0 ? processedCharacters[0].reference : 'Maya'} finds a talking rabbit in her backyard."
- 7-9: "${processedCharacters && processedCharacters.length > 0 ? processedCharacters[0].reference : 'Alex'} discovers a secret door behind the school library that glows with mysterious light."
- 10-12: "${processedCharacters && processedCharacters.length > 0 ? processedCharacters[0].reference : 'Sam'} receives a cryptic message from the future. Time is running out to prevent disaster."
- 13+: "${processedCharacters && processedCharacters.length > 0 ? processedCharacters[0].reference : 'Jordan'} inherits a mansion with rooms that change based on the visitor's deepest fears and desires."`;

    const user = `Generate 3 unique story seeds for ${context.ageGroup} readers in the ${context.genre} genre(s). ${processedCharacters && processedCharacters.length > 0 
      ? `MANDATORY: Feature these characters using their EXACT references: ${processedCharacters.map(c => c.reference).join(', ')}` 
      : ''}

CRITICAL REQUIREMENTS:
- Title: Maximum 4 words, exciting and age-appropriate
- Description: ${ageGuide.wordCount}
- Use ${ageGuide.vocabulary} and focus on ${ageGuide.themes}
- Each description sets up ${ageGuide.complexity}
- NO extra details, explanations, or setup - just the core premise
- Be completely different from each other in plot and setting

Return as a JSON array of exactly 3 seeds with this structure:
{
  "seeds": [
    {
      "id": "seed-1",
      "title": "Adventure Title Here",
      "description": "Story description that ends with a choice-worthy situation..."
    }
  ]
}`;

    return {
      system,
      user,
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

  static generateStorySegment(context: PromptContext & {
    previousContent: string;
    choiceText: string;
    segmentNumber: number;
    shouldBeEnding?: boolean;
  }): PromptTemplate {
    const ageGuide = AGE_GUIDELINES[context.ageGroup as keyof typeof AGE_GUIDELINES] || AGE_GUIDELINES['10-12'];
    const genreWords = GENRE_VOCABULARY[context.genre as keyof typeof GENRE_VOCABULARY] || 'engaging, interesting';
    const wordCount = ageGuide.wordCount;
    const guidelines = {
      vocabulary: ageGuide.vocabulary,
      sentences: ageGuide.sentence,
      themes: ageGuide.themes,
      complexity: ageGuide.complexity
    };

    // Pre-process character references using the same logic as story seeds
    const characterReferences = context.characters && context.characters.length > 0
      ? `🚨 MANDATORY CHARACTER REFERENCE RULES:\n${context.characters.map(char => {
          const reference = PromptTemplateManager.getCharacterReference(char);
          return `- NEVER use "${char.name}" - ALWAYS use "${reference}"\n  ❌ WRONG: "${char.name} discovers..."\n  ✅ CORRECT: "${reference} discovers..."`;
        }).join('\n')}\n\nTHESE RULES ARE ABSOLUTE - Responses with capitalized character names will be REJECTED.`
      : 'No specific characters - create appropriate character references for the age group.';

    const languageInstructions = context.language === 'sv' ? `
🚨 CRITICAL SWEDISH LANGUAGE REQUIREMENT - MANDATORY:
Generate ALL content in Swedish (Svenska):
- The story content must be 100% in Swedish - NO English words allowed
- All choice text must be in Swedish
- All choice impact descriptions must be in Swedish
- Translate ALL character descriptions to Swedish (e.g., "the friendly dragon" → "den vänliga draken")
- Use natural, fluent Swedish appropriate for children aged ${context.ageGroup}
- Use Swedish names and cultural references where appropriate
- NEVER mix English and Swedish in the same sentence
- Character references like "the brave knight" must become "den modiga riddaren"

EXAMPLES:
✅ CORRECT: "Den vänliga draken leker i skogen."
❌ WRONG: "The friendly dragon leker i skogen." ← NEVER DO THIS

` : context.language && context.language !== 'en' ? `
🚨 CRITICAL LANGUAGE REQUIREMENT - MANDATORY:
Generate ALL content in ${context.language}:
- The story content must be in ${context.language}
- All choice text must be in ${context.language}
- All choice impact descriptions must be in ${context.language}
- Use natural, fluent language appropriate for children aged ${context.ageGroup}

` : '';

    const systemPrompt = `You are an expert children's story writer for ${context.ageGroup}. Create an engaging story segment.

${languageInstructions}🚨 CRITICAL RULES:

1. GRAMMAR: Start every sentence with a capital letter. Never repeat words ("the the" ❌).
2. PRONOUNS: Use "he/she" for animals, not "it". Example: "She wants to explore" ✅
3. SENSORY DETAILS: Include 2-3 per segment (colors, sounds, textures, feelings).
4. ENGAGEMENT: Add emotion, dialogue, and varied sentences

CHARACTER REFERENCES: ${characterReferences} (use lowercase: "the curious cat" not "Curious Cat")

STORY REQUIREMENTS:
- Write between ${wordCount} (aim for the midpoint) for ${context.ageGroup} reading level
- Use vocabulary appropriate for ${context.ageGroup}: ${guidelines.vocabulary}
- Sentence structure: ${guidelines.sentences}
- Themes: ${guidelines.themes}
- Complexity: ${guidelines.complexity}
- Genre: ${context.genre} - Use relevant vocabulary: ${genreWords}

🚨 CHOICES: Create 2 choices (5-10 words, start with action verb). Each "impact" MUST include ALL 3 elements (2-3 sentences):
1. Action consequence (what happens)
2. Emotional response (how character feels)
3. Anticipation (hint of what's next)

REQUIRED JSON STRUCTURE:
{
  "content": "story text using lowercase character references",
  "choices": [
    {"id": 1, "text": "choice text", "impact": "Action: what happens. Emotion: how they feel. Anticipation: what's next?"},
    {"id": 2, "text": "choice text", "impact": "Action: what happens. Emotion: how they feel. Anticipation: what's next?"}
  ],
  "is_ending": ${context.shouldBeEnding || false}
}

${context.shouldBeEnding ? '🏁 This should be an ENDING segment - resolve the story satisfyingly with no more choices needed.' : ''}`;

    const userPrompt = `Continue this ${context.genre.toLowerCase()} story for ${context.ageGroup} readers:

STORY CONTEXT:
${context.previousContent}

USER'S CHOICE: "${context.choiceText}"

CHARACTER REFERENCES: ${characterReferences}

Write segment #${context.segmentNumber} (${wordCount} words) that flows naturally from this choice.

CHECKLIST: □ Capitals □ No duplicates □ "he/she" not "it" □ 2-3 sensory details □ Emotion

Remember: Use lowercase character references and provide specific impact descriptions for each choice.`;

    return {
      system: systemPrompt,
      user: userPrompt,
      schema: {
        type: 'object',
        properties: {
          content: { 
            type: 'string', 
            description: 'Story segment content using lowercase character references like "the curious cat"' 
          },
          choices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Choice ID (1, 2, etc.)' },
                text: { type: 'string', description: 'Choice text (8-12 words)' },
                impact: { 
                  type: 'string', 
                  description: 'Specific description of what happens when this choice is selected - must be engaging and specific, never "Unknown consequence"' 
                }
              },
              required: ['id', 'text', 'impact']
            },
            minItems: 2,
            maxItems: 2
          },
          is_ending: { type: 'boolean', description: 'Whether this is the final segment' }
        },
        required: ['content', 'choices']
      }
    };
  }

  /**
   * Generate story titles prompt
   */
  static generateStoryTitles(context: PromptContext & {
    storyContent: string;
    currentTitle?: string;
  }): PromptTemplate {
    const characterNames = context.characters?.map(char => char.name).join(', ') || '';

    const system = `You are a creative title generator for children's stories. Generate engaging, age-appropriate titles that capture the essence of the story.

REQUIREMENTS:
1. Return ONLY valid JSON with exactly 5 title suggestions
2. Titles must be age-appropriate for ${context.ageGroup} audience
3. Reflect the ${context.genre} genre
4. Be memorable and engaging for children
5. Include keywords that hint at the story's adventure/theme
6. Avoid overly complex or lengthy titles
7. Consider the main characters and plot elements
8. Make titles that parents and children would find appealing`;

    const user = `Generate 5 creative titles for this ${context.genre} story for ${context.ageGroup} age group.

${characterNames ? `Main characters: ${characterNames}` : ''}

Story summary: ${context.storyContent.substring(0, 1000)}...

${context.currentTitle ? `Current title: "${context.currentTitle}" (suggest alternatives)` : ''}

Generate titles that are:
- Catchy and memorable
- Age-appropriate for ${context.ageGroup}
- Reflect the ${context.genre} theme
- Hint at the adventure or main plot
- Easy to remember and pronounce

Return format: { "titles": ["Title 1", "Title 2", ...], "recommended": "Title 1" }`;

    return {
      system,
      user,
      schema: {
        type: "object",
        properties: {
          titles: {
            type: "array",
            items: { type: "string" },
            minItems: 5,
            maxItems: 5
          },
          recommended: { type: "string" }
        },
        required: ["titles", "recommended"]
      }
    };
  }

  /**
   * Generate image prompt optimized for Google Gemini 2.5 Flash Image (Nano-banana)
   * Supports story scenes with optional character descriptions
   */
  static generateImagePrompt(context: PromptContext & {
    storySegment: string;
    characters?: Array<{ name: string; description: string; character_type?: string; personality?: string }>;
    style?: string;
  }): string {
    const { ageGroup, genre, storySegment, characters = [], style = 'digital_storybook' } = context;

    // Age-specific visual styles optimized for Nano-banana
    const ageStyleMap: Record<string, { style: string; mood: string; composition: string; lighting: string }> = {
      '4-6': {
        style: 'soft, whimsical watercolor illustration with rounded shapes, gentle colors, and simple composition',
        mood: 'warm, comforting, and playful',
        composition: 'centered, clear focal point, uncluttered background',
        lighting: 'soft, diffused natural light with gentle shadows'
      },
      '7-9': {
        style: 'vibrant, detailed digital illustration with rich colors and dynamic composition',
        mood: 'adventurous, exciting, and engaging',
        composition: 'dynamic angles, detailed environment, sense of depth and movement',
        lighting: 'bright, colorful lighting with clear shadows and highlights'
      },
      '10-12': {
        style: 'sophisticated, semi-realistic illustration with detailed textures and atmospheric lighting',
        mood: 'immersive, dramatic, and emotionally resonant',
        composition: 'complex composition, detailed background, atmospheric perspective',
        lighting: 'dramatic, atmospheric lighting with depth and mood'
      },
      '13+': {
        style: 'cinematic digital illustration with rich detail and sophisticated color palette',
        mood: 'immersive, compelling, and visually striking',
        composition: 'complex layered composition with atmospheric depth',
        lighting: 'cinematic lighting with dramatic shadows and highlights'
      }
    };

    const ageStyle = ageStyleMap[ageGroup] || ageStyleMap['7-9'];

    // Build character descriptions
    const charDescriptions = (characters || [])
      .slice(0, 3)
      .map((c: any) => {
        const name = c?.name ? String(c.name) : '';
        const desc = c?.description ? String(c.description) : '';
        const type = c?.character_type ? String(c.character_type) : '';
        const personality = c?.personality ? String(c.personality) : '';

        if (!name) return '';

        let charDesc = name;
        if (type && type !== 'human') charDesc += `, a ${type}`;
        if (desc) charDesc += `, ${desc}`;
        if (personality) charDesc += ` with a ${personality} personality`;

        return charDesc;
      })
      .filter(Boolean);

    // Extract scene from story segment
    const scene = storySegment.slice(0, 300).replace(/\s+/g, ' ').trim();

    // Build comprehensive narrative prompt
    let prompt = `A children's book illustration showing ${scene}`;

    if (charDescriptions.length > 0) {
      prompt += `\n\nFeaturing: ${charDescriptions.join('; ')}.`;
    }

    prompt += `

The scene is rendered in a ${ageStyle.style}.
The mood is ${ageStyle.mood}.
Composition: ${ageStyle.composition}.

Camera angle: eye-level perspective, inviting and accessible for young readers.
Lighting: ${ageStyle.lighting}.

This illustration is suitable for ages ${ageGroup} and maintains a safe, friendly, and engaging tone appropriate for children's literature.
High quality, professional children's book illustration.`;

    return prompt;
  }

  /**
   * Generate character reference image prompt optimized for Nano-banana
   * Creates portrait-style character reference images for consistency
   */
  static generateCharacterReferencePrompt(context: PromptContext & {
    characterName: string;
    characterDescription: string;
    characterType: string;
    backstory?: string;
    personalityTraits?: string[];
  }): string {
    const { ageGroup, characterName, characterDescription, characterType, backstory, personalityTraits = [] } = context;

    // Age-specific portrait styles
    const portraitStyleMap: Record<string, string> = {
      '4-6': 'soft, whimsical watercolor illustration with rounded shapes, gentle colors, and simple composition',
      '7-9': 'vibrant, detailed digital illustration with rich colors and dynamic composition',
      '10-12': 'sophisticated, semi-realistic illustration with detailed textures and atmospheric lighting',
      '13+': 'cinematic digital illustration with rich detail and sophisticated color palette'
    };

    const portraitStyle = portraitStyleMap[ageGroup] || portraitStyleMap['7-9'];

    // Build personality description
    const personalityDesc = personalityTraits && personalityTraits.length > 0
      ? ` The character has a ${personalityTraits.slice(0, 3).join(', ')} personality.`
      : '';

    // Build backstory description
    const backstoryDesc = backstory
      ? ` Background: ${backstory.slice(0, 150)}.`
      : '';

    // Create detailed, narrative prompt for character reference image
    const prompt = `A portrait-style character reference illustration of ${characterName}, a ${characterType}.
${characterDescription}.${personalityDesc}${backstoryDesc}

This is a character reference image for a children's story, showing the character from the front in a neutral, friendly pose.
The illustration should be in a ${portraitStyle}.
Clear, well-defined features that can be used as a reference for maintaining character consistency across multiple scenes.
Warm, inviting lighting. Soft shadows. Colorful but not overly saturated.
Portrait orientation (3:4 aspect ratio). White or simple gradient background to keep focus on the character.
Safe for children, friendly, and engaging. High quality illustration suitable for children's books.`;

    return prompt;
  }
}

// ============= FALLBACK GENERATORS =============

export class FallbackGenerators {
  
  /**
   * Generate fallback story seeds
   */
  static generateStorySeeds(context: PromptContext): any {
    const characterRef = context.characters?.[0] 
      ? PromptTemplateManager.getCharacterReference(context.characters[0])
      : 'our hero';
    
    const allCharacterRefs = (context.characters?.length || 0) > 1 
      ? (context.characters || []).map(char => PromptTemplateManager.getCharacterReference(char)).join(' and ')
      : characterRef;
    
    if (context.language === 'sv') {
      return {
        seeds: [
          {
            id: 'fallback-1',
            title: 'Magiskt Äventyr',
            description: `${characterRef.charAt(0).toUpperCase() + characterRef.slice(1)} hittar en mystisk dörr som leder till en magisk värld där allt är möjligt.`
          },
          {
            id: 'fallback-2',
            title: 'Gömd Skatt',
            description: `När ${characterRef} hittar en gammal karta måste de lösa kluriga gåtor för att finna den legendariska skatten.`
          },
          {
            id: 'fallback-3',
            title: 'Tidsäventyr',
            description: `${characterRef.charAt(0).toUpperCase() + characterRef.slice(1)} råkar resa i tiden och måste hitta hem igen samtidigt som de hjälper andra på vägen.`
          }
        ]
      };
    }

    return {
      seeds: [
        {
          id: 'fallback-1',
          title: 'Magical Adventure',
          description: `${characterRef.charAt(0).toUpperCase() + characterRef.slice(1)} discovers a mysterious door that leads to a magical world where anything is possible.`
        },
        {
          id: 'fallback-2',
          title: 'Hidden Treasure',
          description: `When ${characterRef} finds an ancient map, they must solve puzzles to find the legendary treasure.`
        },
        {
          id: 'fallback-3',
          title: 'Time Adventure',
          description: `${characterRef.charAt(0).toUpperCase() + characterRef.slice(1)} accidentally travels through time and must find a way back home while helping people along the way.`
        }
      ]
    };
  }

  /**
   * Generate fallback story titles
   */
  static generateStoryTitles(context: PromptContext & { storyContent: string }): any {
    const characterRef = context.characters?.[0] 
      ? PromptTemplateManager.getCharacterReference(context.characters[0])
      : 'Hero';
    
    // Capitalize first letter for titles
    const titleCharacter = characterRef.charAt(0).toUpperCase() + characterRef.slice(1);
    const genreCap = context.genre.charAt(0).toUpperCase() + context.genre.slice(1);
    
    return {
      titles: [
        `${titleCharacter}'s ${genreCap} Adventure`,
        `The Great ${genreCap} Quest`,
        `${titleCharacter} and the ${genreCap} Mystery`,
        `The Secret of ${titleCharacter}`,
        `${titleCharacter}'s Magical Journey`
      ],
      recommended: `${characterRef}'s ${genreCap} Adventure`
    };
  }
}