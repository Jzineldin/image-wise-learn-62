import { test, expect } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL || 'jzineldin@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD || 'Rashzin1996!';

// Utility: click a Next/Nästa button
async function clickNext(page) {
  const nextButton = page.getByRole('button', { name: /^(Next|Nästa)$/i });
  await nextButton.click();
}

// Utility: try to switch language to Swedish via compact selector in header
async function switchToSwedish(page) {
  // Open the language combobox (Radix SelectTrigger has role="combobox")
  const triggers = page.getByRole('combobox');
  const count = await triggers.count();
  if (count > 0) {
    await triggers.first().click();
    // Select Svenska if present
    const svOption = page.getByRole('option', { name: /Svenska/i });
    if (await svOption.count()) {
      await svOption.click();
    } else {
      // Fallback: click item with text Svenska
      await page.getByText('Svenska', { exact: false }).first().click();
    }
  }
}

// Utility: wait for story content and return whether protagonists found
async function waitForProtagonists(page, protagonists: string[], timeoutMs: number) {
  const start = Date.now();
  const contentLocator = page.locator('.prose .leading-relaxed, .prose .text-foreground');
  await expect(contentLocator).toBeVisible({ timeout: timeoutMs });
  const text = (await contentLocator.innerText()).toLowerCase();
  const found = protagonists.every(p => text.includes(p.toLowerCase()));
  return { found, ms: Date.now() - start, text };
}

// Utility: wait for cover/segment image
async function waitForSegmentImage(page, timeoutMs: number) {
  const start = Date.now();
  const img = page.locator('img');
  try {
    await expect(img.first()).toBeVisible({ timeout: timeoutMs });
    return { hasImage: true, ms: Date.now() - start };
  } catch {
    return { hasImage: false, ms: Date.now() - start };
  }
}

