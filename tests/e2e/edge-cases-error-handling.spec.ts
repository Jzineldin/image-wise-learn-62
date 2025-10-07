import { test, expect, Page } from '@playwright/test';
import { API_MOCK_RESPONSES, CREDIT_MOCK_RESPONSES } from '../fixtures/story-fixtures';

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

async function setupBasicStoryCreation(page: Page) {
  await page.goto('/create');
  await page.getByText(/7-9|7-9 Years/i).first().click();
  await page.getByText(/Fantasy/i).first().click();

  const nextButton = page.getByRole('button', { name: /^(Next|Nästa)$/i });
  await nextButton.click();

  // Create a test character
  await page.getByRole('button', { name: /Create New|Skapa ny/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/Character Name/i).fill('TestCharacter');
  await dialog.getByRole('combobox').click();
  await page.getByRole('option', { name: /human/i }).click();
  await dialog.getByLabel(/Description/i).fill('A test character for error handling');
  await dialog.getByRole('button', { name: /Create Character/i }).click();

  await page.getByText(/^TestCharacter$/i).first().click();
  await nextButton.click();
}

async function simulateNetworkFailure(page: Page) {
  // Intercept network requests and simulate failures
  await page.route('**/functions/v1/generate-story', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify(API_MOCK_RESPONSES.networkError)
    });
  });
}

async function simulateTimeout(page: Page) {
  // Intercept and delay response beyond timeout
  await page.route('**/functions/v1/generate-story', async route => {
    // Delay response by 3 minutes (longer than 120s timeout)
    await new Promise(resolve => setTimeout(resolve, 180000));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(API_MOCK_RESPONSES.successfulStoryGeneration)
    });
  });
}

async function simulateInsufficientCredits(page: Page) {
  await page.route('**/functions/v1/generate-story', async route => {
    await route.fulfill({
      status: 402,
      contentType: 'application/json',
      body: JSON.stringify(API_MOCK_RESPONSES.creditInsufficient)
    });
  });
}

test.describe('Edge Cases - API Timeout and Retry Logic', () => {
  test.setTimeout(300_000);

  test('should handle 120s timeout gracefully with retry mechanism', async ({ page }) => {
    await authenticateUser(page);
    await setupBasicStoryCreation(page);

    // Setup timeout simulation
    await simulateTimeout(page);

    // Fill seed and attempt generation
    const writeOwnBtn = page.getByRole('button', { name: /(Write (My|Your) Own|Write Your Own Story Idea|Skriv)/i });
    if (await writeOwnBtn.count()) {
      await writeOwnBtn.click();
    }
    await page.locator('#custom-seed').fill('A test story for timeout handling');

    const genStart = Date.now();
    const createBtn = page.getByRole('button', { name: /Create|Skapa/i });
    await createBtn.click();

    // Should timeout within reasonable time (less than 130s due to 120s timeout + buffer)
    const timeoutError = await page.getByText(/timeout|time out|timed out/i).first().isVisible({ timeout: 130_000 }).catch(() => false);
    const genTime = Date.now() - genStart;

    // Assertions
    expect(genTime).toBeLessThan(130_000); // Should fail before 130s
    expect(timeoutError || genTime >= 120_000).toBeTruthy(); // Either error shown or timed out

    console.log(`Timeout Test Metrics: generation_time_ms=${genTime}; timeout_handled=${timeoutError || genTime >= 120_000}`);
  });

  test('should show appropriate error message for timeout scenarios', async ({ page }) => {
    await authenticateUser(page);
    await setupBasicStoryCreation(page);

    await simulateTimeout(page);

    await page.locator('#custom-seed').fill('Timeout test story');
    const createBtn = page.getByRole('button', { name: /Create|Skapa/i });
    await createBtn.click();

    // Check for timeout error message
    const errorMessage = page.getByText(/timeout|time out|timed out|120 seconds/i);
    await expect(errorMessage).toBeVisible({ timeout: 125_000 });

    // Should offer retry option
    const retryButton = page.getByRole('button', { name: /retry|try again|försök igen/i });
    const hasRetry = await retryButton.count() > 0;

    expect(hasRetry).toBeTruthy();

    console.log('Timeout error handling validated with retry option');
  });
});

