const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

// Remove from ExperimentsView
app = app.replace(
  '    </Paper>\n    <TrialDiffModal onAttribute={openAttribution} />\n    <AttributionModal context={state.attributionContext} onClose={() => state.setAttributionContext(null)} />\n  </main>\n}',
  '    </Paper>\n  </main>\n}'
);

// Add to CompareView
app = app.replace(
  '    </>}\n  </main>\n}',
  '    </>}\n    <TrialDiffModal onAttribute={openAttribution} />\n    <AttributionModal context={state.attributionContext} onClose={() => state.setAttributionContext(null)} />\n  </main>\n}'
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
