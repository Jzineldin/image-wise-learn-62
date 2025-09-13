import { create } from 'zustand';
import { StoryCreationState, Character, Story } from '../types';

interface StoryState {
  // Story Creation Flow
  creationState: StoryCreationState;
  updateCreationState: (updates: Partial<StoryCreationState>) => void;
  resetCreationState: () => void;
  
  // Current Story
  currentStory: Story | null;
  setCurrentStory: (story: Story | null) => void;
  
  // Characters
  characters: Character[];
  addCharacter: (character: Character) => void;
  removeCharacter: (characterId: string) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  
  // Stories List
  stories: Story[];
  setStories: (stories: Story[]) => void;
  addStory: (story: Story) => void;
  updateStory: (storyId: string, updates: Partial<Story>) => void;
}

const initialCreationState: StoryCreationState = {
  step: 1,
  age_group: undefined,
  genres: [],
  characters: [],
  prompt: '',
  settings: {
    length: 'medium',
    language: 'en',
    voice_enabled: true,
    image_style: 'illustrated'
  }
};

export const useStoryStore = create<StoryState>((set, get) => ({
  // Story Creation
  creationState: initialCreationState,
  updateCreationState: (updates) => 
    set((state) => ({
      creationState: { ...state.creationState, ...updates }
    })),
  resetCreationState: () => set({ creationState: initialCreationState }),
  
  // Current Story
  currentStory: null,
  setCurrentStory: (story) => set({ currentStory: story }),
  
  // Characters
  characters: [],
  addCharacter: (character) =>
    set((state) => ({
      characters: [...state.characters, character]
    })),
  removeCharacter: (characterId) =>
    set((state) => ({
      characters: state.characters.filter(c => c.id !== characterId)
    })),
  updateCharacter: (characterId, updates) =>
    set((state) => ({
      characters: state.characters.map(c => 
        c.id === characterId ? { ...c, ...updates } : c
      )
    })),
  
  // Stories
  stories: [],
  setStories: (stories) => set({ stories }),
  addStory: (story) =>
    set((state) => ({
      stories: [story, ...state.stories]
    })),
  updateStory: (storyId, updates) =>
    set((state) => ({
      stories: state.stories.map(s => 
        s.id === storyId ? { ...s, ...updates } : s
      )
    })),
}));