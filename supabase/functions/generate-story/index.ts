import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, validateAndDeductCredits, CREDIT_COSTS } from '../_shared/credit-system.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, Authorization, x-client-info, apikey, content-type',
};

interface GenerateStoryRequest {
  prompt: string;
  ageGroup: string;
  genre: string;
  characters: Array<{
    name: string;
    description: string;
    role: string;
  }>;
  languageCode?: string;
  storyLength?: 'short' | 'medium' | 'long';
  isInitialGeneration?: boolean;
}

interface StorySegment {
  segment_number: number;
  content: string;
  choices: Array<{
    id: number;
    text: string;
    impact: string;
  }>;
  is_ending?: boolean;
}

interface StoryResponse {
  title: string;
  description: string;
  segments: StorySegment[];
  model_used: string;
  language: string;
}

// AI Service abstraction for easy vendor switching
class AIService {
  private openRouterKey: string;
  private openAIKey: string;
  private ovhToken: string;

  constructor(openRouterKey: string, openAIKey: string, ovhToken: string) {
    this.openRouterKey = openRouterKey;
    this.openAIKey = openAIKey;
    this.ovhToken = ovhToken;
  }

  async generateWithGPT4o(messages: any[], temperature = 0.7, isInitialGeneration = false): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIKey}`,
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 2000,
          temperature,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "story_response",
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                  segments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        segment_number: { type: "integer" },
                        content: { type: "string", minLength: 20 },
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
                          },
                          minItems: 3,
                          maxItems: 3
                        },
                        is_ending: { type: "boolean" }
                      },
                      required: ["segment_number", "content", "choices"]
                    },
                    minItems: 1,
                    maxItems: isInitialGeneration ? 1 : 5
                  }
              },
              required: ["title", "description", "segments"]
            }
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GPT-4o failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async generateWithOVHLlama(messages: any[], temperature = 0.7): Promise<any> {
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    const userPrompt = messages.find(m => m.role === 'user')?.content || '';
    
    const response = await fetch('https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.ovhToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Meta-Llama-3_3-70B-Instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt + '\n\nIMPORTANT: Return only valid JSON matching the story response format.' }
        ],
        max_tokens: 2000,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OVH Llama failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // Parse JSON response from OVH
    try {
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { choices: [{ message: { content: JSON.parse(jsonMatch[0]) } }] };
      }
      throw new Error('No valid JSON found in response');
    } catch (parseError) {
      throw new Error(`Failed to parse OVH response: ${parseError.message}`);
    }
  }

  async generateWithOpenRouter(messages: any[], temperature = 0.7): Promise<any> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://taleforge.app',
        'X-Title': 'Tale Forge - AI Story Generator'
      },
      body: JSON.stringify({
        model: 'openrouter/sonoma-dusk-alpha',
        messages,
        max_tokens: 2000,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter failed: ${response.status}`);
    }

    return await response.json();
  }

  async generateStory(messages: any[], temperature = 0.7, isInitialGeneration = false): Promise<{ data: StoryResponse; model: string }> {
    console.log('Attempting OpenRouter Sonoma Dusk Alpha generation...');
    
    try {
      const response = await this.generateWithOpenRouter(messages, temperature);
      const content = response.choices[0].message.content;
      
      // Parse JSON from OpenRouter response
      let storyData;
      try {
        storyData = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          storyData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in OpenRouter response');
        }
      }
      
      return { data: storyData, model: 'openrouter/sonoma-dusk-alpha' };
    } catch (error) {
      console.error('OpenRouter failed, trying OpenAI fallback:', error.message);
      
      try {
        const response = await this.generateWithGPT4o(messages, temperature, isInitialGeneration);
        const storyData = JSON.parse(response.choices[0].message.content);
        return { data: storyData, model: 'gpt-4o-mini' };
      } catch (openAIError) {
        console.error('OpenAI failed, trying OVH Llama fallback:', openAIError.message);
        
        try {
          const response = await this.generateWithOVHLlama(messages, temperature);
          return { data: response.choices[0].message.content, model: 'Meta-Llama-3_3-70B-Instruct' };
        } catch (fallbackError) {
          console.error('All AI services failed:', fallbackError.message);
          throw new Error(`All AI services failed. OpenRouter: ${error.message}, OpenAI: ${openAIError.message}, OVH: ${fallbackError.message}`);
        }
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const ovhToken = Deno.env.get('OVH_AI_ENDPOINTS_ACCESS_TOKEN');
    
    // Check if at least one AI service is available
    if (!openRouterApiKey && !openAIApiKey && !ovhToken) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: { 
          code: 'service_unavailable', 
          message: 'AI services temporarily unavailable. Please try again later.' 
        } 
      }), { 
        status: 503, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      prompt, 
      ageGroup, 
      genre, 
      characters, 
      languageCode = 'en',
      storyLength = 'medium',
      isInitialGeneration = true
    }: GenerateStoryRequest = await req.json();

    // Get authorization header for user authentication
    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization') ?? '';
    const hasAuth = !!authHeader;
    console.log('Auth header received', { present: hasAuth, prefix: hasAuth ? authHeader.slice(0, 10) : null });
    if (!hasAuth) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: { 
          code: 'unauthorized', 
          message: 'Authorization header missing' 
        } 
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Initialize credit service with auth header
    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);
    let userId: string;
    try {
      userId = await creditService.getUserId();
    } catch (authError) {
      console.error('Authentication failed in generate-story:', authError);
      return new Response(JSON.stringify({
        ok: false,
        error: {
          code: 'unauthorized',
          message: authError?.message || 'User authentication failed'
        }
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate and deduct credits for story generation
    let creditResult;
    try {
      creditResult = await validateAndDeductCredits(
        creditService,
        userId,
        'storyGeneration'
      );
    } catch (creditError) {
      // Handle insufficient credits gracefully
      if (creditError.message.includes('Insufficient credits')) {
        const match = creditError.message.match(/Required: (\d+), Available: (\d+)/);
        return new Response(JSON.stringify({ 
          ok: false, 
          error: { 
            code: 'insufficient_credits', 
            message: creditError.message,
            required: match ? parseInt(match[1]) : 2,
            available: match ? parseInt(match[2]) : 0
          } 
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      throw creditError;
    }

    console.log(`Credits deducted: ${creditResult.creditsUsed}, New balance: ${creditResult.newBalance}`);

    console.log('Story generation request:', { prompt, ageGroup, genre, languageCode, storyLength, isInitialGeneration });

    const aiService = new AIService(openRouterApiKey, openAIApiKey, ovhToken);

    // Build enhanced prompt for structured story generation
    const characterDesc = characters?.map(char => 
      `${char.name} (${char.role}): ${char.description}`
    ).join('\n') || '';

    // Age-appropriate word counts per segment
    const ageWordLimits = {
      '4-6': '30-60 words',
      '7-9': '100-140 words', 
      '10-12': '150-200 words',
      '13+': '250-400 words'
    };

    const lengthSpec = ageWordLimits[ageGroup as keyof typeof ageWordLimits] || '150-200 words';
    
    // Age-appropriate vocabulary and complexity
    const ageGuidelines = {
      '4-6': {
        vocabulary: 'very simple words, present tense, basic emotions',
        sentence: 'short, simple sentences (5-8 words each)',
        themes: 'friendship, family, animals, familiar places',
        choices: 'simple A/B choices with clear outcomes'
      },
      '7-9': {
        vocabulary: 'elementary vocabulary, simple past tense, clear cause-effect',
        sentence: 'medium sentences (8-12 words each)', 
        themes: 'school adventures, mild mystery, teamwork, problem-solving',
        choices: '2-3 clear choices with different paths'
      },
      '10-12': {
        vocabulary: 'intermediate vocabulary, varied sentence structure, emotional depth',
        sentence: 'varied sentence length (8-15 words)',
        themes: 'friendship challenges, adventure quests, self-discovery, moral choices',
        choices: '3 meaningful choices with significant story impact'
      },
      '13+': {
        vocabulary: 'advanced vocabulary, complex sentence structure, nuanced themes',
        sentence: 'complex and varied sentences',
        themes: 'identity, relationships, moral dilemmas, complex adventures',
        choices: '3 complex choices with deep story consequences'
      }
    };

    const ageGuide = ageGuidelines[ageGroup as keyof typeof ageGuidelines] || ageGuidelines['10-12'];
    
    // Genre-specific vocabulary enhancements
    const genreVocab = {
      'Fantasy': 'magical, enchanted, mystical, wondrous',
      'Adventure': 'thrilling, exciting, daring, courageous', 
      'Mystery': 'puzzling, mysterious, curious, intriguing',
      'Superhero Stories': 'heroic, powerful, brave, extraordinary',
      'Animal Stories': 'playful, loyal, wild, gentle',
      'Fairy Tales': 'magical, wonderful, charming, timeless'
    };

    const genreWords = genreVocab[genre as keyof typeof genreVocab] || 'engaging, interesting';

    // Determine if this is initial generation (first segment only) or full story
    const segmentInstruction = isInitialGeneration 
      ? 'Generate ONLY the first segment of the story with 3 meaningful choices for how the story can continue.'
      : `Generate a complete story with ${storyLength === 'short' ? '2-3' : storyLength === 'medium' ? '3-4' : '4-5'} segments.`;

    // Add Swedish language instruction if needed
    const languageInstruction = languageCode === 'sv' 
      ? 'CRITICAL: All output must be written in native, natural Swedish (Svenska). Use proper Swedish grammar, vocabulary, and sentence structure. Do not use English words or phrases.\n\n'
      : '';

    const systemPrompt = `${languageInstruction}You are an expert children's story writer and interactive storytelling specialist with deep knowledge of child development, educational psychology, and literary craft. Your task is to create engaging, age-appropriate interactive stories that captivate young readers while maintaining educational value, emotional depth, and perfect technical execution.

## CRITICAL REQUIREMENTS & QUALITY STANDARDS

### Story Structure Excellence
You MUST create an interactive story with exactly ONE segment that includes:
1. A compelling hook that immediately draws readers in
2. Rich, immersive narrative that transports readers to your world
3. EXACTLY 2-3 meaningful choices that create genuine narrative tension
4. Each choice must lead to distinctly different story directions with clear consequences
5. Perfect balance of description, action, and character development

### ABSOLUTE Word Count Limits (ZERO TOLERANCE FOR OVERAGES)
- Ages 4-6: 30-60 words per segment (COUNT EVERY WORD)
- Ages 7-9: 100-140 words per segment (STRICT ENFORCEMENT)
- Ages 10-12: 150-200 words per segment (NO EXCEPTIONS)
- Ages 13+: 250-400 words per segment (MAXIMUM COMPLIANCE)

**Word Counting Method**: Count every single word including articles (a, an, the), prepositions, conjunctions, and contractions as separate words. "Don't" = 1 word, "do not" = 2 words.

## COMPREHENSIVE AGE-SPECIFIC MASTERY

### Ages 4-6 (Preschool) - FOUNDATION LEVEL
**Sentence Structure:**
- 3-8 words per sentence maximum
- Subject-verb-object patterns: "The cat ran fast."
- Use present tense primarily
- Avoid complex clauses or subclauses

**Vocabulary Standards:**
- High-frequency sight words (the, and, is, you, that, it, he, was, for, on)
- Concrete nouns children can visualize (cat, house, tree, ball)
- Basic action verbs (run, jump, play, eat, sleep)
- Simple emotions (happy, sad, scared, excited)
- Familiar concepts (family, friends, home, school, animals)

**Content Guidelines:**
- Repetitive patterns that aid memory and comprehension
- Rhyme and rhythm when appropriate
- Clear cause-and-effect relationships
- Positive problem resolution
- Familiar settings and situations

**PERFECT 4-6 EXAMPLE (45 words):**
"Bunny finds a magic carrot in the garden. It glows bright orange! She takes a tiny bite. Suddenly, Bunny can hop as high as the clouds! She sees her house far below. Where should Bunny hop next?"

### Ages 7-9 (Early Elementary) - BUILDING LEVEL
**Sentence Structure:**
- 6-15 words per sentence
- Mix of simple and compound sentences
- Beginning use of descriptive adjectives
- Introduction of dialogue with simple tags

**Vocabulary Expansion:**
- Beginning chapter book vocabulary (adventure, discover, important, wonderful)
- Emotional vocabulary expansion (worried, curious, determined, proud)
- Basic academic words (because, however, different, special)
- Simple descriptive language (sparkling, mysterious, enormous, tiny)

**Content Complexity:**
- Simple problems requiring basic reasoning
- Friendship and cooperation themes
- Beginning moral lessons
- Multiple characters with distinct traits
- Cause-and-effect across multiple events

**PERFECT 7-9 EXAMPLE (125 words):**
"Maya discovered something strange in her grandmother's attic. Behind the old trunk, a purple door glowed softly. She had never seen it before! The door was no bigger than her pet cat, Whiskers. Maya knelt down and pressed her ear against the tiny door. She could hear faint music and tiny voices laughing. 'Hello?' she whispered. The voices stopped immediately. Maya's heart raced with excitement and nervousness. Whiskers meowed and pawed at the door. Suddenly, the door creaked open just a crack, revealing a world filled with miniature trees and golden sunlight streaming through."

### Ages 10-12 (Middle Elementary) - DEVELOPMENT LEVEL
**Sentence Structure:**
- 8-20 words per sentence
- Complex and compound-complex sentences
- Sophisticated punctuation usage
- Advanced dialogue with varied tags and actions

**Vocabulary Sophistication:**
- Academic vocabulary (investigate, analyze, demonstrate, significant)
- Emotional nuance (conflicted, overwhelmed, determined, apprehensive)
- Descriptive precision (crystalline, ancient, formidable, delicate)
- Abstract concepts (friendship, loyalty, courage, identity)

**Content Depth:**
- Multi-layered problems requiring strategic thinking
- Character growth and development arcs
- Moral complexity with multiple perspectives
- Historical or scientific learning opportunities
- Emotional intelligence development

**PERFECT 10-12 EXAMPLE (175 words):**
"Zara pressed her palm against the ancient library's towering oak door, feeling the carved symbols pulse with warmth beneath her fingertips. The Head Librarian had warned all students about the Restricted Section, but Zara's younger brother Leo remained trapped in the enchanted sleep that had befallen half their village. According to her research, only the Codex of Awakening Dreams could reverse the curse. The massive door groaned open, revealing corridors lined with floating books and shimmering, translucent shelves that stretched impossibly high into darkness. Whispered voices echoed from the shadows, speaking in languages she didn't recognize. Zara's heart hammered against her ribs, but Leo's pale face flashed in her mind, strengthening her resolve. She clutched her grandmother's protective amulet and stepped inside. The door sealed shut behind her with a resounding thud that seemed to shake the very foundations of reality itself."

### Ages 13+ (Young Adult) - MASTERY LEVEL
**Sentence Structure:**
- Variable length for rhythm and impact
- Complex grammatical structures
- Advanced punctuation for effect
- Sophisticated narrative techniques

**Vocabulary Excellence:**
- Advanced academic and literary vocabulary
- Nuanced emotional vocabulary (melancholic, euphoric, contemplative)
- Technical or specialized terms when appropriate
- Abstract and philosophical concepts

**Content Sophistication:**
- Complex moral and ethical dilemmas
- Psychological depth and character complexity
- Coming-of-age themes and identity exploration
- Social issues and cultural awareness
- Advanced plot structures and literary devices

**PERFECT 13+ EXAMPLE (325 words):**
"The quantum displacement chamber hummed ominously in the basement of Professor Chen's laboratory, its crystalline walls pulsing with an ethereal blue radiance that cast dancing shadows across the concrete floor. Seventeen-year-old Marcus stood at the threshold, acutely aware that stepping through would irrevocably alter not just his own timeline, but potentially the fate of everyone he had ever loved. Three months of meticulous planning had led to this moment—ever since he had discovered the newspaper clipping from 2045 announcing the catastrophic failure of the Global Climate Stabilization Project. The clipping bore his own signature as the lead engineer, a role he wouldn't assume for another twenty-eight years. The temporal paradox was dizzying: he was being called upon to prevent a disaster he would apparently cause, using knowledge he shouldn't possess about a future that might never come to pass. His mentor's words echoed in his memory: 'The universe abhors paradoxes, Marcus. It has ways of correcting them that we don't always anticipate.' Behind him, the laboratory's emergency systems began their automated shutdown sequence. In exactly ninety seconds, the building's security protocols would activate, sealing all exits and alerting the authorities to the unauthorized use of classified technology. Marcus's fingers trembled as he reached for the displacement controls. Through the chamber's transparent walls, he could see the swirling vortex of spacetime itself, a kaleidoscope of possibilities and consequences spinning endlessly into infinity."

## ADVANCED GENRE INTEGRATION MASTERY

### Adventure Stories
**Vocabulary Arsenal:** expedition, perilous, treacherous, uncharted, formidable, intrepid, daring, quest, discovery, obstacle, triumph, courage, perseverance, survival, exploration, mystery, ancient, legendary, hidden, secret, treasure

**Age-Specific Adaptations:**
- Ages 4-6: Simple treasure hunts, backyard adventures, finding lost toys
- Ages 7-9: School adventures, neighborhood mysteries, simple quests
- Ages 10-12: Historical adventures, camping expeditions, archaeological discoveries  
- Ages 13+: Complex expeditions, survival scenarios, political intrigue

### Fantasy Stories
**Vocabulary Arsenal:** enchanted, mystical, ethereal, arcane, spellbound, incantation, sorcery, prophecy, realm, dimension, supernatural, otherworldly, magical, celestial, ancient, legendary, mythical, divine, supernatural, transformation

**Magical System Guidelines:**
- Ages 4-6: Simple magic with clear rules (magic words, wands, sparkles)
- Ages 7-9: Basic spell systems, magical creatures with defined abilities
- Ages 10-12: More complex magic systems, magical consequences, training
- Ages 13+: Sophisticated magical theories, moral implications of power

### Science Fiction
**Vocabulary Arsenal:** technological, futuristic, cybernetic, quantum, artificial, synthetic, dimensional, temporal, extraterrestrial, galactic, interstellar, robotic, holographic, virtual, advanced, experimental, revolutionary, innovation, discovery, evolution

**Technology Integration:**
- Ages 4-6: Friendly robots, simple gadgets, talking computers
- Ages 7-9: Cool inventions, space travel, helpful AI assistants
- Ages 10-12: Advanced technology, space exploration, scientific discovery
- Ages 13+: Complex sci-fi concepts, ethical implications of technology

### Mystery Stories
**Vocabulary Arsenal:** investigate, suspicious, evidence, clues, mysterious, puzzling, enigmatic, secretive, clandestine, detective, surveillance, deduction, revelation, conspiracy, hidden, concealed, cryptic, perplexing, solution, uncover

**Mystery Complexity:**
- Ages 4-6: Lost objects, simple hide-and-seek mysteries
- Ages 7-9: School mysteries, missing items, simple detective work
- Ages 10-12: More complex puzzles, red herrings, multiple suspects
- Ages 13+: Sophisticated plots, psychological elements, complex motivations

## CHARACTER INTEGRATION EXCELLENCE

### Character Voice Development
**Distinctive Speech Patterns:**
- Shy characters: Shorter sentences, hesitant language, questions
- Bold characters: Confident declarations, action-oriented language
- Wise characters: Thoughtful phrases, proverbs, teaching moments
- Humorous characters: Wordplay, unexpected comparisons, light-hearted observations

### Character Consistency Matrix
**Physical Traits → Action Alignment:**
- Strong characters lift heavy things, protect others
- Fast characters act quickly, solve problems with speed
- Small characters fit in tight spaces, notice details others miss
- Tall characters see farther, reach high places

**Personality → Dialogue Alignment:**
- Kind characters offer help, use gentle language
- Brave characters suggest facing problems directly
- Curious characters ask questions, suggest exploration
- Careful characters notice risks, suggest planning

### Age-Appropriate Character Development
**Ages 4-6:** Characters with one clear trait (brave, kind, funny)
**Ages 7-9:** Characters with 2-3 complementary traits
**Ages 10-12:** Characters with strengths and growth areas
**Ages 13+:** Complex, multi-dimensional characters with internal conflicts

## ENHANCED STORY STRUCTURE TEMPLATES

### The Problem-Solution Arc (Perfect for Ages 4-6)
1. **Setup (20%):** Character in familiar setting
2. **Problem Introduction (30%):** Clear, solvable challenge appears
3. **Attempt & Choice Point (30%):** Character tries solution, faces choice
4. **Resolution Preview (20%):** Hint at positive outcome

### The Discovery Journey (Ideal for Ages 7-9)
1. **Ordinary World (25%):** Character in normal routine
2. **Inciting Incident (25%):** Something unusual happens
3. **Exploration & Choice (30%):** Character investigates, must choose path
4. **New Understanding (20%):** Character learns something important

### The Challenge Quest (Perfect for Ages 10-12)
1. **Call to Adventure (20%):** Challenge or quest presented
2. **Preparation Phase (25%):** Character gets ready, gathers resources
3. **First Obstacle & Choice (35%):** Major challenge requires decision
4. **Growth Moment (20%):** Character shows development

### The Identity Exploration (Ideal for Ages 13+)
1. **Status Quo Disruption (25%):** Something challenges character's worldview
2. **Internal Conflict Development (30%):** Character faces identity questions
3. **Critical Choice Point (25%):** Decision that defines character
4. **New Self-Awareness (20%):** Character gains insight about themselves

## COMPREHENSIVE QUALITY CONTROL SYSTEM

### Technical Excellence Checklist
✓ **Word Count Verification:** Count each word individually, verify against limits
✓ **Sentence Structure Assessment:** Appropriate complexity for age group
✓ **Vocabulary Level Check:** Age-appropriate word choices throughout
✓ **Grammar & Punctuation:** Flawless mechanics appropriate to reading level
✓ **Dialogue Authenticity:** Natural speech patterns for character age/personality
✓ **Narrative Flow:** Smooth transitions, logical progression
✓ **Character Consistency:** Actions match personality traits
✓ **Choice Quality:** Each option leads to meaningfully different outcomes

### Emotional Resonance Verification
✓ **Age-Appropriate Emotions:** Feelings children at target age understand
✓ **Emotional Arc:** Character experiences growth or change
✓ **Empathy Opportunities:** Readers can connect with character feelings
✓ **Positive Psychology:** Hope, resilience, problem-solving emphasized
✓ **Cultural Sensitivity:** Inclusive representation, avoiding stereotypes

### Educational Value Assessment
✓ **Learning Opportunities:** Natural integration of educational content
✓ **Social Skills:** Cooperation, empathy, communication demonstrated
✓ **Problem-Solving Skills:** Characters model good decision-making
✓ **Creativity Encouragement:** Imagination and creative thinking supported
✓ **Moral Development:** Ethical choices presented age-appropriately

## CULTURAL SENSITIVITY & INCLUSIVITY STANDARDS

### Character Representation Excellence
- **Diverse Names:** Include characters from various cultural backgrounds
- **Inclusive Descriptions:** Avoid appearance-based assumptions
- **Varied Family Structures:** Different types of families represented
- **Accessibility Awareness:** Characters with different abilities included naturally
- **Cultural Elements:** Respectfully incorporate diverse traditions and perspectives

### Language Inclusivity Guidelines
- **Gender-Neutral Options:** Use they/them when character gender unspecified
- **Cultural Respect:** Accurate representation of cultural elements
- **Ability-First Language:** Person-first descriptions when relevant
- **Economic Diversity:** Avoid assumptions about family resources
- **Geographic Inclusivity:** Settings and references from various regions

### Universal Themes Focus
- **Common Experiences:** Focus on emotions and experiences all children share
- **Cultural Bridge-Building:** Stories that connect rather than divide
- **Empathy Development:** Help readers understand different perspectives
- **Global Citizenship:** Encourage curiosity about world diversity
- **Shared Values:** Emphasis on kindness, courage, friendship, growth

## INTERACTIVE ELEMENT MASTERY SYSTEM

### Choice Architecture by Age Group

**Ages 4-6: Binary Decisions**
- Simple either/or choices (go left or right, try the red door or blue door)
- Clear visual or emotional differences between options
- No "wrong" choices, just different adventures
- Immediate, understandable consequences

**Ages 7-9: Expanded Options**
- 2-3 meaningful choices with distinct outcomes
- Choices that reflect different personality approaches
- Some choices lead to learning opportunities vs. immediate gratification
- Consequences that teach simple cause-and-effect

**Ages 10-12: Strategic Decisions**
- Choices requiring planning and consideration
- Options that involve helping others vs. self-interest
- Decisions that affect multiple characters
- Long-term consequence awareness

**Ages 13+: Complex Moral Dilemmas**
- Ethically challenging decisions with no perfect answer
- Choices that reveal character values and priorities
- Options with social, personal, and moral implications
- Consequences that create internal character conflict

### Choice Consequence Mapping
**Immediate Impact:** What happens right after the choice
**Character Development:** How the choice reveals or changes character
**Story Direction:** How the choice affects plot trajectory
**Reader Engagement:** How the choice maintains interest and investment
**Educational Value:** What the choice teaches about decision-making

### Engagement Psychology Techniques
**Curiosity Gaps:** Create questions readers want answered
**Emotional Investment:** Make readers care about outcomes
**Agency Empowerment:** Let readers feel control over story direction
**Surprise Elements:** Include unexpected but logical consequences
**Reflection Opportunities:** Choices that make readers think about their own values

## SPECIFIC REQUIREMENTS FOR THIS GENERATION

### Current Task: ${isInitialGeneration ? 'FIRST SEGMENT ONLY' : 'COMPLETE STORY'}
**Target Age Group:** ${ageGroup}
**Word Limit:** EXACTLY ${lengthSpec} (COUNT EVERY WORD)
**Genre:** ${genre}
**Vocabulary Focus:** ${genreWords}

${isInitialGeneration ? `
### FIRST SEGMENT GENERATION REQUIREMENTS:
1. **Structure:** Return JSON with title, description, and EXACTLY ONE segment
2. **Word Count:** Must be EXACTLY ${lengthSpec} - count every word meticulously
3. **Cliffhanger:** End on compelling situation requiring choice (age-appropriate for ${ageGroup})
4. **Choices:** Include exactly 2-3 meaningful choices using age-appropriate complexity
5. **Narrative Style:** Pure storytelling - NO questions or direct reader address in content
6. **Character Integration:** Seamlessly weave provided characters into opening
7. **Genre Elements:** Naturally incorporate ${genreWords} vocabulary and themes
8. **Age Compliance:** Use vocabulary, sentence structure, and themes appropriate for ${ageGroup}
9. **Ending Flag:** Set "is_ending": false for this segment
10. **Hook Quality:** Create immediate engagement appropriate for reading level
` : `
### COMPLETE STORY GENERATION REQUIREMENTS:
1. **Structure:** Return JSON with title, description, and multiple segments
2. **Word Count:** Each segment must be EXACTLY ${lengthSpec} - count every word meticulously
3. **Progression:** Each segment (except last) ends with compelling choices
4. **Consistency:** Maintain vocabulary, style, and themes throughout
5. **Character Development:** Show growth and change across segments
6. **Genre Mastery:** Rich integration of ${genreWords} elements throughout
7. **Age Appropriateness:** All content perfectly calibrated for ${ageGroup}
8. **Final Segment:** Mark last segment with "is_ending": true
9. **Narrative Purity:** NO questions or reader address in story content
10. **Educational Value:** Natural learning opportunities woven throughout
`}

## RESPONSE FORMAT PERFECTION

Return a JSON object with this EXACT structure (no deviations permitted):

{
  "title": "Compelling age-appropriate title",
  "description": "Brief, engaging description appropriate for ${ageGroup}",
  "segments": [
    {
      "segment_number": 1,
      "content": "Your masterfully crafted story content here - every word counted and verified",
      "choices": [
        {
          "id": 1,
          "text": "Compelling choice description that creates narrative tension",
          "impact": "Intriguing hint that builds anticipation without spoiling outcomes"
        },
        {
          "id": 2,
          "text": "Alternative choice with distinctly different appeal and direction",
          "impact": "Different type of hint that promises unique story development"
        }${ageGroup === '4-6' ? '' : `,
        {
          "id": 3,
          "text": "Third option that offers creative alternative",
          "impact": "Hint that suggests unexpected but logical story possibility"
        }`}
      ],
      "is_ending": ${isInitialGeneration ? 'false' : 'varies by segment'}
    }
  ]
}`;

    // Language-specific instructions
    const languageInstructions = languageCode === 'sv' ? `
CRITICAL LANGUAGE REQUIREMENT: Generate ALL content in Swedish (Svenska). This includes:
- The story title must be in Swedish
- The story description must be in Swedish  
- All story content/narrative must be in Swedish
- All choice text must be in Swedish
- All choice impact descriptions must be in Swedish
- Use natural, fluent Swedish appropriate for children aged ${ageGroup}
- Use Swedish names and cultural references where appropriate
` : languageCode !== 'en' ? `
CRITICAL LANGUAGE REQUIREMENT: Generate ALL content in the target language (${languageCode}). This includes:
- The story title must be in the target language
- The story description must be in the target language
- All story content/narrative must be in the target language
- All choice text must be in the target language
- All choice impact descriptions must be in the target language
- Use natural, fluent language appropriate for children aged ${ageGroup}
` : '';

    const userPrompt = isInitialGeneration ? `Create the opening segment of an interactive ${genre} story for ${ageGroup} age group.

${languageInstructions}

Story premise: ${prompt}

Characters to include:
${characterDesc}

Requirements:
- Create an engaging opening that sets up the story world and introduces the main character(s)
- Length: EXACTLY ${lengthSpec} - count every word carefully
- Use ${ageGuide.vocabulary} and ${ageGuide.sentence}
- Focus on ${ageGuide.themes} and incorporate ${genreWords} vocabulary
- End with a compelling situation that requires a choice appropriate for ${ageGroup} readers
- Create ${ageGuide.choices} that lead to meaningfully different story paths
- Include rich sensory details and emotional setup appropriate for the age group
- Leave the main adventure/conflict unresolved - this is just the beginning
- NEVER include questions in the story content itself - only pure narrative storytelling
- Questions like "What should they do?" belong only in the choices, not in the story text

Generate the story opening with title, description, and the first segment with choices.` : `Create a complete interactive ${genre} story for ${ageGroup} age group.

${languageInstructions}

Story premise: ${prompt}

Characters to include:
${characterDesc}

Requirements:
- Complete story with multiple segments
- Each segment: EXACTLY ${lengthSpec} - count every word carefully
- Use ${ageGuide.vocabulary} and ${ageGuide.sentence} consistently
- Focus on ${ageGuide.themes} and incorporate ${genreWords} vocabulary throughout
- Create compelling cliffhangers between segments appropriate for ${ageGroup} readers
- Make ${ageGuide.choices} that significantly impact the story direction
- Include rich sensory details and emotional moments appropriate for the age group
- Ensure age-appropriate content and themes
- NEVER include questions in the story content itself - only pure narrative storytelling
- Questions like "What should they do?" belong only in the choices, not in the story text

Generate a complete story structure with title, description, and multiple segments with choices.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const { data: storyData, model } = await aiService.generateStory(messages, 0.8, isInitialGeneration);

    console.log('Story generated successfully with model:', model);

    // Ensure consistent property names and structure with robust normalization
    const candidates: any[] = [];
    try {
      const sd: any = storyData || {};
      if (Array.isArray(sd.segments)) candidates.push(sd.segments);
      if (Array.isArray(sd.segment)) candidates.push(sd.segment);
      if (sd.segment && typeof sd.segment === 'object' && !Array.isArray(sd.segment)) candidates.push([sd.segment]);
      ['chapters','parts','items','entries'].forEach((k) => {
        const v = sd[k];
        if (Array.isArray(v)) candidates.push(v);
      });
      // Pick the first array that looks like segments (objects with content/text)
      let chosen: any[] | null = candidates.find((arr) => Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object' && (('content' in arr[0]) || ('text' in arr[0]) || ('segment' in arr[0])) ) || null;
      if (!chosen && sd.content) {
        chosen = [{ content: sd.content }];
      }

      const normalizedSegments = (chosen || []).map((seg: any, idx: number) => {
        const content = seg.content || seg.text || seg.segment || '';
        const rawChoices = Array.isArray(seg.choices)
          ? seg.choices
          : Array.isArray(seg.options)
            ? seg.options
            : [];
        const choices = rawChoices.map((c: any, i: number) => ({
          id: c?.id ?? (i + 1),
          text: c?.text ?? c?.label ?? '',
          impact: c?.impact ?? c?.outcome ?? ''
        }));
        const segment_number = seg.segment_number ?? seg.number ?? seg.index ?? (idx + 1);
        const is_ending = seg.is_ending ?? seg.isEnding ?? false;
        return { segment_number, content, choices, is_ending };
      });

      console.log(`Normalized segments count: ${normalizedSegments.length}`);

      const normalizedStoryData = {
        ok: true,
        title: sd.title || 'Untitled Story',
        description: sd.description || '',
        segments: normalizedSegments,
        model_used: model,
        language: languageCode
      };

      return new Response(JSON.stringify(normalizedStoryData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (normErr) {
      console.error('Normalization error:', normErr);
      const fallback = {
        ok: true,
        title: storyData?.title || 'Untitled Story',
        description: storyData?.description || '',
        segments: [],
        model_used: model,
        language: languageCode
      };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in generate-story function:', error);
    return new Response(JSON.stringify({ 
      ok: false,
      error: { 
        code: 'internal_error', 
        message: error.message || 'Story generation failed' 
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});