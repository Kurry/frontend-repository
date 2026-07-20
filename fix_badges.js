const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', 'utf8');

code = code.replace(/<span className=\{\`marker \$\{overlap \? 'overlap' : 'unique'\}\`\}>\{overlap \? 'Overlap' : 'Unique'\}<\/span>/, '<span className={`marker ${overlap ? \'overlap\' : \'unique\'}`}><Tag size="sm" type={overlap ? \'green\' : \'magenta\'}>{overlap ? \'Overlap\' : \'Unique\'}</Tag></span>');

fs.writeFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', code);
