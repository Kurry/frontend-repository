// Hand-authored oracle spec
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
});

// --- APPEND MARKER ---

test('15.1 nav_menu_uppercase_convention', async ({ page }) => {
  const labels = await page.evaluate(() => {
     return Array.from(document.querySelectorAll('[data-menu-link], [data-store-cta], [data-social-link], .nav-menu-link'))
       .map(el => el.innerText.trim())
       .filter(t => t.length > 0);
  });
  for (const text of labels) {
     expect(text).toBe(text.toUpperCase());
  }
});

test('15.2 action_labels_specific', async ({ page }) => {
  const submitBtnText = await page.evaluate(() => {
     const btn = document.querySelector('.newsletter-submit');
     return btn ? btn.innerText.trim() : '';
  });
  expect(submitBtnText).toBe('Subscribe');
});

test('15.3 newsletter_errors_name_email_and_fix', async ({ page }) => {
  await page.evaluate(() => {
     const input = document.getElementById('newsletterEmail');
     input.value = 'invalid';
     input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const errorMsg = await page.locator('#newsletterMsg').innerText();
  expect(errorMsg.toLowerCase()).toContain('email');
  expect(errorMsg.toLowerCase()).toContain('@');
  expect(errorMsg.toLowerCase()).toContain('dot');
});

test('15.4 exact_mandated_chrome_strings', async ({ page }) => {
  const title = await page.title();
  expect(title).toBe('2025 Apex Grand Prix Driver — Avery Vale');
  const preloaderText = await page.locator('#preloader .transition-label').textContent();
  expect(preloaderText.trim()).toBe('LOAD VALE');
});

test('15.6 avery_vale_terminology_consistent', async ({ page }) => {
  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText).toContain('Avery Vale');
  expect(bodyText).toContain('Nova Racing');
  expect(bodyText).not.toContain('Lando Norris');
});

test('15.7 supporting_copy_sentence_case', async ({ page }) => {
  const textImpact = await page.locator('.text-impact').textContent();
  expect(textImpact.trim()).toBe('No limits only laps');

  const footerStatement = await page.locator('.footer-statement').textContent();
  expect(footerStatement.trim()).toBe('Driven by the fans. Built for the future.');
});

test('15.8 newsletter_confirmation_states_success', async ({ page }) => {
  await page.fill('#newsletterEmail', 'fan@averyvale.example');
  await page.click('#newsletterSubmit', { force: true });
  const msg = await page.locator('#newsletterMsg').innerText();
  expect(msg.toLowerCase()).toContain('succeed');
});

test('15.9 press_kit_empty_state_plain_language', async ({ page }) => {
  await page.click('#pressKitBtn');
  await page.waitForTimeout(500);
  await page.click('[data-tab="markdown"]');
  const preview = await page.locator('[data-presskit-preview]').textContent();
  expect(preview.toLowerCase()).toContain('lists are empty');
});

test('15.10 status_and_import_errors_name_fields', async ({ page }) => {
  await page.fill('[data-import-area]', '{"schemaVersion": 1}');
  await page.click('[data-import-paste]');
  const msg = await page.locator('[data-import-msg]').textContent();
  expect(msg.toLowerCase()).toContain('import problem:');
});
