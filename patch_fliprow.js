const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

app = app.replace(
  'const attribution = useLabStore((state) => state.attributions.find((item) => item.trialId === trialId && item.criterionId === criterionA.id && item.labelA === labelA && item.labelB === labelB))',
  'const attributions = useLabStore((state) => state.attributions);\n  const attribution = attributions.find((item) => item.trialId === trialId && item.criterionId === criterionA.id && item.labelA === labelA && item.labelB === labelB);'
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
