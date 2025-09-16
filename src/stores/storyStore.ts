import { create } from 'zustand';
import { StoryCreationFlow } from '@/types/character';

interface StoryState {
  // Story Creation Flow
  currentFlow: StoryCreationFlow;
  isGenerating: boolean;
  generationProgress: number;
  
  // Story Viewer State  
  currentStoryId: string | null;
  currentSegmentIndex: number;
  readingMode: 'text' | 'audio' | 'both';
  autoPlay: boolean;
  
  // Actions
  updateFlow: (updates: Partial<StoryCreationFlow>) => void;
  resetFlow: () => void;
  setGenerating: (generating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setCurrentStory: (storyId: string | null) => void;
  setCurrentSegment: (index: number) => void;
  setReadingMode: (mode: 'text' | 'audio' | 'both') => void;
  setAutoPlay: (autoPlay: boolean) => void;
}

const initialFlow: StoryCreationFlow = {
  step: 1,
  ageGroup: undefined,
  genres: [],
  selectedCharacters: [],
  selectedSeed: undefined,
  customSeed: ''
};

export const useStoryStore = create<StoryState>((set, get) => ({
  // Initial State
  currentFlow: initialFlow,
  isGenerating: false,
  generationProgress: 0,
  currentStoryId: null,
  currentSegmentIndex: 0,
  readingMode: 'text',
  autoPlay: false,
  
  // Actions
  updateFlow: (updates) => set((state) => ({
    currentFlow: { ...state.currentFlow, ...updates }
  })),
  
  resetFlow: () => set({ currentFlow: initialFlow }),
  
  setGenerating: (isGenerating) => set({ isGenerating }),
  
  setGenerationProgress: (generationProgress) => set({ generationProgress }),
  
  setCurrentStory: (currentStoryId) => set({ 
    currentStoryId, 
    currentSegmentIndex: 0 // Reset to first segment when switching stories
  }),
  
  setCurrentSegment: (currentSegmentIndex) => set({ currentSegmentIndex }),
  
  setReadingMode: (readingMode) => set({ readingMode }),
  
  setAutoPlay: (autoPlay) => set({ autoPlay }),
}));