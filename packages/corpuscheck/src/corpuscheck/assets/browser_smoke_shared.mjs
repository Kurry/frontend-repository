import { createRequire } from 'node:module';
import path from 'node:path';

const requireCjs = createRequire(import.meta.url);

export function resolvePlaywright(repoRoot) {
  const candidates = [
    'playwright',
    ...(repoRoot ? [path.join(repoRoot, 'node_modules', 'playwright')] : []),
  ];
  for (const candidate of candidates) {
    try { return requireCjs(candidate); } catch { /* next */ }
  }
  throw new Error('playwright not resolvable; npm install playwright first');
}

export async function waitForServer(url, timeoutMs = 240000, shouldStop = () => false) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (shouldStop()) return false;
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch { /* still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

export function observePageFailures(page, result) {
  page.on('console', (message) => {
    if (message.type() === 'error') result.consoleErrors.push(message.text().slice(0, 300));
  });
  page.on('pageerror', (error) => result.pageErrors.push(String(error).slice(0, 300)));
  if (result.failedUrls) {
    page.on('response', (response) => {
      if (response.status() >= 400) {
        result.failedUrls.push(`${response.status()} ${response.url()}`.slice(0, 300));
      }
    });
    page.on('requestfailed', (request) => {
      result.failedUrls.push(`FAIL ${request.url()}`.slice(0, 300));
    });
  }
}
