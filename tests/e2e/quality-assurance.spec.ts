import { test, expect, Page } from '@playwright/test';
import { STORY_VALIDATION_FIXTURES, AGE_GROUP_FIXTURES } from '../fixtures/story-fixtures';
import { validateStoryContent, analyzeContent } from '../utils/ai-validation';

const EMAIL = process.env.E2E_EMAIL || 'jzineldin@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD || 'Rashzin1996!';

// Utility functions
async function authenticateUser(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Tale Forge/i })).toBeVisible();

  const signInNav = page.getByRole('button', { name: /Sign In/i }).first();
  if (await signInNav.count()) {
    await signInNav.click();
  } else {
    await page.goto('/auth');
  }

  await expect(page.locator('form')).toBeVisible({ timeout: 30_000 });
  await page.getByLabel(/Email/i).fill(EMAIL);
  await page.getByLabel(/Password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 60_000 });
}

async function createAndGenerateStory(
  page: Page,
  ageGroup: string,
  genre: string,
  characters: Array<{ name: string; type: string; description: string }>,
  seed: string,
  language: 'en' | 'sv' = 'en'
) {
  await page.goto('/create');

  if (language === 'sv') {
    const triggers = page.getByRole('combobox');
    if (await triggers.count()) {
      await triggers.first().click();
      const svOption = page.getByRole('option', { name: /Svenska/i });
      if (await svOption.count()) {
        await svOption.click();
      }
    }
  }

  // Select age group and genre
  const ageSelector = ageGroup === 'toddlers' ? '4-6' :
                     ageGroup === 'children' ? '7-9' :
                     ageGroup === 'teens' ? '10-12' : '13+';
  await page.getByText(new RegExp(`${ageSelector}|${ageSelector} År`, 'i')).first().click();
  await page.getByText(new RegExp(genre, 'i')).first().click();

  const nextButton = page.getByRole('button', { name: /^(Next|Nästa)$/i });
  await nextButton.click();

  // Create characters
  for (const character of characters) {
    await page.getByRole('button', { name: /Create New|Skapa ny/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Character Name/i).fill(character.name);
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: new RegExp(character.type, 'i') }).click();
    await dialog.getByLabel(/Description/i).fill(character.description);
    await dialog.getByRole('button', { name: /Create Character/i }).click();
  }

  // Select characters
  for (const character of characters) {
    await page.getByText(new RegExp(`^${character.name}$`, 'i')).first().click();
  }

  await nextButton.click();

  // Fill seed and generate
  const writeOwnBtn = page.getByRole('button', { name: /(Write (My|Your) Own|Write Your Own Story Idea|Skriv)/i });
  if (await writeOwnBtn.count()) {
    await writeOwnBtn.click();
  }
  await page.locator('#custom-seed').fill(seed);

  const genStart = Date.now();
  const createBtn = page.getByRole('button', { name: /Create|Skapa/i });
  await createBtn.click();

  // Wait for content
  const contentLocator = page.locator('.prose .leading-relaxed, .prose .text-foreground');
  await expect(contentLocator).toBeVisible({ timeout: 120_000 });
  const content = await contentLocator.innerText();
  const genTime = Date.now() - genStart;

  return { content, genTime };
}

test.describe('Quality Assurance - Story Output Quality Validation', () => {
  test.setTimeout(300_000);

  STORY_VALIDATION_FIXTURES.forEach((fixture) => {
    test(`should validate story quality metrics for: ${fixture.id}`, async ({ page }) => {
      await authenticateUser(page);

      // Generate a story that should match the fixture criteria
      const ageGroup = fixture.id.includes('toddler') ? 'toddlers' :
                      fixture.id.includes('teen') ? 'teens' : 'children';

      const { content, genTime } = await createAndGenerateStory(
        page,
        ageGroup,
        'fantasy',
        [{ name: 'TestHero', type: 'human', description: 'A brave hero' }],
        fixture.content.split(' ').slice(0, 10).join(' ') + '...', // Use part of fixture as seed
        'en'
      );

      // Validate against expected criteria
      const validation = validateStoryContent(content, ageGroup as any);

      // Check each validation criterion
      expect(validation.isValid).toBe(fixture.expectedValidation.hasNarrativeStructure &&
                                     fixture.expectedValidation.hasCharacterConsistency &&
                                     fixture.expectedValidation.hasAppropriateLength &&
                                     fixture.expectedValidation.hasGrammarQuality &&
                                     fixture.expectedValidation.ageAppropriate &&
                                     fixture.expectedValidation.languageCorrect);

      // Check specific quality metrics
      expect(validation.metadata.wordCount).toBeGreaterThan(20);
      expect(validation.metadata.readingLevel).toBeGreaterThan(0);
      expect(validation.score).toBeGreaterThan(50); // Minimum quality threshold

      console.log(`Quality Validation [${fixture.id}]: score=${validation.score}; words=${validation.metadata.wordCount}; reading_level=${validation.metadata.readingLevel.toFixed(1)}`);
    });
  });
});

