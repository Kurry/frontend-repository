const fs = require('fs');
const file = 'tasks/frontend-game-mineclash/solution/app/src/components/App.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `w.__mineclashApi = mcApi;
    initWebMcp();`,
  `w.__mineclashApi = mcApi;
    initWebMcp();
    w.API = mcApi;`
);

fs.writeFileSync(file, code);
