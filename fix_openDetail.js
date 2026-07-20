const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/store.js', 'utf8');

code = code.replace("railOpen: false }))", "railOpen: state.railOpen }))"); // wait, maybe closing the rail is intended when opening detail on MOBILE but it shouldn't close on desktop! Let's check mobile CSS.
fs.writeFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/store.js', code);
