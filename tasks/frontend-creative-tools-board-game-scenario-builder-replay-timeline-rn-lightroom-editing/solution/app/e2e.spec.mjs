import { test, expect } from '@playwright/test';

// Use standard standard WebMCP globals structure injected by harness
const listTools = async (page) => await page.evaluate(() => window.webmcp_list_tools());
const invokeTool = async (page, name, args) => await page.evaluate(({name, args}) => window.webmcp_invoke_tool(name, args), {name, args});

test.describe('Scenario Builder', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
    });

    // ==== END CANONICAL REGION — add task-specific criterion tests below. ====

    test('AC-01 signature_mutation', async ({ page }) => {
        // Select a scenario
        await page.click('text=Scenario 3');
        // Scrub timeline
        const slider = page.locator('input[type="range"]');
        await slider.fill('50');
        // Verify primary record changed in DOM
        await expect(page.locator('text=50%').first()).toBeVisible();
        // Verify linked view (sidebar) updated
        await expect(page.locator('text=Timeline scrubbed to 50')).toBeVisible();
    });

    test('AC-02 visual_hierarchy', async ({ page }) => {
        // NOT-AUTOMATABLE: AC-02 — Subjective visual hierarchy and calm focused canvas cannot be automated.
        expect(true).toBeTruthy();
    });

    test('AC-03 causal_motion', async ({ page }) => {
        // Evaluate DOM for reduced motion styles logic on scrub
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.click('text=Scenario 3');
        const slider = page.locator('input[type="range"]');
        await slider.fill('75');

        // Ensure styles applied immediately without animation
        const visualBox = page.locator('.w-24.h-24').first();
        const style = await visualBox.getAttribute('style');
        expect(style).toContain('transform: translateX');
    });

    test('AC-04 schema_contract', async ({ page }) => {
        const res = await invokeTool(page, 'artifact_export', { format: 'scenario-builder-v1-replay-timeline.json' });
        expect(res.result.schemaVersion).toBe('v1');
        expect(res.result.records.length).toBeGreaterThan(0);
        expect(res.result.records[0].timelineState).toBeDefined();
    });

    test('AC-05 complete_user_flow', async ({ page }) => {
        // Need to click button not the title
        await page.locator('button:has-text("New Scenario")').first().click();

        // We use more generic locators because the mobile layout changes classes
        await page.locator('.p-3').filter({ hasText: 'New Scenario' }).first().click();

        // Wait for it to become active before trying to mutate
        await expect(page.locator('input[type="range"]')).toBeVisible();

        // Mutate
        const slider = page.locator('input[type="range"]');
        await slider.fill('25');
        await expect(page.locator('text=25%').first()).toBeVisible();

        // Undo
        await page.click('text=Undo');
        await expect(page.locator('text=0%').first()).toBeVisible();
    });

    test('AC-06 boundaries_recovery', async ({ page }) => {
        // Test edge cases
        await page.click('text=Conflicting Scenario');
        await expect(page.locator('text=This scenario is in a conflicting state')).toBeVisible();

        await page.click('text=Empty State Scenario');
        await expect(page.locator('text=0%').first()).toBeVisible();
    });

    test('AC-07 mobile_mode', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.click('text=Scenario 3');
        // Ensure no horizontal overflow
        const layoutWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(layoutWidth).toBeLessThanOrEqual(viewportWidth);
    });

    test('AC-08 alternate_input', async ({ page }) => {
        await page.click('text=Scenario 3');
        // Keyboard scrub
        const slider = page.locator('input[type="range"]');
        await slider.focus();
        await page.keyboard.press('ArrowLeft'); // Assuming this decrements from 100
        const val = await slider.inputValue();
        expect(Number(val)).not.toBe(100);
    });

    test('AC-09 large_collection', async ({ page }) => {
        // Seeded 110 items, verify grid has them
        const count = await page.locator('.p-3').count();
        expect(count).toBeGreaterThan(100);

        await page.click('text=Scenario 3');
        const slider = page.locator('input[type="range"]');
        await slider.fill('10'); // Responsiveness on interaction
        await expect(page.locator('text=10%').first()).toBeVisible();
    });

    test('AC-10 domain_copy', async ({ page }) => {
        await expect(page.locator('text=Scenario Cards')).toBeVisible();
        // Since no record is selected by default, click one to see the "Replay Timeline" UI
        await page.click('text=Scenario 3');
        await expect(page.locator('text=Replay Timeline')).toBeVisible();
    });

    test('AC-11 linked_utility', async ({ page }) => {
        // Linked summary updates dynamically
        await page.click('text=Scenario 3');
        const slider = page.locator('input[type="range"]');
        await slider.fill('40');
        await expect(page.locator('text=Timeline scrubbed to 40')).toBeVisible();
    });

    test('AC-12 source_fidelity', async ({ page }) => {
        // NOT-AUTOMATABLE: AC-12 — Subjective fidelity to Lightroom source interactions cannot be automated.
        expect(true).toBeTruthy();
    });

    test('AC-13 artifact_round_trip', async ({ page }) => {
        // Export
        const exportRes = await invokeTool(page, 'artifact_export', { format: 'scenario-builder-v1-replay-timeline.json' });

        // Mutate local state heavily
        await page.click('text=Scenario 3');
        await page.locator('input[type="range"]').fill('20');

        // Import original state
        await invokeTool(page, 'artifact_import', { data: JSON.stringify(exportRes.result), mode: 'scenario-builder-v1-replay-timeline.json' });

        // Verify state is back
        const finalExportRes = await invokeTool(page, 'artifact_export', { format: 'scenario-builder-v1-replay-timeline.json' });
        expect(finalExportRes.result.records.find(r => r.id === 'rec-3').timelineState).toBe(100);
    });
});
