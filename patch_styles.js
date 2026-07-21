const fs = require('fs');
const file = 'tasks/frontend-data-tracking-command-center/solution/app/src/styles.css';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('min-height: 44px')) {
  content += `\n\n@media (max-width: 767px) {
  button, .cds--btn, .suggestion-chip, input, select, textarea, .cds--text-input, .cds--select-input {
    min-height: 44px !important;
  }
}\n`;
  fs.writeFileSync(file, content);
  console.log('Patched styles.css successfully.');
} else {
  console.log('styles.css already contains min-height fix.');
}
