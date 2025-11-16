/**
 * AI Prompt Templates for Story Generation
 * 
 * Improved prompts with explicit quality requirements for grammar,
 * capitalization, sensory details, and emotional engagement.
 */

export interface StoryPromptConfig {
  genre: string;
  ageGroup: string;
  language: string;
  theme?: string;
  characterName?: string;
  setting?: string;
  userPrompt?: string;
}

export interface ChoicePromptConfig {
  storyContext: string;
  ageGroup: string;
  genre: string;
  previousChoices?: string[];
}

/**
 * Generate system prompt for story segment generation
 */
export function generateStorySegmentPrompt(config: StoryPromptConfig): string {
  const { genre, ageGroup, language, theme, characterName, setting, userPrompt } = config;
  
  // Age-specific guidelines
  const ageGuidelines = getAgeSpecificGuidelines(ageGroup);
  
  return `You are an expert children's story writer creating engaging, age-appropriate interactive stories.

STORY REQUIREMENTS:
- Genre: ${genre}
- Age Group: ${ageGroup} years old
- Language: ${language}
- Theme: ${theme || 'Adventure and exploration'}
${characterName ? `- Main Character: ${characterName}` : ''}
${setting ? `- Setting: ${setting}` : ''}

USER'S STORY IDEA:
${userPrompt || 'Create an engaging adventure story'}

WRITING QUALITY STANDARDS (CRITICAL):

1. GRAMMAR & FORMATTING:
   ✓ Start EVERY sentence with a CAPITAL letter
   ✓ End sentences with proper punctuation (. ! ?)
   ✓ NO duplicate words (check for "the the", "a a", etc.)
   ✓ Use proper spacing (one space after punctuation)
   ✓ Proofread carefully before submitting

2. PRONOUN USAGE:
   ✓ For animals/characters: Use "he/she" or the character's name
   ✓ AVOID using "it" for living creatures
   ✓ Example: "The cat sees..." or "She sees..." NOT "It sees..."

3. SENSORY DETAILS (Include 2-3 per segment):
   ✓ Visual: colors, shapes, sizes ("orange cat", "bright green eyes")
   ✓ Auditory: sounds ("meow", "rustling leaves", "chirping birds")
   ✓ Tactile: textures ("soft fur", "warm sun", "cool grass")
   ✓ Emotional: feelings ("excited", "curious", "happy")

4. SENTENCE STRUCTURE:
   ✓ Keep sentences SHORT: ${ageGuidelines.maxWords} words or less
   ✓ Use SIMPLE vocabulary appropriate for ${ageGroup} year-olds
   ✓ Vary sentence beginnings (don't start every sentence the same way)
   ✓ Mix sentence types: statements, questions, exclamations

5. ENGAGEMENT ELEMENTS:
   ✓ Start with an engaging hook (action, question, or surprise)
   ✓ Include emotional moments (excitement, wonder, curiosity)
   ✓ Add dialogue or character sounds when appropriate
   ✓ End with anticipation or a question to maintain interest

6. PACING & RHYTHM:
   ✓ Build tension gradually
   ✓ Use "suddenly" or "then" for transitions
   ✓ Create rhythm with varied sentence lengths
   ✓ Read aloud mentally - does it sound good?

AGE-SPECIFIC GUIDELINES:
${ageGuidelines.guidelines}

STORY LENGTH:
- Write exactly ${ageGuidelines.sentenceCount} sentences
- Total word count: ${ageGuidelines.minWords}-${ageGuidelines.maxWords} words

TONE & STYLE:
- ${ageGuidelines.tone}
- Use a warm, encouraging narrative voice
- Make the reader feel like they're part of the adventure
- Keep content positive and age-appropriate

SAFETY REQUIREMENTS:
- NO scary, violent, or inappropriate content
- NO negative language (hate, stupid, dumb, etc.)
- Promote positive values (kindness, curiosity, bravery, friendship)
- Ensure all content is suitable for children

OUTPUT FORMAT:
Write a single paragraph of ${ageGuidelines.sentenceCount} sentences that follows ALL the requirements above.

VALIDATION CHECKLIST (Review before submitting):
□ Every sentence starts with a capital letter
□ No duplicate words (the the, a a, etc.)
□ Used "he/she" or names instead of "it" for characters
□ Included 2-3 sensory details
□ Included emotional engagement
□ Appropriate vocabulary for age ${ageGroup}
□ Sentence length under ${ageGuidelines.maxWords} words
□ No inappropriate content
□ Engaging and fun to read

Now write the story segment:`;
}