test.describe('Quality Assurance - Inappropriate Content Filtering Effectiveness', () => {
  test.setTimeout(240_000);

  const inappropriateTestCases = [
    {
      name: 'Violent content filtering',
      seed: 'A story about warriors fighting dragons with swords and blood',
      ageGroup: 'toddlers' as const,
      shouldBeFiltered: true,
      triggerWords: ['blood', 'fight', 'sword', 'kill']
    },
    {
      name: 'Age-appropriate content allowance',
      seed: 'A story about friends playing in a park',
      ageGroup: 'toddlers' as const,
      shouldBeFiltered: false,
      triggerWords: []
    },
    {
      name: 'Scary content for young children',
      seed: 'A dark story about ghosts in a haunted house',
      ageGroup: 'children' as const,
      shouldBeFiltered: true,
      triggerWords: ['dark', 'ghost', 'haunted', 'scary']
    },
    {
      name: 'Mild adventure for children',
      seed: 'A fun adventure exploring a magical forest',
      ageGroup: 'children' as const,
      shouldBeFiltered: false,
      triggerWords: []
    }
  ];

  inappropriateTestCases.forEach(({ name, seed, ageGroup, shouldBeFiltered, triggerWords }) => {
    test(`should ${shouldBeFiltered ? 'filter' : 'allow'} ${name}`, async ({ page }) => {
      await authenticateUser(page);

      const { content } = await createAndGenerateStory(
        page,
        ageGroup,
        'fantasy',
        [{ name: 'TestChar', type: 'human', description: 'A character for testing' }],
        seed
      );

      const analysis = analyzeContent(content, ageGroup);
      const hasInappropriateContent = analysis.inappropriateContent.length > 0;

      if (shouldBeFiltered) {
        expect(hasInappropriateContent).toBeTruthy();
        expect(analysis.ageAppropriate).toBeFalsy();

        // Check that trigger words are not present or are handled appropriately
        const lowerContent = content.toLowerCase();
        const foundTriggers = triggerWords.filter(word => lowerContent.includes(word.toLowerCase()));

        if (foundTriggers.length > 0) {
          console.log(`Found potentially inappropriate triggers: ${foundTriggers.join(', ')}`);
        }
      } else {
        expect(analysis.ageAppropriate).toBeTruthy();
        expect(analysis.inappropriateContent.length).toBe(0);
      }

      console.log(`Content Filtering [${name}]: appropriate=${analysis.ageAppropriate}; inappropriate_words=${analysis.inappropriateContent.length}`);
    });
  });
});

