import { expect, test } from '@playwright/test';

async function holdToCreate(page) {
  const button = page.getByRole('button', { name: 'Hold to add theme' });
  const box = await button.boundingBox();
  if (!box) throw new Error('Hold-to-add control is not visible');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  return { button, box };
}

test('hold-to-add exposes live progress before creating exactly one theme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#my-themes-count')).toHaveText('0');

  const { button, box } = await holdToCreate(page);
  await page.waitForTimeout(280);
  const progressWidth = await button.locator('.hold-progress').evaluate((node) => node.getBoundingClientRect().width);
  expect(progressWidth).toBeGreaterThan(box.width * 0.25);
  expect(progressWidth).toBeLessThan(box.width * 0.75);

  await page.waitForTimeout(520);
  await page.mouse.up();
  await expect(page.locator('#my-themes-count')).toHaveText('1');
  await expect(page.locator('#my-themes .theme-row')).toHaveCount(1);
});

test('downloaded Theme JSON restores edited tokens and modal close paths cleanly dismiss', async ({ page }) => {
  await page.addInitScript(() => {
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      window.__lastDownloadBlob = blob;
      return createObjectURL(blob);
    };
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function downloadClick() {
      if (this.download) window.__lastDownloadName = this.download;
      return click.call(this);
    };
  });
  await page.goto('/');
  await holdToCreate(page);
  await page.waitForTimeout(760);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Skip tour' }).click();

  await page.getByLabel('Theme name').fill('Studio Dawn');
  await page.getByLabel('Primary face color').fill('#336699');
  await page.getByRole('button', { name: 'Boxes: 1rem (1rem)' }).click();
  await page.getByLabel('Dark color scheme').check();

  const exportButton = page.getByRole('button', { name: 'Export', exact: true });
  await exportButton.click();
  const exportModal = page.locator('#css-modal');
  await expect(exportModal).toHaveAttribute('aria-hidden', 'false');
  await page.getByRole('tab', { name: 'Theme JSON' }).click();
  await expect(page.locator('#css-output')).toContainText('"--color-primary": "#336699"');
  await expect(page.locator('#css-output')).toContainText('"--radius-box": "1rem"');
  await expect(page.locator('#css-output')).toContainText('"color-scheme": "dark"');

  await page.getByRole('button', { name: 'Download' }).click();
  const downloadArtifact = await page.evaluate(async () => ({
    name: window.__lastDownloadName,
    text: await window.__lastDownloadBlob.text()
  }));
  expect(downloadArtifact.name).toBe('studio-dawn.json');
  const downloadedJson = downloadArtifact.text;
  expect(JSON.parse(downloadedJson).name).toBe('Studio Dawn');

  await page.getByRole('button', { name: 'Close' }).click();
  await expect(exportModal).toHaveAttribute('aria-hidden', 'true');
  await expect(exportModal).toHaveAttribute('inert', '');

  await page.getByLabel('Primary face color').fill('#aa2244');
  await page.getByRole('button', { name: 'Boxes: 0rem (0rem)' }).click();
  await page.getByLabel('Dark color scheme').uncheck();

  await page.getByRole('button', { name: 'Import theme' }).click();
  await page.getByLabel('Theme JSON document').fill(downloadedJson);
  await page.getByRole('button', { name: 'Import theme' }).last().click();
  await expect(page.locator('#import-modal')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.getByLabel('Theme name')).toHaveValue('Studio Dawn');
  await expect(page.getByLabel('Primary face color')).toHaveValue('#336699');
  await expect(page.getByRole('button', { name: 'Boxes: 1rem (1rem)' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Dark color scheme')).toBeChecked();

  await exportButton.click();
  await page.keyboard.press('Escape');
  await expect(exportModal).toHaveAttribute('aria-hidden', 'true');

  await exportButton.click();
  await exportModal.click({ position: { x: 4, y: 4 } });
  await expect(exportModal).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.modal-backdrop.open')).toHaveCount(0);
});