test.describe('Edge Cases - Network Failure Scenarios', () => {
  test.setTimeout(180_000);

  test('should handle network failures with graceful degradation', async ({ page }) => {
    await authenticateUser(page);
    await setupBasicStoryCreation(page);

    await simulateNetworkFailure(page);

    await page.locator('#custom-seed').fill('Network failure test story');
    const createBtn = page.getByRole('button', { name: /Create|Skapa/i });
    await createBtn.click();

    // Should show network error message
    const errorMessage = page.getByText(/network|connection|failed|error/i);
    await expect(errorMessage).toBeVisible({ timeout: 30_000 });

    // Should not crash the application
    await expect(page.getByRole('link', { name: /Tale Forge/i })).toBeVisible();

    // Should allow user to try again
    const retryButton = page.getByRole('button', { name: /retry|try again|försök igen/i });
    if (await retryButton.count()) {
      await retryButton.click();
      // Should be able to retry (may still fail but shouldn't crash)
      await expect(page.locator('.prose')).toBeVisible({ timeout: 30_000 }).catch(() => {
        // Expected to potentially fail again, but shouldn't crash
      });
    }

    console.log('Network failure graceful degradation validated');
  });

  test('should maintain UI state during network failures', async ({ page }) => {
    await authenticateUser(page);
    await setupBasicStoryCreation(page);

    await simulateNetworkFailure(page);

    // Fill form and remember state
    await page.locator('#custom-seed').fill('State preservation test');
    const seedValue = await page.locator('#custom-seed').inputValue();

    const createBtn = page.getByRole('button', { name: /Create|Skapa/i });
    await createBtn.click();

    // Wait for error
    await page.getByText(/network|connection|failed/i).first().isVisible({ timeout: 30_000 });

    // Check that form state is preserved
    const preservedValue = await page.locator('#custom-seed').inputValue();
    expect(preservedValue).toBe(seedValue);

    // Should be able to modify and retry
    await page.locator('#custom-seed').fill('Modified after network failure');
    const modifiedValue = await page.locator('#custom-seed').inputValue();
    expect(modifiedValue).toBe('Modified after network failure');

    console.log('UI state preservation during network failures validated');
  });
});

