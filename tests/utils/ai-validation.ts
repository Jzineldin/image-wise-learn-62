import { StoryValidationFixture } from '../fixtures/story-fixtures';

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  warnings: string[];
  metadata: {
    wordCount: number;
    readingLevel: number;
    sentimentScore: number;
    characterCount: number;
    sentenceCount: number;
  };
}

export interface ContentAnalysis {
  hasNarrativeStructure: boolean;
  hasCharacterConsistency: boolean;
  hasAppropriateLength: boolean;
  hasGrammarQuality: boolean;
  ageAppropriate: boolean;
  languageCorrect: boolean;
  inappropriateContent: string[];
  protagonistMentions: string[];
}

/**
 * Validates AI-generated story content against quality criteria
 */
export function validateStoryContent(
  content: string,
  ageGroup: 'toddlers' | 'children' | 'teens' | 'young-adults',
  expectedProtagonists: string[] = [],
  language: 'en' | 'sv' = 'en'
): ValidationResult {
  const analysis = analyzeContent(content, ageGroup, expectedProtagonists, language);

  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Check narrative structure
  if (!analysis.hasNarrativeStructure) {
    issues.push('Missing narrative structure (beginning, middle, end)');
    score -= 30;
  }

  // Check character consistency
  if (!analysis.hasCharacterConsistency) {
    issues.push('Character inconsistency detected');
    score -= 20;
  }

  // Check appropriate length
  if (!analysis.hasAppropriateLength) {
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 50) {
      issues.push('Content too short');
      score -= 15;
    } else if (wordCount > 1000) {
      warnings.push('Content may be too long for target age group');
      score -= 5;
    }
  }

  // Check grammar quality
  if (!analysis.hasGrammarQuality) {
    issues.push('Grammar or language quality issues detected');
    score -= 15;
  }

  // Check age appropriateness
  if (!analysis.ageAppropriate) {
    issues.push('Content not appropriate for target age group');
    score -= 40;
  }

  // Check language correctness
  if (!analysis.languageCorrect) {
    issues.push('Language detection mismatch');
    score -= 10;
  }

  // Check for inappropriate content
  if (analysis.inappropriateContent.length > 0) {
    issues.push(`Inappropriate content detected: ${analysis.inappropriateContent.join(', ')}`);
    score -= 50;
  }

  // Check protagonist mentions
  if (expectedProtagonists.length > 0 && analysis.protagonistMentions.length === 0) {
    warnings.push('Expected protagonists not found in content');
    score -= 10;
  }

  return {
    isValid: issues.length === 0,
    score: Math.max(0, score),
    issues,
    warnings,
    metadata: {
      wordCount: content.split(/\s+/).length,
      readingLevel: calculateReadingLevel(content),
      sentimentScore: calculateSentimentScore(content),
      characterCount: content.length,
      sentenceCount: content.split(/[.!?]+/).length - 1
    }
  };
}

/**
 * Analyzes content for various quality metrics
 */
export function analyzeContent(
  content: string,
  ageGroup: 'toddlers' | 'children' | 'teens' | 'young-adults',
  expectedProtagonists: string[] = [],
  language: 'en' | 'sv' = 'en'
): ContentAnalysis {
  const lowerContent = content.toLowerCase();
  const words = content.split(/\s+/);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

  return {
    hasNarrativeStructure: checkNarrativeStructure(content),
    hasCharacterConsistency: checkCharacterConsistency(content),
    hasAppropriateLength: checkAppropriateLength(words.length, ageGroup),
    hasGrammarQuality: checkGrammarQuality(content, language),
    ageAppropriate: checkAgeAppropriateness(content, ageGroup),
    languageCorrect: checkLanguageCorrectness(content, language),
    inappropriateContent: detectInappropriateContent(content, ageGroup),
    protagonistMentions: findProtagonistMentions(content, expectedProtagonists)
  };
}

/**
 * Checks if content has proper narrative structure
 */
