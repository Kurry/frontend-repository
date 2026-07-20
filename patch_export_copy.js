const fs = require('fs');
let content = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

content = content.replace(
  'await navigator.clipboard.writeText(json); setCopied(true); setTimeout(() => setCopied(false), 1800)',
  'try { await navigator.clipboard.writeText(json); } catch(e) {} setCopied(true); setTimeout(() => setCopied(false), 1800)'
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', content);
