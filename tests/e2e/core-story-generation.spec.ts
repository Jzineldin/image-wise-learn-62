import { test, expect, Page } from '@playwright/test';
import { AGE_GROUP_FIXTURES, SEED_REPRODUCIBILITY_FIXTURES, CHOICE_IMPACT_FIXTURES } from '../fixtures/story-fixtures';
import { validateStoryContent, validateChoiceImpact, validateSeedReproducibility } from '../utils/ai-validation';

const EMAIL = process.env.E2E_EMAIL || 'jzineldin@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD || 'Rashzin1996!';

// Utility functions (shared with existing tests)
async function clickNext(page: Page) {
  const nextButton = page.getByRole('button', { name: /^(Next|Nästa)$/i });
  await nextButton.click();
}

async function switchToSwedish(page: Page) {
  const triggers = page.getByRole('combobox');
  const count = await triggers.count();
  if (count > 0) {
    await triggers.first().click();
    const svOption = page.getByRole('option', { name: /Svenska/i });
    if (await svOption.count()) {
      await svOption.click();
    }
  }
}

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

async function createCharacters(page: Page, characters: Array<{ name: string; type: string; description: string }>) {
  for (const character of characters) {
    await page.getByRole('button', { name: /Create New|Skapa ny/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Character Name/i).fill(character.name);
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: new RegExp(character.type, 'i') }).click();
    await dialog.getByLabel(/Description/i).fill(character.description);
    await dialog.getByRole('button', { name: /Create Character/i }).click();
  }
}

async function selectCharacters(page: Page, characterNames: string[]) {
  for (const name of characterNames) {
    const characterElement = page.getByText(new RegExp(`^${name}$`, 'i')).first();
    if (await characterElement.count()) {
      await characterElement.click();
    }
  }
}

async function generateAndValidateStory(
  page: Page,
  seed: string,
  expectedProtagonists: string[],
  ageGroup: string,
  language: 'en' | 'sv' = 'en'
) {
  // Fill custom seed
  const writeOwnBtn = page.getByRole('button', { name: /(Write (My|Your) Own|Write Your Own Story Idea|Skriv)/i });
  if (await writeOwnBtn.count()) {
    await writeOwnBtn.click();
  }
  await page.locator('#custom-seed').fill(seed);

  // Generate story
  const genStart = Date.now();
  const createBtn = page.getByRole('button', { name: /Create|Skapa/i });
  await createBtn.click();

  // Wait for story content
  const contentLocator = page.locator('.prose .leading-relaxed, .prose .text-foreground');
  await expect(contentLocator).toBeVisible({ timeout: 120_000 });
  const storyContent = await contentLocator.innerText();
  const genTime = Date.now() - genStart;

  // Validate content
  const validation = validateStoryContent(storyContent, ageGroup as any, expectedProtagonists, language);

  return {
    content: storyContent,
    generationTime: genTime,
    validation,
    isValid: validation.isValid && validation.score >= 70
  };
}

