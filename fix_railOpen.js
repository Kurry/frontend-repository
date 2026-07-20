const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/store.js', 'utf8');

code = code.replace("railOpen: false,", "railOpen: true,");
code = code.replace("setRailView: (railView) => set({ railView, railOpen: false })", "setRailView: (railView) => set({ railView, railOpen: true })");

fs.writeFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/store.js', code);
