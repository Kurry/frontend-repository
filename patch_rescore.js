const fs = require('fs');
let content = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/store.js', 'utf8');

content = content.replace(
  'startRescore: async (payload) => {',
  `startRescore: async (payload) => {
    if (get().run.active || window.__isRescoring) return false;
    window.__isRescoring = true;`
);

content = content.replace(
  'return true\n  },',
  `  window.__isRescoring = false;
    return true
  },`
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/store.js', content);
