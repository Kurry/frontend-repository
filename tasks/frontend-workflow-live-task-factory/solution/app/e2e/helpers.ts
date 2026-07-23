import { expect, type Download, type Page } from '@playwright/test';

export async function boot(page: Page, preserve = false) {
  if (!preserve) {
    const resetMarker = `e2e-reset-${Date.now()}-${Math.random()}`;
    await page.addInitScript((marker) => {
      if (sessionStorage.getItem(marker)) return;
      localStorage.clear();
      sessionStorage.setItem(marker, 'done');
    }, resetMarker);
  }
  await page.goto('/');
  await expect(page.getByText('Demo data', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'TaskFoundry' })).toBeVisible();
}

export async function nav(page: Page, name: 'Candidates' | 'Triage' | 'Runs' | 'Library') {
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name }).click();
}

async function dismissConnectionCoachmark(page: Page) {
  const dismiss = page.getByRole('button', { name: /Dismiss Connect when/ });
  if (await dismiss.isVisible()) {
    await dismiss.click();
    await expect(dismiss).toBeHidden();
  }
}

export async function shellProbe(page: Page) {
  await boot(page);
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('.repo-row')).toHaveCount(3);
  await expect(page.locator('.repo-row').filter({ hasText: 'nimbusworks/driftline' })).toBeVisible();
  await expect(page.locator('.repo-row').filter({ hasText: 'cobalt-labs/loomdb' })).toBeVisible();
  await expect(page.locator('.repo-row').filter({ hasText: 'fernfield/petrel' })).toBeVisible();
}

export async function headingOrderProbe(page: Page) {
  await boot(page);
  const levels = await page.locator('main h1, main h2, main h3').evaluateAll((headings) =>
    headings.filter((heading) => getComputedStyle(heading).display !== 'none').map((heading) => Number(heading.tagName.slice(1))),
  );
  expect(levels.length).toBeGreaterThan(1);
  expect(levels[0]).toBe(1);
  for (let index = 1; index < levels.length; index += 1) expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
}

