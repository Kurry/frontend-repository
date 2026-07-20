const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

app = app.replace(
  "import { useEffect, useMemo, useRef, useState } from 'react'",
  "import { useEffect, useMemo, useRef, useState } from 'react'\nimport { flushSync } from 'react-dom'"
);

app = app.replace(
  /const webActions = useMemo\(\(\) => \(\{\n([\s\S]*?)\}\), \[state\]\)/,
  (match, p1) => {
    let replaced = p1.replace(/([a-zA-Z0-9]+): \((.*?)\) => { (.*?) return (.*?); },/g, "$1: ($2) => { flushSync(() => { $3 }); return $4; },");
    // Handle the startRun which is async
    replaced = replaced.replace(
      'startRun: ({ demo, ...payload }) => { flushSync(() => { setRescoreOpen(true); state.startRescore(payload); }); return { started: demo, labelName: payload.labelName }; },',
      'startRun: ({ demo, ...payload }) => { flushSync(() => setRescoreOpen(true)); state.startRescore(payload); return { started: demo, labelName: payload.labelName }; },'
    );
    return `const webActions = useMemo(() => ({\n${replaced}}), [state])`;
  }
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
