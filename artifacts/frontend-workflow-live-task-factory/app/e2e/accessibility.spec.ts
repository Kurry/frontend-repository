import { test } from '@playwright/test';
import { candidateProbe, cleanConsoleProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, objectiveVisualProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';
import { contrastProbe, formLabelProbe, headingOrderProbe, iconLabelProbe, keyboardControlsProbe, liveRegionProbe, modalFocusProbe } from './helpers';

test.setTimeout(90_000);

test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
  await keyboardControlsProbe(page);
});

test('1.2 modals_manage_focus', async ({ page }) => {
  await modalFocusProbe(page);
});

test('1.3 images_and_icons_have_alt_text', async ({ page }) => {
  await iconLabelProbe(page);
});

test('1.4 feedback_uses_live_regions', async ({ page }) => {
  await liveRegionProbe(page);
});

test('1.5 forms_have_explicit_labels', async ({ page }) => {
  await formLabelProbe(page);
});

test('1.6 headings_follow_logical_order', async ({ page }) => {
  await headingOrderProbe(page);
});

test('1.7 landmark_navigation_is_present', async ({ page }) => {
  await shellProbe(page);
});

test('1.8 text_and_controls_have_contrast', async ({ page }) => {
  await contrastProbe(page);
});

test('1.9 semantic_html_roles_are_used', async ({ page }) => {
  await shellProbe(page);
});

test('1.10 reduced_motion_is_respected', async ({ page }) => {
  await reducedMotionProbe(page);
});
