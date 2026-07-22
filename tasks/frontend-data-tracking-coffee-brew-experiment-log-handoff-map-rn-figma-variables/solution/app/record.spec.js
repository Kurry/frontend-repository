import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('record evidence', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Wait for initial load
  await page.waitForSelector('text=Coffee Brew Log');

  // Select a record
  await page.click('text=Morning V60');
  await page.waitForTimeout(1000);

  // Edit it
  await page.fill('input[type="number"]', '16'); // change bean weight
  await page.click('text=Save Changes');
  await page.waitForTimeout(1000);

  // Handoff Map interaction (Signature interaction)
  await page.click('button:text("Alice")');
  await page.waitForTimeout(500);
  await page.click('button:text("high")');
  await page.waitForTimeout(500);
  await page.click('text=Apply Handoff State');
  await page.waitForTimeout(1000);

  // Undo
  await page.click('text=Undo');
  await page.waitForTimeout(1000);

  // Redo applying handoff state
  await page.click('button:text("Bob")');
  await page.waitForTimeout(500);
  await page.click('button:text("medium")');
  await page.waitForTimeout(500);
  await page.click('text=Apply Handoff State');
  await page.waitForTimeout(1000);

  // Open Export
  await page.click('text=Export / Import');
  await page.waitForTimeout(1000);

  // We've interacted enough to show the UI
  await page.waitForTimeout(2000);
});
