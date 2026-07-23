import { expect, type Page } from '@playwright/test';

export async function boot(page: Page) {
  if (!await page.getByRole('heading', { name: 'Task Bundle Portfolio' }).isVisible().catch(() => false)) {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  }
  await expect(page.getByRole('heading', { name: 'Task Bundle Portfolio' })).toBeVisible();
}

export async function openBundle(page: Page, slug = 'ember-relay-router') {
  await boot(page);
  // The desktop row is itself the link but contains gate-evidence buttons.
  // A coordinate click at the row's centre can land on one of those nested
  // buttons and open Gate instead of the bundle's default Resolve panel.
  // Keyboard activation exercises the row's own public interaction path.
  const row = page.getByRole('link', { name: `Open ${slug}` });
  await row.focus();
  await row.press('Enter');
  await expect(page.getByRole('heading', { name: slug })).toBeVisible();
}

export async function openStep(page: Page, step: 'Resolve' | 'Gate' | 'Audit' | 'Verdict' | 'Bundle' | 'Timeline', slug = 'ember-relay-router') {
  // Check for the bundle's own heading rather than sniffing the page URL —
  // a hostname/port substring check (e.g. "localhost:3000") silently never
  // matches when the app is served from 127.0.0.1 (what both the CI harness
  // and a locally-forwarded port use), which forced every second-or-later
  // openStep() call in a test to re-run openBundle()'s full page.goto('/'),
  // discarding any in-memory session state (like an in-flight re-run) the
  // test had just set up.
  const isBundleOpen = await page.getByRole('heading', { name: slug }).isVisible().catch(() => false);
  if (!isBundleOpen) {
    await openBundle(page, slug);
  }
  await page.locator('.step-button').filter({ has: page.getByText(step, { exact: true }) }).click();
}

export async function resolvePrerequisites(page: Page, through: 'Resolve' | 'Gate' | 'Audit' | 'Verdict' = 'Audit', slug = 'juniper-lint-fixer') {
  await openBundle(page, slug);
  const steps = ['Resolve', 'Gate', 'Audit', 'Verdict'] as const;
  for (const step of steps) {
    await page.locator('.step-button').filter({ has: page.getByText(step, { exact: true }) }).click();
    const box = page.getByRole('checkbox', { name: `Mark ${step} done` });
    if (await box.isVisible() && !(await box.isChecked())) await box.check();
    if (step === through) break;
  }
}

export async function portfolioInvariant(page: Page) {
  await boot(page);
  await expect(page.locator('.bundle-row')).toHaveCount(12);
  await expect(page.locator('.calibration-cell')).toHaveCount(12);
  await expect(page.locator('.rollup-value').first()).toHaveText('12');
}

