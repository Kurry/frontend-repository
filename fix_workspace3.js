const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', 'utf8');

// I already added the dummy div, so let's verify if `DetailPanel` is an aside. Yes.