/**
 * Generate prompt for story choices with impact previews
 */
export function generateChoicesPrompt(config: ChoicePromptConfig): string {
  const { storyContext, ageGroup, genre, previousChoices } = config;
  
  const ageGuidelines = getAgeSpecificGuidelines(ageGroup);
  
  return `Generate 2 meaningful story choices for a ${ageGroup} year-old reader.

STORY CONTEXT:
${storyContext}

CHOICE REQUIREMENTS:

1. CHOICE TEXT (5-8 words each):
   ✓ Start with an ACTION VERB (climb, look, ask, explore, help, etc.)
   ✓ Be clear and specific
   ✓ Use simple vocabulary for age ${ageGroup}
   ✓ Capitalize the first letter
   ✓ NO punctuation at the end

2. IMPACT PREVIEW (2-3 sentences each):
   ✓ Describe what happens (action consequence)
   ✓ Include how the character feels (emotional response)
   ✓ Add a hint of mystery or anticipation
   ✓ Use proper capitalization and punctuation
   ✓ Keep it exciting and engaging

3. MEANINGFUL BRANCHING:
   ✓ Choices should lead to DIFFERENT outcomes
   ✓ Not just cosmetic differences
   ✓ One choice could be cautious, one adventurous
   ✓ Or one social, one independent
   ✓ Both should be valid and interesting

4. AGE-APPROPRIATENESS:
   ✓ Actions a ${ageGroup} year-old can understand
   ✓ Safe and positive behaviors
   ✓ Promote good values (curiosity, kindness, bravery)
   ✓ No dangerous or inappropriate actions

EXAMPLE FORMAT:

Choice 1: "Climb the fence to follow the cat"
Impact: "You climb over the fence and follow the curious cat into the neighbor's garden. Your heart beats with excitement! What amazing things will you discover together?"

Choice 2: "Look around the yard first"
Impact: "You decide to explore your own backyard before following the cat. You notice colorful flowers and interesting bugs. The cat watches you with bright, curious eyes."

${previousChoices ? `\nPREVIOUS CHOICES (avoid repetition):\n${previousChoices.join('\n')}` : ''}

VALIDATION CHECKLIST:
□ Both choices start with action verbs
□ Both choices are 5-8 words
□ Impact previews include action + emotion + anticipation
□ Choices lead to different outcomes
□ All text properly capitalized
□ Age-appropriate vocabulary and actions
□ No duplicate words or grammar errors

Now generate 2 choices with impact previews:`;
}

/**
 * Generate prompt for story ending
 */
export function generateEndingPrompt(config: StoryPromptConfig & { storyPath: string }): string {
  const { genre, ageGroup, language, storyPath } = config;
  const ageGuidelines = getAgeSpecificGuidelines(ageGroup);
  
  return `Create a satisfying, magical ending for this ${genre} story for ${ageGroup} year-olds.

STORY PATH TAKEN:
${storyPath}

ENDING REQUIREMENTS:

1. RESOLUTION:
   ✓ Resolve the main story question or adventure
   ✓ Give the reader a sense of accomplishment
   ✓ Tie back to the beginning (full circle)
   ✓ Leave the reader feeling happy and satisfied

2. EMOTIONAL IMPACT:
   ✓ Include a moment of wonder or joy
   ✓ Celebrate the reader's choices and bravery
   ✓ Positive, uplifting tone
   ✓ Age-appropriate emotional depth

3. WRITING QUALITY:
   ✓ Follow ALL grammar and formatting rules
   ✓ Start every sentence with a capital letter
   ✓ No duplicate words
   ✓ Use "he/she" or names for characters (not "it")
   ✓ Include sensory details (colors, sounds, feelings)

4. LENGTH:
   ✓ Write ${ageGuidelines.endingSentenceCount} sentences
   ✓ Total: ${ageGuidelines.endingWords} words

5. CLOSING:
   ✓ End with "The End" on a new line
   ✓ Optional: Add a moral or lesson (subtle, not preachy)
   ✓ Make the reader want to create another story

TONE: ${ageGuidelines.endingTone}

Now write the ending:`;
}

/**
 * Get age-specific writing guidelines
 */
