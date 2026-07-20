const fs = require('fs');
const file = 'tasks/frontend-game-mineclash/solution/app/src/components/GameScreen.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `{/* Pause / Resume */}`,
  `{/* Save progress */}
          <button
            class="btn-secondary"
            style={{ fontSize: '13px', padding: '8px 12px' }}
            onClick$={() => {
              if (store.phase !== 'playing') return;
              store.savedCheckpoint = {
                playerName: store.playerName,
                difficulty: store.difficulty,
                roundNumber: store.roundNumber,
                playerScore: store.player.score,
                rivalScore: store.rival.score,
                playerStrikes: store.player.strikes,
                rivalStrikes: store.rival.strikes,
                sideToMove: store.currentTurn,
                hintsRemaining: 2 - store.hintsUsed,
                playerRoundWins: store.playerMatchWins,
                rivalRoundWins: store.rivalMatchWins,
                board: JSON.parse(JSON.stringify(store.tiles)),
                targetScore: store.targetScore,
                mineCount: store.mineCount
              };
              store.feedback = 'Match saved.';
            }}
          >
            💾 Save Progress
          </button>

          {/* Pause / Resume */}`
);

fs.writeFileSync(file, code);
