const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

app = app.replace(
  'const [visible, setVisible] = useState(() => Object.fromEntries(labels.map((label) => [label.name, true])))',
  `const [visibleState, setVisible] = useState(() => Object.fromEntries(labels.map((label) => [label.name, true])))
  const visible = useMemo(() => Object.fromEntries(labels.map((label) => [label.name, visibleState[label.name] ?? true])), [labels, visibleState])`
);

app = app.replace(
  'useEffect(() => setVisible((current) => Object.fromEntries(labels.map((label) => [label.name, current[label.name] ?? true]))), [labels])',
  '' // Remove this useEffect as it is no longer needed since visible handles it synchronously
);

app = app.replace(
  /visible\[label\.name\]/g,
  'visible[label.name]'
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
