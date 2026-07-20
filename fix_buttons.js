const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', 'utf8');

code = code.replace(/ primaryButtonDisabled=\{!isValid\}/g, '');
fs.writeFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', code);
