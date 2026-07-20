const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

app = app.replace(
  '<div className="locked-pair">',
  '<input type="hidden" {...register(\'labelA\')} /><input type="hidden" {...register(\'labelB\')} /><div className="locked-pair">'
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
