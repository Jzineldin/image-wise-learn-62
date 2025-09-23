import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StoryCreationFlow } from '@/types/character';

interface GenerationProgress {
  currentStep: string;
  progress: number;
  estimatedTimeRemaining?: number;
  canCancel: boolean;
}

interface StoryState {
  // Story Creation Flow
  currentFlow: StoryCreationFlow;
  isGenerating: boolean;
  generationProgress: GenerationProgress;
  lastSavedAt: number | null;
  hasUnsavedChanges: boolean;
  
  // Story Viewer State  
  currentStoryId: string | null;
  currentSegmentIndex: number;
  readingMode: 'text' | 'audio' | 'both';
  autoPlay: boolean;
  
  // Error Recovery
  lastError: string | null;
  retryCount: number;
  
  // Actions
  updateFlow: (updates: Partial<StoryCreationFlow>) => void;
  resetFlow: () => void;
  setGenerating: (generating: boolean, progress?: Partial<GenerationProgress>) => void;
  setGenerationProgress: (progress: Partial<GenerationProgress>) => void;
  setCurrentStory: (storyId: string | null) => void;
  setCurrentSegment: (index: number) => void;
  setReadingMode: (mode: 'text' | 'audio' | 'both') => void;
  setAutoPlay: (autoPlay: boolean) => void;
  markSaved: () => void;
  setError: (error: string | null) => void;
  incrementRetry: () => void;
  resetRetry: () => void;
  canResume: () => boolean;
}

const initialFlow: StoryCreationFlow = {
  step: 1,
  ageGroup: undefined,
  genres: [],
  selectedCharacters: [],
  selectedSeed: undefined,
  customSeed: ''
};

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentFlow: initialFlow,
      isGenerating: false,
      generationProgress: {
        currentStep: '',
        progress: 0,
        canCancel: false
      },
      lastSavedAt: null,
      hasUnsavedChanges: false,
      currentStoryId: null,
      currentSegmentIndex: 0,
      readingMode: 'text',
      autoPlay: false,
      lastError: null,
      retryCount: 0,
      
      // Actions
      updateFlow: (updates) => set((state) => ({
        currentFlow: { ...state.currentFlow, ...updates },
        hasUnsavedChanges: true,
        lastSavedAt: Date.now()
      })),
      
      resetFlow: () => set({ 
        currentFlow: initialFlow,
        hasUnsavedChanges: false,
        lastError: null,
        retryCount: 0
      }),
      
      setGenerating: (isGenerating, progress) => set((state) => ({
        isGenerating,
        generationProgress: progress ? { ...state.generationProgress, ...progress } : state.generationProgress
      })),
      
      setGenerationProgress: (progress) => set((state) => ({
        generationProgress: { ...state.generationProgress, ...progress }
      })),
      
      setCurrentStory: (currentStoryId) => set({ 
        currentStoryId, 
        currentSegmentIndex: 0
      }),
      
      setCurrentSegment: (currentSegmentIndex) => set({ currentSegmentIndex }),
      
      setReadingMode: (readingMode) => set({ readingMode }),
      
      setAutoPlay: (autoPlay) => set({ autoPlay }),
      
      markSaved: () => set({
        hasUnsavedChanges: false,
        lastSavedAt: Date.now()
      }),
      
      setError: (lastError) => set({ lastError }),
      
      incrementRetry: () => set((state) => ({ retryCount: state.retryCount + 1 })),
      
      resetRetry: () => set({ retryCount: 0 }),
      
      canResume: () => {
        const state = get();
        return state.currentFlow.step > 1 && !state.isGenerating;
      }
    }),
    {
      name: 'tale-forge-story-creation',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentFlow: state.currentFlow,
        lastSavedAt: state.lastSavedAt,
        hasUnsavedChanges: state.hasUnsavedChanges,
        readingMode: state.readingMode,
        autoPlay: state.autoPlay
      })
    }
  )
);