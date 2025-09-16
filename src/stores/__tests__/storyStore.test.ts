import { describe, it, expect, beforeEach } from 'vitest';
import { useStoryStore } from '../storyStore';

describe('storyStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStoryStore.setState({
      currentFlow: {
        step: 1,
        ageGroup: undefined,
        genres: [],
        selectedCharacters: [],
        selectedSeed: undefined,
        customSeed: ''
      },
      isGenerating: false,
      generationProgress: 0,
      currentStoryId: null,
      currentSegmentIndex: 0,
      readingMode: 'text',
      autoPlay: false,
    });
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useStoryStore.getState();
      expect(state.currentFlow.step).toBe(1);
      expect(state.currentFlow.ageGroup).toBeUndefined();
      expect(state.currentFlow.genres).toEqual([]);
      expect(state.currentFlow.selectedCharacters).toEqual([]);
      expect(state.currentFlow.selectedSeed).toBeUndefined();
      expect(state.currentFlow.customSeed).toBe('');
      expect(state.isGenerating).toBe(false);
      expect(state.generationProgress).toBe(0);
      expect(state.currentStoryId).toBe(null);
      expect(state.currentSegmentIndex).toBe(0);
      expect(state.readingMode).toBe('text');
      expect(state.autoPlay).toBe(false);
    });
  });

  describe('story creation flow', () => {
    it('should update flow partially', () => {
      const { updateFlow } = useStoryStore.getState();
      
      updateFlow({ step: 2, ageGroup: 'kids' });
      
      const state = useStoryStore.getState();
      expect(state.currentFlow.step).toBe(2);
      expect(state.currentFlow.ageGroup).toBe('kids');
      expect(state.currentFlow.genres).toEqual([]); // Should preserve other values
    });

    it('should update genres array', () => {
      const { updateFlow } = useStoryStore.getState();
      
      updateFlow({ genres: ['adventure', 'fantasy'] });
      
      expect(useStoryStore.getState().currentFlow.genres).toEqual(['adventure', 'fantasy']);
    });

    it('should update selected characters', () => {
      const { updateFlow } = useStoryStore.getState();
      const characters = [
        { 
          id: '1', 
          user_id: 'user123',
          name: 'Hero', 
          description: 'Main character', 
          character_type: 'protagonist',
          personality_traits: ['brave', 'kind'],
          usage_count: 0,
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        }
      ];
      
      updateFlow({ selectedCharacters: characters });
      
      expect(useStoryStore.getState().currentFlow.selectedCharacters).toEqual(characters);
    });

    it('should reset flow to initial state', () => {
      const { updateFlow, resetFlow } = useStoryStore.getState();
      
      // First modify the flow
      updateFlow({ 
        step: 3, 
        ageGroup: 'teens', 
        genres: ['mystery'],
        customSeed: 'Custom story'
      });
      
      // Then reset it
      resetFlow();
      
      const state = useStoryStore.getState();
      expect(state.currentFlow.step).toBe(1);
      expect(state.currentFlow.ageGroup).toBeUndefined();
      expect(state.currentFlow.genres).toEqual([]);
      expect(state.currentFlow.customSeed).toBe('');
    });
  });

  describe('generation state', () => {
    it('should update generating state', () => {
      const { setGenerating } = useStoryStore.getState();
      
      setGenerating(true);
      expect(useStoryStore.getState().isGenerating).toBe(true);
      
      setGenerating(false);
      expect(useStoryStore.getState().isGenerating).toBe(false);
    });

    it('should update generation progress', () => {
      const { setGenerationProgress } = useStoryStore.getState();
      
      setGenerationProgress(50);
      expect(useStoryStore.getState().generationProgress).toBe(50);
      
      setGenerationProgress(100);
      expect(useStoryStore.getState().generationProgress).toBe(100);
    });
  });

  describe('story viewer state', () => {
    it('should set current story and reset segment index', () => {
      const { setCurrentSegment, setCurrentStory } = useStoryStore.getState();
      
      // First set a segment index
      setCurrentSegment(5);
      expect(useStoryStore.getState().currentSegmentIndex).toBe(5);
      
      // Then set a new story - should reset segment index
      setCurrentStory('story-123');
      
      const state = useStoryStore.getState();
      expect(state.currentStoryId).toBe('story-123');
      expect(state.currentSegmentIndex).toBe(0); // Should reset to 0
    });

    it('should update current segment index', () => {
      const { setCurrentSegment } = useStoryStore.getState();
      
      setCurrentSegment(3);
      expect(useStoryStore.getState().currentSegmentIndex).toBe(3);
    });

    it('should handle null story id', () => {
      const { setCurrentStory } = useStoryStore.getState();
      
      setCurrentStory(null);
      expect(useStoryStore.getState().currentStoryId).toBe(null);
      expect(useStoryStore.getState().currentSegmentIndex).toBe(0);
    });
  });

  describe('reading mode', () => {
    it('should update reading mode', () => {
      const { setReadingMode } = useStoryStore.getState();
      
      setReadingMode('audio');
      expect(useStoryStore.getState().readingMode).toBe('audio');
      
      setReadingMode('both');
      expect(useStoryStore.getState().readingMode).toBe('both');
      
      setReadingMode('text');
      expect(useStoryStore.getState().readingMode).toBe('text');
    });

    it('should update autoplay setting', () => {
      const { setAutoPlay } = useStoryStore.getState();
      
      setAutoPlay(true);
      expect(useStoryStore.getState().autoPlay).toBe(true);
      
      setAutoPlay(false);
      expect(useStoryStore.getState().autoPlay).toBe(false);
    });
  });

  describe('complex flow scenarios', () => {
    it('should handle complete story creation flow', () => {
      const { updateFlow } = useStoryStore.getState();
      
      // Step 1: Age and genre selection
      updateFlow({ step: 2, ageGroup: 'kids', genres: ['adventure'] });
      
      // Step 2: Character selection
      const characters = [
        { 
          id: '1', 
          user_id: 'user123',
          name: 'Alice', 
          description: 'Brave explorer', 
          character_type: 'protagonist',
          personality_traits: ['brave', 'curious'],
          usage_count: 0,
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        }
      ];
      updateFlow({ step: 3, selectedCharacters: characters });
      
      // Step 3: Story idea
      updateFlow({ step: 4, selectedSeed: { id: 'seed1', title: 'Magic Forest', description: 'A magical adventure' } });
      
      const finalState = useStoryStore.getState().currentFlow;
      expect(finalState.step).toBe(4);
      expect(finalState.ageGroup).toBe('kids');
      expect(finalState.genres).toEqual(['adventure']);
      expect(finalState.selectedCharacters).toEqual(characters);
      expect(finalState.selectedSeed).toEqual({ id: 'seed1', title: 'Magic Forest', description: 'A magical adventure' });
    });
  });
});