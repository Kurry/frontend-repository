import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', 'utf-8');

// Fix app.svelte custom card webmcp length check
content = content.replace(
  "if (text.length < 5) return { ok: false, message: 'Enter at least 5 characters for the card prompt' };",
  "if (text.length < 8) return { ok: false, message: 'prompt must be at least 8 characters' };"
);

content = content.replace(
  "if (text.length < 5) {",
  "if (text.length < 8) {"
);

content = content.replace(
  "return { ok: false, message: 'Enter at least 5 characters for the card prompt' };",
  "return { ok: false, message: 'prompt must be at least 8 characters' };"
);

fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', content);
