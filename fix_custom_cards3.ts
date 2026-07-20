import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/CustomCards.svelte', 'utf-8');

// replace flip usage correctly
content = content.replace(
  "<div class=\"flex items-center gap-2 p-3 rounded-lg bg-gray-50\" out:slide|local in:slide|local animate:flip={{ duration: 300 }}>",
  "<div class=\"flex items-center gap-2 p-3 rounded-lg bg-gray-50\" out:fade={{ duration: 300 }} in:fade={{ duration: 300 }} animate:flip={{ duration: 300 }}>"
);

fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/CustomCards.svelte', content);
