import { create } from 'zustand';
import { StoryCreationFlow } from '@/types/character';

interface StoryState {
  // Story Creation Flow
  currentFlow: StoryCreationFlow;
  isGenerating: boolean;
  generationProgress: number;
  generationError: string | null;
  canCancelGeneration: boolean;
  
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
  setGenerationError: (error: string | null) => void;
  setCanCancelGeneration: (canCancel: boolean) => void;
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
  generationError: null,
  canCancelGeneration: false,
  currentStoryId: null,
  currentSegmentIndex: 0,
  readingMode: 'text',
  autoPlay: false,
  
  // Actions
  updateFlow: (updates) => set((state) => {
    const prevStep = state.currentFlow.step;
    const nextStep = typeof updates.step === 'number' ? updates.step : prevStep;
    // TEMP DIAGNOSTIC LOG
    // eslint-disable-next-line no-console
    console.log('[StoryStore.updateFlow]', {
      prevStep,
      updates,
      nextStep,
      ts: Date.now()
    });
    return {
      currentFlow: { ...state.currentFlow, ...updates }
    };
  }),
  
  resetFlow: () => set({ 
    currentFlow: initialFlow,
    generationError: null,
    generationProgress: 0
  }),
  
  setGenerating: (isGenerating) => set({ 
    isGenerating,
    generationError: isGenerating ? null : get().generationError
  }),
  
  setGenerationProgress: (generationProgress) => set({ generationProgress }),
  
  setGenerationError: (generationError) => set({ generationError }),
  
  setCanCancelGeneration: (canCancelGeneration) => set({ canCancelGeneration }),
  
  setCurrentStory: (currentStoryId) => set({ 
    currentStoryId, 
    currentSegmentIndex: 0 // Reset to first segment when switching stories
  }),
  
  setCurrentSegment: (currentSegmentIndex) => set({ currentSegmentIndex }),
  
  setReadingMode: (readingMode) => set({ readingMode }),
  
  setAutoPlay: (autoPlay) => set({ autoPlay }),
}));