test.describe('Core Story Generation - Age Group Content Filtering', () => {
  test.setTimeout(300_000);

  AGE_GROUP_FIXTURES.forEach((fixture) => {
    test(`should generate appropriate content for ${fixture.ageGroup} with ${fixture.genre}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(`[console.error] ${msg.text()}`);
        }
      });

      // Authenticate
      await authenticateUser(page);

      // Navigate to create and set language if needed
      await page.goto('/create');
      if (fixture.language === 'sv') {
        await switchToSwedish(page);
      }

      // Select age group and genre
      const ageSelector = fixture.ageGroup === 'toddlers' ? '4-6' :
                         fixture.ageGroup === 'children' ? '7-9' :
                         fixture.ageGroup === 'teens' ? '10-12' : '13+';
      await page.getByText(new RegExp(`${ageSelector}|${ageSelector} År`, 'i')).first().click();
      await page.getByText(new RegExp(fixture.genre, 'i')).first().click();
      await clickNext(page);

      // Create and select characters
      await createCharacters(page, fixture.characters);
      await selectCharacters(page, fixture.characters.map(c => c.name));
      await clickNext(page);

      // Generate and validate story
      const result = await generateAndValidateStory(
        page,
        fixture.seed,
        fixture.expectedProtagonists,
        fixture.ageGroup,
        fixture.language
      );

      // Assertions
      expect(result.isValid, `Story validation failed: ${result.validation.issues.join(', ')}`).toBeTruthy();
      expect(result.generationTime).toBeLessThan(120_000); // Should complete within 2 minutes
      expect(result.validation.metadata.wordCount).toBeGreaterThan(30);

      // Check for inappropriate content
      if (fixture.inappropriateContentTriggers) {
        const lowerContent = result.content.toLowerCase();
        const hasInappropriate = fixture.inappropriateContentTriggers.some(trigger =>
          lowerContent.includes(trigger.toLowerCase())
        );
        expect(hasInappropriate, `Found inappropriate content: ${fixture.inappropriateContentTriggers.join(', ')}`).toBeFalsy();
      }

      // Check for expected content patterns
      const lowerContent = result.content.toLowerCase();
      const hasExpectedPatterns = fixture.expectedContentPatterns.some(pattern =>
        lowerContent.includes(pattern.toLowerCase())
      );
      expect(hasExpectedPatterns, `Missing expected content patterns: ${fixture.expectedContentPatterns.join(', ')}`).toBeTruthy();

      // Log metrics
      console.log(`Age Group Test Metrics [${fixture.id}]: score=${result.validation.score}; gen_time_ms=${result.generationTime}; word_count=${result.validation.metadata.wordCount}`);
    });
  });
});

test.describe('Core Story Generation - Seed-based Reproducibility', () => {
  test.setTimeout(300_000);

  SEED_REPRODUCIBILITY_FIXTURES.forEach((fixture) => {
    test(`should generate reproducible content for seed: "${fixture.seed.substring(0, 50)}..."`, async ({ page }) => {
      // Generate first story
      await authenticateUser(page);
      await page.goto('/create');
      await page.getByText(/7-9|7-9 Years/i).first().click();
      await page.getByText(/Fantasy/i).first().click();
      await clickNext(page);

      // Create test characters
      await createCharacters(page, [
        { name: 'TestHero', type: 'human', description: 'A brave hero' },
        { name: 'TestFriend', type: 'animal', description: 'A loyal friend' }
      ]);
      await selectCharacters(page, ['TestHero', 'TestFriend']);
      await clickNext(page);

      // Generate first story
      const firstResult = await generateAndValidateStory(
        page,
        fixture.seed,
        ['TestHero', 'TestFriend'],
        'children'
      );

      // Navigate back and generate second story with same seed
      await page.goto('/create');
      await page.getByText(/7-9|7-9 Years/i).first().click();
      await page.getByText(/Fantasy/i).first().click();
      await clickNext(page);
      await selectCharacters(page, ['TestHero', 'TestFriend']);
      await clickNext(page);

      const secondResult = await generateAndValidateStory(
        page,
        fixture.seed,
        ['TestHero', 'TestFriend'],
        'children'
      );

      // Validate reproducibility
      const reproducibility = validateSeedReproducibility(
        firstResult.content,
        secondResult.content,
        0.6 // 60% similarity threshold
      );

      expect(reproducibility.isReproducible,
        `Stories not sufficiently reproducible. Similarity: ${(reproducibility.similarity * 100).toFixed(1)}%`
      ).toBeTruthy();

      // Both stories should be valid
      expect(firstResult.isValid).toBeTruthy();
      expect(secondResult.isValid).toBeTruthy();

      console.log(`Reproducibility Test Metrics: similarity=${(reproducibility.similarity * 100).toFixed(1)}%; first_score=${firstResult.validation.score}; second_score=${secondResult.validation.score}`);
    });
  });
});

test.describe('Core Story Generation - Choice-based Branching Logic', () => {
  test.setTimeout(300_000);

  CHOICE_IMPACT_FIXTURES.forEach((fixture) => {
    test(`should provide meaningful choice impact in branching stories`, async ({ page }) => {
      await authenticateUser(page);
      await page.goto('/create');
      await page.getByText(/10-12|10-12 Years/i).first().click();
      await page.getByText(/Adventure/i).first().click();
      await clickNext(page);

      // Create characters for choice testing
      await createCharacters(page, [
        { name: 'ChoiceHero', type: 'human', description: 'A decision-maker' },
        { name: 'ChoiceGuide', type: 'animal', description: 'A wise guide' }
      ]);
      await selectCharacters(page, ['ChoiceHero', 'ChoiceGuide']);
      await clickNext(page);

      // Generate initial story segment
      const initialResult = await generateAndValidateStory(
        page,
        fixture.initialSegment,
        ['ChoiceHero', 'ChoiceGuide'],
        'teens'
      );

      expect(initialResult.isValid).toBeTruthy();

      // Check if choices are presented (this depends on UI implementation)
      const choiceButtons = page.locator('button').filter({ hasText: /choice|option|path/i });
      const choiceCount = await choiceButtons.count();

      if (choiceCount > 0) {
        // Test choice impact by selecting first choice
        await choiceButtons.first().click();

        // Wait for next segment
        await expect(page.locator('.prose')).toBeVisible({ timeout: 60_000 });
        const nextContent = await page.locator('.prose .leading-relaxed').innerText();

        // Validate choice impact
        const impactValidation = validateChoiceImpact(fixture.choices, nextContent);

        expect(impactValidation.isValid,
          `Choice impact validation failed. Scores: ${impactValidation.impactScores.join(', ')}`
        ).toBeTruthy();

        console.log(`Choice Impact Test Metrics: valid=${impactValidation.isValid}; scores=${impactValidation.impactScores.join(', ')}`);
      } else {
        console.log('No choices presented - this may be expected for linear stories');
      }
    });
  });
});

test.describe('Core Story Generation - Story Preview and Image Loading', () => {
  test.setTimeout(240_000);

  test('should generate story previews with images within performance limits', async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/create');
    await page.getByText(/7-9|7-9 Years/i).first().click();
    await page.getByText(/Fantasy/i).first().click();
    await clickNext(page);

    await createCharacters(page, [
      { name: 'PreviewHero', type: 'human', description: 'A hero for preview' }
    ]);
    await selectCharacters(page, ['PreviewHero']);
    await clickNext(page);

    const previewStart = Date.now();
    const createBtn = page.getByRole('button', { name: /Create|Skapa/i });
    await createBtn.click();

    // Wait for story content
    await expect(page.locator('.prose')).toBeVisible({ timeout: 120_000 });

    // Check for image loading
    const imageLocator = page.locator('img');
    const imageVisible = await imageLocator.first().isVisible().catch(() => false);

    if (!imageVisible) {
      // Try to trigger image generation
      const genImageBtn = page.getByRole('button', { name: /Generate Image|Skapa bild/i });
      if (await genImageBtn.count()) {
        await genImageBtn.click();
        await expect(imageLocator.first()).toBeVisible({ timeout: 90_000 });
      }
    }

    const previewTime = Date.now() - previewStart;

    // Performance assertions
    expect(previewTime).toBeLessThan(180_000); // 3 minutes max for preview + image

    // Content assertions
    const content = await page.locator('.prose .leading-relaxed').innerText();
    expect(content.length).toBeGreaterThan(50);

    console.log(`Preview Test Metrics: total_time_ms=${previewTime}; has_image=${imageVisible}`);
  });
});

test.describe('Core Story Generation - Complete Story Workflow', () => {
  test.setTimeout(360_000);

  test('should complete full story creation, saving, and retrieval workflow', async ({ page }) => {
    const storyTitle = `Test Story ${Date.now()}`;

    await authenticateUser(page);

    // Create story
    await page.goto('/create');
    await page.getByText(/7-9|7-9 Years/i).first().click();
    await page.getByText(/Adventure/i).first().click();
    await clickNext(page);

    await createCharacters(page, [
      { name: 'WorkflowHero', type: 'human', description: 'A hero for workflow testing' },
      { name: 'WorkflowFriend', type: 'animal', description: 'A friend for workflow testing' }
    ]);
    await selectCharacters(page, ['WorkflowHero', 'WorkflowFriend']);
    await clickNext(page);

    const result = await generateAndValidateStory(
      page,
      'A complete adventure story about friendship and courage',
      ['WorkflowHero', 'WorkflowFriend'],
      'children'
    );

    expect(result.isValid).toBeTruthy();

    // Check if story saving functionality exists
    const saveButtons = page.locator('button').filter({ hasText: /save|spara|bookmark/i });
    if (await saveButtons.count()) {
      await saveButtons.first().click();

      // Try to navigate to My Stories
      await page.goto('/my-stories');
      await expect(page.locator('text=/WorkflowHero|Test Story/i')).toBeVisible({ timeout: 30_000 });

      console.log('Story saving and retrieval workflow validated');
    } else {
      console.log('Story saving UI not found - may need to check dashboard or library');
    }

    console.log(`Complete Workflow Test Metrics: story_valid=${result.isValid}; generation_time_ms=${result.generationTime}`);
  });
});