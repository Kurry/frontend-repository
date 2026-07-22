import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function dismissConsent(page) {
  await page.waitForTimeout(1400);
  const reject = page.getByRole("button", { name: "Απόρριψη" });
  if (await reject.isVisible()) await reject.click();
}

test("living carousel advances one complete card and resets on reload", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await dismissConsent(page);

  const carousel = page.locator(".swiper-living");
  const activeSlide = carousel.locator(".swiper-slide[aria-current='true']");
  const visibleTitle = activeSlide.locator(".data-wrap > .title");
  await carousel.scrollIntoViewIfNeeded();
  await expect(visibleTitle).toHaveText("Community living spaces");
  await expect(activeSlide.locator("li")).toContainText(["Γυμναστήριο", "Laundry room", "Social areas"]);

  await carousel.getByRole("button", { name: "Επόμενο" }).click();
  await expect(visibleTitle).toHaveText("Ασφάλεια");
  await expect(activeSlide.locator("li").first()).toContainText("Κλειστό κύκλωμα τηλεόρασης");

  await carousel.getByRole("button", { name: "Προηγούμενο" }).click();
  await expect(visibleTitle).toHaveText("Community living spaces");
  await page.reload();
  await expect(visibleTitle).toHaveText("Community living spaces");
});

test("inquiry dialog traps Tab focus, closes with Escape, and restores its opener", async ({ page }) => {
  await page.goto("/");
  await dismissConsent(page);
  const opener = page.locator("section.hero [data-action='open-inquiry']");
  await opener.click();
  const dialog = page.locator("#booking-inquiry-overlay");
  await expect(dialog).toBeVisible();

  for (let index = 0; index < 18; index += 1) {
    await page.keyboard.press("Tab");
    await expect.poll(() => page.evaluate(() => {
      const overlay = document.querySelector("#booking-inquiry-overlay");
      return Boolean(overlay && overlay.contains(document.activeElement));
    })).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test("mobile menu locks position and closes cleanly at the desktop breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await dismissConsent(page);
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(500);

  await page.getByRole("button", { name: /^Shortlist/ }).click();
  await expect(page.locator("#shortlist-drawer")).toBeVisible();

  // Exercise the conflicting pre-existing drawer/menu state used by WebMCP navigation.
  await page.getByRole("button", { name: "Άνοιγμα μενού" }).click({ force: true });
  await expect(page.locator("#nav-overlay")).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator("#shortlist-drawer")).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveClass(/drawer-open/);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(500);

  await page.getByRole("button", { name: "Κλείσιμο μενού" }).click();
  await expect(page.locator("#nav-overlay")).toHaveAttribute("aria-hidden", "true");
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(500);

  await page.getByRole("button", { name: "Άνοιγμα μενού" }).click();
  await expect(page.locator("#nav-overlay")).toHaveAttribute("aria-hidden", "false");

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator("#nav-overlay")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("html")).not.toHaveClass(/menu-locked/);
  await page.evaluate(() => window.scrollBy(0, 200));
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(500);
});

test("consent rejection is clickable above floating UI and returns on reload", async ({ page }) => {
  await page.goto("/");
  const consent = page.locator("#cky-consent-container");
  await expect(consent).toHaveClass(/is-visible/, { timeout: 3_000 });
  await page.getByRole("button", { name: "Απόρριψη" }).click();
  await expect(consent).not.toHaveClass(/is-visible/);
  await page.waitForTimeout(1500);
  await expect(consent).not.toHaveClass(/is-visible/);

  await page.reload();
  await expect(consent).toHaveClass(/is-visible/, { timeout: 3_000 });
});

test("shortlist drawer stays on-screen and exposes undo and redo", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await dismissConsent(page);
  const boost = page.locator(".add-to-shortlist-btn[data-tier='Boost']");
  await boost.scrollIntoViewIfNeeded();
  await boost.click();

  await page.getByRole("button", { name: /Shortlist/ }).click();
  const drawer = page.locator("#shortlist-drawer");
  await expect(drawer).toBeVisible();
  await expect.poll(async () => {
    const current = await drawer.boundingBox();
    return current && Math.round(current.x + current.width);
  }).toBeLessThanOrEqual(390);
  const box = await drawer.boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(391);
  await expect(drawer).toContainText("Boost Studio");

  await drawer.getByRole("button", { name: "Undo" }).click();
  await expect(drawer).not.toContainText("Boost Studio");
  await drawer.getByRole("button", { name: "Redo" }).click();
  await expect(drawer).toContainText("Boost Studio");
});

test("two inquiry sessions each export a valid packet for current values", async ({ page }) => {
  await page.goto("/");
  await dismissConsent(page);
  await page.locator("section.hero [data-action='open-inquiry']").click();
  const dialog = page.locator("#booking-inquiry-overlay");
  const moveIn = `${new Date().getFullYear() + 1}-01`;

  async function submitAndExport(name, email) {
    await dialog.locator("[name='full_name']").fill(name);
    await dialog.locator("[name='email']").fill(email);
    await dialog.locator("[name='phone']").fill("+30 210 123 4567");
    await dialog.locator("[name='studio_tier']").selectOption("Boost");
    await dialog.locator("[name='move_in_month']").fill(moveIn);
    await dialog.locator("[name='privacy_consent']").check();
    await dialog.getByRole("button", { name: "Submit inquiry" }).click();
    await expect(dialog.locator("[data-role='ready']")).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Export JSON" }).click();
    const download = await downloadPromise;
    const packet = JSON.parse(await readFile(await download.path(), "utf8"));
    expect(packet.inquiry.full_name).toBe(name);
    expect(packet.inquiry.email).toBe(email);
    expect(packet.inquiry.submitted).toBe(true);
    expect(packet.monthly_estimate_eur).toBe(0);
  }

  await submitAndExport("First Resident", "first@example.com");
  await dialog.getByRole("button", { name: "Reset" }).click();
  await submitAndExport("Second Resident", "second@example.com");
});