function getAgeSpecificGuidelines(ageGroup: string): {
  maxWords: number;
  minWords: number;
  sentenceCount: number;
  endingSentenceCount: number;
  endingWords: number;
  tone: string;
  guidelines: string;
  endingTone: string;
} {
  const guidelines: Record<string, any> = {
    '4-6': {
      maxWords: 10,
      minWords: 80,
      sentenceCount: 6,
      endingSentenceCount: 4,
      endingWords: 60,
      tone: 'Warm, playful, and encouraging. Use simple, joyful language.',
      endingTone: 'Warm and celebratory, like a bedtime story ending',
      guidelines: `- Use very simple words (cat, dog, run, jump, happy, sad)
- Short sentences (5-10 words maximum)
- Lots of repetition and rhythm
- Include sounds (meow, woof, splash)
- Focus on concrete, visible actions
- Bright, cheerful descriptions
- Simple emotions (happy, sad, excited, scared)`
    },
    '7-9': {
      maxWords: 15,
      minWords: 120,
      sentenceCount: 7,
      endingSentenceCount: 5,
      endingWords: 80,
      tone: 'Engaging and adventurous. Use descriptive but accessible language.',
      endingTone: 'Satisfying and encouraging, with a sense of achievement',
      guidelines: `- Use elementary vocabulary with some challenging words
- Sentences can be 8-15 words
- More complex sentence structures
- Include dialogue and character thoughts
- Descriptive language (sparkling, mysterious, ancient)
- Moderate emotional complexity
- Simple cause-and-effect relationships`
    },
    '10-12': {
      maxWords: 20,
      minWords: 150,
      sentenceCount: 8,
      endingSentenceCount: 6,
      endingWords: 100,
      tone: 'Sophisticated and immersive. Use rich vocabulary and varied sentence structure.',
      endingTone: 'Meaningful and thought-provoking, with emotional depth',
      guidelines: `- Use intermediate vocabulary with context clues
- Sentences can be 10-20 words
- Complex sentence structures (compound, complex)
- Rich dialogue and internal monologue
- Vivid sensory descriptions
- Nuanced emotions and motivations
- Multiple plot threads can be introduced`
    },
    '13+': {
      maxWords: 25,
      minWords: 180,
      sentenceCount: 9,
      endingSentenceCount: 7,
      endingWords: 120,
      tone: 'Mature and compelling. Use advanced vocabulary and literary techniques.',
      endingTone: 'Impactful and resonant, with thematic depth',
      guidelines: `- Use advanced vocabulary and literary devices
- Sentences can be 12-25 words
- Sophisticated sentence structures
- Deep character development
- Layered descriptions and symbolism
- Complex emotions and moral dilemmas
- Subtext and thematic elements`
    }
  };
  
  return guidelines[ageGroup] || guidelines['7-9'];
}

/**
 * @deprecated Use PromptTemplateManager.generateImagePrompt() from supabase/functions/_shared/prompt-templates.ts instead
 * This function is kept for backward compatibility but is no longer used in the codebase.
 * The centralized version is optimized for Google Gemini 2.5 Flash Image (Nano-banana).
 *
 * Generate prompt for image generation (DALL-E/Stable Diffusion)
 */
export function generateImagePrompt(
  storySegment: string,
  ageGroup: string,
  genre: string,
  characterDescription?: string
): string {
  const style = getImageStyleForAge(ageGroup);

  return `Create a children's book illustration in ${style} style.

SCENE DESCRIPTION:
${storySegment}

${characterDescription ? `CHARACTER: ${characterDescription}` : ''}

STYLE REQUIREMENTS:
- ${style} illustration style
- Warm, inviting colors
- Soft edges and gentle lighting
- Age-appropriate for ${ageGroup} year-olds
- ${genre} genre aesthetic
- Professional children's book quality

SAFETY:
- NO scary or frightening elements
- NO inappropriate content
- Child-friendly and welcoming
- Positive, uplifting mood

COMPOSITION:
- Clear focal point (main character or action)
- Balanced composition
- Appropriate depth and perspective
- Engaging and visually appealing`;
}

/**
 * Get image style based on age group
 */
function getImageStyleForAge(ageGroup: string): string {
  const styles: Record<string, string> = {
    '4-6': 'soft watercolor, bright and cheerful',
    '7-9': 'detailed digital painting, vibrant and adventurous',
    '10-12': 'semi-realistic illustration, rich and atmospheric',
    '13+': 'sophisticated digital art, cinematic and immersive'
  };
  
  return styles[ageGroup] || styles['7-9'];
}