export async function iconLabelProbe(page: Page) {
  await boot(page);
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  for (const name of ['Candidates', 'Triage', 'Runs', 'Library']) {
    await expect(navigation.getByRole('button', { name, exact: true })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Connections' }).click();
  const connections = page.getByRole('dialog', { name: 'Connections' });
  await expect(connections.locator('.credential-name').filter({ hasText: 'GitHub' })).toBeVisible();
  await expect(connections.locator('.credential-name').filter({ hasText: 'AI endpoint' })).toBeVisible();
  await expect(connections.getByRole('button', { name: 'Show GitHub token' })).toBeVisible();
  await expect(connections.getByRole('button', { name: 'Show AI API key' })).toBeVisible();
  await page.keyboard.press('Escape');

  await nav(page, 'Triage');
  const card = page.locator('.triage-card[data-pr-number="57"]');
  await expect(card.getByRole('button', { name: 'Accept' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Reject PR' })).toBeVisible();
  await card.getByRole('button', { name: 'Accept' }).click();
  await card.getByRole('button', { name: 'Run pipeline' }).click();
  await expect(page.locator('.stage-card')).toHaveCount(4);
  for (const label of ['Fetch', 'Evaluate', 'Generate', 'Package']) {
    await expect(page.locator('.stage-card').filter({ hasText: label }).locator('.stage-head')).toContainText(label);
  }

  await nav(page, 'Library');
  await page.locator('.library-row').first().click();
  await expect(page.getByRole('button', { name: 'Copy bundle' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download bundle' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete package' })).toBeVisible();
}

export async function connectionsProbe(page: Page) {
  await boot(page);
  const trigger = page.getByRole('button', { name: 'Connections' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Connections' });
  await expect(dialog).toBeVisible();
  const github = dialog.locator('input[name="githubToken"]');
  const key = dialog.locator('input[name="aiApiKey"]');
  await expect(github).toHaveAttribute('type', 'password');
  await expect(key).toHaveAttribute('type', 'password');
  await expect(dialog.getByLabel('AI base URL')).toHaveValue('https://api.nimbus-ai.com');
  await github.fill('ghp_SENTINEL123');
  await dialog.getByRole('button', { name: 'Show GitHub token' }).click();
  await expect(github).toHaveAttribute('type', 'text');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
}

export async function modalFocusProbe(page: Page) {
  await connectionsProbe(page)
  await boot(page)
  await nav(page, 'Triage')
  const reject = page.locator('.triage-card[data-pr-number="52"]').getByRole('button', { name: 'Reject PR' })
  await reject.click()
  let dialog = page.getByRole('dialog', { name: 'Reject PR #52' })
  await expect.poll(() => dialog.evaluate((node) => node.contains(document.activeElement))).toBeTruthy()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(reject).toBeFocused()
  await libraryProbe(page)
  const coachmark = page.getByRole('button', { name: /Dismiss Connect when/ })
  if (await coachmark.isVisible()) await coachmark.click()
  const remove = page.getByRole('button', { name: 'Delete package' })
  await remove.click()
  dialog = page.getByRole('alertdialog', { name: 'Delete this package?' })
  await expect.poll(() => dialog.evaluate((node) => node.contains(document.activeElement))).toBeTruthy()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(remove).toBeFocused()
  const searchTrigger = page.getByRole('button', { name: /Search/ })
  await searchTrigger.click()
  const palette = page.getByRole('dialog', { name: 'Search TaskFoundry' })
  await expect.poll(() => palette.evaluate((node) => node.contains(document.activeElement))).toBeTruthy()
  await page.keyboard.press('Escape')
  await expect(palette).toBeHidden()
  await expect(searchTrigger).toBeFocused()
}

export async function overlayClosePathsProbe(page: Page) {
  await boot(page)

  const exercise = async (open: () => Promise<void>, dialog: () => ReturnType<Page['getByRole']>, close: () => Promise<void>) => {
    await open(); await expect(dialog()).toBeVisible(); await close(); await expect(dialog()).toBeHidden()
    await open(); await expect(dialog()).toBeVisible(); await page.keyboard.press('Escape'); await expect(dialog()).toBeHidden()
    await open(); await expect(dialog()).toBeVisible(); await page.locator('.dialog-overlay').click({ position: { x: 5, y: 5 } }); await expect(dialog()).toBeHidden()
  }

  const connectionsTrigger = page.getByRole('button', { name: 'Connections' })
  await exercise(
    () => connectionsTrigger.click(),
    () => page.getByRole('dialog', { name: 'Connections' }),
    () => page.getByRole('dialog', { name: 'Connections' }).getByRole('button', { name: 'Close Connections' }).click(),
  )

  await nav(page, 'Triage')
  const rejectTrigger = page.locator('.triage-card[data-pr-number="52"]').getByRole('button', { name: 'Reject PR' })
  await exercise(
    () => rejectTrigger.click(),
    () => page.getByRole('dialog', { name: 'Reject PR #52' }),
    () => page.getByRole('dialog', { name: 'Reject PR #52' }).getByRole('button', { name: 'Close reject reason chooser' }).click(),
  )

  await nav(page, 'Library')
  await page.locator('.library-row').first().click()
  const deleteTrigger = page.getByRole('button', { name: 'Delete package' })
  await exercise(
    () => deleteTrigger.click(),
    () => page.getByRole('alertdialog', { name: 'Delete this package?' }),
    () => page.getByRole('alertdialog', { name: 'Delete this package?' }).getByRole('button', { name: 'Cancel' }).click(),
  )

  const paletteTrigger = page.getByRole('button', { name: /Search/ })
  await exercise(
    () => paletteTrigger.click(),
    () => page.getByRole('dialog', { name: 'Search TaskFoundry' }),
    () => page.getByRole('dialog', { name: 'Search TaskFoundry' }).getByRole('button', { name: 'Close search' }).click(),
  )
}

export async function liveRegionProbe(page: Page) {
  await acceptAndRun(page, 31)
  const live = page.locator('[aria-live="assertive"]')
  await expect(page.getByText(/Generate stage failed after 3 attempts/).first()).toBeVisible({ timeout: 30_000 })
  await expect(live).toContainText(/failed/i)
  await page.getByRole('button', { name: 'Retry Generate' }).click()
  await expect(page.getByLabel(/Task package for fernfield\/petrel PR 31/)).toBeVisible({ timeout: 30_000 })
  await expect(live).toContainText(/complete|ready/i)
  await page.getByRole('button', { name: 'Connections' }).click()
  const connections = page.getByRole('dialog', { name: 'Connections' })
  await connections.getByLabel('AI base URL').fill('https://api.live-region.test')
  await connections.locator('input[name="aiApiKey"]').fill('sk-live-region-check')
  await connections.getByRole('button', { name: 'Connect AI' }).click()
  await expect(page.getByLabel('Connection status')).toContainText('AI ready')
  await expect(live).toContainText(/connected/i)
}

export async function contrastProbe(page: Page) {
  await acceptAndRun(page, 57)
  const measure = (selector: string) => page.locator(selector).first().evaluate((element) => {
      const parse = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
      const luminance = (rgb: number[]) => rgb.map((value) => value / 255).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
      const style = getComputedStyle(element)
      let backgroundElement: Element | null = element
      let backgroundColor = style.backgroundColor
      while (backgroundElement && backgroundColor === 'rgba(0, 0, 0, 0)') {
        backgroundElement = backgroundElement.parentElement
        backgroundColor = backgroundElement ? getComputedStyle(backgroundElement).backgroundColor : 'rgb(255, 255, 255)'
      }
      const foreground = luminance(parse(style.color))
      const background = luminance(parse(backgroundColor))
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
    })
  for (const selector of ['.mode-chip', '.status', '.page-description']) {
    const ratio = await measure(selector)
    expect(ratio, `${selector} contrast ratio`).toBeGreaterThanOrEqual(4.5)
  }
  await nav(page, 'Triage')
  expect(await measure('.reason-badge')).toBeGreaterThanOrEqual(4.5)
}

export async function candidateProbe(page: Page) {
  await boot(page);
  await expect(page.locator('.pr-row')).toHaveCount(5);
  await expect(page.getByText(/Loaded 5 of \d+ matching PRs/)).toBeVisible();
  await page.getByRole('button', { name: /Load next page/ }).click();
  await expect(page.locator('.pr-row')).toHaveCount(7);
  await page.locator('.pr-row').filter({ hasText: '#57' }).click();
  await expect(page.getByRole('heading', { name: 'Changed files' })).toBeVisible();
  await expect(page.getByText('Test file', { exact: true })).toBeVisible();
}

export async function filterProbe(page: Page) {
  await boot(page);
  await expect(page.getByLabel('Min files')).toHaveValue('3');
  await expect(page.getByLabel('Max files')).toHaveValue('10');
  const rows = page.locator('.pr-row');
  const defaultRows = await rows.allTextContents();
  await page.getByLabel('Min files').fill('5');
  await page.getByLabel('Max files').fill('7');
  await expect(page.getByText('Source files 5–7')).toBeVisible();
  for (let i = 0; i < await rows.count(); i += 1) {
    const match = (await rows.nth(i).innerText()).match(/(\d+) source files/);
    expect(match).not.toBeNull();
    expect(Number(match?.[1])).toBeGreaterThanOrEqual(5);
    expect(Number(match?.[1])).toBeLessThanOrEqual(7);
  }
  await page.getByRole('switch', { name: 'Require linked issue' }).click();
  await expect(page.getByText('Linked issue required')).toBeVisible();
  await page.getByRole('switch', { name: 'Require linked issue' }).click();
  await page.getByLabel('Min files').fill('3');
  await page.getByLabel('Max files').fill('10');
  await expect(page.getByText('Source files 3–10')).toBeVisible();
  await expect(rows).toHaveCount(defaultRows.length);
  expect(await rows.allTextContents()).toEqual(defaultRows);
}

export async function validationProbe(page: Page) {
  await boot(page);
  const coachmark = page.getByRole('button', { name: /Dismiss Connect when/ });
  if (await coachmark.isVisible()) await coachmark.click();
  await page.getByRole('button', { name: 'Add repository' }).click();
  await expect(page.getByText(/repository:/)).toBeVisible();
  await nav(page, 'Triage');
  const card = page.locator('.triage-card').first();
  await card.getByRole('button', { name: 'Reject PR' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reject PR' }).click();
  await expect(page.getByText(/reason:/)).toBeVisible();
}

export async function formLabelProbe(page: Page) {
  await boot(page);
  for (const label of ['Min files', 'Max files', 'Require linked issue']) {
    await expect(page.getByLabel(label)).toBeVisible();
  }
  await expect(page.getByLabel('Repository')).toBeVisible();
  await page.getByRole('button', { name: 'Connections' }).click();
  const dialog = page.getByRole('dialog', { name: 'Connections' });
  await expect(dialog.locator('input[name="githubToken"]')).toBeVisible();
  await expect(dialog.getByLabel('AI base URL', { exact: true })).toBeVisible();
  await expect(dialog.locator('input[name="aiApiKey"]')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Show GitHub token' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Show AI API key' })).toBeVisible();
}

export async function emptyStateProbe(page: Page) {
  await boot(page);
  await page.getByLabel('Min files').fill('999');
  await page.getByLabel('Max files').fill('1000');
  await expect(page.getByRole('heading', { name: 'No pull requests match' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.pr-row')).toHaveCount(5);
}

export async function keyboardControlsProbe(page: Page) {
  await boot(page);
  const candidates = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: 'Candidates' });
  await page.locator('body').focus();
  for (let index = 0; index < 30 && !(await candidates.evaluate((element) => element === document.activeElement)); index += 1) await page.keyboard.press('Tab');
  await expect(candidates).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(candidates).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Find the right merged change.' })).toBeVisible();
  const candidate = page.locator('.pr-row').filter({ hasText: '#57' });
  await candidate.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Changed files' })).toBeVisible();
}

export async function triageProbe(page: Page) {
  await boot(page);
  await nav(page, 'Triage');
  const acceptedBefore = Number(await page.locator('.stat-card').filter({ hasText: 'Accepted' }).locator('.stat-value').textContent());
  const card = page.locator('.triage-card[data-pr-number="57"]');
  await card.getByRole('button', { name: 'Accept' }).click();
  await expect(page.locator('.stat-card').filter({ hasText: 'Accepted' }).locator('.stat-value')).toHaveText(String(acceptedBefore + 1));
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.stat-card').filter({ hasText: 'Accepted' }).locator('.stat-value')).toHaveText(String(acceptedBefore));
}

export async function toastMotionProbe(page: Page) {
  await boot(page);
  await nav(page, 'Triage');
  await page.locator('.triage-card[data-pr-number="57"]').getByRole('button', { name: 'Accept' }).click();
  const toast = page.locator('.toast').filter({ hasText: 'PR accepted' });
  await expect(toast).toBeVisible();
  await expect(toast).toHaveCSS('animation-name', /toast-in.*toast-out/);
  await expect(toast).toBeHidden({ timeout: 7_000 });
}

export async function triageMotionProbe(page: Page) {
  await boot(page);
  await nav(page, 'Triage');
  const card = page.locator('.triage-card[data-pr-number="57"]');
  await expect(card.locator('xpath=ancestor::*[contains(@class,"board-column")]')).toContainText(/Inbox/i);
  await card.getByRole('button', { name: 'Accept' }).click();
  const moved = page.locator('.triage-card[data-pr-number="57"]');
  await expect(moved.locator('xpath=ancestor::*[contains(@class,"board-column")]')).toContainText(/Accepted/i);
  const motion = await moved.evaluate((element) => {
    const style = getComputedStyle(element);
    return { animation: style.animationName, transition: style.transitionDuration };
  });
  expect(motion.animation !== 'none' || motion.transition.split(',').some((duration) => parseFloat(duration) > 0)).toBeTruthy();
}

export async function rejectProbe(page: Page) {
  await boot(page);
  await nav(page, 'Triage');
  const card = page.locator('.triage-card[data-pr-number="52"]');
  await card.getByRole('button', { name: 'Reject PR' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reject PR #52' });
  await dialog.locator('select[name="reason"]').selectOption('docs-only');
  await dialog.getByRole('button', { name: 'Reject PR' }).click();
  await expect(page.locator('.triage-card[data-pr-number="52"]')).toContainText('Docs only');
  const second = page.locator('.triage-card[data-pr-number="54"]');
  await second.getByRole('button', { name: 'Reject PR' }).click();
  const secondDialog = page.getByRole('dialog', { name: 'Reject PR #54' });
  await secondDialog.locator('select[name="reason"]').selectOption('too-many-files');
  await secondDialog.getByRole('button', { name: 'Reject PR' }).click();
  await expect(second).toContainText('Too many files');
  await expect(page.locator('.stat-card').filter({ hasText: 'Rejected' }).locator('.stat-value')).toHaveText('2');
  const breakdown = page.locator('.stat-card').filter({ hasText: 'Rejected breakdown' });
  await expect(breakdown.getByText('Docs only · 1', { exact: true })).toBeVisible();
  await expect(breakdown.getByText('Too many files · 1', { exact: true })).toBeVisible();
}

export async function acceptAndRun(page: Page, pr = 57, preserve = false) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, preserve);
  await nav(page, 'Triage');
  const card = page.locator(`.triage-card[data-pr-number="${pr}"]`);
  const accept = card.getByRole('button', { name: 'Accept' });
  if (await accept.isVisible()) await accept.click();
  await card.getByRole('button', { name: 'Run pipeline' }).click();
  await expect(page.getByText(/Active run/)).toBeVisible();
}

export async function pipelineProbe(page: Page) {
  await acceptAndRun(page, 57);
  await expect(page.locator('.stage-card')).toHaveCount(4);
  await expect(page.getByLabel(/Task package for nimbusworks\/driftline PR 57/)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.stage-card .status-complete')).toHaveCount(8);
  await expect(page.getByText('live-task-package-v1', { exact: false }).first()).toBeVisible();
}

export async function trivialProbe(page: Page) {
  await acceptAndRun(page, 52);
  await expect(page.getByText('Trivial verdict', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Run ended after Evaluate. No package was created.')).toBeVisible();
  await expect(page.getByText(/Docs-only change:/).first()).toBeVisible();
}

export async function failureRetryProbe(page: Page) {
  await acceptAndRun(page, 31);
  await expect(page.getByText(/Generate stage failed after 3 attempts/).first()).toBeVisible({ timeout: 30_000 });
  const fetchOutput = await page.locator('#stage-fetch').textContent();
  await page.getByRole('button', { name: 'Retry Generate' }).click();
  await expect(page.getByLabel(/Task package for fernfield\/petrel PR 31/)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#stage-fetch')).toContainText(fetchOutput ?? '');
}

export async function rateLimitProbe(page: Page) {
  await acceptAndRun(page, 58);
  await expect(page.getByText(/429 Rate limit reached/)).toBeVisible({ timeout: 7_000 });
  const first = await page.getByText(/Reset in \d+s/).textContent();
  await page.waitForTimeout(1100);
  const second = await page.getByText(/Reset in \d+s/).textContent();
  expect(second).not.toBe(first);
  await expect(page.getByLabel(/Task package for nimbusworks\/driftline PR 58/)).toBeVisible({ timeout: 60_000 });
}

export async function pauseProbe(page: Page) {
  await acceptAndRun(page, 57);
  await nav(page, 'Candidates');
  await page.getByLabel('Min files').fill('4');
  await expect(page.getByLabel('Active filters')).toContainText('Source files 4–10');
  await nav(page, 'Runs');
  await expect(page.getByText(/Active run/)).toBeVisible();
  const pause = page.getByRole('button', { name: 'Pause' });
  await pause.click();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
}

export async function libraryProbe(page: Page) {
  await boot(page);
  await nav(page, 'Library');
  await expect(page.locator('.library-row')).toHaveCount(2);
  await dismissConnectionCoachmark(page);
  await page.locator('.library-row').first().click();
  await expect(page.getByLabel(/Task package for/)).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Instruction' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Task config' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Metadata' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Patch note' })).toBeVisible();
}

export async function libraryDeleteProbe(page: Page) {
  await libraryProbe(page);
  await page.getByRole('button', { name: 'Delete package' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Delete this package?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Delete package' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete package' }).click();
  await expect(page.locator('.library-row')).toHaveCount(1);
}

export async function libraryFilterProbe(page: Page) {
  await boot(page);
  await nav(page, 'Library');
  const before = await page.locator('.library-row').count();
  await page.getByLabel('Repository').selectOption('nimbusworks/driftline');
  expect(await page.locator('.library-row').count()).toBeLessThan(before);
  await page.getByLabel('Difficulty').selectOption({ index: 1 });
  await page.getByLabel('Language').selectOption('Rust');
  await expect(page.getByRole('heading', { name: 'No packages match' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.library-row')).toHaveCount(before);
}

export async function emptyLibraryProbe(page: Page) {
  await boot(page);
  await nav(page, 'Library');
  const coachmark = page.getByRole('button', { name: /Dismiss Connect when/ });
  if (await coachmark.isVisible()) await coachmark.click();
  for (let remaining = 2; remaining > 0; remaining -= 1) {
    await page.locator('.library-row').first().click();
    await page.getByRole('button', { name: 'Delete package' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete package' }).click();
    await expect(page.locator('.library-row')).toHaveCount(remaining - 1);
  }
  await expect(page.getByRole('heading', { name: 'No packages match' })).toBeVisible();
  await acceptAndRun(page, 57, true);
  await expect(page.getByLabel(/Task package for nimbusworks\/driftline PR 57/)).toBeVisible({ timeout: 30_000 });
  await nav(page, 'Library');
  await expect(page.locator('.library-row')).toHaveCount(1);
}

export async function downloadProbe(page: Page) {
  await libraryProbe(page);
  await page.getByRole('button', { name: 'Connections' }).click();
  const connections = page.getByRole('dialog', { name: 'Connections' });
  await connections.locator('input[name="githubToken"]').fill('ghp_EXPORT_SENTINEL');
  await connections.locator('input[name="aiApiKey"]').fill('sk-EXPORT-SENTINEL');
  await page.keyboard.press('Escape');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download bundle' }).click();
  const download: Download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const bundle = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(Object.keys(bundle)).toEqual(expect.arrayContaining(['schemaVersion', 'repo', 'pr_number', 'base_sha', 'language', 'difficulty', 'source_file_count', 'created_at', 'instruction', 'task_config', 'patch_note']));
  expect(bundle.schemaVersion).toBe('live-task-package-v1');
  expect(bundle.base_sha).toMatch(/^[a-f0-9]{40}$/);
  expect(JSON.stringify(bundle)).not.toContain('EXPORT_SENTINEL');
}

export async function importProbe(page: Page) {
  await boot(page);
  await nav(page, 'Library');
  const input = page.getByLabel('Import TaskPackageBundle JSON');
  await input.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schemaVersion: 'wrong', repo: 'bad' })) });
  await expect(page.getByRole('alert')).toContainText('schemaVersion');
  await expect(page.getByRole('alert')).toContainText('base_sha');
  const valid = { schemaVersion: 'live-task-package-v1', repo: 'acme/widget', pr_number: 9, base_sha: 'a'.repeat(40), language: 'TypeScript', difficulty: 'easy', source_file_count: 3, created_at: '2026-07-21T12:00:00.000Z', instruction: 'Distinct imported instruction', task_config: '[task]\nname = "widget"', patch_note: 'Revert src/widget.ts' };
  await input.setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(valid)) });
  await expect(page.getByLabel('Task package for acme/widget PR 9')).toBeVisible();
  await expect(page.getByText('Distinct imported instruction')).toBeVisible();
}

export async function roundTripProbe(page: Page) {
  await libraryProbe(page);
  const sourceRegion = page.getByLabel(/Task package for/);
  const label = await sourceRegion.getAttribute('aria-label');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download bundle' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const buffer = Buffer.concat(chunks);
  const bundle = JSON.parse(buffer.toString('utf8'));
  const coachmark = page.getByRole('button', { name: /Dismiss Connect when/ });
  if (await coachmark.isVisible()) await coachmark.click();
  await page.getByRole('button', { name: 'Delete package' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete package' }).click();
  await page.getByLabel('Import TaskPackageBundle JSON').setInputFiles({ name: 'round-trip.json', mimeType: 'application/json', buffer });
  await expect(page.getByLabel(label ?? '')).toBeVisible();
  await expect(page.getByText(bundle.instruction)).toBeVisible();
}

export async function credentialLifecycleProbe(page: Page) {
  await page.route('https://api.github.com/user', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Bad credentials"}' }));
  await boot(page);
  await page.getByRole('button', { name: 'Connections' }).click();
  const dialog = page.getByRole('dialog', { name: 'Connections' });
  await dialog.locator('input[name="githubToken"]').fill('ghp_invalid_token');
  await dialog.getByRole('button', { name: 'Connect GitHub' }).click();
  await expect(dialog.getByText(/Disconnected/).first()).toBeVisible();
  await expect(dialog.getByText(/401|Bad credentials/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Demo data', { exact: true })).toBeVisible();
  await expect(page.locator('.repo-row')).toHaveCount(3);
}

export async function batchProbe(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  await nav(page, 'Triage');
  for (const pr of [57, 54]) await page.locator(`.triage-card[data-pr-number="${pr}"]`).getByRole('button', { name: 'Accept' }).click();
  for (const pr of [57, 54]) await page.locator(`.triage-card[data-pr-number="${pr}"]`).getByRole('button', { name: 'Queue' }).click();
  await nav(page, 'Runs');
  await page.getByRole('button', { name: 'Start batch · 2' }).click();
  await expect(page.getByRole('progressbar', { name: 'Batch progress' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'BatchRunReport' })).toBeVisible({ timeout: 30_000 });
  const values = await page.locator('.report-bucket strong').allTextContents();
  expect(values.map(Number).reduce((sum, value) => sum + value, 0)).toBe(2);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download report' }).click();
  const reportDownload = await downloadPromise;
  expect(reportDownload.suggestedFilename()).toMatch(/batch-report-.*\.json/);
}

export async function differentPackagesProbe(page: Page) {
  await acceptAndRun(page, 57);
  const first = page.getByLabel(/Task package for nimbusworks\/driftline PR 57/);
  const firstText = await first.innerText();
  await acceptAndRun(page, 54, true);
  const second = page.getByLabel(/Task package for.*PR 54/);
  await expect(second).toBeVisible({ timeout: 30_000 });
  const secondText = await second.innerText();
  expect(secondText).not.toBe(firstText);
  await nav(page, 'Library');
  await expect(page.getByText(/(?:Pull request|PR) #57/).first()).toBeVisible();
  await expect(page.getByText(/(?:Pull request|PR) #54/).first()).toBeVisible();
}

export async function countDeltaProbe(page: Page) {
  await triageProbe(page);
  await nav(page, 'Library');
  const coachmark = page.getByRole('button', { name: /Dismiss Connect when/ });
  if (await coachmark.isVisible()) await coachmark.click();
  const before = await page.locator('.library-row').count();
  await dismissConnectionCoachmark(page);
  await page.locator('.library-row').first().click();
  await page.getByRole('button', { name: 'Delete package' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete package' }).click();
  await expect(page.locator('.library-row')).toHaveCount(before - 1);
}

export async function interleavedRunProbe(page: Page) {
  await boot(page);
  await nav(page, 'Triage');
  const running = page.locator('.triage-card[data-pr-number="57"]');
  await running.getByRole('button', { name: 'Accept' }).click();
  await running.getByRole('button', { name: 'Run pipeline' }).click();
  await expect(page.getByText(/Active run/)).toBeVisible();
  await nav(page, 'Triage');
  const rejected = page.locator('.triage-card[data-pr-number="52"]');
  await rejected.getByRole('button', { name: 'Reject PR' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reject PR #52' });
  await dialog.locator('select[name="reason"]').selectOption('docs-only');
  await dialog.getByRole('button', { name: 'Reject PR' }).click();
  await expect(rejected).toContainText('Docs only');
  await nav(page, 'Runs');
  await expect(page.getByLabel(/Task package for nimbusworks\/driftline PR 57/)).toBeVisible({ timeout: 30_000 });
  await nav(page, 'Triage');
  await expect(page.locator('.triage-card[data-pr-number="52"]')).toContainText('Docs only');
}

export async function coldStartProbe(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'TaskFoundry' })).toBeVisible();
  const navigationDuration = await page.evaluate(() => {
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return entry?.duration ?? performance.now();
  });
  expect(navigationDuration).toBeLessThan(2_000);
}

export async function paletteProbe(page: Page) {
  await acceptAndRun(page, 57);
  const trigger = page.getByRole('button', { name: /Search/ });
  const search = page.getByLabel('Search repositories, pull requests, and packages');
  for (const query of ['drift', '57', 'nimbusworks']) {
    await trigger.focus();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
    await expect(search).toBeFocused();
    await search.fill(query);
    await expect(page.locator('.palette-results')).not.toBeEmpty();
    await page.keyboard.press('Escape');
    await expect(search).toBeHidden();
    await expect(trigger).toBeFocused();
  }
  await nav(page, 'Runs');
  await expect(page.getByText(/Active run/)).toBeVisible();
}

export async function webmcpProbe(page: Page) {
  await boot(page);
  const info = await page.evaluate(() => window.webmcp_session_info());
  expect(info.contract_version).toBe('zto-webmcp-v1');
  const tools = await page.evaluate(() => window.webmcp_list_tools());
  expect(tools.length).toBeGreaterThanOrEqual(10);
  await nav(page, 'Library');
  const before = await page.locator('.library-row').count();
  const response = await page.evaluate(() => window.webmcp_invoke_tool('entity_delete_library_package', { repository: 'nimbusworks/driftline', confirm: true }));
  expect(response.content[0].text).toContain('Deleted exactly one');
  await expect(page.locator('.library-row')).toHaveCount(before - 1);
}

export async function networkIsolationProbe(page: Page) {
  const external: string[] = [];
  page.on('request', (request) => { if (!['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname)) external.push(request.url()); });
  await boot(page);
  await candidateProbe(page);
  await triageProbe(page);
  await pipelineProbe(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download bundle' }).click();
  await downloadPromise;
  expect(external).toEqual([]);
}

export async function deterministicRunProbe(page: Page) {
  await acceptAndRun(page, 57);
  const first = await page.getByLabel(/Task package for nimbusworks\/driftline PR 57/).innerText();
  await acceptAndRun(page, 57);
  const second = await page.getByLabel(/Task package for nimbusworks\/driftline PR 57/).innerText();
  expect(second).toBe(first);
}

export async function viewRetentionProbe(page: Page) {
  await boot(page);
  await page.getByLabel('Min files').fill('4');
  await page.getByLabel('Max files').fill('9');
  await nav(page, 'Triage');
  await nav(page, 'Runs');
  await nav(page, 'Library');
  await nav(page, 'Candidates');
  await expect(page.getByLabel('Min files')).toHaveValue('4');
  await expect(page.getByLabel('Max files')).toHaveValue('9');
}

export async function credentialStorageProbe(page: Page) {
  await boot(page);
  await page.getByRole('button', { name: 'Connections' }).click();
  const dialog = page.getByRole('dialog', { name: 'Connections' });
  await dialog.locator('input[name="githubToken"]').fill('ghp_live_STORAGE_SENTINEL');
  await dialog.getByRole('button', { name: 'Connect GitHub' }).click();
  await expect(dialog.getByText(/Connected · fixture-connected/)).toBeVisible();
  await dialog.locator('input[name="aiApiKey"]').fill('sk-live_STORAGE_SENTINEL');
  await dialog.getByRole('button', { name: 'Connect AI' }).click();
  await expect(dialog.getByText('Connected', { exact: true }).last()).toBeVisible();
  const storage = await page.evaluate(async () => ({ local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage), cookies: document.cookie, databases: (await indexedDB.databases()).map((db) => db.name) }));
  expect(JSON.stringify(storage)).not.toContain('SENTINEL');
  await page.reload();
  await expect(page.getByText('Demo data', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Connections' }).click();
  await expect(page.locator('input[name="githubToken"]')).toHaveValue('');
  await expect(page.locator('input[name="aiApiKey"]')).toHaveValue('');
}

export async function credentialExportProbe(page: Page) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await boot(page);
  await page.getByRole('button', { name: 'Connections' }).click();
  const dialog = page.getByRole('dialog', { name: 'Connections' });
  await dialog.locator('input[name="githubToken"]').fill('ghp_live_EXPORT_SENTINEL');
  await dialog.getByRole('button', { name: 'Connect GitHub' }).click();
  await dialog.locator('input[name="aiApiKey"]').fill('sk-live_EXPORT_SENTINEL');
  await dialog.getByRole('button', { name: 'Connect AI' }).click();
  await expect(dialog.getByText('Connected', { exact: true }).last()).toBeVisible();
  await page.keyboard.press('Escape');

  await nav(page, 'Library');
  await page.locator('.library-row').first().click();
  const bundleDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download bundle' }).click();
  const bundleStream = await (await bundleDownload).createReadStream();
  const bundleChunks: Buffer[] = [];
  for await (const chunk of bundleStream) bundleChunks.push(Buffer.from(chunk));
  expect(Buffer.concat(bundleChunks).toString('utf8')).not.toContain('SENTINEL');
  await page.getByRole('button', { name: 'Copy bundle' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).not.toContain('SENTINEL');

  await nav(page, 'Triage');
  for (const pr of [57, 54]) {
    const card = page.locator(`.triage-card[data-pr-number="${pr}"]`);
    await card.getByRole('button', { name: 'Accept' }).click();
    await card.getByRole('button', { name: 'Queue' }).click();
  }
  await nav(page, 'Runs');
  await page.getByRole('button', { name: 'Start batch · 2' }).click();
  await expect(page.getByRole('heading', { name: 'BatchRunReport' })).toBeVisible({ timeout: 30_000 });
  const reportDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download report' }).click();
  const reportStream = await (await reportDownload).createReadStream();
  const reportChunks: Buffer[] = [];
  for await (const chunk of reportStream) reportChunks.push(Buffer.from(chunk));
  expect(Buffer.concat(reportChunks).toString('utf8')).not.toContain('SENTINEL');
}

export async function streamingProbe(page: Page) {
  await boot(page);
  await nav(page, 'Triage');
  const card = page.locator('.triage-card[data-pr-number="57"]');
  await card.getByRole('button', { name: 'Accept' }).click();
  await card.getByRole('button', { name: 'Run pipeline' }).click();
  const cursor = page.locator('.stream-cursor');
  await expect(cursor).toBeVisible({ timeout: 8_000 });
  await expect(page.getByLabel(/Task package for nimbusworks\/driftline PR 57/)).toBeVisible({ timeout: 30_000 });
  await expect(cursor).toHaveCount(0);
}

export async function transitionCountdownProbe(page: Page) {
  await boot(page);
  await nav(page, 'Triage');
  const card = page.locator('.triage-card[data-pr-number="31"]');
  const accept = card.getByRole('button', { name: 'Accept' });
  if (await accept.isVisible()) await accept.click();
  await card.getByRole('button', { name: 'Run pipeline' }).click();
  const generate = page.locator('#stage-generate');
  await expect(generate).toContainText(/running/i, { timeout: 10_000 });
  const countdown = generate.getByText(/Reset in \d+s/);
  await expect(countdown).toBeVisible({ timeout: 10_000 });
  const first = await countdown.textContent();
  await expect.poll(() => countdown.textContent()).not.toBe(first);
  await expect(generate).toContainText(/failed/i, { timeout: 20_000 });
}

export async function emptyCopyProbe(page: Page) {
  await boot(page);
  await page.getByLabel('Min files').fill('999');
  await page.getByLabel('Max files').fill('1000');
  await expect(page.getByRole('heading', { name: 'No pull requests match' }).locator('..')).toContainText(/Clear|restore/i);
  await boot(page);
  await nav(page, 'Library');
  await page.getByLabel('Repository').selectOption('nimbusworks/driftline');
  await page.getByLabel('Language').selectOption('Rust');
  const empty = page.getByRole('heading', { name: 'No packages match' }).locator('..');
  await expect(empty).toContainText(/Clear filters|import/i);
  await boot(page);
  await nav(page, 'Triage');
  const rejected = page.locator('.board-column').filter({ has: page.getByText(/^Rejected \d+$/) });
  await expect(rejected.getByText(/Reject candidates from Inbox/)).toBeVisible();
}

export async function mobileProbe(page: Page) {
  await page.setViewportSize({ width: 375, height: 900 });
  await boot(page);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await page.getByRole('button', { name: 'Triage' }).click();
  await expect(page.locator('.board')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

export async function reducedMotionProbe(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const duration = await page.locator('.repo-row').first().evaluate((el) => getComputedStyle(el).animationDuration);
  expect(duration === '0s' || duration === '0.001s').toBe(true);
}

export async function cleanConsoleProbe(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(error.message));
  await boot(page);
  await connectionsProbe(page);
  await paletteProbe(page);
  await pipelineProbe(page);
  await importProbe(page);
  await libraryDeleteProbe(page);
  expect(errors).toEqual([]);
}

export async function transitionResponseProbe(page: Page) {
  await boot(page);
  const elapsed = await page.evaluate(async () => {
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('nav button')];
    const candidates = buttons.find((element) => element.textContent?.includes('Candidates'));
    const triage = buttons.find((element) => element.textContent?.includes('Triage'));
    if (!candidates || !triage) throw new Error('Primary navigation controls missing');
    const activate = (button: HTMLButtonElement) => new Promise<number>((resolve) => {
      const start = performance.now();
      const observer = new MutationObserver(() => {
        if (button.classList.contains('active')) {
          observer.disconnect();
          resolve(performance.now() - start);
        }
      });
      observer.observe(button, { attributes: true, attributeFilter: ['class'] });
      button.click();
      if (button.classList.contains('active')) {
        observer.disconnect();
        resolve(performance.now() - start);
      }
    });
    const samples: number[] = [];
    for (let index = 0; index < 3; index += 1) {
      await activate(triage);
      samples.push(await activate(candidates));
    }
    samples.push(await activate(triage));
    return Math.min(...samples);
  });
  expect(elapsed).toBeLessThan(100);
  await expect(page.getByRole('heading', { name: 'Shape the evaluation queue.' })).toBeVisible();
}

export async function crossViewCoherenceProbe(page: Page) {
  await webmcpProbe(page);
  await boot(page);
  await nav(page, 'Triage');
  const accepted = page.locator('.stat-card').filter({ hasText: 'Accepted' }).locator('.stat-value');
  const before = Number(await accepted.textContent());
  await page.locator('.triage-card[data-pr-number="57"]').getByRole('button', { name: 'Accept' }).click();
  await expect(accepted).toHaveText(String(before + 1));
  await nav(page, 'Runs');
  await expect(page.getByText('#57', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: /Search/ }).click();
  const search = page.getByLabel('Search repositories, pull requests, and packages');
  await search.fill('57');
  await expect(page.getByText(/#57/).first()).toBeVisible();
}

export async function persistenceProbe(page: Page) {
  await boot(page);
  const coachmark = page.getByRole('button', { name: /Dismiss Connect when/ });
  await expect(coachmark).toBeVisible();
  await coachmark.click();
  await page.getByLabel('Min files').fill('4');
  await page.getByLabel('Max files').fill('9');
  await nav(page, 'Triage');
  await page.locator('.triage-card[data-pr-number="52"]').getByRole('button', { name: 'Reject PR' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reject PR #52' });
  await dialog.locator('select[name="reason"]').selectOption('docs-only');
  await dialog.getByRole('button', { name: 'Reject PR' }).click();
  await nav(page, 'Library');
  const packageCount = await page.locator('.library-row').count();
  await page.getByRole('button', { name: 'Connections' }).click();
  const connections = page.getByRole('dialog', { name: 'Connections' });
  await connections.getByLabel('AI base URL').fill('https://api.persisted.test');
  await connections.locator('input[name="aiApiKey"]').fill('sk-live-persistence-check');
  await connections.getByRole('button', { name: 'Connect AI' }).click();
  await expect(connections.getByText('Connected', { exact: true })).toBeVisible();
  await connections.locator('input[name="githubToken"]').fill('ghp_EPHEMERAL');
  await page.reload();
  await expect(page.getByText('Demo data', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Dismiss Connect when/ })).toHaveCount(0);
  await nav(page, 'Library');
  await expect(page.locator('.library-row')).toHaveCount(packageCount);
  await nav(page, 'Candidates');
  await expect(page.getByLabel('Min files')).toHaveValue('4');
  await expect(page.getByLabel('Max files')).toHaveValue('9');
  await nav(page, 'Triage');
  await expect(page.locator('.triage-card[data-pr-number="52"]')).toContainText('Docs only');
  await page.getByRole('button', { name: 'Connections' }).click();
  const reloadedConnections = page.getByRole('dialog', { name: 'Connections' });
  await expect(reloadedConnections.getByLabel('AI base URL')).toHaveValue('https://api.persisted.test');
  await expect(reloadedConnections.locator('input[name="githubToken"]')).toHaveValue('');
  await expect(reloadedConnections.locator('input[name="aiApiKey"]')).toHaveValue('');
  await expect(reloadedConnections.getByText('Disconnected', { exact: true })).toHaveCount(2);
}

export async function objectiveVisualProbe(page: Page) {
  await shellProbe(page);
  const titleSize = await page.locator('.brand-title').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const bodySize = await page.locator('.repo-desc').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(titleSize).toBeGreaterThan(bodySize);
  const row = page.locator('.repo-row').nth(1);
  const before = await row.evaluate((el) => getComputedStyle(el).backgroundColor);
  await row.hover();
  await page.waitForTimeout(250);
  const after = await row.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(after).not.toBe(before);
}

export async function frameRateProbe(page: Page) {
  await boot(page);
  await page.getByRole('button', { name: 'Connections' }).click();
  const frames = await page.evaluate(() => new Promise<number>((resolve) => {
    let count = 0;
    const started = performance.now();
    const sample = (now: number) => {
      count += 1;
      if (now - started >= 1000) resolve(count);
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  expect(frames).toBeGreaterThanOrEqual(30);
  await expect(page.getByRole('dialog', { name: 'Connections' })).toBeVisible();
}
