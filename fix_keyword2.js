const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', 'utf8');

code = code.replace(/<h2>\{visible\.mode === 'keyword' \? 'Keyword results' : 'Semantic results'\}<\/h2>/, '<h2>{visible.mode === \'keyword\' ? \'Keyword results (no semantic matches above threshold)\' : \'Semantic results\'}</h2>');

fs.writeFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', code);
