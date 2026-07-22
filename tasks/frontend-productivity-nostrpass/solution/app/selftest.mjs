import { chromium } from '/Users/kurrytran/frontend-repository/node_modules/playwright/index.mjs';

const URL = 'http://localhost:3199';
const consoleErrors = [];
const pageErrors = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => {
  pageErrors.push(String(err));
});

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
  console.log('OK:', msg);
}

await page.goto(URL, { waitUntil: 'networkidle' });

// 1. Nostr key manager surface: npub visible
const npubText = await page.getByTestId('dashboard-npub').innerText();
assert(npubText.startsWith('npub1'), 'dashboard shows npub1... key: ' + npubText);

// active identity nickname
const activeNickname = await page.locator('.text-xl.font-semibold').first().innerText();
console.log('active identity nickname:', activeNickname);

// 2. create a new identity
await page.getByTestId('nav-identities').click();
const identityCards = await page.locator('[data-testid^="identity-card-"]').count();
assert(identityCards >= 2, 'at least 2 seeded identities, got ' + identityCards);
await page.getByTestId('add-identity-btn').click();
await page.getByTestId('identity-name-input').fill('Trading');
await page.getByTestId('create-identity-submit').click();
await page.waitForTimeout(200);
const cardsAfterCreate = await page.locator('[data-testid^="identity-card-"]').count();
assert(cardsAfterCreate === identityCards + 1, 'identity count increased after create: ' + cardsAfterCreate);

// invalid create: empty name should show error and not add
await page.getByTestId('add-identity-btn').click();
await page.getByTestId('create-identity-submit').click();
const errText = await page.getByTestId('create-identity-error').innerText();
assert(errText.length > 0, 'empty identity name shows validation error: ' + errText);
const cardsAfterInvalid = await page.locator('[data-testid^="identity-card-"]').count();
assert(cardsAfterInvalid === cardsAfterCreate, 'invalid create does not add a row');
// close the form (cancel) - find cancel button in create form
await page.locator('[data-testid="create-identity-form"] >> text=Cancel').click();

// 3. select first identity, go to permissions and toggle one app for it
const firstCardId = (await page.locator('[data-testid^="identity-card-"]').first().getAttribute('data-testid')).replace('identity-card-', '');
await page.locator(`[data-testid="select-identity-${firstCardId}"]`).click().catch(() => {});
await page.getByTestId('nav-permissions').click();
await page.waitForTimeout(100);

const damusBefore = await page.getByTestId('permission-toggle-damus').getAttribute('aria-checked');
const snortBefore = await page.getByTestId('permission-toggle-snort').getAttribute('aria-checked');
await page.getByTestId('permission-toggle-damus').click();
await page.waitForTimeout(100);
const damusAfter = await page.getByTestId('permission-toggle-damus').getAttribute('aria-checked');
const snortAfter = await page.getByTestId('permission-toggle-snort').getAttribute('aria-checked');
assert(damusAfter !== damusBefore, 'toggling damus permission flips its state');
assert(snortAfter === snortBefore, 'toggling damus does not affect snort (scoped to app)');

// 4. switch identity -> key changes, permissions not mixed
await page.getByTestId('nav-dashboard').click();
const npubBeforeSwitch = await page.getByTestId('dashboard-npub').innerText();
await page.getByTestId('nav-identities').click();
const secondCard = page.locator('[data-testid^="identity-card-"]').nth(1);
const secondId = (await secondCard.getAttribute('data-testid')).replace('identity-card-', '');
await page.locator(`[data-testid="select-identity-${secondId}"]`).click();
await page.getByTestId('nav-dashboard').click();
await page.waitForTimeout(100);
const npubAfterSwitch = await page.getByTestId('dashboard-npub').innerText();
assert(npubAfterSwitch !== npubBeforeSwitch, 'switching identity changes displayed key');

await page.getByTestId('nav-permissions').click();
const damusSecondIdentity = await page.getByTestId('permission-toggle-damus').getAttribute('aria-checked');
console.log('damus grant for second identity (should reflect its own seed, not first identity toggle):', damusSecondIdentity);

// reveal key toggle (real UI control)
await page.getByTestId('nav-dashboard').click();
const maskedBefore = await page.getByTestId('dashboard-nsec').innerText();
assert(maskedBefore.includes('•'), 'nsec is masked by default');
await page.getByTestId('reveal-key-btn').click();
const revealed = await page.getByTestId('dashboard-nsec').innerText();
assert(revealed.startsWith('nsec1'), 'reveal-key button shows real nsec1... value: ' + revealed);

// theme toggle hover/click
await page.getByTestId('nav-settings').click();
const themeBefore = await page.locator('html').evaluate(() => document.querySelector('[data-theme]')?.getAttribute('data-theme'));
await page.getByTestId('theme-toggle').click();
await page.waitForTimeout(100);
const themeAfter = await page.locator('html').evaluate(() => document.querySelector('[data-theme]')?.getAttribute('data-theme'));
assert(themeBefore !== themeAfter, 'theme toggle flips data-theme: ' + themeBefore + ' -> ' + themeAfter);

// reload -> state restored
await page.reload({ waitUntil: 'networkidle' });
const themeAfterReload = await page.locator('[data-theme]').first().getAttribute('data-theme');
assert(themeAfterReload === themeAfter, 'theme restored after reload');
const cardsAfterReload = await page.locator('[data-testid^="identity-card-"]').count().catch(() => 0);
await page.getByTestId('nav-identities').click();
const cardsAfterReload2 = await page.locator('[data-testid^="identity-card-"]').count();
assert(cardsAfterReload2 === cardsAfterCreate, 'identities restored after reload: ' + cardsAfterReload2);

// webmcp round trip
const sessionInfo = await page.evaluate(() => window.webmcp_session_info());
console.log('session info:', JSON.stringify(sessionInfo));
const toolList = await page.evaluate(() => window.webmcp_list_tools());
console.log('tools:', toolList.map((t) => t.name).join(', '));
assert(toolList.length >= 4, 'at least 4 webmcp tools registered');

await page.getByTestId('nav-permissions').click();
const identityIdForMcp = (await page.locator('[data-testid^="identity-card-"]').first().getAttribute('data-testid').catch(() => null));
// get active identity id via identities view select buttons
await page.getByTestId('nav-identities').click();
const activeCardTestId = await page.locator('[data-testid^="identity-card-"].border-violet-500').first().getAttribute('data-testid');
const activeId = activeCardTestId.replace('identity-card-', '');

const snortBeforeMcp = await (async () => {
  await page.getByTestId('nav-permissions').click();
  return page.getByTestId('permission-toggle-snort').getAttribute('aria-checked');
})();

const invokeResult = await page.evaluate(
  (id) => window.webmcp_invoke_tool('entity_app-permission_toggle', { identityId: id, appId: 'snort' }),
  activeId
);
console.log('invoke result:', JSON.stringify(invokeResult));
await page.waitForTimeout(100);
const snortAfterMcp = await page.getByTestId('permission-toggle-snort').getAttribute('aria-checked');
assert(snortAfterMcp !== snortBeforeMcp, 'webmcp_invoke_tool toggle reflected in UI');

console.log('CONSOLE ERRORS:', consoleErrors.length, consoleErrors);
console.log('PAGE ERRORS:', pageErrors.length, pageErrors);
assert(consoleErrors.length === 0, 'zero console errors');
assert(pageErrors.length === 0, 'zero page errors');

await browser.close();
console.log('SELF-TEST PASSED');
