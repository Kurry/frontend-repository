const fs = require('fs');
const file = 'tasks/frontend-game-mineclash/solution/app/src/components/GameScreen.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `{/* Controls */}
      {(store.phase === 'playing' || store.phase === 'round-result') && (`,
  `{/* Controls */}
      {store.phase === 'playing' && (`
);

fs.writeFileSync(file, code);
