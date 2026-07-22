import { expect, type Download, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

export async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pipeline board', exact: true })).toBeVisible();
}

export async function openSubmit(page: Page) {
  const trigger = page.getByRole('button', { name: 'Submit job' }).first();
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  return page.getByRole('dialog');
}

export async function selectOption(page: Page, label: string, option: string) {
  const control = page.getByRole('textbox', { name: label });
  await control.click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

export async function fillEvaluate(page: Page, benchmark = 'Switchboard', repetitions = 3) {
  const dialog = await openSubmit(page);
  await selectOption(page, 'Job type', 'Evaluate');
  await selectOption(page, 'Dataset', 'Helix-12K');
  await selectOption(page, 'Model', 'quill-2b-ft-1027');
  await selectOption(page, 'Benchmark', benchmark);
  await page.getByLabel('Repetition count').fill(String(repetitions));
  await expect(dialog.getByRole('button', { name: 'Submit job' })).toBeEnabled();
  return dialog;
}

export async function fillFineTune(page: Page, count = 2, autoEvaluate = true) {
  const dialog = await openSubmit(page);
  await selectOption(page, 'Dataset', 'Helix-12K');
  await selectOption(page, 'Model', 'atlas-mini');
  await page.getByLabel('Epoch count').fill(String(count));
  const toggle = page.getByLabel('Start evaluation automatically when training completes');
  if ((await toggle.isChecked()) !== autoEvaluate) await toggle.click();
  await expect(dialog.getByRole('button', { name: 'Submit job' })).toBeEnabled();
  return dialog;
}

export async function submitAndGetNewRun(page: Page, dialog: Locator) {
  const before = Number((await page.getByTestId('run-count').textContent())?.match(/\d+/)?.[0]);
  await dialog.getByRole('button', { name: 'Submit job' }).click();
  await expect(page.getByTestId('run-count')).toHaveText(`${before + 1} runs`);
  return page.locator('.run-strip').first();
}

export async function downloadText(download: Download) {
  const path = await download.path();
  expect(path).toBeTruthy();
  return readFile(path!, 'utf8');
}

export async function openResults(page: Page) {
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Results', exact: true })).toBeVisible();
}

export async function openRun(page: Page, id: string) {
  await page.getByRole('button', { name: `Open details for ${id}` }).click();
  await expect(page.getByRole('heading', { name: 'Event timeline' })).toBeVisible();
  return page.getByRole('dialog');
}

export async function css(locator: Locator, property: string) {
  return locator.evaluate((element, prop) => getComputedStyle(element).getPropertyValue(prop as string), property);
}
