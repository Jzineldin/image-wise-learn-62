/**
 * Text Validation and Correction Utilities
 * 
 * Post-processing functions to ensure AI-generated story text meets quality standards.
 * Catches common grammar errors, formatting issues, and inappropriate content.
 */

export interface ValidationResult {
  isValid: boolean;
  correctedText: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'grammar' | 'formatting' | 'content' | 'safety';
  message: string;
  original: string;
  corrected: string;
  position?: number;
}

export interface ValidationWarning {
  type: 'style' | 'readability' | 'engagement';
  message: string;
  suggestion: string;
}

/**
 * Main validation function - runs all checks and corrections
 */
export function validateAndCorrectStoryText(
  text: string,
  ageGroup?: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let correctedText = text;

  // 1. Fix duplicate words (e.g., "the the")
  const duplicateResult = fixDuplicateWords(correctedText);
  correctedText = duplicateResult.text;
  errors.push(...duplicateResult.errors);

  // 2. Fix capitalization
  const capitalizationResult = fixCapitalization(correctedText);
  correctedText = capitalizationResult.text;
  errors.push(...capitalizationResult.errors);

  // 3. Fix pronoun usage for animals/characters
  const pronounResult = fixPronounUsage(correctedText);
  correctedText = pronounResult.text;
  warnings.push(...pronounResult.warnings);

  // 4. Validate sentence structure
  const sentenceWarnings = validateSentenceStructure(correctedText, ageGroup);
  warnings.push(...sentenceWarnings);

  // 5. Check for inappropriate content
  const safetyErrors = checkContentSafety(correctedText, ageGroup);
  errors.push(...safetyErrors);

  // 6. Validate punctuation
  const punctuationResult = fixPunctuation(correctedText);
  correctedText = punctuationResult.text;
  errors.push(...punctuationResult.errors);

  return {
    isValid: errors.filter(e => e.type === 'grammar' || e.type === 'safety').length === 0,
    correctedText: correctedText.trim(),
    errors,
    warnings
  };
}

/**
 * Fix duplicate consecutive words (e.g., "the the cat" → "the cat")
 */
function fixDuplicateWords(text: string): { text: string; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const duplicatePattern = /\b(\w+)\s+\1\b/gi;
  
  let correctedText = text;
  let match;
  
  while ((match = duplicatePattern.exec(text)) !== null) {
    const original = match[0];
    const corrected = match[1];
    
    errors.push({
      type: 'grammar',
      message: `Duplicate word detected: "${original}"`,
      original,
      corrected,
      position: match.index
    });
    
    correctedText = correctedText.replace(original, corrected);
  }
  
  return { text: correctedText, errors };
}

/**
 * Fix sentence capitalization
 */
function fixCapitalization(text: string): { text: string; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  
  // Split into sentences (basic - handles . ! ?)
  const sentences = text.split(/([.!?]\s+)/);
  const correctedSentences: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i];
    
    // Skip punctuation separators
    if (/^[.!?]\s+$/.test(sentence)) {
      correctedSentences.push(sentence);
      continue;
    }
    
    // Check if sentence starts with lowercase letter
    if (sentence.length > 0 && /^[a-z]/.test(sentence)) {
      const original = sentence;
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
      
      errors.push({
        type: 'formatting',
        message: 'Sentence should start with capital letter',
        original: original.substring(0, 20) + '...',
        corrected: sentence.substring(0, 20) + '...'
      });
    }
    
    correctedSentences.push(sentence);
  }
  
  return { text: correctedSentences.join(''), errors };
}

/**
 * Fix pronoun usage - replace "it" with more personal pronouns for characters
 */
function fixPronounUsage(text: string): { text: string; warnings: ValidationWarning[] } {
  const warnings: ValidationWarning[] = [];
  
  // Detect if "it" is used for animals/characters (heuristic)
  const itUsagePattern = /\b(cat|dog|bird|animal|character|creature)\b[^.!?]*\bit\b/gi;
  
  if (itUsagePattern.test(text)) {
    warnings.push({
      type: 'style',
      message: 'Using "it" for animals/characters may feel impersonal',
      suggestion: 'Consider using "he/she" or the character\'s name for better engagement'
    });
  }
  
  return { text, warnings };
}

/**
 * Validate sentence structure for age-appropriateness
 */
