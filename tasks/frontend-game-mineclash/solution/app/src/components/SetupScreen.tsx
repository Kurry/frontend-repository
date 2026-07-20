import { component$, useContext, useStore } from '@builder.io/qwik';
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

  const localStore = useStore({
    playerName: store.playerName || '',
    difficulty: store.difficulty || 'easy'
  });

  const getPlayerNameError = () => {
    if (localStore.playerName.length > 0 && (localStore.playerName.length < 2 || localStore.playerName.length > 20)) {
       return 'playerName must be between 2 and 20 characters';
    }
    return '';
  };

  const getDifficultyError = () => {
    if (!localStore.difficulty) {
       return 'difficulty is required';
    }
    return '';
  };

  const isInvalid = localStore.playerName.length < 2 || localStore.playerName.length > 20 || !localStore.difficulty;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div aria-hidden="true" style={{ fontSize: '48px', marginBottom: '8px' }}>⛏️</div>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#F59E0B', margin: '0 0 8px', letterSpacing: '-1px' }}>MineClash</h1>
        <p style={{ color: '#A8A29E', margin: 0, fontSize: '16px' }}>A mining duel · Best of 3 rounds</p>
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '340px' }}
      >
        <div>
          <label for="playerName" style={{ display: 'block', color: '#A8A29E', fontSize: '13px', letterSpacing: '0.4px', marginBottom: '8px' }}>
            Player Name
          </label>
          <input
            id="playerName"
            type="text"
            value={localStore.playerName}
            onInput$={(e) => localStore.playerName = (e.target as HTMLInputElement).value}
            class="input input-bordered w-full"
            style={{ background: '#292524', borderColor: getPlayerNameError() ? '#EF4444' : '#44403C', color: '#FAFAF9' }}
          />
          {getPlayerNameError() && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', margin: 0 }}>{getPlayerNameError()}</p>}
        </div>

        <div>
          <p id="difficulty-label" style={{ color: '#A8A29E', fontSize: '13px', letterSpacing: '0.4px', marginBottom: '8px', textAlign: 'center' }}>
            Select difficulty
          </p>
          <div role="group" aria-labelledby="difficulty-label" style={{ display: 'flex', gap: '8px' }}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <label
                key={d}
                class={`btn-secondary${localStore.difficulty === d ? ' btn-mode-active' : ''}`}
                style={{ flex: 1, flexDirection: 'column', display: 'flex', alignItems: 'center', padding: '12px 8px', gap: '4px', cursor: 'pointer' }}
              >
                <input type="radio" value={d} checked={localStore.difficulty === d} onChange$={(e) => localStore.difficulty = (e.target as HTMLInputElement).value as Difficulty} style={{ display: 'none' }} />
                <span style={{ fontWeight: '700', fontSize: '14px' }}>{DIFF_LABELS[d]}</span>
                <span style={{ fontSize: '11px', color: '#A8A29E', fontFamily: "'Courier New', monospace" }}>{DIFF_DESC[d]}</span>
              </label>
            ))}
          </div>
          {getDifficultyError() && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', margin: 0, textAlign: 'center' }}>{getDifficultyError()}</p>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          <button
            class="btn-primary"
            style={{ fontSize: '18px', padding: '14px', width: '100%' }}
            disabled={isInvalid}
            onClick$={() => {
              store.playerName = localStore.playerName;
              store.difficulty = localStore.difficulty;
              initNewMatch(store);
            }}
          >
            ⚔️ Start match
          </button>
          <button
            type="button"
            class="btn-secondary"
            style={{ width: '100%' }}
            onClick$={() => {
              if (store.phase === 'setup') store.phase = 'stats';
            }}
          >
            📊 View stats
          </button>
          {store.matchRounds && store.matchRounds.length < 2 && store.roundNumber > 0 && store.tiles.length > 0 && (
            <button
              type="button"
              class="btn-secondary"
              style={{ width: '100%' }}
              onClick$={() => {
                store.phase = 'playing';
              }}
            >
              🔄 Resume Saved Match
            </button>
          )}
          <button
            type="button"
            class="btn-secondary"
            style={{ width: '100%' }}
            onClick$={() => {
              store.phase = 'match-log';
            }}
          >
            📜 Match log
          </button>
        </div>
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
