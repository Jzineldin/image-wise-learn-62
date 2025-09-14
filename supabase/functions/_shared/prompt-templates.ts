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
    wordCount: '100-140 words',
    vocabulary: 'elementary vocabulary, simple past tense, clear cause-effect',
    sentence: 'medium sentences (8-12 words each)',
    themes: 'school adventures, mild mystery, teamwork, problem-solving',
    choices: '2-3 clear choices with different paths',
    complexity: 'simple problems with clear solutions'
  },
  '10-12': {
    wordCount: '150-200 words',
    vocabulary: 'intermediate vocabulary, varied sentence structure, emotional depth',
    sentence: 'varied sentence length (8-15 words)',
    themes: 'friendship challenges, adventure quests, self-discovery, moral choices',
    choices: '3 meaningful choices with significant story impact',
    complexity: 'meaningful choices and consequences'
  },
  '13+': {
    wordCount: '250-400 words',
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

    const system = `You are a creative storytelling AI that generates ultra-concise story seeds for interactive children's stories.

🚨 ABSOLUTE CHARACTER REFERENCE REQUIREMENTS:
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
1. Each seed description must be exactly ${ageGuide.wordCount}
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

  /**
   * Generate story segment prompt
   */
  static generateStorySegment(context: PromptContext & {
    previousContent: string;
    choiceText: string;
    segmentNumber: number;
    shouldBeEnding?: boolean;
  }): PromptTemplate {
    const ageGuide = AGE_GUIDELINES[context.ageGroup as keyof typeof AGE_GUIDELINES] || AGE_GUIDELINES['10-12'];
    
    const characterDesc = context.characters?.map(char => 
      `${char.name} (${char.role || 'character'}): ${char.description}`
    ).join('\n') || '';

    const characterReferenceGuidance = context.characters && context.characters.length > 0 
      ? `\n\nCHARACTER REFERENCE GUIDELINES:\n${context.characters.map(char => {
          const isProperName = /^[A-Z][a-z]+( [A-Z][a-z]+)*$/.test(char.name.trim()) && 
                               !char.name.toLowerCase().includes('dragon') && 
                               !char.name.toLowerCase().includes('cat') && 
                               !char.name.toLowerCase().includes('wizard') &&
                               !char.name.toLowerCase().includes('fairy') &&
                               !char.name.toLowerCase().includes('knight') &&
                               !char.name.toLowerCase().includes('princess');
          
          if (isProperName) {
            return `- "${char.name}" is a proper name - use directly: "${char.name}", then vary with pronouns (he/she/they)`;
          } else {
            const article = /^[aeiou]/i.test(char.name) ? 'an' : 'a';
            return `- "${char.name}" is descriptive - use as type: "the ${char.name.toLowerCase()}", "${article} ${char.name.toLowerCase()}", then pronouns`;
          }
        }).join('\n')}\n- Use natural pronoun flow and avoid repetitive character names\n- Vary references for engaging, natural storytelling` 
      : '';

    const getChoiceGuidance = (age: string) => {
      const guides = {
        '4-6': 'Provide 2 simple, clear choices with obvious outcomes. Use basic vocabulary and simple sentence structure.',
        '7-9': 'Provide 2-3 choices with clear but slightly more complex outcomes. Use age-appropriate vocabulary.',
        '10-12': 'Provide 3 meaningful choices with interesting consequences. Use varied vocabulary and sentence structure.',
        '13+': 'Provide 3 sophisticated choices with nuanced outcomes and character development implications.'
      };
      return guides[age as keyof typeof guides] || guides['10-12'];
    };

    const system = `You are a master storyteller continuing an interactive story with deep expertise in child development and age-appropriate literature. Create the next segment based on the user's choice.

CRITICAL AGE-SPECIFIC REQUIREMENTS FOR ${context.ageGroup}:

WORD COUNT: Content must be exactly ${ageGuide.wordCount}
- This is NON-NEGOTIABLE. Count every word carefully.
- For 4-6 years: Focus on simple actions and basic emotions
- For 7-9 years: Include more descriptive language and simple plot development  
- For 10-12 years: Add character development and moderate complexity
- For 13+ years: Include sophisticated themes and complex character interactions

VOCABULARY & LANGUAGE STANDARDS:
- Use ${ageGuide.vocabulary}
- ${ageGuide.sentence}
- Focus on ${ageGuide.themes}

CHOICE COMPLEXITY: ${getChoiceGuidance(context.ageGroup)}

CONTENT STRUCTURE REQUIREMENTS:
1. Return ONLY valid JSON matching the exact schema
2. Age-appropriate for ${context.ageGroup} audience with precise word count adherence
3. Build naturally from the previous segment and chosen path
4. ${context.shouldBeEnding ? 'This should be a satisfying ending to the story' : 'Include a compelling cliffhanger'}
5. ${context.shouldBeEnding ? 'Set "is_ending": true and provide fewer/final choices' : 'Create age-appropriate choices as specified above'}
6. Maintain story consistency and character development
7. NEVER include questions or direct reader address in the story content - story content should be pure narrative
8. ALL questions and interactivity should only appear in the structured choices array
9. Cliffhangers should be dramatic situations or moments, not questions posed to the reader

GENRE-SPECIFIC ELEMENTS FOR ${context.genre.toUpperCase()}:
- Adventure: Age-appropriate challenges, exploration, discovery
- Fantasy: Magic systems appropriate for age level, mythical creatures
- Mystery: Age-appropriate puzzles, clues, investigations  
- Friendship: Social dynamics, cooperation, emotional growth
- Educational: Learning opportunities woven naturally into narrative`;

    const user = `Continue this ${context.genre} story for ${context.ageGroup} age group:

Characters:
${characterDesc}${characterReferenceGuidance}

PREVIOUS SEGMENT:
${context.previousContent}

USER'S CHOICE: ${context.choiceText}

Continue the story from this choice. ${context.shouldBeEnding ? 'Create a satisfying conclusion.' : 'Build tension and create a compelling cliffhanger.'} Maintain the story's tone and ensure smooth narrative flow.

IMPORTANT: Write pure narrative content without questions. Instead of ending with "What should they do?" create dramatic moments like "The door creaked open, revealing..." or "Suddenly, three paths appeared before them..." - let the choices provide the interactivity.

Segment Number: ${context.segmentNumber}
${context.shouldBeEnding ? 'This should be the final segment.' : ''}`;

    return {
      system,
      user,
      schema: {
        type: "object",
        properties: {
          content: { type: "string" },
          choices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                text: { type: "string" },
                impact: { type: "string" }
              },
              required: ["id", "text", "impact"]
            }
          },
          is_ending: { type: "boolean" }
        },
        required: ["content", "choices"]
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
    
    const allCharacterRefs = context.characters?.length > 1 
      ? context.characters.map(char => PromptTemplateManager.getCharacterReference(char)).join(' and ')
      : characterRef;
    
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
      recommended: `${character}'s ${genreCap} Adventure`
    };
  }
}