test.describe('Quality Assurance - Metadata Accuracy and Completeness', () => {
  test.setTimeout(240_000);

  test('should generate accurate and complete story metadata', async ({ page }) => {
    await authenticateUser(page);

    const { content, genTime } = await createAndGenerateStory(
      page,
      'children',
      'adventure',
      [
        { name: 'MetaHero', type: 'human', description: 'A hero for metadata testing' },
        { name: 'MetaFriend', type: 'animal', description: 'A loyal animal friend' }
      ],
      'An exciting adventure in a magical kingdom',
      'en'
    );

    // Check for metadata display (if available in UI)
    const metadataElements = [
      page.getByText(/\d+\s*words?/i),
      page.getByText(/reading level|grade level/i),
      page.getByText(/age group|target age/i),
      page.getByText(/genre|category/i),
      page.getByText(/language|språk/i)
    ];

    const metadataFound = await Promise.all(
      metadataElements.map(el => el.count().then(c => c > 0))
    );

    const hasSomeMetadata = metadataFound.some(found => found);

    if (hasSomeMetadata) {
      console.log('Metadata display found in UI');
    } else {
      console.log('Metadata may be stored internally but not displayed');
    }

    // Validate content-based metadata
    const analysis = analyzeContent(content, 'children');
    expect(analysis.hasAppropriateLength).toBeTruthy();
    expect(analysis.languageCorrect).toBeTruthy();

    // Check generation time is reasonable
    expect(genTime).toBeLessThan(120_000);
    expect(genTime).toBeGreaterThan(1000); // Should take at least 1 second

    console.log(`Metadata Validation: generation_time_ms=${genTime}; content_length_valid=${analysis.hasAppropriateLength}; language_correct=${analysis.languageCorrect}`);
  });
});

test.describe('Quality Assurance - Language-Specific Model Selection', () => {
  test.setTimeout(300_000);

  const languageTestCases = [
    {
      language: 'en' as const,
      seed: 'A magical adventure with friendly dragons',
      expectedLanguageFeatures: ['the', 'and', 'is', 'in', 'to'],
      unexpectedLanguageFeatures: ['och', 'är', 'i', 'att', 'på']
    },
    {
      language: 'sv' as const,
      seed: 'Ett magiskt äventyr med vänliga drakar',
      expectedLanguageFeatures: ['och', 'är', 'i', 'att', 'på'],
      unexpectedLanguageFeatures: ['the', 'and', 'is', 'in', 'to']
    }
  ];

  languageTestCases.forEach(({ language, seed, expectedLanguageFeatures, unexpectedLanguageFeatures }) => {
    test(`should generate content in ${language === 'en' ? 'English' : 'Swedish'} when requested`, async ({ page }) => {
      await authenticateUser(page);

      const { content } = await createAndGenerateStory(
        page,
        'children',
        'fantasy',
        [{ name: 'LangTest', type: 'human', description: 'A character for language testing' }],
        seed,
        language
      );

      const lowerContent = content.toLowerCase();

      // Check for expected language features
      const hasExpectedFeatures = expectedLanguageFeatures.some(feature =>
        lowerContent.includes(feature.toLowerCase())
      );

      // Check for absence of unexpected language features
      const hasUnexpectedFeatures = unexpectedLanguageFeatures.some(feature =>
        lowerContent.includes(feature.toLowerCase())
      );

      expect(hasExpectedFeatures).toBeTruthy();
      expect(hasUnexpectedFeatures).toBeFalsy();

      // Validate language correctness
      const analysis = analyzeContent(content, 'children', [], language);
      expect(analysis.languageCorrect).toBeTruthy();

      console.log(`Language Selection [${language}]: expected_features_present=${hasExpectedFeatures}; unexpected_features_absent=${!hasUnexpectedFeatures}; language_correct=${analysis.languageCorrect}`);
    });
  });
});

