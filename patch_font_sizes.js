const fs = require('fs');
const file = 'tasks/frontend-data-tracking-command-center/solution/app/src/styles.css';
let content = fs.readFileSync(file, 'utf8');

const smallFontRegex = /([^{}]+)\s*\{[^}]*font-size:\s*([0-9]+)px/g;
let match;
let selectors = [];
while ((match = smallFontRegex.exec(content)) !== null) {
  if (parseInt(match[2]) < 14) {
    let sels = match[1].split(',').map(s => s.trim().replace(/\n/g, ' ')).filter(Boolean);
    selectors.push(...sels);
  }
}

// Remove duplicates and @media stuff if any
selectors = [...new Set(selectors)].filter(s => !s.startsWith('@'));

if (selectors.length > 0) {
  const css = `\n\n@media (max-width: 767px) {
  ${selectors.join(', ')} {
    font-size: clamp(14px, 1em, 2rem) !important;
  }
}\n`;
  content += css;
  fs.writeFileSync(file, content);
  console.log('Patched font sizes for mobile.');
}
