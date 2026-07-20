const fs = require('fs');
let content = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

content = content.replace(
  'await navigator.clipboard.writeText(text); setCopied(label.name); setTimeout(() => setCopied(null), 1800)',
  'try { await navigator.clipboard.writeText(text); } catch(e) {} setCopied(label.name); setTimeout(() => setCopied(null), 1800)'
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', content);
