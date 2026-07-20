const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

// Replace all remaining `<Table.Tbody>` with `<Table.Tbody ref={parent}>`
app = app.replace(/<Table.Tbody>/g, '<Table.Tbody ref={parent}>');

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
