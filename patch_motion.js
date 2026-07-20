const fs = require('fs');
let css = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/styles.css', 'utf8');

css = css.replace(
  'body, .app-root, .page-shell, .mantine-Paper-root, .mantine-Modal-content, .mantine-Modal-header { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }',
  '*, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }'
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/styles.css', css);
