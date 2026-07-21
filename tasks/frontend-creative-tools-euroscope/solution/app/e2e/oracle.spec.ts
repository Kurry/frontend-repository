import { expect, test } from "@playwright/test";

test("theme, icon count, and wizard step remain coherent through reload", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByLabel(/Patching wizard progress — step 2 of 4/)).toBeVisible();

  const hexFields = page.locator('input[id^="swatch-hex-"]');
  const euroScope = await hexFields.evaluateAll((fields) =>
    fields.map((field) => (field as HTMLInputElement).value),
  );
  await page.getByLabel("Base theme").selectOption("Grey");
  const grey = await hexFields.evaluateAll((fields) =>
    fields.map((field) => (field as HTMLInputElement).value),
  );

  expect(grey).toEqual(["#000000", "#131313", "#262626", "#4b4b4b", "#6d6d6d", "#d4d4d4"]);
  expect(grey.every((value, index) => value !== euroScope[index])).toBe(true);

  await page.getByRole("button", { name: /continue/i }).click();
  const iconSet = page.getByLabel("Base icon set");
  await iconSet.selectOption("none");
  await expect(page.getByText("0 of 10 bitmaps set to Vector.", { exact: false })).toBeVisible();
  const originalTiles = page.locator('[title="Original"]');
  const renderedTileCount = await originalTiles.count();
  expect(renderedTileCount).toBeGreaterThanOrEqual(10);

  await iconSet.selectOption("vector");
  await expect(page.getByText("10 of 10 bitmaps set to Vector.", { exact: false })).toBeVisible();
  await expect(originalTiles).toHaveCount(0);
  await expect(page.locator('[title="Vector (recoloured)"]')).toHaveCount(renderedTileCount);

  await page.reload();
  await expect(page.getByLabel(/Patching wizard progress — step 3 of 4/)).toBeVisible();
  await expect(page.getByLabel("Base icon set")).toHaveValue("vector");
  await expect(page.getByText("10 of 10 bitmaps set to Vector.", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: /back/i }).click();
  await expect(page.getByLabel("Base theme")).toHaveValue("Grey");
  await expect
    .poll(() =>
      hexFields.evaluateAll((fields) =>
        fields.map((field) => (field as HTMLInputElement).value),
      ),
    )
    .toEqual(grey);
  expect(pageErrors).toEqual([]);
});
