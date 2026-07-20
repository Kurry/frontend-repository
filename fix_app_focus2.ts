import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', 'utf-8');

// I also noticed: The regex replacement used to add visible focus rings (content.replace(/focus:ring-black/g, "focus-visible:ring-black focus:outline-none");) blindly injects classes, resulting in duplicated focus:outline-none spam in the markup

content = content.replace(/focus:outline-none focus:outline-none/g, "focus:outline-none");

fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', content);

let contentSetup = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/SetupScreen.svelte', 'utf-8');
contentSetup = contentSetup.replace(/focus:outline-none focus:outline-none/g, "focus:outline-none");
fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/SetupScreen.svelte', contentSetup);

let contentGame = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/GameScreen.svelte', 'utf-8');
contentGame = contentGame.replace(/focus:outline-none focus:outline-none/g, "focus:outline-none");
fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/GameScreen.svelte', contentGame);
