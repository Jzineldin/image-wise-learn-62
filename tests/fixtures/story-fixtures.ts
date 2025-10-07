export interface StoryGenerationFixture {
  id: string;
  ageGroup: 'toddlers' | 'children' | 'teens' | 'young-adults';
  genre: string;
  seed: string;
  characters: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  expectedProtagonists: string[];
  expectedContentPatterns: string[];
  inappropriateContentTriggers?: string[];
  language?: 'en' | 'sv';
}

export interface StorySegmentFixture {
  id: string;
  storyId: string;
  segmentNumber: number;
  content: string;
  choices?: Array<{
    text: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  imagePrompt?: string;
}

export interface StoryValidationFixture {
  id: string;
  content: string;
  expectedValidation: {
    hasNarrativeStructure: boolean;
    hasCharacterConsistency: boolean;
    hasAppropriateLength: boolean;
    hasGrammarQuality: boolean;
    ageAppropriate: boolean;
    languageCorrect: boolean;
  };
  metadata: {
    wordCount: number;
    readingLevel: number;
    sentimentScore: number;
  };
}

// Age group specific fixtures
export const AGE_GROUP_FIXTURES: StoryGenerationFixture[] = [
  {
    id: 'toddler-friendly-dragon',
    ageGroup: 'toddlers',
    genre: 'fantasy',
    seed: 'A friendly dragon who loves to play and make friends',
    characters: [
      {
        name: 'Sparkle',
        type: 'dragon',
        description: 'A small, friendly dragon with rainbow scales'
      },
      {
        name: 'Timmy',
        type: 'human',
        description: 'A curious 4-year-old boy'
      }
    ],
    expectedProtagonists: ['sparkle', 'timmy'],
    expectedContentPatterns: [
      'play',
      'friend',
      'happy',
      'gentle',
      'soft',
      'kind'
    ],
    inappropriateContentTriggers: [
      'scary',
      'dark',
      'fight',
      'monster',
      'dangerous'
    ]
  },
  {
    id: 'children-adventure-knight',
    ageGroup: 'children',
    genre: 'adventure',
    seed: 'A brave knight on a quest to find a lost treasure',
    characters: [
      {
        name: 'Sir Gallant',
        type: 'human',
        description: 'A brave knight with shining armor'
      },
      {
        name: 'Maple',
        type: 'animal',
        description: 'A clever squirrel guide'
      }
    ],
    expectedProtagonists: ['sir gallant', 'gallant', 'maple'],
    expectedContentPatterns: [
      'quest',
      'treasure',
      'adventure',
      'brave',
      'clever',
      'explore'
    ],
    inappropriateContentTriggers: [
      'violence',
      'blood',
      'death',
      'fear',
      'nightmare'
    ]
  },
  {
    id: 'teens-mystery-detective',
    ageGroup: 'teens',
    genre: 'mystery',
    seed: 'A teenage detective solving a school mystery',
    characters: [
      {
        name: 'Alex Rivera',
        type: 'human',
        description: 'A smart 14-year-old detective'
      },
      {
        name: 'Jordan',
        type: 'human',
        description: 'Alex\'s best friend and partner'
      }
    ],
    expectedProtagonists: ['alex', 'jordan'],
    expectedContentPatterns: [
      'mystery',
      'clue',
      'investigate',
      'solve',
      'secret',
      'puzzle'
    ],
    inappropriateContentTriggers: [
      'murder',
      'crime',
      'violence',
      'drugs',
      'alcohol'
    ]
  },
  {
    id: 'young-adults-sci-fi-explorer',
    ageGroup: 'young-adults',
    genre: 'sci-fi',
    seed: 'A young explorer discovering alien worlds',
    characters: [
      {
        name: 'Captain Zara',
        type: 'human',
        description: 'A determined space explorer'
      },
      {
        name: 'Nova',
        type: 'alien',
        description: 'A friendly alien companion'
      }
    ],
    expectedProtagonists: ['zara', 'nova'],
    expectedContentPatterns: [
      'space',
      'explore',
      'discovery',
      'alien',
      'technology',
      'adventure'
    ]
  }
];

// Swedish language fixtures
export const SWEDISH_FIXTURES: StoryGenerationFixture[] = [
  {
    id: 'sv-toddler-friendly-dragon',
    ageGroup: 'toddlers',
    genre: 'fantasy',
    seed: 'En vänlig drake som älskar att leka och göra nya vänner',
    characters: [
      {
        name: 'Gnista',
        type: 'dragon',
        description: 'En liten vänlig drake med regnbågsskinn'
      },
      {
        name: 'Timmy',
        type: 'human',
        description: 'En nyfiken 4-åring'
      }
    ],
    expectedProtagonists: ['gnista', 'timmy'],
    expectedContentPatterns: [
      'leka',
      'vän',
      'glad',
      'snäll',
      'mjuk',
      'vänlig'
    ],
    language: 'sv'
  }
];

// Seed reproducibility fixtures
export const SEED_REPRODUCIBILITY_FIXTURES = [
  {
    seed: 'The magical forest adventure with talking animals',
    expectedConsistentElements: [
      'magical forest',
      'talking animals',
      'adventure'
    ]
  },
  {
    seed: 'A robot who learns about friendship',
    expectedConsistentElements: [
      'robot',
      'friendship',
      'learn'
    ]
  }
];

// Choice impact validation fixtures
export const CHOICE_IMPACT_FIXTURES = [
  {
    storyId: 'choice-test-1',
    initialSegment: 'You find a mysterious door in the forest.',
    choices: [
      {
        text: 'Open the door carefully',
        impact: 'high' as const,
        expectedOutcomes: ['discover', 'secret', 'safe']
      },
      {
        text: 'Knock first',
        impact: 'medium' as const,
        expectedOutcomes: ['friend', 'help', 'curious']
      },
      {
        text: 'Walk away',
        impact: 'low' as const,
        expectedOutcomes: ['continue', 'forest', 'wonder']
      }
    ]
  }
];

// Story validation fixtures
export const STORY_VALIDATION_FIXTURES: StoryValidationFixture[] = [
  {
    id: 'valid-toddler-story',
    content: `Once upon a time, there was a little bunny named Floppy. Floppy loved to hop around the meadow and play with his friends. One sunny day, Floppy found a shiny red apple. He shared it with his friend Squirrel. They played all day and had lots of fun. When it was time to go home, Floppy felt happy and tired. He snuggled in his cozy bed and dreamed sweet dreams.`,
    expectedValidation: {
      hasNarrativeStructure: true,
      hasCharacterConsistency: true,
      hasAppropriateLength: true,
      hasGrammarQuality: true,
      ageAppropriate: true,
      languageCorrect: true
    },
    metadata: {
      wordCount: 120,
      readingLevel: 1.2,
      sentimentScore: 0.8
    }
  },
  {
    id: 'invalid-inappropriate-content',
    content: `The dark knight fought the evil dragon. Blood spilled everywhere as they battled fiercely. The dragon breathed fire and the knight screamed in pain. Finally, the knight killed the dragon with his sword.`,
    expectedValidation: {
      hasNarrativeStructure: true,
      hasCharacterConsistency: true,
      hasAppropriateLength: true,
      hasGrammarQuality: true,
      ageAppropriate: false,
      languageCorrect: true
    },
    metadata: {
      wordCount: 65,
      readingLevel: 4.5,
      sentimentScore: -0.7
    }
  }
];

// API response mocks
export const API_MOCK_RESPONSES = {
  successfulStoryGeneration: {
    story_id: 'test-story-123',
    title: 'The Magical Adventure',
    segments: [
      {
        id: 'segment-1',
        content: 'Once upon a time in a magical forest...',
        choices: [
          { id: 'choice-1', text: 'Go left', impact_score: 0.8 },
          { id: 'choice-2', text: 'Go right', impact_score: 0.6 }
        ],
        image_url: 'https://example.com/image1.jpg'
      }
    ],
    metadata: {
      age_group: 'children',
      genre: 'fantasy',
      language: 'en',
      word_count: 250,
      generation_time_ms: 1500
    }
  },
  timeoutError: {
    error: 'Request timeout after 120 seconds',
    code: 'TIMEOUT_ERROR'
  },
  networkError: {
    error: 'Network connection failed',
    code: 'NETWORK_ERROR'
  },
  creditInsufficient: {
    error: 'Insufficient credits',
    code: 'INSUFFICIENT_CREDITS',
    required_credits: 10,
    available_credits: 5
  },
  invalidInput: {
    error: 'Invalid age group specified',
    code: 'VALIDATION_ERROR',
    field: 'age_group',
    allowed_values: ['toddlers', 'children', 'teens', 'young-adults']
  }
};

// Image generation mocks
export const IMAGE_MOCK_RESPONSES = {
  successfulGeneration: {
    image_url: 'https://example.com/generated-image.jpg',
    prompt: 'A friendly dragon with rainbow scales in a sunny meadow',
    generation_time_ms: 2000
  },
  failedGeneration: {
    error: 'Image generation failed',
    code: 'IMAGE_GENERATION_ERROR'
  }
};

// Credit system mocks
export const CREDIT_MOCK_RESPONSES = {
  sufficientCredits: {
    user_id: 'test-user-123',
    available_credits: 50,
    required_credits: 10,
    can_proceed: true
  },
  insufficientCredits: {
    user_id: 'test-user-123',
    available_credits: 5,
    required_credits: 10,
    can_proceed: false
  }
};