function validateSentenceStructure(text: string, ageGroup?: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Check average sentence length
  const avgWordCount = sentences.reduce((sum, s) => {
    return sum + s.trim().split(/\s+/).length;
  }, 0) / sentences.length;
  
  // Age-appropriate sentence length guidelines
  const maxWordsByAge: Record<string, number> = {
    '4-6': 10,
    '7-9': 15,
    '10-12': 20,
    '13+': 25
  };
  
  const maxWords = ageGroup ? maxWordsByAge[ageGroup] || 15 : 15;
  
  if (avgWordCount > maxWords) {
    warnings.push({
      type: 'readability',
      message: `Average sentence length (${avgWordCount.toFixed(1)} words) may be too long for age group ${ageGroup || 'target'}`,
      suggestion: `Keep sentences under ${maxWords} words for better comprehension`
    });
  }
  
  // Check for variety in sentence structure
  const startsWithSameWord = sentences.filter((s, i) => {
    if (i === 0) return false;
    const firstWord = s.trim().split(/\s+/)[0]?.toLowerCase();
    const prevFirstWord = sentences[i - 1].trim().split(/\s+/)[0]?.toLowerCase();
    return firstWord === prevFirstWord;
  });
  
  if (startsWithSameWord.length > sentences.length / 2) {
    warnings.push({
      type: 'style',
      message: 'Many sentences start with the same word',
      suggestion: 'Vary sentence beginnings for better rhythm and engagement'
    });
  }
  
  return warnings;
}

/**
 * Check for inappropriate content (basic safety check)
 */
function checkContentSafety(text: string, ageGroup?: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // List of inappropriate words/phrases for children's content
  const inappropriateWords = [
    'scary', 'frightening', 'terrifying', 'horrifying',
    'violent', 'blood', 'death', 'kill',
    'hate', 'stupid', 'dumb', 'idiot'
  ];
  
  const lowerText = text.toLowerCase();
  
  for (const word of inappropriateWords) {
    if (lowerText.includes(word)) {
      errors.push({
        type: 'safety',
        message: `Potentially inappropriate word detected: "${word}"`,
        original: word,
        corrected: '[content flagged for review]'
      });
    }
  }
  
  return errors;
}

/**
 * Fix basic punctuation issues
 */
function fixPunctuation(text: string): { text: string; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  let correctedText = text;
  
  // Fix multiple spaces
  if (/\s{2,}/.test(correctedText)) {
    errors.push({
      type: 'formatting',
      message: 'Multiple consecutive spaces detected',
      original: 'multiple spaces',
      corrected: 'single space'
    });
    correctedText = correctedText.replace(/\s{2,}/g, ' ');
  }
  
  // Fix space before punctuation
  if (/\s+[.!?,;:]/.test(correctedText)) {
    errors.push({
      type: 'formatting',
      message: 'Space before punctuation detected',
      original: 'word .',
      corrected: 'word.'
    });
    correctedText = correctedText.replace(/\s+([.!?,;:])/g, '$1');
  }
  
  // Ensure space after punctuation (except at end)
  correctedText = correctedText.replace(/([.!?,;:])([A-Za-z])/g, '$1 $2');
  
  return { text: correctedText, errors };
}

/**
 * Validate choice text (for story choices)
 */
export function validateChoiceText(choiceText: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let correctedText = choiceText.trim();
  
  // Choices should be short (5-10 words)
  const wordCount = correctedText.split(/\s+/).length;
  if (wordCount > 12) {
    warnings.push({
      type: 'readability',
      message: `Choice text is too long (${wordCount} words)`,
      suggestion: 'Keep choices under 10 words for clarity'
    });
  }
  
  // Choices should start with a verb or action word
  const firstWord = correctedText.split(/\s+/)[0]?.toLowerCase();
  const actionVerbs = ['go', 'run', 'walk', 'climb', 'look', 'search', 'find', 'ask', 'tell', 'help', 'follow', 'explore', 'investigate'];
  
  if (!actionVerbs.includes(firstWord)) {
    warnings.push({
      type: 'style',
      message: 'Choice should start with an action verb',
      suggestion: `Consider starting with: ${actionVerbs.slice(0, 5).join(', ')}, etc.`
    });
  }
  
  // Capitalize first letter
  if (/^[a-z]/.test(correctedText)) {
    correctedText = correctedText.charAt(0).toUpperCase() + correctedText.slice(1);
    errors.push({
      type: 'formatting',
      message: 'Choice should start with capital letter',
      original: choiceText,
      corrected: correctedText
    });
  }
  
  return {
    isValid: errors.length === 0,
    correctedText,
    errors,
    warnings
  };
}

/**
 * Generate validation report (for logging/debugging)
 */
export function generateValidationReport(result: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push('=== Text Validation Report ===');
  lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
  lines.push('');
  
  if (result.errors.length > 0) {
    lines.push('ERRORS:');
    result.errors.forEach((error, i) => {
      lines.push(`${i + 1}. [${error.type.toUpperCase()}] ${error.message}`);
      lines.push(`   Original: "${error.original}"`);
      lines.push(`   Corrected: "${error.corrected}"`);
    });
    lines.push('');
  }
  
  if (result.warnings.length > 0) {
    lines.push('WARNINGS:');
    result.warnings.forEach((warning, i) => {
      lines.push(`${i + 1}. [${warning.type.toUpperCase()}] ${warning.message}`);
      lines.push(`   Suggestion: ${warning.suggestion}`);
    });
    lines.push('');
  }
  
  if (result.correctedText !== result.correctedText) {
    lines.push('CORRECTED TEXT:');
    lines.push(result.correctedText);
  }
  
  return lines.join('\n');
}

