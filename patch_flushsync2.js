const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

app = app.replace(
  "open: (destination, trialId) => { if (destination === 'trial-criterion-diff') { state.setView('compare'); if (trialId) state.openTrial(trialId) } else state.setView(destination); return { visibleDestination: destination } },",
  "open: (destination, trialId) => { flushSync(() => { if (destination === 'trial-criterion-diff') { state.setView('compare'); if (trialId) state.openTrial(trialId) } else state.setView(destination); }); return { visibleDestination: destination } },"
);

app = app.replace(
  "search: (query) => { const trial = state.trials.find((item) => item.id.includes(query) || item.taskName.includes(query)); if (trial) { state.setFilter('task', trial.taskName); return { matchedTrial: trial.id } } return { matchedTrial: null } },",
  "search: (query) => { let matchedTrial = null; flushSync(() => { const trial = state.trials.find((item) => item.id.includes(query) || item.taskName.includes(query)); if (trial) { state.setFilter('task', trial.taskName); matchedTrial = trial.id; } }); return { matchedTrial } },"
);

app = app.replace(
  "applyFilter: (filter, value) => { if (filter === 'task') state.setFilter('task', value); else if (filter === 'pass-fail') { state.setFilter('passState', value.state); state.setFilter('passLabel', value.label) } else if (filter === 'delta-size') state.setFilter('deltaMin', Number(value)); else if (filter === 'label-columns') state.setShownLabels(value); else if (filter === 'compare-pair') { state.setCompare('A', value.labelA); state.setCompare('B', value.labelB) } else state.toggleChip(value); return { applied: filter } },",
  "applyFilter: (filter, value) => { flushSync(() => { if (filter === 'task') state.setFilter('task', value); else if (filter === 'pass-fail') { state.setFilter('passState', value.state); state.setFilter('passLabel', value.label) } else if (filter === 'delta-size') state.setFilter('deltaMin', Number(value)); else if (filter === 'label-columns') state.setShownLabels(value); else if (filter === 'compare-pair') { state.setCompare('A', value.labelA); state.setCompare('B', value.labelB) } else state.toggleChip(value); }); return { applied: filter } },"
);

app = app.replace(
  "clearFilters: () => { state.clearFilters(); return { visibleTrials: 12 } },",
  "clearFilters: () => { flushSync(() => state.clearFilters()); return { visibleTrials: 12 } },"
);

app = app.replace(
  "sort: (sort, label) => { state.setSort(sort, label); return { sort } },",
  "sort: (sort, label) => { flushSync(() => state.setSort(sort, label)); return { sort } },"
);

app = app.replace(
  "setTheme: (theme) => { state.setTheme(theme); return { theme } },",
  "setTheme: (theme) => { flushSync(() => state.setTheme(theme)); return { theme } },"
);

app = app.replace(
  "createAttribution: (record) => { state.saveAttribution(record); return { saved: true, cause: record.cause } },",
  "createAttribution: (record) => { flushSync(() => state.saveAttribution(record)); return { saved: true, cause: record.cause } },"
);

app = app.replace(
  "selectTrial: (trialId) => { state.setView('compare'); state.openTrial(trialId); return { trialId } },",
  "selectTrial: (trialId) => { flushSync(() => { state.setView('compare'); state.openTrial(trialId); }); return { trialId } },"
);

app = app.replace(
  "exportArtifact: (format) => { if (format === 'lab-results-json') setExportOpen(true); else state.setView('cost'); return { opened: format } },",
  "exportArtifact: (format) => { flushSync(() => { if (format === 'lab-results-json') setExportOpen(true); else state.setView('cost'); }); return { opened: format } },"
);

app = app.replace(
  "openImport: () => { setExportOpen(true); return { opened: 'lab-results-json' } },",
  "openImport: () => { flushSync(() => setExportOpen(true)); return { opened: 'lab-results-json' } },"
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
