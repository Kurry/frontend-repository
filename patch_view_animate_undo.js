const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

app = app.replace(
  '<AnimatePresence mode="popLayout"><motion.div key={state.activeView} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}><div style={{ display: state.activeView === \'experiments\' ? \'block\' : \'none\' }}><ExperimentsView /></div>',
  '<div style={{ display: state.activeView === \'experiments\' ? \'block\' : \'none\' }}><ExperimentsView /></div>'
);

app = app.replace(
  '<div style={{ display: state.activeView === \'cost\' ? \'block\' : \'none\' }}><CostView /></div></motion.div></AnimatePresence>',
  '<div style={{ display: state.activeView === \'cost\' ? \'block\' : \'none\' }}><CostView /></div>'
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
