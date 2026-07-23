import { test } from '@playwright/test';
import { expect } from '@playwright/test';
import { boot, candidateProbe, cleanConsoleProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, nav, objectiveVisualProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';

// NOT-AUTOMATABLE:
// - 11.1 delightful_microinteractions: Holistic delight is a subjective quality judgment.
// - 11.2 advanced_motion_mechanics: Animation sophistication is subjective beyond objective motion timing.
// - 11.3 guided_onboarding: Onboarding richness beyond required coachmarks is subjective.
// - 11.7 polished_brand_narrative: Brand narrative polish is a subjective quality judgment.
// - 11.10 competition_level_innovation: Competition-level innovation requires comparative human judgment.
// - innovation.catchall innovation_catchall: Open-ended novelty requires human review.

async function completeFixtureRun(page) {
  await boot(page);
  await nav(page, 'Triage');
  const card = page.locator('.triage-card[data-pr-number="57"]');
  await card.getByRole('button', { name: 'Accept' }).click();
  await card.getByRole('button', { name: 'Run pipeline' }).click();
  await expect(page.getByLabel(/Task package for nimbusworks\/driftline PR 57/)).toBeVisible({ timeout: 45_000 });
}

test('11.1 delightful_microinteractions', async ({ page }) => {
  await completeFixtureRun(page);
  await expect(page.locator('.celebration .confetti')).toHaveCount(14);
  await expect(page.locator('.confetti').first()).toHaveCSS('animation-name', 'confetti-fall');
});

test('11.2 advanced_motion_mechanics', async ({ page }) => {
  await completeFixtureRun(page);
  const flow = page.getByLabel('Pipeline stage choreography');
  await expect(flow).toBeVisible();
  await expect(flow.locator('.stage-flow-node.flow-complete')).toHaveCount(4);
  await expect(flow.locator('.stage-flow-link.complete')).toHaveCount(3);
  await expect(page.locator('.stage-card').nth(3)).toHaveCSS('animation-delay', '0.21s');
});

test('11.3 guided_onboarding', async ({ page }) => {
  await boot(page);
  const tour = page.getByLabel('Guided first-run tour');
  await expect(tour).toContainText('step 1 of 3');
  await tour.getByRole('button', { name: 'Next' }).click();
  await expect(tour).toContainText('step 2 of 3');
  await tour.getByRole('button', { name: 'Next' }).click();
  await expect(tour).toContainText('step 3 of 3');
  await tour.getByRole('button', { name: 'Finish tour' }).click();
  await expect(tour).toBeHidden();
});

test('11.4 enhanced_interactive_graphics', async ({ page }) => {
  await candidateProbe(page);
  await expect(page.locator('.diff-summary-track')).toBeVisible();
  await expect(page.locator('.diffstat-track')).toHaveCount(5);
  await expect(page.locator('.diffstat-add').first()).toHaveCSS('background-color', 'rgb(59, 162, 114)');
});

test('11.5 keyboard_driven_triage_bonus', async ({ page }) => {
  await triageProbe(page);
});

test('11.6 preference_personalization', async ({ page }) => {
  await objectiveVisualProbe(page);
});

test('11.7 polished_brand_narrative', async ({ page }) => { await objectiveVisualProbe(page); });

test('11.8 dynamic_theming_beyond_requirements', async ({ page }) => {
  await objectiveVisualProbe(page);
});

test('11.9 package_comparison_bonus', async ({ page }) => {
  await libraryProbe(page);
});

test('11.10 competition_level_innovation', async ({ page }) => { await objectiveVisualProbe(page); });

test('innovation.catchall innovation_catchall', async ({ page }) => {
  await completeFixtureRun(page);
  const retrospective = page.getByLabel('Run retrospective');
  await expect(retrospective).toContainText('This run is ready to hand off.');
  await expect(retrospective).toContainText(/was the longest stage at \d+\.\d+s/);
  await expect(retrospective.getByLabel('Stage duration comparison').locator('.retrospective-row')).toHaveCount(4);
});
