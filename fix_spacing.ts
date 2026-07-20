import * as fs from 'fs';
import * as glob from 'glob';

// The reviewer mentioned:
// "Paddings and margins on setup and play follow the 10px base spacing unit"
// "The agent ignored this completely, leaving all the default Tailwind 4px-scale spacing utilities (e.g. mb-4, p-6) intact."
// We need to change mb-4 -> mb-[10px], mb-8 -> mb-[20px] etc. in App, GameScreen, SetupScreen, CustomCards, Scoreboard
// Actually, tailwind v4 can just use custom spacing or we can use bracket notation like p-[10px], p-[20px] or we can add a theme override in global.css (but it's Tailwind 4, so theme is in CSS)

let cssContent = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/styles/global.css', 'utf-8');

const themeOverrides = `
@theme {
  --spacing-1: 10px;
  --spacing-2: 20px;
  --spacing-3: 30px;
  --spacing-4: 40px;
  --spacing-5: 50px;
  --spacing-6: 60px;
  --spacing-8: 80px;
  --spacing-10: 100px;
}
`;
fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/styles/global.css', cssContent.replace("@tailwind base;", "@tailwind base;\n" + themeOverrides));
