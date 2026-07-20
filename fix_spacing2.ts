import * as fs from 'fs';

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
