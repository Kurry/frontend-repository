import { expect, test as base, type Page } from '@playwright/test';

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const problems: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') problems.push(`${message.type()}: ${message.text()}`); });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    await use(page);
    expect(problems, 'browser console warnings/errors').toEqual([]);
  },
});

export { expect } from '@playwright/test';
