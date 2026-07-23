import { expect, test, type Download } from '@playwright/test';

async function downloadText(downloadPromise: Promise<Download>) {
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Material-UI Theme Creator' })).toBeVisible();
});

test('mobile shell stays within the viewport without announcing a closed form', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();

  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('[data-announcer]')).toBeEmpty();
  await expect(page.getByRole('button', { name: /Commands/ })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Tutorial' })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'GitHub (inert)' })).toBeInViewport();
});

test('WebMCP descriptors synthesize a read probe and a visible mutation', async ({ page }) => {
  const tools = await page.evaluate(() => (window as any).webmcp_list_tools());
  const byName = new Map(tools.map((tool: any) => [tool.name, tool]));
  const select = byName.get('editor_select') as any;
  const exportTool = byName.get('artifact_export') as any;

  expect(select.module).toBe('structured-editor-v1');
  expect(select.inputSchema.required).toEqual(['object_type', 'id']);
  expect(exportTool.module).toBe('artifact-transfer-v1');
  expect(exportTool.inputSchema.properties.format.enum).toEqual(['json', 'css']);

  expect(await page.evaluate(() => (window as any).webmcp_invoke_tool('editor_select', {
    object_type: 'material-theme',
    id: 'default',
  }))).toEqual({ success: true });
  await page.evaluate(() => (window as any).webmcp_invoke_tool('artifact_export', { format: 'json' }));
  await expect(page.getByRole('tab', { name: 'Export' })).toHaveAttribute('aria-selected', 'true');
});

test('exported JSON round-trips, regenerates CSS, rejects incomplete palettes, and downloads exact artifacts', async ({ page }) => {
  await page.getByRole('tab', { name: 'Export' }).click();
  const preview = page.locator('[data-export-preview]');
  const payload = JSON.parse(await preview.innerText());
  payload.palette.type = 'dark';
  payload.palette.primary.main = '#123456';
  payload.typography.fontSize = 19;
  payload.shape.borderRadius = 13;

  const importBox = page.getByLabel('Import ThemeOptions JSON');
  await importBox.fill(JSON.stringify(payload));
  await page.getByRole('button', { name: 'Import ThemeOptions' }).click();
  await expect(page.getByText('ThemeOptions imported', { exact: true })).toBeVisible();
  await expect(preview).toContainText('"main": "#123456"');
  await expect(preview).toContainText('"fontSize": 19');

  await page.getByRole('tab', { name: 'CSS' }).click();
  await expect(preview).toContainText('--primary: #123456');
  await expect(preview).toContainText('--font-size: 19px');
  await expect(preview).toContainText('--border-radius: 13px');

  const cssText = await preview.innerText();
  const cssDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSS' }).click();
  expect(await downloadText(cssDownload)).toBe(cssText);

  await page.getByRole('tab', { name: 'JSON' }).click();
  const jsonText = await preview.innerText();
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON' }).click();
  expect(await downloadText(jsonDownload)).toBe(jsonText);

  const invalid = JSON.parse(jsonText);
  delete invalid.palette.primary.light;
  await importBox.fill(JSON.stringify(invalid));
  await page.getByRole('button', { name: 'Import ThemeOptions' }).click();
  await expect(page.getByText('palette.primary.light: Required', { exact: true })).toBeVisible();
  await expect(preview).toContainText('"main": "#123456"');
});

test('copy is deduplicated and emits one visible confirmation', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('tab', { name: 'Export' }).click();
  await page.getByRole('button', { name: 'Copy export' }).dblclick();
  await expect(page.getByText('Export copied', { exact: true })).toHaveCount(1);
  await expect(page.locator('[data-announcer]')).not.toContainText('export copied');
});

