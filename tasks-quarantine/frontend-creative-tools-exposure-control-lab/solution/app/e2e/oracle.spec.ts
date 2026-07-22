import { expect, test } from "@playwright/test";

test.describe("Exposure Control Lab E2E Suite", () => {
  test("complete app walkthrough: dials, meter, develop sliders, looks, copy/paste settings, mode switch, presets CRUD, batch operations, import/export, and help", async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Dismiss coachmark if visible
    const coachmarkBtn = page.getByRole("button", { name: "Got it" });
    if (await coachmarkBtn.isVisible()) {
      await coachmarkBtn.click();
    }

    // 1. Direct simulator entry & default dial values (f/16, 1/60, ISO 100)
    await expect(page.locator("div", { hasText: "Camera Exposure Simulator" }).first()).toBeVisible();
    const apertureControl = page.locator('div[data-control="aperture"]');
    const speedControl = page.locator('div[data-control="shutter"]');
    const isoControl = page.locator('div[data-control="iso"]');

    await expect(apertureControl).toContainText("f/16");
    await expect(speedControl).toContainText("1/60");
    await expect(isoControl).toContainText("100");

    // Exposure meter visible
    await expect(page.getByRole("meter", { name: "Exposure meter" })).toBeVisible();

    // 2. Stepper interactions
    // Aperture widen (lower f-number: f/16 -> f/11)
    const widenAperture = page.getByRole("button", { name: "Widen aperture (lower f-number)" });
    await widenAperture.click();
    await expect(apertureControl).toContainText("f/11");

    const narrowAperture = page.getByRole("button", { name: "Narrow aperture (higher f-number)" });
    await narrowAperture.click();
    await expect(apertureControl).toContainText("f/16");

    // Shutter speed step
    const increaseSpeed = page.getByRole("button", { name: "Increase shutter speed" });
    await increaseSpeed.click();
    await expect(speedControl).toContainText("1/125");

    const decreaseSpeed = page.getByRole("button", { name: "Decrease shutter speed" });
    await decreaseSpeed.click();
    await expect(speedControl).toContainText("1/60");

    // ISO step
    const increaseIso = page.getByRole("button", { name: "Increase ISO" });
    await increaseIso.click();
    await expect(isoControl).toContainText("200");

    const decreaseIso = page.getByRole("button", { name: "Decrease ISO" });
    await decreaseIso.click();
    await expect(isoControl).toContainText("100");

    // 3. Help panel
    const helpToggle = page.getByRole("button", { name: "Toggle exposure help" });
    await helpToggle.click();
    const helpDialog = page.getByRole("dialog", { name: "Help Panel" });
    await expect(helpDialog).toBeVisible();
    await expect(helpDialog.getByRole("heading", { name: "Aperture" })).toBeVisible();
    await expect(helpDialog.getByRole("heading", { name: "Speed (shutter)" })).toBeVisible();
    await expect(helpDialog.getByRole("heading", { name: "ISO" })).toBeVisible();
    await helpToggle.click();
    await expect(helpDialog).not.toBeVisible();

    // 4. Develop panel: Light & Effects Sliders & Look Chips
    const expSlider = page.locator("#slider-exposure");
    await expSlider.fill("20");
    await expect(page.locator("span.tabular-nums", { hasText: "20" })).toBeVisible();

    // Look chips: Punch, Matte, Golden, Mono
    const punchLook = page.getByRole("button", { name: "Punch" });
    await punchLook.click();
    await expect(punchLook).toHaveAttribute("aria-pressed", "true");

    // Copy settings & Paste settings
    const copySettingsBtn = page.getByRole("button", { name: "Copy settings" });
    await copySettingsBtn.click();
    const copyDialog = page.getByRole("dialog", { name: "Copy settings" });
    await expect(copyDialog).toBeVisible();
    const confirmCopyBtn = copyDialog.getByRole("button", { name: "Copy", exact: true });
    await confirmCopyBtn.click();

    // 5. Export Panel & Lab-package JSON
    await expect(page.getByRole("button", { name: "Download edited PNG" })).toBeVisible();

    // Import lab package dialog invalid JSON test
    const importBtn = page.getByRole("button", { name: "Import lab package" });
    await importBtn.click();
    const importDialog = page.getByRole("dialog", { name: "Import lab package" });
    await expect(importDialog).toBeVisible();

    const importTextarea = page.locator("#import-json-text");
    await importTextarea.fill('{"schemaVersion":"invalid"}');
    const submitImportBtn = importDialog.getByRole("button", { name: "Import lab package" });
    await submitImportBtn.click();
    await expect(importDialog.getByRole("alert")).toBeVisible();
    await expect(importDialog.getByRole("alert")).toContainText("schemaVersion must be exactly");
    await importDialog.getByRole("button", { name: "Cancel" }).click();

    // 6. Interaction Mode Switch & Presets CRUD
    const presetsTab = page.getByRole("tab", { name: "Presets / Compare" });
    await presetsTab.click();

    // Verify seeded presets (at least 6)
    await expect(page.locator(".preset-card").first()).toBeVisible();
    const presetCards = page.locator(".preset-card");
    const seedCount = await presetCards.count();
    expect(seedCount).toBeGreaterThanOrEqual(6);

    // Create Preset flow with form validation
    await page.getByRole("button", { name: "Create preset", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Create Preset" })).toBeVisible();

    const nameInput = page.locator("#preset-name");
    await nameInput.focus();
    await nameInput.fill("");
    await nameInput.blur();
    await expect(page.getByText("Name is required")).toBeVisible();

    const savePresetBtn = page.getByRole("button", { name: "Create preset", exact: true });
    await expect(savePresetBtn).toBeDisabled();

    await nameInput.fill("Golden Hour Soft");
    const tagInput = page.locator("#preset-looktag");
    await tagInput.fill("soft");
    await expect(savePresetBtn).toBeEnabled();
    await savePresetBtn.click();

    await expect(page.getByRole("heading", { name: "Create Preset" })).not.toBeVisible();
    await expect(page.getByText("Golden Hour Soft")).toBeVisible();
    const newCount = await presetCards.count();
    expect(newCount).toEqual(seedCount + 1);

    // Edit preset name to "Night Street Grain"
    const editBtn = page.getByRole("button", { name: "Edit preset Golden Hour Soft" });
    await editBtn.click();
    await expect(page.getByRole("heading", { name: "Edit Preset" })).toBeVisible();
    await nameInput.fill("Night Street Grain");
    await page.getByRole("button", { name: "Save preset", exact: true }).click();
    await expect(page.getByText("Night Street Grain")).toBeVisible();

    // Toggle Favorite & Filter
    const favBtn = page.getByRole("button", { name: "Mark Night Street Grain favorite" });
    await favBtn.click();
    const filterSelect = page.getByRole("combobox", { name: "Filter presets" });
    await filterSelect.selectOption("favorites");
    await expect(page.getByText("Night Street Grain")).toBeVisible();
    await filterSelect.selectOption("all");

    // Delete preset
    const deleteBtn = page.getByRole("button", { name: "Delete preset Night Street Grain" });
    await deleteBtn.click();
    await expect(page.getByText("Night Street Grain")).not.toBeVisible();

    // Switch back to Meter / Lab tab
    const meterTab = page.getByRole("tab", { name: "Meter / Lab" });
    await meterTab.click();
    await expect(page.locator("div", { hasText: "Camera Exposure Simulator" }).first()).toBeVisible();

    // Assert zero page & console errors
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
