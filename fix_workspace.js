const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', 'utf8');

code = code.replace(/\{state\.detailId && <DetailPanel \/>\}/, '{state.detailId ? <DetailPanel /> : <div />}');
fs.writeFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', code);
