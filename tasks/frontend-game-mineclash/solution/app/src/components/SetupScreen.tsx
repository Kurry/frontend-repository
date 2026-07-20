import { component$, useContext, useSignal } from '@builder.io/qwik';
import { AppCtx } from '../context';
import { initNewMatch } from '../gameLogic';
import type { Difficulty } from '../types';

const DIFF_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const DIFF_DESC: Record<Difficulty, string> = {
  easy: '8×8 grid · 10 mines',
  medium: '10×10 grid · 16 mines',
  hard: '12×12 grid · 24 mines',
};

export const SetupScreen = component$(() => {
  const store = useContext(AppCtx);
  const nameError = useSignal('');
  const diffError = useSignal('');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Logo / Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div aria-hidden="true" style={{ fontSize: '48px', marginBottom: '8px' }}>⛏️</div>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#F59E0B', margin: '0 0 8px', letterSpacing: '-1px' }}>MineClash</h1>
        <p style={{ color: '#A8A29E', margin: 0, fontSize: '16px' }}>A mining duel · Best of 3 rounds</p>
      </div>

      {/* Player Name and Difficulty container */}
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

        {/* Difficulty */}
        <div>
          <p id="difficulty-label" style={{ color: '#A8A29E', fontSize: '13px', letterSpacing: '0.4px', marginBottom: '12px', textAlign: 'center' }}>
          Select difficulty
        </p>
        <div role="group" aria-labelledby="difficulty-label" style={{ display: 'flex', gap: '8px' }}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
            <button
              key={d}
              class={`btn-secondary${store.difficulty === d ? ' btn-mode-active' : ''}`}
              style={{ flex: 1, flexDirection: 'column', display: 'flex', alignItems: 'center', padding: '12px 8px', gap: '4px' }}
              aria-pressed={store.difficulty === d}
              onClick$={() => {
                if (store.phase === 'setup') {
                  store.difficulty = d;
                  diffError.value = '';
                }
              }}
            >
              <span style={{ fontWeight: '700', fontSize: '14px' }}>{DIFF_LABELS[d]}</span>
              <span style={{ fontSize: '11px', color: '#A8A29E', fontFamily: "'Courier New', monospace" }}>{DIFF_DESC[d]}</span>
            </button>
          ))}
        </div>
        {diffError.value && (
            <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', textAlign: 'center' }}>{diffError.value}</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '340px' }}>
        <button
          class="btn-primary"
          style={{ fontSize: '18px', padding: '14px', width: '100%' }}
          disabled={!!nameError.value || !!diffError.value || (store.playerName && store.playerName.length < 2) || (store.playerName && store.playerName.length > 20) || !store.difficulty}
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
          }}
        >
          ⚔️ Start match
        </button>
        <button
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
          </button>
      </div>

      {/* Sound toggle */}
      <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '10px', color: '#A8A29E' }}>
        <span style={{ fontSize: '14px' }}>Sound</span>
        <button
          class="sound-switch"
          style={{
            background: store.soundEnabled ? '#F59E0B' : '#44403C',
            border: 'none', borderRadius: '20px', width: '44px', height: '24px',
            cursor: 'pointer', position: 'relative', transition: 'background 0.2s'
          }}
          role="switch"
          aria-label="Sound"
          aria-checked={store.soundEnabled}
          onClick$={() => { store.soundEnabled = !store.soundEnabled; }}
        >
          <span style={{
            position: 'absolute', top: '2px', borderRadius: '50%', width: '20px', height: '20px',
            background: '#fff', transition: 'left 0.2s',
            left: store.soundEnabled ? '22px' : '2px'
          }} />
        </button>
        <span aria-hidden="true" style={{ fontSize: '14px' }}>{store.soundEnabled ? '🔊' : '🔇'}</span>
      </div>
    </div>
  );
});
