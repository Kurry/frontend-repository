import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/styles/global.css', 'utf-8');

const baseSpacing = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .focus-trap-dialog {
    /* added for context */
  }
}

:root {
  --color-bg: #EAE6DF;
  --color-accent: #222222;
  --color-link: #F4E869;
  --color-text-primary: #1A1A1A;
  --color-text-inverse: #FFFFFF;
}

body {
  margin: 0;
  font-family: 'Poppins', sans-serif;
  color: var(--color-text-primary);
  background-color: var(--color-bg);
}

.card-flip {
  perspective: 1000px;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); color: red; }
  100% { transform: scale(1); }
}

.timer-warning {
  animation: pulse 1s infinite;
}
`;

content = baseSpacing;
fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/styles/global.css', content);
