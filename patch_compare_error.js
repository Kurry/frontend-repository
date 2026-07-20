const fs = require('fs');
let store = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/store.js', 'utf8');

store = store.replace(
  "liveMessage: ''",
  "liveMessage: '',\n  compareError: null"
);

store = store.replace(
  "if ((side === 'A' && label === state.compareB) || (side === 'B' && label === state.compareA)) return { liveMessage: `${side === 'A' ? 'labelA' : 'labelB'}: choose a different label` }",
  "if ((side === 'A' && label === state.compareB) || (side === 'B' && label === state.compareA)) return { compareError: `${side === 'A' ? 'labelA' : 'labelB'} must differ from the other label` }\n" +
  "    if (!label) return { compareError: null, compareA: side === 'A' ? null : state.compareA, compareB: side === 'B' ? null : state.compareB }"
);

store = store.replace(
  "return { compareA, compareB, deltaPair: compareA && compareB ? [compareA, compareB] : state.deltaPair, openedTrialId: null, highlightedTrialId: null }",
  "return { compareA, compareB, compareError: null, deltaPair: compareA && compareB ? [compareA, compareB] : state.deltaPair, openedTrialId: null, highlightedTrialId: null }"
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/store.js', store);

let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

app = app.replace(
  '<Select label="Reference label" aria-label="Select label A" value={state.compareA} onChange={(value) => state.setCompare(\'A\', value)} data={labelOptions.map((name) => ({ value: name, label: name, disabled: name === state.compareB }))} searchable clearable />',
  '<Select label="Reference label" aria-label="Select label A" value={state.compareA} onChange={(value) => state.setCompare(\'A\', value)} data={labelOptions.map((name) => ({ value: name, label: name, disabled: name === state.compareB }))} searchable clearable error={state.compareError?.startsWith(\'labelA\') ? state.compareError : null} />'
);

app = app.replace(
  '<Select label="Candidate label" aria-label="Select label B" value={state.compareB} onChange={(value) => state.setCompare(\'B\', value)} data={labelOptions.map((name) => ({ value: name, label: name, disabled: name === state.compareA }))} searchable clearable />',
  '<Select label="Candidate label" aria-label="Select label B" value={state.compareB} onChange={(value) => state.setCompare(\'B\', value)} data={labelOptions.map((name) => ({ value: name, label: name, disabled: name === state.compareA }))} searchable clearable error={state.compareError?.startsWith(\'labelB\') ? state.compareError : null} />'
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
