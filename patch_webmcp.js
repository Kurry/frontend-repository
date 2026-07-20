const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

app = app.replace(
  /\[\'browse_set_theme\',.*?window\.__rescoreLabActions\.setTheme\(theme\)\],/g,
  ''
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
