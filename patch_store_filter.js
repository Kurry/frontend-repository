const fs = require('fs');
let store = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/store.js', 'utf8');

store = store.replace(
  "attributions: state.attributions,",
  "attributions: state.attributions.filter(a => state.trials.some(t => t.id === a.trialId) && state.labels.some(l => l.name === a.labelA) && state.labels.some(l => l.name === a.labelB)),"
);

store = store.replace(
  "savedPairs: state.savedPairs,",
  "savedPairs: state.savedPairs.filter(p => state.labels.some(l => l.name === p.labelA) && state.labels.some(l => l.name === p.labelB)),"
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/store.js', store);
