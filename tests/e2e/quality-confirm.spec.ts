import { test, expect } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL || 'jzineldin@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD || 'Rashzin1996!';

const CONTENT_LOCATOR = '.prose .leading-relaxed, .prose .text-foreground';

async function login(page) {
  await page.goto('/');
  const signInNav = page.getByRole('button', { name: /Sign In/i }).first();
  if (await signInNav.count()) await signInNav.click(); else await page.goto('/auth');
  await expect(page.locator('form')).toBeVisible({ timeout: 30_000 });
  await page.getByLabel(/Email/i).fill(EMAIL);
  await page.getByLabel(/Password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 60_000 });
}

async function setLanguage(page, lang: 'en'|'sv') {
  await page.locator('[data-testid="wizard-step-age-genre"]').waitFor({ state: 'visible', timeout: 30_000 });
  // Try quick toggle if present
  const combo = page.locator('[data-testid="wizard-step-age-genre"]').getByRole('combobox').first();
  if (await combo.count()) {
    await combo.click();
    const option = lang === 'sv' ? page.getByRole('option', { name: /Svenska/i }) : page.getByRole('option', { name: /English/i });
    if (await option.count()) await option.click();
  }
}

async function selectAge(page, age: '7-9'|'10-12') {
  const img = page.locator(`img[alt="Age group ${age}"]`).first();
  await expect(img).toBeVisible();
  await img.click({ force: true });
}

async function selectGenre(page, genre: 'Adventure'|'Fantasy'|'Mystery') {
  const img = page.locator(`img[alt="Genre ${genre}"]`).first();
  await expect(img).toBeVisible();
  await img.click({ force: true });
}

async function clickNext(page) {
  await page.getByRole('button', { name: /^(Next|Nästa)$/i }).click();
}

async function ensureTwoCharacters(page) {
  await expect(page.locator('[data-testid="wizard-step-characters"]')).toBeVisible({ timeout: 30_000 });
  const ensureAtLeastTwoCards = async () => {
    for (let i = 0; i < 10; i++) {
      const count = await page.locator('div.cursor-pointer, div[class*="cursor-pointer"]').count();
      if (count >= 2) return true;
      await page.waitForTimeout(500);
    }
    return false;
  };
  if (!(await ensureAtLeastTwoCards())) {
    const createBtn = page.getByRole('button', { name: /Create New|Skapa ny/i });
    for (const [name, type] of [["Sunny Fox", /animal/i], ["Sky Wizard", /magical|wizard/i]] as const) {
      await createBtn.click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel(/Character Name/i).fill(name);
      await dialog.getByRole('combobox').click();
      await page.getByRole('option', { name: type }).click();
      await dialog.getByLabel(/Description/i).fill('QA temp character.');
      await dialog.getByRole('button', { name: /Create Character/i }).click();
      await page.waitForTimeout(400);
    }
    if (!(await ensureAtLeastTwoCards())) throw new Error('No character cards');
  }
  const cards = page.locator('div.cursor-pointer, div[class*="cursor-pointer"]').filter({ hasText: /.+/ });
  await cards.nth(0).click();
  await cards.nth(1).click();
}

async function openCustomSeedEditor(page) {
  const writeOwnBtn = page.getByRole('button', { name: /(Write (My|Your) Own|Write Your Own Story Idea|Skriv)/i });
  if (await writeOwnBtn.count()) await writeOwnBtn.click();
}

async function waitForContent(page, timeoutMs: number) {
  const start = Date.now();
  const contentLocator = page.locator(CONTENT_LOCATOR);
  await expect(contentLocator).toBeVisible({ timeout: timeoutMs });
  const text = (await contentLocator.innerText()).trim();
  return { text, ms: Date.now() - start };
}

async function extractChoices(page) {
  let btns = page.locator('button:has-text("Impact:")');
  if ((await btns.count()) === 0) btns = page.locator('button').filter({ hasText: /.{15,}/ });
  const out: string[] = [];
  for (let i = 0; i < Math.min(await btns.count(), 3); i++) {
    out.push((await btns.nth(i).innerText()).trim().replace(/\s+/g, ' '));
  }
  return out;
}

