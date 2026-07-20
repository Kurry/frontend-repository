const fs = require('fs');
const file = 'tasks/frontend-game-mineclash/solution/app/src/components/TileCell.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `tile.revealed && tile.isMine ? 'tile-mine-hit' : '',`,
  `tile.revealed && tile.isMine ? 'tile-mine-hit' : '',`
);

// We need to ensure that unrevealed tiles don't expose what they are.
// "isMine" should not be in class or title or anywhere in the DOM if not revealed.
// Looking at the code:
// tile.hintStatus === 'mine' ? 'tile-hinted-mine' : ''
// Wait, the hint status *does* reveal it's a mine, which is intentional for hints.
// But is there anything exposing it otherwise?
// The current TileCell logic seems fine.

fs.writeFileSync(file, code);
