const fs = require('fs');
const file = 'tasks/frontend-game-mineclash/solution/app/src/components/SetupScreen.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `import { component$, useContext } from '@builder.io/qwik';`,
  `import { component$, useContext, useSignal } from '@builder.io/qwik';`
);

code = code.replace(
  `export const SetupScreen = component$(() => {
  const store = useContext(AppCtx);`,
  `export const SetupScreen = component$(() => {
  const store = useContext(AppCtx);
  const nameError = useSignal('');
  const diffError = useSignal('');`
);

code = code.replace(
  `{/* Difficulty */}
      <div style={{ marginBottom: '32px', width: '100%', maxWidth: '340px' }}>`,
  `{/* Player Name and Difficulty container */}
      <div style={{ marginBottom: '32px', width: '100%', maxWidth: '340px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label for="playerName" style={{ display: 'block', color: '#A8A29E', fontSize: '13px', letterSpacing: '0.4px', marginBottom: '8px' }}>
            Player Name
          </label>
          <input
            id="playerName"
            type="text"
            class="input input-bordered w-full"
            style={{ background: '#292524', border: '1px solid #44403C', color: '#FAFAF9', padding: '12px', borderRadius: '8px', fontSize: '16px', width: '100%' }}
            value={store.playerName}
            onInput$={(e) => {
              const val = (e.target as HTMLInputElement).value;
              store.playerName = val;
              if (val.length < 2 || val.length > 20) {
                nameError.value = 'playerName must be 2 to 20 characters';
              } else {
                nameError.value = '';
              }
            }}
          />
          {nameError.value && (
            <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{nameError.value}</div>
          )}
        </div>

        {/* Difficulty */}`
);

code = code.replace(
  `onClick$={() => { initNewMatch(store); }}`,
  `disabled={!!nameError.value || !!diffError.value || (store.playerName && store.playerName.length < 2) || (store.playerName && store.playerName.length > 20) || !store.difficulty}
          onClick$={() => {
            let valid = true;
            if (!store.playerName || store.playerName.length < 2 || store.playerName.length > 20) {
              nameError.value = 'playerName must be 2 to 20 characters';
              valid = false;
            }
            if (!store.difficulty) {
              diffError.value = 'difficulty must be selected';
              valid = false;
            }
            if (valid) {
              initNewMatch(store);
            }
          }}`
);

code = code.replace(
  `<button
          class="btn-secondary"
          style={{ width: '100%' }}
          onClick$={() => {
            if (store.phase === 'setup') store.phase = 'stats';
          }}
        >
          📊 View stats
        </button>`,
  `<button
            type="button"
            class="btn-secondary"
            style={{ width: '100%', marginBottom: '12px' }}
            onClick$={() => {
              if (store.phase === 'setup') store.phase = 'stats';
            }}
          >
            📊 View stats
          </button>
          <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '12px' }}>
            <button
              type="button"
              class="btn-secondary"
              style={{ flex: 1, fontSize: '14px' }}
              onClick$={() => {
                if (store.phase === 'setup') store.phase = 'match-log';
              }}
            >
              📜 Match log
            </button>
            <button
              type="button"
              class="btn-secondary"
              style={{ flex: 1, fontSize: '14px' }}
              onClick$={() => {
                if (store.phase === 'setup') store.phase = 'export-center';
              }}
            >
              📥 Export / Import
            </button>
          </div>
          <button
            type="button"
            class="btn-secondary"
            style={{ width: '100%', fontSize: '14px' }}
            disabled={!store.savedCheckpoint}
            onClick$={() => {
              if (store.phase === 'setup' && store.savedCheckpoint) {
                // Resume logic
                Object.assign(store, store.savedCheckpoint);
                store.tiles = store.savedCheckpoint.board;
                // Wait, need to restore strikes differently since it's nested
                store.player.score = store.savedCheckpoint.playerScore;
                store.player.strikes = store.savedCheckpoint.playerStrikes;
                store.rival.score = store.savedCheckpoint.rivalScore;
                store.rival.strikes = store.savedCheckpoint.rivalStrikes;
                store.currentTurn = store.savedCheckpoint.sideToMove;
                store.hintsUsed = 2 - store.savedCheckpoint.hintsRemaining; // MAX_HINTS is 2
                store.playerMatchWins = store.savedCheckpoint.playerRoundWins;
                store.rivalMatchWins = store.savedCheckpoint.rivalRoundWins;
                store.phase = 'playing';
              }
            }}
          >
            ▶️ Resume Saved Match
          </button>`
);

code = code.replace(
  `{/* Difficulty */}
        <p id="difficulty-label"`,
  `{/* Difficulty */}
        <div>
          <p id="difficulty-label"`
);

code = code.replace(
  `          </button>
          ))}
        </div>`,
  `          </button>
          ))}
        </div>
        {diffError.value && (
            <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', textAlign: 'center' }}>{diffError.value}</div>
          )}
        </div>`
);

code = code.replace(
  `onClick$={() => {
                if (store.phase === 'setup') store.difficulty = d;
              }}`,
  `onClick$={() => {
                if (store.phase === 'setup') {
                  store.difficulty = d;
                  diffError.value = '';
                }
              }}`
);


fs.writeFileSync(file, code);
