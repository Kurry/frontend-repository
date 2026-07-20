const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

// Modify AppInner to use display:none for views instead of conditional rendering
app = app.replace(
  "{state.activeView === 'experiments' ? <ExperimentsView /> : state.activeView === 'compare' ? <CompareView onSavePair={() => setSavePairOpen(true)} /> : <CostView />}",
  `<div style={{ display: state.activeView === 'experiments' ? 'block' : 'none' }}><ExperimentsView /></div>
   <div style={{ display: state.activeView === 'compare' ? 'block' : 'none' }}><CompareView onSavePair={() => setSavePairOpen(true)} /></div>
   <div style={{ display: state.activeView === 'cost' ? 'block' : 'none' }}><CostView /></div>`
);

// Move TrialDiffModal and AttributionModal into CompareView
app = app.replace(
  "    <TrialDiffModal onAttribute={openAttribution} suspendEscape={paletteOpen || !!attributionContext} />\n    <AttributionModal context={attributionContext} onClose={() => setAttributionContext(null)} />\n",
  ""
);

// We need to pass openAttribution to CompareView now, or store attributionContext in store.
app = app.replace(
  "const [attributionContext, setAttributionContext] = useState(null)",
  ""
);

app = app.replace(
  "const openAttribution = (detail) => setAttributionContext({ ...detail, trialId: state.openedTrialId, labelA: state.compareA, labelB: state.compareB })",
  ""
);

// Add attributionContext to Zustand store
let store = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/store.js', 'utf8');
store = store.replace(
  "openedTrialId: null,",
  "openedTrialId: null,\n  attributionContext: null,"
);
store = store.replace(
  "openTrial: (id) => set({ openedTrialId: id }),",
  "openTrial: (id) => set({ openedTrialId: id }),\n  setAttributionContext: (ctx) => set({ attributionContext: ctx }),"
);
fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/store.js', store);

// Now update CompareView to include the modals
app = app.replace(
  "function CompareView({ onSavePair }) {",
  `function CompareView({ onSavePair }) {
  const openAttribution = (detail) => state.setAttributionContext({ ...detail, trialId: state.openedTrialId, labelA: state.compareA, labelB: state.compareB })`
);

app = app.replace(
  "  </main>\n}",
  `    <TrialDiffModal onAttribute={openAttribution} />
    <AttributionModal context={state.attributionContext} onClose={() => state.setAttributionContext(null)} />
  </main>
}`
);

// Add keepMounted={true} withinPortal={false} to the Modals so they stay mounted and respect display:none
app = app.replace(
  'size="xl" title={<div><Text size="xs" c="dimmed">Criterion verdict diff</Text><Text fw={700}>{trial.id} · {trial.taskName}</Text></div>}>',
  'size="xl" keepMounted={true} withinPortal={false} title={<div><Text size="xs" c="dimmed">Criterion verdict diff</Text><Text fw={700}>{trial.id} · {trial.taskName}</Text></div>}>'
);

app = app.replace(
  'title="Attribute verdict flip" size="md">',
  'title="Attribute verdict flip" size="md" keepMounted={true} withinPortal={false}>'
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
