const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('record walkthrough', async ({ page, context }) => {
  await context.tracing.start({ screenshots: true, snapshots: true });

  await page.goto('http://127.0.0.1:3000');

  // Wait for the app to be fully loaded
  await page.waitForSelector('text=Interactive Fiction Branch Board', { timeout: 10000 }).catch(() => {});
  await page.waitForSelector('text=Story Nodes');

  // Select a node to place
  await page.selectOption('select', { label: 'Explore the hallway' });
  await page.waitForTimeout(1000);

  // Place the node
  const canvas = await page.locator('.cursor-crosshair').first();
  await canvas.click({ position: { x: 200, y: 200 } });
  await page.waitForTimeout(1000);

  // Click on Rebalance
  await page.click('button:has-text("Rebalance")');
  await page.waitForTimeout(1000);

  // Create a new node
  await page.click('button:has-text("+ New Node")');
  await page.fill('input[name="title"]', 'A strange door');
  await page.fill('textarea[name="content"]', 'You see a strange door.');
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(1000);

  // Export
  await page.click('button:has-text("Download JSON")');
  await page.waitForTimeout(1000);

  await context.tracing.stop({ path: 'trace.zip' });
});
