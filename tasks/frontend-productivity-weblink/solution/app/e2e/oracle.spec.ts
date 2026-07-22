import { test, expect } from '@playwright/test';

test.describe('Weblink Oracle E2E Suite', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[console error] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(`[uncaught error] ${err.message}`);
    });
    await page.goto('/');
  });

  test.afterEach(() => {
    expect(consoleErrors).toEqual([]);
  });

  test('1. Initial shell layout, identity seeding, and empty states', async ({ page }) => {
    // Header title and subtitle
    await expect(page.locator('h1')).toHaveText('Weblink');
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible();

    // Session panel elements
    await expect(page.locator('[data-testid="session-panel"]')).toBeVisible();
    const nameInput = page.locator('[data-testid="peer-name-input"]');
    await expect(nameInput).toBeVisible();
    const initialName = await nameInput.inputValue();
    expect(initialName.length).toBeGreaterThan(0);

    const clientId = page.locator('[data-testid="client-id"]');
    await expect(clientId).toBeVisible();
    const clientIdText = await clientId.textContent();
    expect(clientIdText?.trim().length).toBeGreaterThan(0);

    // Initial connection status badge is idle
    const badge = page.locator('[data-testid="connection-badge"]');
    await expect(badge).toHaveAttribute('data-status', 'idle');
    await expect(badge).toContainText('Not connected');

    // Chat panel with seeded lines
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
    const messages = page.locator('[data-testid="chat-messages"] > div');
    const msgCount = await messages.count();
    expect(msgCount).toBeGreaterThanOrEqual(2);

    // Chat input disabled when idle
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeDisabled();
    await expect(page.locator('[data-testid="chat-disabled-note"]')).toContainText('Sending is disabled while disconnected');

    // File panel empty state
    await expect(page.locator('[data-testid="file-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-queue-empty"]')).toContainText('No files queued yet');
  });

  test('2. Peer identity validation and live editing', async ({ page }) => {
    const nameInput = page.locator('[data-testid="peer-name-input"]');

    // Edit to a valid name
    await nameInput.fill('Alice Tester');
    await nameInput.blur();
    await expect(nameInput).toHaveValue('Alice Tester');

    // Invalid edit: empty / whitespace only — clear the field and trigger validation
    await nameInput.fill('');
    // Wait for the onChange validator to fire and render the error
    await expect(page.locator('[data-testid="session-panel"] [role="alert"]')).toBeVisible({ timeout: 3000 });

    // Invalid edit: over 40 chars
    const longName = 'A'.repeat(41);
    await nameInput.fill(longName);
    await expect(page.locator('[data-testid="session-panel"] [role="alert"]')).toBeVisible({ timeout: 3000 });

    // Restore valid name
    await nameInput.fill('Bob Developer');
    await nameInput.blur();
    await expect(nameInput).toHaveValue('Bob Developer');
    // Error should disappear
    await expect(page.locator('[data-testid="session-panel"] [role="alert"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('3. Room join validation, state transition machine, and leave flow', async ({ page }) => {
    const roomInput = page.locator('[data-testid="room-id-input"]');
    const joinBtn = page.locator('[data-testid="join-room-button"]');
    const leaveBtn = page.locator('[data-testid="leave-room-button"]');
    const badge = page.locator('[data-testid="connection-badge"]');

    // Leave button disabled while idle
    await expect(leaveBtn).toBeDisabled();

    // Invalid room ID with spaces/punctuation — submit the form to trigger onSubmit validation
    await roomInput.fill('invalid room ID!');
    await joinBtn.click();
    await expect(page.locator('#roomId-error')).toBeVisible({ timeout: 3000 });
    await expect(badge).toHaveAttribute('data-status', 'idle');

    // Valid room ID
    await roomInput.fill('test-room-101');
    await joinBtn.click();

    // Immediately or quickly transitions to connecting / waiting
    await expect(badge).toHaveAttribute('data-status', /connecting|waiting/, { timeout: 3000 });

    // Chat composer becomes enabled
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeEnabled({ timeout: 3000 });

    // Wait until it settles into waiting state
    await expect(badge).toHaveAttribute('data-status', 'waiting', { timeout: 8000 });

    // Click leave room
    await leaveBtn.click();
    await expect(badge).toHaveAttribute('data-status', 'disconnected', { timeout: 3000 });
    await expect(chatInput).toBeDisabled();

    // Rejoin room
    await roomInput.fill('test-room-102');
    await joinBtn.click();
    await expect(badge).toHaveAttribute('data-status', /connecting|waiting/, { timeout: 3000 });
    await expect(badge).toHaveAttribute('data-status', 'waiting', { timeout: 8000 });
  });

  test('4. Chat message composer and submission', async ({ page }) => {
    const roomInput = page.locator('[data-testid="room-id-input"]');
    const joinBtn = page.locator('[data-testid="join-room-button"]');
    await roomInput.fill('chat-room-42');
    await joinBtn.click();

    const chatInput = page.locator('[data-testid="chat-input"]');
    const sendBtn = page.locator('[data-testid="chat-send-button"]');
    await expect(chatInput).toBeEnabled({ timeout: 5000 });

    const initialMsgCount = await page.locator('[data-testid="chat-messages"] > div').count();

    // Send valid message
    await chatInput.fill('Hello from Playwright automated oracle test!');
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // Verify transcript incremented by 1
    await expect(page.locator('[data-testid="chat-messages"] > div')).toHaveCount(initialMsgCount + 1, { timeout: 3000 });

    // Verify sent message content & right alignment
    const lastMsg = page.locator('[data-testid="chat-messages"] > div').last();
    await expect(lastMsg).toContainText('Hello from Playwright automated oracle test!');
    // Check that the message is right-aligned (from "you")
    await expect(lastMsg).toHaveClass(/justify-end/);
  });

  test('5. File queueing, chunked transfer simulation, pause, resume, cancel, retry', async ({ page }) => {
    // Queue file via input
    const fileInput = page.locator('input[data-testid="file-input"]');

    // Create mock file upload
    await fileInput.setInputFiles([
      { name: 'document1.pdf', mimeType: 'application/pdf', buffer: Buffer.from('Hello world contents for file 1') },
      { name: 'image2.png', mimeType: 'image/png', buffer: Buffer.from('Fake image data content') },
    ]);

    // Table appears with 2 rows
    const table = page.locator('[data-testid="file-queue-table"]');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(2);

    await expect(rows.nth(0).locator('[data-testid="file-queue-name"]')).toHaveText('document1.pdf');
    await expect(rows.nth(1).locator('[data-testid="file-queue-name"]')).toHaveText('image2.png');

    // Row 1 status is Not Started
    await expect(rows.nth(0)).toContainText('Not Started');

    // Start transfer for row 0
    const startBtn = rows.nth(0).locator('button:has-text("Start")');
    await startBtn.click();

    // Status changes to Transferring or Completed quickly
    await expect(rows.nth(0)).toContainText(/Transferring|Completed|Paused/);

    // If still transferring, test Pause & Resume
    const pauseBtn = rows.nth(0).locator('button:has-text("Pause")');
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      await expect(rows.nth(0)).toContainText('Paused');

      const resumeBtn = rows.nth(0).locator('button:has-text("Resume")');
      await expect(resumeBtn).toBeVisible();
      await resumeBtn.click();
    }

    // Wait until completed
    await expect(rows.nth(0)).toContainText('Completed', { timeout: 10000 });
    await expect(rows.nth(0)).toContainText('100%');

    // Test Retry on completed row
    const retryBtn = rows.nth(0).locator('button:has-text("Retry")');
    await retryBtn.click();
    await expect(rows.nth(0)).toContainText('Not Started');
  });

  test('6. Zero-byte file transfer', async ({ page }) => {
    const fileInput = page.locator('input[data-testid="file-input"]');
    await fileInput.setInputFiles([
      { name: 'empty.txt', mimeType: 'text/plain', buffer: Buffer.from('') }
    ]);

    const table = page.locator('[data-testid="file-queue-table"]');
    const row = table.locator('tbody tr').first();
    await expect(row).toContainText('empty.txt');

    await row.locator('button:has-text("Start")').click();
    await expect(row).toContainText('Completed');
    await expect(row).toContainText('100%');
  });

  test('7. Multi-select and bulk remove / retry', async ({ page }) => {
    const fileInput = page.locator('input[data-testid="file-input"]');
    await fileInput.setInputFiles([
      { name: 'file-a.txt', mimeType: 'text/plain', buffer: Buffer.from('a') },
      { name: 'file-b.txt', mimeType: 'text/plain', buffer: Buffer.from('b') },
      { name: 'file-c.txt', mimeType: 'text/plain', buffer: Buffer.from('c') },
    ]);

    const selectAll = page.locator('[data-testid="select-all-checkbox"]');
    await selectAll.check();

    const bulkBar = page.locator('[data-testid="bulk-action-bar"]');
    await expect(bulkBar).toBeVisible();
    await expect(bulkBar).toContainText('3 selected');

    // Accept confirm dialog when clicking Remove Selected
    page.once('dialog', (dialog) => dialog.accept());
    await bulkBar.locator('button:has-text("Remove Selected")').click();

    // Queue is empty again
    await expect(page.locator('[data-testid="file-queue-empty"]')).toBeVisible();
  });

  test('8. Transfer log panel updates with lifecycle events', async ({ page }) => {
    const fileInput = page.locator('input[data-testid="file-input"]');
    await fileInput.setInputFiles([
      { name: 'logged-file.dat', mimeType: 'application/octet-stream', buffer: Buffer.from('test data') }
    ]);

    const logPanel = page.locator('[data-testid="transfer-log-panel"]');
    await expect(logPanel).toBeVisible();

    // After queuing a file, the log should show "queued" event
    await expect(logPanel).toContainText('queued');
    await expect(logPanel).toContainText('logged-file.dat');

    const row = page.locator('[data-testid="file-queue-table"] tbody tr').first();
    await row.locator('button:has-text("Start")').click();

    await expect(logPanel).toContainText('started');
    await expect(row).toContainText('Completed', { timeout: 10000 });
    await expect(logPanel).toContainText('completed');
  });

  test('9. Theme toggle and persistence across reload', async ({ page }) => {
    const themeBtn = page.locator('[data-testid="theme-toggle"]');
    await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'light');

    await themeBtn.click();
    await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');

    // Reload page
    await page.reload();
    await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');

    // Connection badge is back at rest (idle)
    const badge = page.locator('[data-testid="connection-badge"]');
    await expect(badge).toHaveAttribute('data-status', 'idle');
  });

  test('10. Session Pack export dialog and import round-trip', async ({ page }) => {
    // Perform mutations
    const nameInput = page.locator('[data-testid="peer-name-input"]');
    await nameInput.fill('Distinctive User');
    await nameInput.blur();

    const roomInput = page.locator('[data-testid="room-id-input"]');
    await roomInput.fill('distinctive-room-99');
    await page.locator('[data-testid="join-room-button"]').click();

    const badge = page.locator('[data-testid="connection-badge"]');
    await expect(badge).toHaveAttribute('data-status', /connecting|waiting/, { timeout: 3000 });

    const chatInput = page.locator('[data-testid="chat-input"]');
    const sendBtn = page.locator('[data-testid="chat-send-button"]');
    await expect(chatInput).toBeEnabled({ timeout: 5000 });
    await chatInput.fill('Distinctive chat message for export');
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // Open Export Session dialog
    await page.getByText('Export Session', { exact: true }).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Export Session Pack');

    const jsonPreview = await dialog.locator('pre').textContent();
    expect(jsonPreview).toContain('weblink-session-v2');
    expect(jsonPreview).toContain('Distinctive User');
    expect(jsonPreview).toContain('distinctive-room-99');
    expect(jsonPreview).toContain('Distinctive chat message for export');

    // Close export dialog (store the JSON preview for later import)
    const jsonToPaste = jsonPreview!;
    await dialog.locator('button:has-text("Close"), [aria-label="Close"]').first().click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    // Leave room to reset state
    await page.locator('[data-testid="leave-room-button"]').click();

    // Open Import Session dialog
    await page.getByText('Import Session', { exact: true }).click();
    const importDialog = page.locator('[role="dialog"]');
    await expect(importDialog).toBeVisible();

    // Import invalid JSON first
    const importTextarea = importDialog.locator('textarea#import-json');
    await importTextarea.fill('{"invalid": true}');
    await importDialog.locator('button:has-text("Apply Import")').click();
    await expect(importDialog.locator('[role="alert"]')).toContainText('Validation failed');

    // Import valid JSON
    await importTextarea.fill(jsonToPaste);
    await importDialog.locator('button:has-text("Apply Import")').click();
    await expect(importDialog).not.toBeVisible({ timeout: 3000 });

    // State restored and badge at idle (import resets connection)
    await expect(page.locator('[data-testid="peer-name-input"]')).toHaveValue('Distinctive User');
    await expect(page.locator('[data-testid="connection-badge"]')).toHaveAttribute('data-status', 'idle');
  });

  test('11. Export Transcript dialog preview and actions', async ({ page }) => {
    await page.getByText('Export Transcript', { exact: true }).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Export Chat Transcript');

    const mdPreview = await dialog.locator('pre').textContent();
    expect(mdPreview?.length).toBeGreaterThan(0);

    // Verify Copy to Clipboard button exists (don't click - clipboard may fail in CI)
    await expect(dialog.locator('button:has-text("Copy to Clipboard")')).toBeVisible();
  });
});
