import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', 'utf-8');

// The spec says:
// [1.18] After returning to setup from a game played with only Dare selected and starting a new game with only Truth selected, every card drawn in the new game
// This implies we need to make sure the deck is properly rebuilt upon startGame.
// In startGame we do: deck = buildDeck(); so it should be correct.
// And selectedCategories is updated during Setup.
// The reshuffle logic is already present.

// Let's add toast accessibility live region properly.
content = content.replace(
  "<!-- Toast Container -->\n  <div class=\"fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none\">",
  "<!-- Toast Container -->\n  <div aria-live=\"polite\" class=\"fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none\">"
);

fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', content);
