export interface UserCharacter {
  id: string;
  user_id: string;
  name: string;
  description: string;
  character_type: string;
  personality_traits: string[];
  backstory?: string;
  image_url?: string;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface StorySeed {
  id: string;
  title: string;
  description: string;
}

export interface StoryCreationFlow {
  step: number;
  ageGroup?: string;
  genres: string[];
  selectedCharacters: UserCharacter[];
  selectedSeed?: StorySeed;
  customSeed?: string;
}

// Default characters for new users
export const DEFAULT_CHARACTERS = [
  {
    name: 'Brave Knight',
    description: 'A courageous knight with shining armor and a noble heart',
    character_type: 'human',
    personality_traits: ['brave', 'loyal', 'determined'],
    backstory: 'Trained since childhood to protect the innocent'
  },
  {
    name: 'Wise Owl',
    description: 'An ancient owl with vast knowledge and mystical powers',
    character_type: 'animal',
    personality_traits: ['wise', 'patient', 'mysterious'],
    backstory: 'Guardian of ancient secrets in the enchanted forest'
  },
  {
    name: 'Curious Cat',
    description: 'A playful cat who loves exploring and getting into adventures',
    character_type: 'animal',
    personality_traits: ['curious', 'playful', 'clever'],
    backstory: 'Always finding hidden passages and secret treasures'
  },
  {
    name: 'Magical Unicorn',
    description: 'A beautiful unicorn with healing powers and rainbow magic',
    character_type: 'magical',
    personality_traits: ['gentle', 'healing', 'pure'],
    backstory: 'Last unicorn of the Crystal Valley'
  },
  {
    name: 'Friendly Dragon',
    description: 'A kind dragon who breathes colorful bubbles instead of fire',
    character_type: 'dragon',
    personality_traits: ['friendly', 'creative', 'protective'],
    backstory: 'Protector of the village and friend to all children'
  },
  {
    name: 'Space Explorer',
    description: 'A young astronaut discovering new planets and alien friends',
    character_type: 'human',
    personality_traits: ['adventurous', 'scientific', 'brave'],
    backstory: 'Dreams of exploring the galaxy and making first contact'
  }
];