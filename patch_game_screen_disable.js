const fs = require('fs');
const file = 'tasks/frontend-game-mineclash/solution/app/src/components/GameScreen.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `{/* Controls */}
      {store.phase === 'playing' && (`,
  `{/* Controls */}
      {(store.phase === 'playing' || store.phase === 'round-result') && (`
);

code = code.replace(
  `{store.showHistoryPanel ? '▲ History' : '▼ History'}
          </button>
        </div>
      )}`,
  `{store.showHistoryPanel ? '▲ History' : '▼ History'}
          </button>
        </div>
      )}`
);

fs.writeFileSync(file, code);
