const fs = require('fs');
let content = fs.readFileSync('package.json', 'utf8');
content = content.replace('"test:e2e:criteria": "playwright test e2e.spec.mjs"', '"test:e2e:criteria": "playwright test e2e.spec.mjs -c playwright.config.ts"');
fs.writeFileSync('package.json', content);
