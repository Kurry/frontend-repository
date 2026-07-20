import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/Scoreboard.svelte', 'utf-8');

content = content.replace(
  "</script>",
  "  import { flip } from 'svelte/animate';\n  import { fade } from 'svelte/transition';\n</script>"
);

content = content.replace(
  "{#each sortedScores as entry, index}",
  "{#each sortedScores as entry, index (entry.name)}"
);

content = content.replace(
  "<div class=\"flex items-center gap-3 p-3 rounded-lg {index === 0 ? 'bg-yellow-50' : 'bg-gray-50'}\">",
  "<div class=\"flex items-center gap-3 p-3 rounded-lg {index === 0 ? 'bg-yellow-50' : 'bg-gray-50'}\" animate:flip={{ duration: 400 }}>"
);

// fix focus trap inside App.svelte while scoreboard or confirmation dialogs open (focus management)
// We already did dialog, but we should do this for aria labels
fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/Scoreboard.svelte', content);
