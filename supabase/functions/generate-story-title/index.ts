import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateTitleRequest {
  storyContent: string;
  ageGroup: string;
  genre: string;
  characters?: Array<{
    name: string;
    role: string;
  }>;
  currentTitle?: string;
}

interface TitleResponse {
  titles: string[];
  recommended: string;
  model_used: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const ovhToken = Deno.env.get('OVH_AI_ENDPOINTS_ACCESS_TOKEN');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { 
      storyContent,
      ageGroup, 
      genre, 
      characters = [],
      currentTitle
    }: GenerateTitleRequest = await req.json();

    console.log('Title generation request:', { 
      contentLength: storyContent.length,
      ageGroup, 
      genre,
      charactersCount: characters.length
    });

    // Build character context
    const characterNames = characters.map(char => char.name).join(', ');
    const mainCharacters = characters.filter(char => 
      char.role.toLowerCase().includes('main') || 
      char.role.toLowerCase().includes('protagonist')
    );

    const systemPrompt = `You are a creative title generator for children's stories. Generate engaging, age-appropriate titles that capture the essence of the story.

REQUIREMENTS:
1. Return ONLY valid JSON with exactly 5 title suggestions
2. Titles must be age-appropriate for ${ageGroup} audience
3. Reflect the ${genre} genre
4. Be memorable and engaging for children
5. Include keywords that hint at the story's adventure/theme
6. Avoid overly complex or lengthy titles
7. Consider the main characters and plot elements
8. Make titles that parents and children would find appealing`;

    const userPrompt = `Generate 5 creative titles for this ${genre} story for ${ageGroup} age group.

${characterNames ? `Main characters: ${characterNames}` : ''}

Story summary: ${storyContent.substring(0, 1000)}...

${currentTitle ? `Current title: "${currentTitle}" (suggest alternatives)` : ''}

Generate titles that are:
- Catchy and memorable
- Age-appropriate for ${ageGroup}
- Reflect the ${genre} theme
- Hint at the adventure or main plot
- Easy to remember and pronounce

Return format: { "titles": ["Title 1", "Title 2", ...], "recommended": "Title 1" }`;

    // Try GPT-4o first
    let response, data, titleData, model = 'gpt-4o';

    try {
      console.log('Attempting GPT-4o title generation...');
      
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 300,
          temperature: 0.9, // Higher creativity for titles
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "title_suggestions",
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
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`GPT-4o failed: ${response.status}`);
      }

      data = await response.json();
      titleData = JSON.parse(data.choices[0].message.content);
      
    } catch (error) {
      console.error('GPT-4o failed, trying OVH Llama fallback:', error.message);
      
      if (!ovhToken) {
        throw new Error('OVH token not available for fallback');
      }

      try {
        response = await fetch('https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ovhToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'Meta-Llama-3_3-70B-Instruct',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt + '\n\nReturn only valid JSON.' }
            ],
            max_tokens: 300,
            temperature: 0.9,
          }),
        });

        if (!response.ok) {
          throw new Error(`OVH Llama failed: ${response.status}`);
        }

        data = await response.json();
        const content = data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          titleData = JSON.parse(jsonMatch[0]);
          model = 'Meta-Llama-3_3-70B-Instruct';
        } else {
          throw new Error('No valid JSON found in OVH response');
        }
        
      } catch (fallbackError) {
        // Generate fallback titles based on content analysis
        console.error('Both AI services failed, generating fallback titles');
        titleData = generateFallbackTitles(storyContent, ageGroup, genre, characterNames);
        model = 'fallback-generator';
      }
    }

    // Validate and clean titles
    if (!titleData.titles || !Array.isArray(titleData.titles) || titleData.titles.length === 0) {
      titleData = generateFallbackTitles(storyContent, ageGroup, genre, characterNames);
      model = 'fallback-generator';
    }

    // Ensure we have exactly 5 titles
    while (titleData.titles.length < 5) {
      titleData.titles.push(`The ${genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure`);
    }
    titleData.titles = titleData.titles.slice(0, 5);

    // Set recommended if not present
    if (!titleData.recommended || !titleData.titles.includes(titleData.recommended)) {
      titleData.recommended = titleData.titles[0];
    }

    console.log('Titles generated successfully with model:', model);

    return new Response(JSON.stringify({ 
      ...titleData,
      model_used: model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-story-title function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Title generation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackTitles(storyContent: string, ageGroup: string, genre: string, characterNames: string): TitleResponse {
  const contentWords = storyContent.toLowerCase();
  
  // Extract key themes and elements
  const themes = {
    adventure: ['journey', 'quest', 'exploration', 'discovery'],
    magic: ['magic', 'magical', 'spell', 'wizard', 'enchanted'],
    friendship: ['friend', 'friendship', 'together', 'help'],
    mystery: ['mystery', 'secret', 'hidden', 'clue'],
    fantasy: ['dragon', 'unicorn', 'fairy', 'castle', 'kingdom']
  };

  const foundThemes = [];
  for (const [theme, words] of Object.entries(themes)) {
    if (words.some(word => contentWords.includes(word))) {
      foundThemes.push(theme);
    }
  }

  const mainCharacter = characterNames.split(',')[0]?.trim() || 'Hero';
  const genreCap = genre.charAt(0).toUpperCase() + genre.slice(1);

  const titles = [
    `${mainCharacter}'s ${genreCap} Adventure`,
    `The ${foundThemes[0] ? foundThemes[0].charAt(0).toUpperCase() + foundThemes[0].slice(1) : 'Great'} Quest`,
    `${mainCharacter} and the ${genreCap} Mystery`,
    `The Secret of ${mainCharacter}`,
    `${mainCharacter}'s Magical Journey`
  ];

  return {
    titles,
    recommended: titles[0],
    model_used: 'fallback-generator'
  };
}