function buildSeed(age: string, genre: string, lang: 'en'|'sv', idx: number): string {
  if (lang === 'sv') return `(${age}, ${genre}) Kort öppning ${idx}: enkel start, vänlig ton, tydlig stämning.`;
  return `(${age}, ${genre}) Short opening ${idx}: simple setup, friendly tone, clear mood.`;
}

const SAMPLES: Array<{age: '7-9'|'10-12'; genre: 'Adventure'|'Fantasy'|'Mystery'; lang: 'en'|'sv'}> = [
  { age: '7-9', genre: 'Adventure', lang: 'en' },
  { age: '7-9', genre: 'Fantasy',   lang: 'sv' },
  { age: '10-12', genre: 'Mystery',  lang: 'en' },
  { age: '7-9', genre: 'Mystery',    lang: 'sv' },
  { age: '10-12', genre: 'Adventure',lang: 'en' },
  { age: '10-12', genre: 'Fantasy',  lang: 'sv' },
];

test('Quality confirm: 6-sample spot-check after prompt refinements', async ({ page }) => {
  test.setTimeout(30 * 60 * 1000);

  const consoleErrors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[console.error] ${msg.text()}`); });

  await login(page);

  const results: any[] = [];
  for (const [idx, s] of SAMPLES.entries()) {
    try {
      await page.goto('/create');
      await setLanguage(page, s.lang);
      await selectAge(page, s.age);
      await selectGenre(page, s.genre);
      await clickNext(page);
      await ensureTwoCharacters(page);
      await clickNext(page);
      await openCustomSeedEditor(page);
      await page.locator('#custom-seed').fill(buildSeed(s.age, s.genre, s.lang, idx+1));
      await clickNext(page);
      const start = Date.now();
      await page.getByRole('button', { name: /Create|Skapa/i }).click();
      const { text, ms } = await waitForContent(page, 120_000);
      const choices = await extractChoices(page);
      const uniqueChoices = Array.from(new Set(choices.map(c => c.toLowerCase())));
      const choiceDiversity = uniqueChoices.length >= Math.min(3, choices.length);
      const isLikelySwedish = /[åäöÅÄÖ]|\b(och|det|en|ett|är|med|på|för|som)\b/i.test(text);
      const languageConsistent = s.lang === 'sv' ? isLikelySwedish : true;
      results.push({ sample: s, ok: true, ms, choices, choiceDiversity, languageConsistent, textPreview: text.slice(0,140) });
      console.log(`[CONFIRM] ok ${s.age}/${s.genre}/${s.lang}; ms=${ms}; diverse=${choiceDiversity}; svConsistent=${languageConsistent}`);
    } catch (e) {
      results.push({ sample: s, ok: false, error: String(e) });
      console.warn(`[CONFIRM] fail ${s.age}/${s.genre}/${s.lang}; error=${String(e)}`);
    }
  }

  const benign = /(401)|(row-level security)|(RLS)|(profiles)|(Global error caught)|("error":null)|(subscription-check)|(Failed to send a request to the Edge Function)|(FunctionsFetchError)|(language-fetch)|(TypeError: Failed to fetch)/i;
  const actionableErrors = consoleErrors.filter(e => !benign.test(e));

  const successes = results.filter(r => r.ok);
  const times = successes.map(r => r.ms).sort((a,b)=>a-b);
  const p50 = times[Math.floor(times.length*0.5)] || null;
  const p90 = times[Math.floor(times.length*0.9)] || null;

  console.log(`[CONFIRM_SUMMARY] success=${successes.length}/${results.length}; p50=${p50}; p90=${p90}; actionableErrors=${actionableErrors.length}`);

  expect.soft(actionableErrors, 'No actionable console errors during confirmation pass').toHaveLength(0);
  expect.soft(successes.length, 'At least 5/6 confirmations should succeed').toBeGreaterThanOrEqual(5);
});

