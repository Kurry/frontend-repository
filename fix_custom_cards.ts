import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/CustomCards.svelte', 'utf-8');

// add flip animate
content = content.replace(
  "import type { Card, Category, Intensity } from '../lib/cards';",
  "import type { Card, Category, Intensity } from '../lib/cards';\n  import { flip } from 'svelte/animate';\n  import { fade, slide } from 'svelte/transition';"
);

// update length validation to 8
content = content.replace(
  "if (prompt.length < 5) {",
  "if (prompt.length < 8) {"
);
content = content.replace(
  "formError = 'Enter at least 5 characters';",
  "formError = 'prompt must be at least 8 characters';"
);

// update UI empty state to be friendly and clear
content = content.replace(
  "No custom cards yet. Select Add custom card to create one.",
  "Your custom card list is empty. Fill out the prompt, select a category and intensity above, then click Add custom card to create one."
);

// apply flip and transition to list items
content = content.replace(
  "<div class=\"flex items-center gap-2 p-3 rounded-lg bg-gray-50\">",
  "<div class=\"flex items-center gap-2 p-3 rounded-lg bg-gray-50\" transition:slide animate:flip={{ duration: 300 }}>"
);

fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/CustomCards.svelte', content);
