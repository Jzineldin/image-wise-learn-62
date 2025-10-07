import { describe, it, expect } from 'vitest';
import {
  validateStoryContent,
  validateChoiceImpact,
  validateSeedReproducibility,
  analyzeContent
} from '../utils/ai-validation';

describe('AI Validation Utilities', () => {
  describe('validateStoryContent', () => {
    it('should validate a good toddler story', () => {
      const content = `Once upon a time, there was a little bunny named Floppy. Floppy loved to hop around the meadow and play with his friends. One sunny day, Floppy found a shiny red apple. He shared it with his friend Squirrel. They played all day and had lots of fun. When it was time to go home, Floppy felt happy and tired. He snuggled in his cozy bed and dreamed sweet dreams.`;

      const result = validateStoryContent(content, 'toddlers', ['floppy', 'squirrel']);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(70);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject inappropriate content for toddlers', () => {
      const content = `The dark knight fought the evil dragon. Blood spilled everywhere as they battled fiercely. The dragon breathed fire and the knight screamed in pain. Finally, the knight killed the dragon with his sword.`;

      const result = validateStoryContent(content, 'toddlers');

      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(50);
      expect(result.issues).toContain('Content not appropriate for target age group');
      expect(result.issues.some(issue => issue.includes('inappropriate content'))).toBe(true);
    });

    it('should validate appropriate content for teens', () => {
      const content = `Alex discovered an ancient mystery in the old school library. With the help of Jordan, they uncovered clues that led to a hidden treasure. Working together, they solved puzzles and learned about friendship and perseverance. In the end, they shared their discovery with the school, becoming local heroes.`;

      const result = validateStoryContent(content, 'teens', ['alex', 'jordan']);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(60);
      expect(result.metadata.wordCount).toBeGreaterThan(50);
    });

    it('should detect missing narrative structure', () => {
      const content = `Timmy went to the park. He saw a dog. The dog barked. Timmy ran home.`;

      const result = validateStoryContent(content, 'children');

      expect(result.issues).toContain('Missing narrative structure (beginning, middle, end)');
      expect(result.score).toBeLessThan(80);
    });

    it('should detect inappropriate length', () => {
      const shortContent = `Hi there.`;
      const result = validateStoryContent(shortContent, 'children');

      expect(result.issues.some(issue => issue.includes('too short'))).toBe(true);
    });
  });

  describe('analyzeContent', () => {
    it('should analyze content structure correctly', () => {
      const content = `Once upon a time in a magical forest, there lived a brave knight named Sir Gallant. Every day, Sir Gallant would practice sword fighting and help his friends. One day, he met a friendly dragon who needed help finding his lost treasure. Together, they went on an adventure, solved riddles, and became the best of friends. And they lived happily ever after.`;

      const analysis = analyzeContent(content, 'children', ['sir gallant', 'dragon']);

      expect(analysis.hasNarrativeStructure).toBe(true);
      expect(analysis.hasAppropriateLength).toBe(true);
      expect(analysis.ageAppropriate).toBe(true);
      expect(analysis.protagonistMentions.length).toBeGreaterThan(0);
    });

    it('should detect inappropriate content patterns', () => {
      const content = `The scary monster lived in the dark cave. It frightened all the children and made them cry. The darkness was everywhere and no one could escape.`;

      const analysis = analyzeContent(content, 'toddlers');

      expect(analysis.ageAppropriate).toBe(false);
      expect(analysis.inappropriateContent).toContain('scary');
      expect(analysis.inappropriateContent).toContain('dark');
    });
  });

  describe('analyzeContent integration', () => {
    it('should provide comprehensive content analysis', () => {
      const content = `Once upon a time, in a magical forest, there lived a brave knight named Sir Gallant. Every day, Sir Gallant would practice sword fighting and help his friends. One day, he met a friendly dragon who needed help finding his lost treasure. Together, they went on an adventure, solved riddles, and became the best of friends. And they lived happily ever after.`;

      const analysis = analyzeContent(content, 'children', ['sir gallant', 'dragon']);

      expect(analysis).toHaveProperty('hasNarrativeStructure');
      expect(analysis).toHaveProperty('hasCharacterConsistency');
      expect(analysis).toHaveProperty('hasAppropriateLength');
      expect(analysis).toHaveProperty('ageAppropriate');
      expect(analysis).toHaveProperty('protagonistMentions');

      expect(analysis.hasNarrativeStructure).toBe(true);
      expect(analysis.hasAppropriateLength).toBe(true);
      expect(analysis.ageAppropriate).toBe(true);
      expect(analysis.protagonistMentions.length).toBeGreaterThan(0);
    });
  });

  describe('validateChoiceImpact', () => {
    it('should validate meaningful choice impact', () => {
      const choices = [
        { text: 'Go left towards the dark cave', impact: 'high' as const },
        { text: 'Go right towards the sunny meadow', impact: 'medium' as const },
        { text: 'Stay where you are', impact: 'low' as const }
      ];

      const resultingContent = `You chose to go left towards the dark cave. Inside, you found ancient treasures and mysterious creatures. The cave was filled with glowing crystals and you discovered a hidden path that led to adventure.`;

      const result = validateChoiceImpact(choices, resultingContent);

      expect(result.isValid).toBe(true);
      expect(result.impactScores.length).toBe(3);
      expect(result.impactScores[0]).toBeGreaterThan(result.impactScores[2]); // high > low
    });

    it('should detect low impact choices', () => {
      const choices = [
        { text: 'Open the door', impact: 'high' as const }
      ];

      const resultingContent = `You opened the door and walked through. Nothing much happened.`;

      const result = validateChoiceImpact(choices, resultingContent);

      expect(result.isValid).toBe(false);
      expect(result.impactScores[0]).toBeLessThan(50);
    });
  });

  describe('validateSeedReproducibility', () => {
    it('should validate reproducible content', () => {
      const original = `Once upon a time, in a magical forest, there lived a wise old owl named Oliver. Oliver loved to tell stories to the young animals. One day, a curious rabbit asked for an adventure story. Oliver told about brave heroes and hidden treasures.`;
      const regenerated = `In a magical forest, there was a wise owl called Oliver. Oliver enjoyed sharing tales with the animal friends. A curious rabbit wanted an adventure. Oliver spoke of heroes and treasures in his story.`;

      const result = validateSeedReproducibility(original, regenerated, 0.5);

      expect(result.isReproducible).toBe(true);
      expect(result.similarity).toBeGreaterThan(0.5);
    });

    it('should detect non-reproducible content', () => {
      const original = `A story about a dragon who loves ice cream.`;
      const regenerated = `A tale about a princess who lives in a castle.`;

      const result = validateSeedReproducibility(original, regenerated, 0.8);

      expect(result.isReproducible).toBe(false);
      expect(result.similarity).toBeLessThan(0.3);
    });
  });
});