const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', 'utf8');

code = code.replace(/resultCount:state\.getVisible\(\)\.items\.length/g, 'resultCount:useAppStore.getState().getVisible().items.length');
fs.writeFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', code);