export async function gateInvariant(page: Page) {
  await openStep(page, 'Gate');
  await expect(page.getByRole('heading', { name: 'Six-Gate Certification Board' })).toBeVisible();
  await expect(page.locator('.gate-card')).toHaveCount(6);
  await expect(page.getByText('0.80', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('0.90', { exact: true }).first()).toBeVisible();
}

export async function inspectorInvariant(page: Page) {
  await openStep(page, 'Audit');
  await expect(page.getByRole('heading', { name: /Trial Inspector/ })).toBeVisible();
  await expect(page.getByRole('listbox', { name: /trials$/ }).getByRole('option')).toHaveCount(4);
  await expect(page.getByLabel('Rubric criteria').getByRole('button')).toHaveCount(6);
  await expect(page.getByText('answer-determinacy', { exact: true })).toBeVisible();
}

export async function fixInvariant(page: Page) {
  await openStep(page, 'Resolve');
  await expect(page.getByRole('heading', { name: 'Fix List' })).toBeVisible();
  await expect(page.locator('.fix-item').first()).toBeVisible();
}

export async function verdictInvariant(page: Page) {
  await openStep(page, 'Verdict');
  await expect(page.getByText('Verdict is locked')).toBeVisible();
}

export async function editableVerdictInvariant(page: Page) {
  await resolvePrerequisites(page, 'Audit');
  await page.locator('.step-button').filter({ has: page.getByText('Verdict', { exact: true }) }).click();
  await expect(page.getByRole('heading', { name: 'Constrained Verdict' })).toBeVisible();
  // Mantine's Radio.Group renders the correct ARIA role for a grouped set of
  // radio inputs, role="radiogroup" (not the generic "group") — match that.
  await expect(page.getByRole('radiogroup', { name: 'Recommendation' })).toBeVisible();
  // Mantine's controlled toggle role differs across browser/platform builds;
  // its explicit label is the stable user-facing contract.
  await expect(page.getByLabel('Override constraint')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save recommendation' })).toBeVisible();
}

export async function artifactInvariant(page: Page) {
  await openBundle(page);
  await page.getByRole('button', { name: 'Export Certification Package' }).click();
  await expect(page.getByRole('heading', { name: 'Export Certification Package', exact: true })).toBeVisible();
  await expect(page.getByLabel(/export preview/)).toContainText('review-certification/v1');
}

export async function artifactRoundTripInvariant(page: Page) {
  await openBundle(page);
  await page.getByRole('button', { name: 'Export Certification Package' }).click();
  const preview = await page.getByLabel(/json export preview/i).innerText();
  await page.getByRole('button', { name: 'Close export drawer' }).click();
  await page.getByRole('button', { name: 'Import Certification Package' }).click();
  const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Import Certification Package' }) });
  await dialog.getByLabel('packageText').fill(preview);
  await dialog.getByRole('button', { name: 'Import Certification Package' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'ember-relay-router' })).toBeVisible();
}

export async function reloadInvariant(page: Page) {
  await openStep(page, 'Resolve', 'juniper-lint-fixer');
  const notes = page.getByLabel('Resolve step notes');
  await notes.fill('Transient reload mutation');
  await notes.blur();
  await page.getByRole('checkbox', { name: 'Mark Resolve done' }).check();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Task Bundle Portfolio' })).toBeVisible();
  const row = page.getByRole('link', { name: 'Open juniper-lint-fixer' });
  await row.focus();
  await row.press('Enter');
  await page.locator('.step-button').filter({ has: page.getByText('Resolve', { exact: true }) }).click();
  await expect(page.getByLabel('Resolve step notes')).not.toHaveValue('Transient reload mutation');
  await expect(page.getByRole('checkbox', { name: 'Mark Resolve done' })).not.toBeChecked();
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
}

export async function stepperInvariant(page: Page) {
  await openBundle(page, 'juniper-lint-fixer');
  const gate = page.locator('.step-button').filter({ has: page.getByText('Gate', { exact: true }) });
  await expect(gate).toHaveClass(/locked/);
  const notes = page.getByLabel('Resolve step notes');
  await notes.fill('Stepper continuity note');
  await notes.blur();
  await page.getByRole('checkbox', { name: 'Mark Resolve done' }).check();
  await expect(gate).not.toHaveClass(/locked/);
  await gate.click();
  await page.locator('.step-button').filter({ has: page.getByText('Resolve', { exact: true }) }).click();
  await expect(page.getByLabel('Resolve step notes')).toHaveValue('Stepper continuity note');
}

export async function resizeStateInvariant(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openStep(page, 'Resolve', 'juniper-lint-fixer');
  const notes = page.getByLabel('Resolve step notes');
  await notes.fill('Resize continuity note');
  await notes.blur();
  await page.setViewportSize({ width: 375, height: 900 });
  await expect(page.getByRole('heading', { name: 'juniper-lint-fixer' })).toBeVisible();
  await expect(page.getByLabel('Resolve step notes')).toHaveValue('Resize continuity note');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

export async function rerunInvariant(page: Page) {
  await openStep(page, 'Gate');
  const button = page.getByRole('button', { name: 'Re-run gate' }).first();
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByText('Re-run sequence').first()).toBeVisible();
  await expect(page.getByText(/running|waiting|complete/).first()).toBeVisible();
}

export async function doubleRerunInvariant(page: Page) {
  await openStep(page, 'Gate');
  // Scope to the first gate card and match on a "Re-run" name prefix (not the
  // exact label) so the same locator keeps resolving to the same button once
  // its accessible name flips to "Re-run in progress" / "Re-run paused" after
  // the click — an exact-name locator would silently re-resolve to a
  // different, still-idle gate's button once the first gate's label changes.
  const button = page.locator('.gate-card').first().getByRole('button', { name: /Re-run/ });
  await button.evaluate((node: HTMLButtonElement) => { node.click(); node.click(); });
  await expect(page.locator('.rerun-progress')).toHaveCount(1);
  const runLabel = await page.locator('.rerun-progress').getByText(/^Run /).innerText();
  await expect(button).toBeDisabled();
  await button.evaluate((node: HTMLButtonElement) => node.click());
  await expect(page.locator('.rerun-progress').getByText(runLabel, { exact: true })).toBeVisible();
  await openStep(page, 'Timeline');
  await expect(page.getByText(/re-run started/)).toHaveCount(1);
}

export async function keyboardInvariant(page: Page) {
  await boot(page);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  await page.getByRole('button', { name: 'Export Certification Package' }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await expect.poll(() => drawer.evaluate((node) => node.contains(document.activeElement))).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
}

export async function timingInvariant(page: Page, limit = 2_000) {
  const start = Date.now();
  await boot(page);
  expect(Date.now() - start).toBeLessThan(limit);
}

export async function transitionInvariant(page: Page) {
  await boot(page);
  const link = page.getByLabel('Open ember-relay-router');
  const delays = await link.evaluate((node) => getComputedStyle(node).transitionDelay.split(',').map(Number.parseFloat));
  expect(delays.every((delay) => delay < 0.1)).toBeTruthy();
  // Measure real in-app responsiveness with in-page performance timestamps
  // rather than Node-side Date.now() wrapped around the Playwright actions —
  // the latter also bills CDP round-trip and actionability-polling overhead
  // to the app, which can dwarf actual render time and has nothing to do
  // with whether the UI itself "begins responding" quickly.
  await link.evaluate((node) => {
    const win = window as unknown as { __navClickTs: number; __navRenderedTs: number };
    win.__navClickTs = 0;
    win.__navRenderedTs = 0;
    node.addEventListener('click', () => { win.__navClickTs = performance.now(); }, { capture: true, once: true });
    const observer = new MutationObserver(() => {
      const heading = document.querySelector('h1');
      if (heading?.textContent === 'ember-relay-router' && !win.__navRenderedTs) {
        win.__navRenderedTs = performance.now();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  await link.click();
  await expect(page.getByRole('heading', { name: 'ember-relay-router' })).toBeVisible();
  const elapsed = await page.evaluate(() => {
    const win = window as unknown as { __navClickTs: number; __navRenderedTs: number };
    return win.__navRenderedTs - win.__navClickTs;
  });
  expect(elapsed).toBeLessThan(100);
}

export async function consoleInvariant(page: Page) {
  const messages: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') messages.push(`${message.type()}: ${message.text()}`); });
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
  await portfolioInvariant(page);
  await rerunInvariant(page);
  await inspectorInvariant(page);
  await fixInvariant(page);
  await editableVerdictInvariant(page);
  await artifactInvariant(page);
  expect(messages).toEqual([]);
}

export async function reducedMotionInvariant(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const durations = await page.locator('.bundle-row').first().evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.animationDuration, style.transitionDuration].flatMap((value) => value.split(',')).map(Number.parseFloat);
  });
  expect(durations.every((duration) => duration <= 0.01)).toBeTruthy();
}

export async function genericCriterion(page: Page, dimension: string, id: string) {
  if (dimension === 'core_features') {
    const n = Number(id.split('.')[1]);
    if (n <= 7) return portfolioInvariant(page);
    if (n <= 20) return gateInvariant(page);
    if (n <= 29) return inspectorInvariant(page);
    if (n <= 32) return fixInvariant(page);
    if (n <= 37) return editableVerdictInvariant(page);
    if (n === 48) return doubleRerunInvariant(page);
    if (n <= 52) return stepperInvariant(page);
    if (n >= 56) return artifactRoundTripInvariant(page);
    return artifactInvariant(page);
  }
  if (dimension === 'responsiveness') {
    if (id === '7.9') return resizeStateInvariant(page);
    const width = id === '7.2' ? 1024 : id === '7.3' ? 768 : 375;
    await page.setViewportSize({ width, height: 900 });
    await boot(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    // Per responsiveness criterion 7.3, at <=768px the portfolio table
    // condenses to per-bundle cards (.portfolio-table-wrap is intentionally
    // hidden by the <=768px media query in styles.css) — assert the cards
    // layout is what's actually shown, not the desktop table wrapper.
    if (id === '7.3') await expect(page.locator('.portfolio-cards')).toBeVisible();
    return;
  }
  if (dimension === 'technical') {
    if (id === '2.2') return reloadInvariant(page);
    if (id === '2.5') return consoleInvariant(page);
    if (id === '2.6') return timingInvariant(page);
    if (id === '2.7') return rerunInvariant(page);
    return portfolioInvariant(page);
  }
  if (dimension === 'performance') {
    if (id === '9.1') return timingInvariant(page);
    if (id === '9.2') return consoleInvariant(page);
    if (id === '9.3') return transitionInvariant(page);
    if (id === '9.4' || id === '9.6') return rerunInvariant(page);
    return portfolioInvariant(page);
  }
  if (dimension === 'accessibility') {
    if (id === '1.1' || id === '1.2') return keyboardInvariant(page);
    if (id === '1.10') return reducedMotionInvariant(page);
    await boot(page);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export Certification Package' })).toBeVisible();
    return;
  }
  if (dimension === 'motion') {
    if (id === '4.10') return reducedMotionInvariant(page);
    await boot(page);
    const row = page.locator('.bundle-row').first();
    await row.hover();
    await expect(row).toBeVisible();
    return;
  }
  if (dimension === 'edge_cases') return id === '4.11' ? artifactInvariant(page) : openBundle(page);
  if (dimension === 'behavioral') {
    if (id === '14.1') return reloadInvariant(page);
    if (id === '14.3') return rerunInvariant(page);
    if (id === '14.12') return artifactRoundTripInvariant(page);
    if (id === '14.9' || id === '14.11') return artifactInvariant(page);
    return openBundle(page);
  }
  if (dimension === 'user_flows') {
    if (id === '6.2' || id === '6.10') return rerunInvariant(page);
    if (id === '6.12') return artifactRoundTripInvariant(page);
    if (id === '6.11') return artifactInvariant(page);
    return openBundle(page);
  }
  if (dimension === 'visual_design' || dimension === 'design_fidelity' || dimension === 'writing' || dimension === 'innovation') return portfolioInvariant(page);
  return boot(page);
}