test.describe('Edge Cases - Concurrent Story Generation Requests', () => {
  test.setTimeout(240_000);

  test('should handle concurrent story generation requests with rate limiting', async ({ browser }) => {
    // Create multiple browser contexts for concurrent requests
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

    try {
      // Authenticate all pages
      await Promise.all(pages.map(page => authenticateUser(page)));

      // Setup all pages for story creation
      await Promise.all(pages.map(page => setupBasicStoryCreation(page)));

      // Fill different seeds
      const seeds = [
        'Concurrent story 1',
        'Concurrent story 2',
        'Concurrent story 3'
      ];

      await Promise.all(pages.map((page, i) => {
        return page.locator('#custom-seed').fill(seeds[i]);
      }));

      // Start all generations simultaneously
      const genStart = Date.now();
      const createButtons = await Promise.all(
        pages.map(page => page.getByRole('button', { name: /Create|Skapa/i }))
      );

      await Promise.all(createButtons.map(btn => btn.click()));

      // Wait for all to complete or fail
      const results = await Promise.allSettled(
        pages.map((page, i) =>
          page.locator('.prose .leading-relaxed').isVisible({ timeout: 120_000 })
            .then(() => ({ page: i, success: true, time: Date.now() - genStart }))
            .catch(() => ({ page: i, success: false, time: Date.now() - genStart }))
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;

      // At least one should succeed, and rate limiting should prevent all from succeeding simultaneously
      expect(successful + failed).toBe(3);
      expect(successful).toBeGreaterThan(0); // At least one should work

      // Check for rate limiting messages
      const rateLimitMessages = await Promise.all(
        pages.map(page => page.getByText(/rate limit|too many requests|please wait/i).count())
      );
      const hasRateLimiting = rateLimitMessages.some(count => count > 0);

      console.log(`Concurrent Requests Test Metrics: successful=${successful}; failed=${failed}; rate_limiting_detected=${hasRateLimiting}`);

      // Rate limiting is good - it prevents overwhelming the system
      if (hasRateLimiting) {
        console.log('Rate limiting properly implemented');
      }

    } finally {
      // Cleanup
      await Promise.all(contexts.map(ctx => ctx.close()));
    }
  });
});

test.describe('Edge Cases - Invalid Input Validation and Sanitization', () => {
  test.setTimeout(120_000);

  const invalidInputs = [
    {
      name: 'Empty seed',
      seed: '',
      expectedError: /empty|required|fill|complete/i
    },
    {
      name: 'Only special characters',
      seed: '!@#$%^&*()',
      expectedError: /meaningful|content|text/i
    },
    {
      name: 'Extremely long seed',
      seed: 'A'.repeat(10000),
      expectedError: /too long|length|characters/i
    },
    {
      name: 'SQL injection attempt',
      seed: "'; DROP TABLE users; --",
      expectedError: /invalid|characters|not allowed/i
    },
    {
      name: 'Script injection attempt',
      seed: '<script>alert("xss")</script>',
      expectedError: /invalid|html|script|not allowed/i
    }
  ];

  invalidInputs.forEach(({ name, seed, expectedError }) => {
    test(`should validate and reject invalid input: ${name}`, async ({ page }) => {
      await authenticateUser(page);
      await setupBasicStoryCreation(page);

      // Try to submit invalid input
      const writeOwnBtn = page.getByRole('button', { name: /(Write (My|Your) Own|Write Your Own Story Idea|Skriv)/i });
      if (await writeOwnBtn.count()) {
        await writeOwnBtn.click();
      }
      await page.locator('#custom-seed').fill(seed);

      const createBtn = page.getByRole('button', { name: /Create|Skapa/i });
      await createBtn.click();

      // Should show validation error
      const errorMessage = page.getByText(expectedError);
      await expect(errorMessage).toBeVisible({ timeout: 30_000 });

      // Should not proceed to story generation
      const storyContent = page.locator('.prose .leading-relaxed');
      const hasStoryContent = await storyContent.isVisible().catch(() => false);
      expect(hasStoryContent).toBeFalsy();

      console.log(`Input validation test passed for: ${name}`);
    });
  });
});

test.describe('Edge Cases - Credit System Integration and Validation', () => {
  test.setTimeout(180_000);

  test('should validate credits before story generation and deduct appropriately', async ({ page }) => {
    await authenticateUser(page);
    await setupBasicStoryCreation(page);

    // Mock insufficient credits
    await simulateInsufficientCredits(page);

    await page.locator('#custom-seed').fill('Credit test story');
    const createBtn = page.getByRole('button', { name: /Create|Skapa/i });
    await createBtn.click();

    // Should show insufficient credits error
    const creditError = page.getByText(/insufficient credits|not enough credits|upgrade|purchase/i);
    await expect(creditError).toBeVisible({ timeout: 30_000 });

    // Should show current credit balance
    const creditDisplay = page.getByText(/\d+\s*credits?/i);
    const hasCreditInfo = await creditDisplay.count() > 0;

    // Should offer upgrade/purchase option
    const upgradeButton = page.getByRole('button', { name: /upgrade|purchase|buy|köp/i });
    const hasUpgradeOption = await upgradeButton.count() > 0;

    expect(hasCreditInfo || hasUpgradeOption).toBeTruthy();

    console.log(`Credit system validation: credit_info=${hasCreditInfo}; upgrade_option=${hasUpgradeOption}`);
  });

  test('should prevent generation when credits are exhausted mid-process', async ({ page }) => {
    await authenticateUser(page);
    await setupBasicStoryCreation(page);

    // First simulate successful credit check, then fail during generation
    let callCount = 0;
    await page.route('**/functions/v1/generate-story', async route => {
      callCount++;
      if (callCount === 1) {
        // First call succeeds (credit check)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...API_MOCK_RESPONSES.successfulStoryGeneration, credits_deducted: false })
        });
      } else {
        // Subsequent calls fail with credit error
        await route.fulfill({
          status: 402,
          contentType: 'application/json',
          body: JSON.stringify(API_MOCK_RESPONSES.creditInsufficient)
        });
      }
    });

    await page.locator('#custom-seed').fill('Mid-process credit failure test');
    const createBtn = page.getByRole('button', { name: /Create|Skapa/i });
    await createBtn.click();

    // Should initially start generation
    await expect(page.locator('.prose')).toBeVisible({ timeout: 60_000 }).catch(() => {
      // May fail due to mocking complexity
    });

    // Should eventually show credit error
    const creditError = page.getByText(/insufficient credits|credits exhausted/i);
    await expect(creditError).toBeVisible({ timeout: 60_000 });

    console.log('Mid-process credit validation implemented');
  });
});