test('Monaco source synchronizes into tools and invalid source preserves the last valid theme', async ({ page }) => {
  const source = `import { ThemeOptions } from '@material-ui/core/styles';
export const themeOptions: ThemeOptions = {
  palette: {
    type: 'dark',
    primary: { main: '#112233', light: '#223344', dark: '#001122', contrastText: '#ffffff' },
    secondary: { main: '#445566', light: '#556677', dark: '#334455', contrastText: '#ffffff' },
    error: { main: '#aa0000', light: '#bb1111', dark: '#990000', contrastText: '#ffffff' },
    warning: { main: '#aa6600', light: '#bb7711', dark: '#995500', contrastText: '#ffffff' },
    info: { main: '#0066aa', light: '#1177bb', dark: '#005599', contrastText: '#ffffff' },
    success: { main: '#008844', light: '#119955', dark: '#007733', contrastText: '#ffffff' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: { primary: '#ffffff', secondary: '#bbbbbb' },
    divider: '#424242',
  },
  typography: { fontFamily: 'Roboto', fontSize: 20 },
  spacing: 8,
  shape: { borderRadius: 11 },
};`;

  const editor = page.locator('.monaco-editor');
  await expect(editor).toBeVisible();
  await editor.locator('.view-lines').click({ position: { x: 240, y: 40 }, force: true });
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(source);
  await expect(page.getByText('Synced from editor', { exact: true })).toBeVisible({ timeout: 8_000 });

  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('not a ThemeOptions declaration');
  await expect(page.getByRole('main').getByText(/Invalid ThemeOptions — nothing applied/)).toBeVisible({ timeout: 8_000 });

  await page.getByRole('tab', { name: 'Typography' }).click();
  await expect(page.getByLabel('Base Font Size (8–24px)')).toHaveValue('20');
  await expect(page.getByLabel('Border Radius (0–24px)')).toHaveValue('11');
});

