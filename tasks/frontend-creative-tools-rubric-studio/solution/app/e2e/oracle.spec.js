import { expect, test } from '@playwright/test';

async function waitForStudio(page) {
  await page.waitForFunction(() => typeof window.webmcp_invoke_tool === 'function');
  const skip = page.getByRole('button', { name: 'Skip tour' });
  if (await skip.isVisible()) await skip.click();
}

test('criterion dialog blocks invalid submit, closes on Escape, and returns focus', async ({ page }) => {
  await page.goto('/');
  await waitForStudio(page);

  const opener = page.getByRole('button', { name: 'Add criterion', exact: true }).first();
  const initialCount = await page.locator('.criterion-panel').count();
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Add criterion' });
  await expect(dialog).toBeVisible();

  const submit = dialog.getByRole('button', { name: 'Add criterion', exact: true });
  await expect(submit).toHaveAttribute('data-incomplete', 'true');
  await expect(submit).toBeDisabled();
  await expect(dialog.getByRole('status')).toContainText('Complete the required fields');
  await expect(page.locator('.criterion-panel')).toHaveCount(initialCount);

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('partial add draft survives a Tune case toggle and submits exactly once', async ({ page }) => {
  await page.goto('/');
  await waitForStudio(page);

  const criteriaRows = page.locator('.criterion-panel');
  const initialCount = await criteriaRows.count();
  await page.getByRole('button', { name: 'Add criterion', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add criterion' });
  await dialog.getByLabel('ID').fill('interleaved-check');
  await dialog.getByLabel('Name').fill('Interleaved integrity');

  await page.getByRole('button', { name: 'Tune', exact: true }).click();
  const caseSwitch = page.getByRole('switch', { name: 'Include case-01' });
  const initiallyIncluded = await caseSwitch.isChecked();
  await caseSwitch.click();
  await expect(caseSwitch).toBeChecked({ checked: !initiallyIncluded });

  await page.getByRole('button', { name: 'Criteria', exact: true }).click();
  await expect(dialog.getByLabel('ID')).toHaveValue('interleaved-check');
  await expect(dialog.getByLabel('Name')).toHaveValue('Interleaved integrity');
  await dialog.getByLabel('Description').fill('Confirms that partially authored criteria and Tune changes remain independent.');
  await dialog.getByRole('button', { name: 'Add criterion', exact: true }).click();

  await expect(dialog).toHaveCount(0);
  await expect(criteriaRows).toHaveCount(initialCount + 1);
  await expect(page.getByText('Interleaved integrity', { exact: true })).toHaveCount(1);
  await expect(page.getByRole('status')).toContainText('Criterion added');

  await page.getByRole('button', { name: 'Tune', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Include case-01' })).toBeChecked({ checked: !initiallyIncluded });

  await page.getByRole('switch', { name: 'Include case-01' }).focus();
  const focusStyle = await page.getByRole('switch', { name: 'Include case-01' }).evaluate((input) => {
    const slider = input.closest('.p-toggleswitch')?.querySelector('.p-toggleswitch-slider');
    const style = getComputedStyle(slider);
    return { outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
  });
  expect(focusStyle.outlineWidth === '3px' || focusStyle.boxShadow !== 'none').toBeTruthy();
});

test('package export preserves the rubric version history', async ({ page }) => {
  await page.goto('/');
  await waitForStudio(page);

  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Export center' });
  await dialog.getByRole('tab', { name: 'Package JSON' }).click();

  const exported = JSON.parse(await dialog.locator('.export-preview').textContent());
  const responseQuality = exported.rubrics.find((rubric) => rubric.name === 'Response Quality');
  expect(responseQuality.history).toHaveLength(4);
  expect(responseQuality.history[0]).toMatchObject({ version: '2.1.0', diff: { kind: 'changed' } });
});

test('a versioned Likert range edit reconciles the Tune threshold', async ({ page }) => {
  await page.goto('/');
  await waitForStudio(page);

  const result = await page.evaluate(() => window.webmcp_invoke_tool({
    name: 'editor_update_property',
    arguments: {
      objectType: 'criterion',
      id: 'clarity-check',
      property: 'likert-min',
      value: 4,
      version: '2.2.0',
    },
  }));
  expect(result).toMatchObject({ ok: true, visibleState: { version: '2.2.0' } });

  await page.getByRole('button', { name: 'Tune', exact: true }).click();
  const threshold = page.getByLabel('Pass threshold for Clarity and directness');
  await expect(threshold).toHaveText('5');
});
