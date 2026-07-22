import fs from 'fs';
let content = fs.readFileSync('tasks/frontend-planning-execution-kanban/solution/app/e2e.spec.mjs', 'utf8');

// I also need to update the e2e suite to remove the (Failing) text and ensure the test expects properly.
content = content.replace(/\(Failing: actual app doesn't reverse comments on undo\)/g, '');

fs.writeFileSync('tasks/frontend-planning-execution-kanban/solution/app/e2e.spec.mjs', content);