test('Escape closes each overlay, restores its opener, and empty names explain disabled create', async ({ page }) => {
  const tutorial = page.getByRole('button', { name: 'Tutorial' });
  await tutorial.click();
  await expect(page.getByRole('dialog', { name: 'Studio tour' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Studio tour' })).toBeHidden();
  await expect(tutorial).toBeFocused();

  await page.getByRole('tab', { name: 'Saved Themes' }).click();
  const newTheme = page.getByRole('button', { name: 'New Theme' }).first();
  await newTheme.click();
  const formDialog = page.getByRole('dialog', { name: 'New Theme' });
  await expect(formDialog.getByText('Theme name is required — enter a name for the theme')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Theme' })).toBeDisabled();
  await page.getByLabel('Theme name').fill(' default theme ');
  await expect(formDialog.getByText('Theme name must be unique — choose a different name')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'New Theme' })).toBeHidden();
  await expect(newTheme).toBeFocused();

  const commands = page.getByRole('button', { name: /Commands/ });
  await commands.click();
  await page.getByLabel('Search commands').fill('zzzzzz');
  await expect(page.getByText(/No commands match/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden();
  await expect(commands).toBeFocused();
});

test('component gallery exposes roughly two dozen demos and search filters sections', async ({ page }) => {
  await page.getByRole('tab', { name: 'Components' }).click();
  await expect(page.locator('[data-gallery-count]')).toContainText('25 themed component demos');
  expect(await page.locator('[data-component-demo]').count()).toBeGreaterThanOrEqual(24);

  await page.getByLabel('Search components').fill('Buttons');
  await expect(page.locator('#comp-buttons')).toBeVisible();
  await expect(page.locator('#comp-cards')).toBeHidden();
  expect(await page.locator('[data-component-demo]').evaluateAll(elements => elements.filter(element => (element as HTMLElement).offsetParent !== null).length)).toBe(5);
});

test('invalid numeric drafts do not mutate the live theme', async ({ page }) => {
  await page.getByRole('tab', { name: 'Typography' }).click();
  const fontSize = page.getByLabel('Base Font Size (8–24px)');
  const borderRadius = page.getByLabel('Border Radius (0–24px)');
  const initialFontSize = Number(await fontSize.inputValue());
  const initialBorderRadius = Number(await borderRadius.inputValue());

  await fontSize.fill('1');
  await expect(page.locator('#font-size-error')).toHaveText('typography.fontSize must be an integer from 8 through 24');
  await borderRadius.fill('25');
  await expect(page.locator('#border-radius-error')).toHaveText('shape.borderRadius must be a number from 0 through 24');

  await page.getByRole('tab', { name: 'Export' }).click();
  const payload = JSON.parse(await page.locator('[data-export-preview]').innerText());
  expect(payload.typography.fontSize).toBe(initialFontSize);
  expect(payload.shape.borderRadius).toBe(initialBorderRadius);
});

test('reduced motion preserves overlay hidden opacity while closing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Tutorial' }).click();
  const dialog = page.locator('[role="dialog"][aria-labelledby="tutorial-title"]');
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCSS('opacity', '0', { timeout: 200 });
});

test('recorded 14.7 failure: an unfinished create survives a main-tab round trip and creates exactly once', async ({ page }) => {
  await page.getByRole('tab', { name: 'Saved Themes' }).click();
  const before = await page.locator('[data-theme-card]').count();
  await page.getByRole('button', { name: 'New Theme' }).first().click();
  await page.getByLabel('Theme name').fill('Discard this draft');
  await page.getByRole('tab', { name: 'Components' }).click();
  await expect(page.getByRole('tab', { name: 'Components' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Saved Themes' }).click();
  await page.getByLabel('Theme name').fill('Interleaved Theme');
  await page.getByRole('button', { name: 'Create Theme' }).click();
  await expect(page.locator('[data-theme-card]')).toHaveCount(before + 1);
  await expect(page.getByText('Interleaved Theme', { exact: true })).toBeVisible();
});

test('recorded 6.3/1.13 failure: palette edit, export, save status, and saved-card swatch stay atomic', async ({ page }) => {
  const primary = page.getByLabel(/primary\.main hex value/);
  await primary.fill('#123456');
  await primary.press('Enter');
  await expect(page.getByText('Unsaved', { exact: true })).toBeVisible();
  await expect(page.locator('.monaco-editor')).toContainText('#123456');

  await page.getByRole('tab', { name: 'Export' }).click();
  await expect(page.locator('[data-export-preview]')).toContainText('#123456');
  await page.getByRole('tab', { name: 'Preview' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Theme saved', { exact: true })).toBeVisible();
  await expect(page.getByText('All changes saved', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Saved Themes' }).click();
  await expect(page.locator('[data-theme-card="default"] span').filter({ has: page.locator('xpath=..') }).first()).toBeAttached();
  const swatches = page.locator('[data-theme-card="default"] [aria-hidden="true"] span');
  await expect(swatches.first()).toHaveCSS('background-color', 'rgb(18, 52, 86)');
});

test('recorded 1.25 failure: added fonts can be removed while Roboto stays protected', async ({ page }) => {
  await page.getByRole('tab', { name: 'Fonts' }).click();
  await page.getByLabel('Font family name').fill('Lato');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('Lato', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove Lato' }).click();
  await expect(page.getByText('Lato', { exact: true })).toBeHidden();
  await expect(page.getByLabel('Roboto is protected from removal')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove Roboto' })).toHaveCount(0);
});

test('recorded 1.33/4.4 failure: snippets patch source and show an auto-dismissing confirmation', async ({ page }) => {
  await page.getByRole('tab', { name: 'Snippets' }).click();
  await page.getByRole('button', { name: /Rounded shapes/ }).click();
  await expect(page.locator('.monaco-editor')).toContainText('borderRadius');
  const toast = page.getByText(/Rounded shapes.*applied/i);
  await expect(toast).toBeVisible();
  await expect(toast).toBeHidden({ timeout: 5_000 });
});

test('recorded 1.38/1.49 failure: rename rejects empty, duplicate, and overlong names without mutation', async ({ page }) => {
  await page.getByRole('tab', { name: 'Saved Themes' }).click();
  const card = page.locator('[data-theme-card="default"]');
  await card.getByRole('button', { name: 'Rename' }).click();
  const name = page.getByLabel('Theme name');
  await name.fill('');
  await expect(page.getByText(/Theme name is required/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rename Theme' })).toBeDisabled();
  await name.fill('Forest');
  await expect(page.getByText(/must be unique/)).toBeVisible();
  await name.fill('x'.repeat(65));
  await expect(page.getByText(/64 characters or fewer/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(card.getByText('Default Theme', { exact: true })).toBeVisible();
});

test('recorded 1.47/6.13 failure: version validation, save, and restore round-trip all live surfaces', async ({ page }) => {
  const primary = page.getByLabel(/primary\.main hex value/);
  await primary.fill('#112233');
  await primary.press('Enter');
  await page.getByRole('tab', { name: 'Saved Themes' }).click();
  await page.getByRole('button', { name: 'Save version' }).click();
  await expect(page.getByText(/Version name is required/)).toBeVisible();
  await page.getByLabel('Version name').fill('Before second edit');
  await page.getByRole('button', { name: 'Save version' }).click();
  await expect(page.getByText('Before second edit', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Preview' }).click();
  await primary.fill('#abcdef');
  await primary.press('Enter');
  await page.getByRole('tab', { name: 'Saved Themes' }).click();
  await page.getByRole('button', { name: 'Restore' }).click();
  await page.getByRole('tab', { name: 'Export' }).click();
  await expect(page.locator('[data-export-preview]')).toContainText('#112233');
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(primary).toHaveValue('#112233');
  await expect(page.getByText('Unsaved', { exact: true })).toBeVisible();
});

test('recorded 1.42/6.11 failure: invalid import preserves state and valid export-import restores all fields', async ({ page }) => {
  const primary = page.getByLabel(/primary\.main hex value/);
  await primary.fill('#13579b');
  await primary.press('Enter');
  await page.getByRole('tab', { name: 'Typography' }).click();
  await page.getByLabel('Border Radius (0–24px)').fill('17');
  await page.getByRole('tab', { name: 'Export' }).click();
  const preview = page.locator('[data-export-preview]');
  const exported = await preview.innerText();
  const box = page.getByLabel('Import ThemeOptions JSON');

  const invalid = JSON.parse(exported);
  invalid.palette.primary.main = 'red';
  await box.fill(JSON.stringify(invalid));
  await page.getByRole('button', { name: 'Import ThemeOptions' }).click();
  await expect(page.getByRole('alert')).toContainText('palette.primary.main');
  await expect(preview).toContainText('#13579b');

  await page.getByRole('tab', { name: 'Preview' }).click();
  await primary.fill('#2468ac');
  await primary.press('Enter');
  await page.getByRole('tab', { name: 'Typography' }).click();
  await page.getByLabel('Border Radius (0–24px)').fill('3');
  await page.getByRole('tab', { name: 'Export' }).click();
  await box.fill(exported);
  await page.getByRole('button', { name: 'Import ThemeOptions' }).click();
  await expect(preview).toContainText('#13579b');
  await expect(preview).toContainText('"borderRadius": 17');
});

test('recorded 1.4/2.8/1.50 failure: field-path errors and save/import statuses reach polite live output', async ({ page }) => {
  const announcer = page.locator('[data-announcer]');
  const primary = page.getByLabel(/primary\.main hex value/);
  await primary.fill('not-a-hex');
  await primary.press('Enter');
  await expect(page.getByText(/palette\.primary\.main/)).toBeVisible();
  await expect(announcer).toContainText('palette.primary.main');

  await page.getByRole('tab', { name: 'Typography' }).click();
  await page.getByLabel('Border Radius (0–24px)').fill('99');
  await expect(page.getByText(/shape\.borderRadius/)).toBeVisible();
  await expect(announcer).toContainText('shape.borderRadius');
});
