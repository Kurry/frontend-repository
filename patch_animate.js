const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

app = app.replace(
  "import { useEffect, useMemo, useRef, useState } from 'react'",
  "import { useEffect, useMemo, useRef, useState } from 'react'\nimport { useAutoAnimate } from '@formkit/auto-animate/react'"
);

app = app.replace(
  "function ExperimentsView() {",
  "function ExperimentsView() {\n  const [parent] = useAutoAnimate()"
);

app = app.replace(
  '<Table.Tbody>',
  '<Table.Tbody ref={parent}>'
);

// We have two Table.Tbody occurrences: one in ExperimentsView, one in CompareView.
app = app.replace(
  "function CompareView({ onSavePair }) {",
  "function CompareView({ onSavePair }) {\n  const [parent] = useAutoAnimate()"
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
