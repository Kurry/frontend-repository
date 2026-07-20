import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/SetupScreen.svelte', 'utf-8');

// Fix hidden file input to sr-only
content = content.replace(
  'class="hidden"',
  'class="sr-only"'
);

fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/SetupScreen.svelte', content);
