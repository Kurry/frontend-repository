import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/Scoreboard.svelte', 'utf-8');
content = content.replace(
  "<div class=\"flex items-center gap-3 p-3 rounded-lg {index === 0 ? 'bg-yellow-50' : 'bg-gray-50'}\" animate:flip={{ duration: 400 }}>",
  "<div class=\"flex items-center gap-3 p-3 rounded-lg {index === 0 ? 'bg-yellow-50 border-2 border-yellow-500' : 'bg-gray-50'}\" in:fade={{ duration: 400 }} animate:flip={{ duration: 400 }}>"
);
fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/Scoreboard.svelte', content);
