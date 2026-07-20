const fs = require('fs');
let content = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/contracts.js', 'utf8');

content = content.replace(
  "note: z.string().max(200, 'note: use 200 characters or fewer'),",
  "note: z.string().max(200, 'note: use 200 characters or fewer').optional().catch(''),"
);

content = content.replace(
  "configNote: z.string().max(120, 'configNote: use 120 characters or fewer'),",
  "configNote: z.string().max(120, 'configNote: use 120 characters or fewer').optional().catch(''),"
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/contracts.js', content);