function checkNarrativeStructure(content: string): boolean {
  const lowerContent = content.toLowerCase();

  // Look for narrative elements
  const hasBeginning = /\b(once|one day|long ago|in a|there was|there were)\b/i.test(content);
  const hasMiddle = /\b(and then|but then|so|then|after that|next|suddenly)\b/i.test(content);
  const hasEnd = /\b(finally|at last|in the end|and they lived|the end|happily ever after)\b/i.test(content);

  // More flexible check - at least 2 out of 3 elements
  const elements = [hasBeginning, hasMiddle, hasEnd].filter(Boolean);
  return elements.length >= 2;
}

/**
 * Checks for character consistency throughout the story
 */
function checkCharacterConsistency(content: string): boolean {
  // Simple check: if characters are mentioned multiple times, ensure consistency
  // This is a basic implementation - could be enhanced with NLP
  const characterPatterns = [
    /\b(he|she|they|his|her|their)\b/gi,
    /\b(the \w+)\b/gi
  ];

  let consistentReferences = 0;
  characterPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches && matches.length > 1) {
      consistentReferences++;
    }
  });

  return consistentReferences >= 1;
}

/**
 * Checks if content length is appropriate for age group
 */
function checkAppropriateLength(wordCount: number, ageGroup: string): boolean {
  const lengthRanges = {
    toddlers: { min: 30, max: 150 },
    children: { min: 80, max: 300 },
    teens: { min: 150, max: 500 },
    'young-adults': { min: 200, max: 800 }
  };

  const range = lengthRanges[ageGroup as keyof typeof lengthRanges];
  return range ? wordCount >= range.min && wordCount <= range.max : true;
}

/**
 * Basic grammar quality check
 */
function checkGrammarQuality(content: string, language: 'en' | 'sv'): boolean {
  // Basic checks for common grammar issues
  const issues = [];

  // Check for excessive repetition
  const words = content.toLowerCase().split(/\s+/);
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    if (word.length > 3) { // Only check meaningful words
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  const maxRepetition = Math.max(...Object.values(wordFreq));
  if (maxRepetition > words.length * 0.1) { // More than 10% repetition
    issues.push('excessive repetition');
  }

  // Check for incomplete sentences
  const sentences = content.split(/[.!?]+/);
  const incompleteCount = sentences.filter(s =>
    s.trim().length > 0 && !s.trim().match(/^[A-Z]/)
  ).length;

  if (incompleteCount > sentences.length * 0.3) {
    issues.push('incomplete sentences');
  }

  return issues.length === 0;
}

/**
 * Checks if content is appropriate for the target age group
 */
function checkAgeAppropriateness(content: string, ageGroup: string): boolean {
  const lowerContent = content.toLowerCase();

  const inappropriateByAge = {
    toddlers: [
      'scary', 'dark', 'monster', 'fight', 'blood', 'death', 'kill', 'weapon',
      'violence', 'fear', 'nightmare', 'ghost', 'haunted', 'evil', 'bad'
    ],
    children: [
      'blood', 'death', 'kill', 'murder', 'weapon', 'violence', 'drugs',
      'alcohol', 'smoke', 'curse', 'hell', 'damn'
    ],
    teens: [
      'explicit violence', 'sexual content', 'drugs', 'alcohol abuse'
    ],
    'young-adults': [] // More permissive
  };

  const forbidden = inappropriateByAge[ageGroup as keyof typeof inappropriateByAge] || [];
  return !forbidden.some(word => lowerContent.includes(word));
}

/**
 * Basic language correctness check
 */
function checkLanguageCorrectness(content: string, expectedLanguage: 'en' | 'sv'): boolean {
  // Simple heuristic based on common words
  const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that'];
  const swedishWords = ['och', 'är', 'i', 'att', 'en', 'det', 'som', 'på'];

  const lowerContent = content.toLowerCase();
  const englishScore = englishWords.filter(word => lowerContent.includes(word)).length;
  const swedishScore = swedishWords.filter(word => lowerContent.includes(word)).length;

  if (expectedLanguage === 'en') {
    return englishScore >= swedishScore;
  } else {
    return swedishScore >= englishScore;
  }
}

/**
 * Detects inappropriate content based on age group
 */
function detectInappropriateContent(content: string, ageGroup: string): string[] {
  const lowerContent = content.toLowerCase();
  const found: string[] = [];

  const inappropriateWords = {
    toddlers: ['kill', 'death', 'blood', 'monster', 'scary', 'dark', 'evil', 'weapon'],
    children: ['kill', 'death', 'blood', 'murder', 'drugs', 'alcohol', 'sex', 'weapon'],
    teens: ['explicit', 'porn', 'drugs', 'violence'],
    'young-adults': ['extreme violence', 'explicit content']
  };

  const words = inappropriateWords[ageGroup as keyof typeof inappropriateWords] || [];
  words.forEach(word => {
    if (lowerContent.includes(word)) {
      found.push(word);
    }
  });

  return found;
}

/**
 * Finds mentions of expected protagonists in content
 */
function findProtagonistMentions(content: string, expectedProtagonists: string[]): string[] {
  const lowerContent = content.toLowerCase();
  return expectedProtagonists.filter(protagonist =>
    lowerContent.includes(protagonist.toLowerCase())
  );
}

/**
 * Calculates approximate reading level
 */
function calculateReadingLevel(content: string): number {
  const words = content.split(/\s+/);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

  if (sentences.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const complexWords = words.filter(word =>
    word.length > 6 || word.match(/[aeiou]{3,}/i)
  ).length;

  const complexWordRatio = complexWords / words.length;

  // Simple reading level calculation
  return (avgWordsPerSentence * 0.4) + (complexWordRatio * 10);
}

/**
 * Calculates sentiment score (-1 to 1)
 */
function calculateSentimentScore(content: string): number {
  const positiveWords = ['happy', 'joy', 'love', 'friend', 'good', 'great', 'wonderful', 'amazing', 'excited', 'fun'];
  const negativeWords = ['sad', 'angry', 'fear', 'hate', 'bad', 'terrible', 'scary', 'dark', 'evil', 'monster'];

  const lowerContent = content.toLowerCase();
  const words = lowerContent.split(/\s+/);

  let score = 0;
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) score += 1;
    if (negativeWords.some(nw => word.includes(nw))) score -= 1;
  });

  return Math.max(-1, Math.min(1, score / Math.max(1, words.length * 0.1)));
}