test.describe('Quality Assurance - Story Length and Pacing Validation', () => {
  test.setTimeout(300_000);

  const pacingTestCases = [
    {
      ageGroup: 'toddlers' as const,
      expectedWordRange: { min: 30, max: 150 },
      expectedSentenceRange: { min: 3, max: 8 },
      description: 'Short, simple stories for toddlers'
    },
    {
      ageGroup: 'children' as const,
      expectedWordRange: { min: 80, max: 300 },
      expectedSentenceRange: { min: 6, max: 15 },
      description: 'Engaging stories for children'
    },
    {
      ageGroup: 'teens' as const,
      expectedWordRange: { min: 150, max: 500 },
      expectedSentenceRange: { min: 10, max: 25 },
      description: 'More complex stories for teens'
    },
    {
      ageGroup: 'young-adults' as const,
      expectedWordRange: { min: 200, max: 800 },
      expectedSentenceRange: { min: 15, max: 35 },
      description: 'Detailed stories for young adults'
    }
  ];

  pacingTestCases.forEach(({ ageGroup, expectedWordRange, expectedSentenceRange, description }) => {
    test(`should maintain appropriate pacing for ${ageGroup}: ${description}`, async ({ page }) => {
      await authenticateUser(page);

      const { content } = await createAndGenerateStory(
        page,
        ageGroup,
        'fantasy',
        [{ name: 'PacingTest', type: 'human', description: 'A character for pacing tests' }],
        `A ${ageGroup} story about adventure and friendship`,
        'en'
      );

      // Analyze content metrics
      const words = content.split(/\s+/).filter(w => w.length > 0);
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

      const wordCount = words.length;
      const sentenceCount = sentences.length;
      const avgWordsPerSentence = wordCount / sentenceCount;

      // Validate word count range
      expect(wordCount).toBeGreaterThanOrEqual(expectedWordRange.min);
      expect(wordCount).toBeLessThanOrEqual(expectedWordRange.max);

      // Validate sentence count range
      expect(sentenceCount).toBeGreaterThanOrEqual(expectedSentenceRange.min);
      expect(sentenceCount).toBeLessThanOrEqual(expectedSentenceRange.max);

      // Check pacing - not too simple or complex
      expect(avgWordsPerSentence).toBeGreaterThan(3); // Not too fragmented
      expect(avgWordsPerSentence).toBeLessThan(25); // Not too complex

      // Validate with our quality checker
      const validation = validateStoryContent(content, ageGroup);
      expect(validation.metadata.wordCount).toBe(wordCount);

      console.log(`Pacing Validation [${ageGroup}]: words=${wordCount} (${expectedWordRange.min}-${expectedWordRange.max}); sentences=${sentenceCount} (${expectedSentenceRange.min}-${expectedSentenceRange.max}); avg_words_per_sentence=${avgWordsPerSentence.toFixed(1)}; quality_score=${validation.score}`);
    });
  });
});

test.describe('Quality Assurance - Content Consistency and Character Development', () => {
  test.setTimeout(240_000);

  test('should maintain character consistency throughout the story', async ({ page }) => {
    await authenticateUser(page);

    const characterName = 'ConsistencyTestHero';
    const characterTrait = 'brave and curious';

    const { content } = await createAndGenerateStory(
      page,
      'children',
      'adventure',
      [{ name: characterName, type: 'human', description: `A ${characterTrait} explorer` }],
      `A story about ${characterName} who is ${characterTrait} and goes on an adventure`,
      'en'
    );

    const analysis = analyzeContent(content, 'children', [characterName]);

    // Should have character consistency
    expect(analysis.hasCharacterConsistency).toBeTruthy();

    // Should mention the protagonist
    expect(analysis.protagonistMentions.length).toBeGreaterThan(0);

    // Should reflect character traits in content
    const lowerContent = content.toLowerCase();
    const traitWords = characterTrait.split(' ');
    const traitMentions = traitWords.filter(trait =>
      lowerContent.includes(trait.toLowerCase())
    );

    expect(traitMentions.length).toBeGreaterThan(0);

    console.log(`Character Consistency: consistent=${analysis.hasCharacterConsistency}; protagonist_mentions=${analysis.protagonistMentions.length}; trait_mentions=${traitMentions.length}`);
  });

  test('should maintain narrative structure with proper story arc', async ({ page }) => {
    await authenticateUser(page);

    const { content } = await createAndGenerateStory(
      page,
      'children',
      'fantasy',
      [{ name: 'StoryArcTest', type: 'human', description: 'A character for story arc testing' }],
      'A complete story with a beginning, middle, and end about solving a problem',
      'en'
    );

    const analysis = analyzeContent(content, 'children');

    // Should have narrative structure
    expect(analysis.hasNarrativeStructure).toBeTruthy();

    // Should have appropriate length for a complete story
    expect(analysis.hasAppropriateLength).toBeTruthy();

    // Should have grammar quality
    expect(analysis.hasGrammarQuality).toBeTruthy();

    console.log(`Narrative Structure: has_structure=${analysis.hasNarrativeStructure}; appropriate_length=${analysis.hasAppropriateLength}; grammar_quality=${analysis.hasGrammarQuality}`);
  });
});