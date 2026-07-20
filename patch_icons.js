const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

// Find all Icon components (e.g. <IconCheck size={15} />) and add aria-hidden="true"
app = app.replace(/<Icon[A-Za-z0-9]+(?:\s+[^>]*?)?\s*\/>/g, (match) => {
  if (match.includes('aria-hidden')) return match;
  return match.replace('/>', ' aria-hidden="true" />');
});

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