/**
 * Validates choice impact in branching stories
 */
export function validateChoiceImpact(
  choices: Array<{ text: string; impact: 'high' | 'medium' | 'low' }>,
  resultingContent: string
): { isValid: boolean; impactScores: number[] } {
  const impactScores: number[] = [];

  choices.forEach(choice => {
    let impactScore = 0;

    // Analyze how much the choice affects the story
    const choiceWords = choice.text.toLowerCase().split(/\s+/);
    const contentWords = resultingContent.toLowerCase().split(/\s+/);

    // Check if choice keywords appear in resulting content
    const keywordMatches = choiceWords.filter(word =>
      word.length > 2 && contentWords.includes(word)
    ).length;

    impactScore = (keywordMatches / choiceWords.length) * 100;

    // Adjust based on expected impact level
    const multipliers = { high: 1.5, medium: 1.0, low: 0.5 };
    impactScore *= multipliers[choice.impact];

    impactScores.push(Math.min(100, impactScore));
  });

  const avgImpact = impactScores.reduce((a, b) => a + b, 0) / impactScores.length;
  const isValid = avgImpact >= 30; // At least 30% impact score

  return { isValid, impactScores };
}

/**
 * Validates seed-based reproducibility
 */
export function validateSeedReproducibility(
  originalContent: string,
  regeneratedContent: string,
  tolerance: number = 0.8
): { isReproducible: boolean; similarity: number } {
  const originalWords = originalContent.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const regeneratedWords = regeneratedContent.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const commonWords = originalWords.filter(word => regeneratedWords.includes(word));
  const similarity = commonWords.length / Math.max(originalWords.length, regeneratedWords.length);

  return {
    isReproducible: similarity >= tolerance,
    similarity
  };
}