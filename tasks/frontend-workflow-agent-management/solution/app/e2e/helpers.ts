import { expect, type Download, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

export async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Agent registry' })).toBeVisible();
  await expect(page.locator('.agent-row')).toHaveCount(9);
}

export const row = (page: Page, name: string) => page.locator('.agent-row').filter({ hasText: name });
export const total = (page: Page) => page.locator('.rollup-total strong');

export async function openRegister(page: Page) {
  const trigger = page.getByRole('button', { name: 'Register Agent' }).first();
  await trigger.click();
  const modal = page.locator('.cds--modal-container').filter({ hasText: 'Create the exact payload' });
  await expect(modal).toBeVisible();
  return modal;
}

export async function fillRegister(page: Page, modal: Locator, name = 'Delta Signal', type = 'Aster', editor = 'Vector', accessKey = 'delta_signal_key_2026') {
  await modal.getByLabel('Name').fill(name);
  await modal.getByRole('combobox', { name: 'Agent type' }).click(); await page.getByRole('option', { name: type, exact: true }).click();
  await modal.getByRole('combobox', { name: 'Editor integration' }).click(); await page.getByRole('option', { name: editor, exact: true }).click();
  await modal.getByLabel('Access key').fill(accessKey);
  await expect(modal.getByRole('button', { name: 'Register Agent' })).toBeEnabled();
}

export async function register(page: Page, name = 'Delta Signal', type = 'Aster', editor = 'Vector', accessKey = 'delta_signal_key_2026') {
  const modal = await openRegister(page); await fillRegister(page, modal, name, type, editor, accessKey); await modal.getByRole('button', { name: 'Register Agent' }).click();
  await expect(row(page, name)).toHaveCount(1); return row(page, name);
}

export async function openDetail(page: Page, name = 'Aster Finch') {
  await row(page, name).click(); const panel = page.locator('.detail-panel'); await expect(panel).toContainText(name); return panel;
}

export async function openExport(page: Page) {
  await page.getByRole('button', { name: 'Export fleet' }).first().click(); await expect(page.locator('.json-preview')).toBeVisible(); return page.locator('.cds--modal-container').filter({ hasText: 'compiled from the current registry' });
}

export async function exportJson(page: Page) { await openExport(page); return JSON.parse((await page.locator('.json-preview').textContent())!); }

export async function closeTopOverlay(page: Page) { await page.keyboard.press('Escape'); await expect(page.locator('.cds--modal-container')).toHaveCount(0); }

export async function removeAgent(page: Page, name: string) {
  const target = row(page, name); await target.getByRole('button', { name: `Actions for ${name}` }).click(); await page.getByRole('menuitem', { name: 'Remove' }).click();
  const dialog = page.getByRole('dialog').filter({ hasText: `Remove ${name}?` }); await dialog.getByRole('button', { name: 'Remove agent' }).click(); await expect(target).toHaveCount(0); return dialog;
}

export async function downloadedText(download: Download) { const path = await download.path(); expect(path).toBeTruthy(); return readFile(path!, 'utf8'); }

export async function importText(page: Page, text: string) {
  await page.getByRole('button', { name: 'Import fleet' }).first().click(); const modal = page.locator('.cds--modal-container').filter({ hasText: 'Paste a complete fleet JSON' }); await modal.getByLabel('Fleet JSON').fill(text); return modal;
}

export async function css(locator: Locator, property: string) { return locator.evaluate((element, prop) => getComputedStyle(element).getPropertyValue(prop as string), property); }