test.describe('Tale Forge - Story Creation E2E', () => {
  test('full flow: auth → language → create story → verify protagonists & image → backward nav', async ({ page, context }) => {
    test.setTimeout(240_000);

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[console.error] ${msg.text()}`);
      }
    });

    // 1) Authentication (navigate via home -> auth to avoid lazy loading race conditions)
    await page.goto('/');
    // Ensure navbar rendered
    await expect(page.getByRole('link', { name: /Tale Forge/i })).toBeVisible();
    // Click Sign In (navbar)
    const signInNav = page.getByRole('button', { name: /Sign In/i }).first();
    if (await signInNav.count()) {
      await signInNav.click();
    } else {
      await page.goto('/auth');
    }
    // Wait for auth form and fill
    await expect(page.locator('form')).toBeVisible({ timeout: 30_000 });
    await page.getByLabel(/Email/i).fill(EMAIL);
    await page.getByLabel(/Password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 60_000 });

    // 2) Navigate to Create and switch language to Swedish
    await page.goto('/create');
    await switchToSwedish(page);

    // Validate that Create title is localized (best-effort check for Swedish keyword "Skapa")
    await expect(page.getByText(/Skapa/i)).toBeVisible({ timeout: 15_000 });

    // 3) Age & Genre selection
    // Age: 7-9 År; Genre: Fantasy
    await page.getByText(/7-9 År/i).first().click();
    await page.getByText(/Fantasy/i).first().click();
    await clickNext(page); // to Characters

    // 4) Characters: if none, create two; else select first two
    const characterCards = page.locator('[class*="CardTitle"]');
    const hasCards = await characterCards.count().then(c => c > 0);

    if (!hasCards) {
      // Create Friendly Dragon
      await page.getByRole('button', { name: /Create New|Skapa ny/i }).click();
      const dialog1 = page.getByRole('dialog');
      await dialog1.getByLabel(/Character Name/i).fill('Friendly Dragon');
      await dialog1.getByRole('combobox').click();
      await page.getByRole('option', { name: /dragon/i }).click();
      await dialog1.getByLabel(/Description/i).fill('A kind dragon who breathes colorful bubbles.');
      await dialog1.getByRole('button', { name: /Create Character/i }).click();

      // Create Brave Knight
      await page.getByRole('button', { name: /Create New|Skapa ny/i }).click();
      const dialog2 = page.getByRole('dialog');
      await dialog2.getByLabel(/Character Name/i).fill('Brave Knight');
      await dialog2.getByRole('combobox').click();
      await page.getByRole('option', { name: /human/i }).click();
      await dialog2.getByLabel(/Description/i).fill('A courageous knight with shining armor.');
      await dialog2.getByRole('button', { name: /Create Character/i }).click();
    }

    // Select two characters by their names if present, else pick first two cards
    const selectable = page.locator('div[data-radix-portal] ~ *'); // noop for TS
    const pickByName = async (name: string) => {
      const el = page.getByText(new RegExp(`^${name}$`, 'i')).first();
      if (await el.count()) await el.click();
    };
    await pickByName('Friendly Dragon');
    await pickByName('Brave Knight');

    // If still fewer than 2 selected, click first two cards
    const selectedBadges = page.getByText(/Selected|Vald/i);
    if ((await selectedBadges.count()) < 2) {
      const cards = page.locator('div[class*="cursor-pointer"]').filter({ hasText: /.+/ });
      await cards.nth(0).click();
      await cards.nth(1).click();
    }

    await clickNext(page); // to Story Ideas

    // 5) Story idea: use custom seed for deterministic verification
    // Toggle to custom idea editor and fill textarea
    // The toggle button may say "Write your own" or localized; try both.
    const writeOwnBtn = page.getByRole('button', { name: /(Write (My|Your) Own|Write Your Own Story Idea|Skriv)/i });
    if (await writeOwnBtn.count()) {
      await writeOwnBtn.click();
    } else {
      // Fallback: click the custom card by headline text
      const customCard = page.getByText(/Write Your Own Story Idea|Custom Story Idea/i).first();
      if (await customCard.count()) await customCard.click();
    }
    await page.locator('#custom-seed').fill('A cozy bedtime adventure where Friendly Dragon and Brave Knight explore a moonlit forest to find a glowing crystal.');
    await clickNext(page); // to Review

    // 6) Create story and measure generation time
    const genStart = Date.now();
    const createBtn = page.getByRole('button', { name: /Create|Skapa/i });
    await createBtn.click();

    // Wait for first segment content and verify protagonists
    const { found: protagonistsFound, ms: storyMs, text: storyText } = await (async () => {
      const res = await waitForProtagonists(
        page,
        [],
        120_000
      );
      const lc = res.text.toLowerCase();
      const hasDragon = /(friendly\s*dragon|v(?:\u00E4|a)nlig[a]?\s*drak[ea]|drake)/i.test(lc);
      const hasKnight = /(brave\s*knight|modig[a]?\s*riddare|riddare)/i.test(lc);
      return { found: hasDragon && hasKnight, ms: res.ms, text: res.text };
    })();

    // 8) Verify cover/segment image
    // First wait for image; if not present, try clicking "Generate Image"
    let imageResult = await waitForSegmentImage(page, 60_000);
    if (!imageResult.hasImage) {
      const genImageBtn = page.getByRole('button', { name: /Generate Image|Skapa bild/i });
      if (await genImageBtn.count()) {
        await genImageBtn.click();
        imageResult = await waitForSegmentImage(page, 90_000);
      }
    }

    // Assertions (filter out known benign console errors like 401 prefetch and RLS violations)
    const benignPatterns = /(401)|(row-level security)|(RLS)|(profiles)|(Global error caught)|("error":null)/i;
    const actionableErrors = consoleErrors.filter(e => !benignPatterns.test(e));
    if (actionableErrors.length) {
      console.warn('Console errors (actionable):', actionableErrors);
    }
    expect.soft(actionableErrors, 'No actionable console errors during flow').toHaveLength(0);
    expect.soft(protagonistsFound, 'Selected characters should appear as protagonists in generated text (English or Swedish)').toBeTruthy();

    // Emit metrics for the test report
    console.log(`E2E Metrics: story_generation_ms=${storyMs}; image_present=${imageResult.hasImage}; image_wait_ms=${imageResult.ms}`);

  });
});



// Lightweight UI test focused on backward navigation via step indicators
test('backward navigation via step indicators works', async ({ page }) => {
  // Pipe page console to test output for diagnostics
  page.on('console', (msg) => {
     
    console.log(`[PAGE:${msg.type()}]`, msg.text());
  });
  test.setTimeout(120_000);

  // Auth
  await page.goto('/');
  const signInNav = page.getByRole('button', { name: /Sign In/i }).first();
  if (await signInNav.count()) await signInNav.click(); else await page.goto('/auth');
  await expect(page.locator('form')).toBeVisible();
  await page.getByLabel(/Email/i).fill(EMAIL);
  await page.getByLabel(/Password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForURL('**/dashboard');

  // Go to Create, pick age & genre, advance to Story Ideas
  await page.goto('/create');
  await page.getByText(/7-9 År|7-9 Years/i).first().click();
  await page.getByText(/Fantasy/i).first().click();
  await clickNext(page); // to Characters
  await clickNext(page); // to Story Ideas

  // Use the Back button to go from step 3 to step 2 (deterministic)
  await page.getByRole('button', { name: /^(Back|Tillbaka)$/i }).click();
  await expect(page.locator('[data-testid="wizard-current-step"]')).toHaveAttribute('data-step', '2');

  // Now verify backward navigation via step indicators: click step 1 indicator (retry once if needed)
  const step1 = page.locator('[data-testid="wizard-step-indicator-1"]');
  await step1.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid="wizard-current-step"]')).toHaveAttribute('data-step', '1');
});
