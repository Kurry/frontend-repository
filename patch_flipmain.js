const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

app = app.replace(
  '<div className="flip-main">',
  '<div className="flip-main" onClick={() => setExpanded(v => !v)} style={{ cursor: "pointer" }}>'
);

app = app.replace(
  'onClick={() => setExpanded((value) => !value)}',
  'onClick={(e) => { e.stopPropagation(); setExpanded((value) => !value); }}'
);

// also prevent Button from propagating
app = app.replace(
  'onClick={() => onAttribute({ criterionA, criterionB, attribution })}',
  'onClick={(e) => { e.stopPropagation(); onAttribute({ criterionA, criterionB, attribution }); }}'
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
