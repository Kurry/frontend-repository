import { expect, test as base, type Page } from '@playwright/test';

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const browserProblems: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') browserProblems.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => browserProblems.push(`pageerror: ${error.message}`));
    await use(page);
    expect(browserProblems, 'browser console warnings/errors').toEqual([]);
  },
});

export { expect } from '@playwright/test';
