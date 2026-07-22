import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  if (errors.length > 0) {
    console.error('Errors found:');
    errors.forEach(e => console.error(e));
    process.exit(1);
  } else {
    console.log('Zero console errors and zero page errors on load.');
  }

  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
