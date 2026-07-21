import { component$, useContext } from '@builder.io/qwik';
import { AppCtx } from '../context';
import { MAX_STRIKES } from '../gameLogic';

export const Scoreboard = component$(() => {
  const store = useContext(AppCtx);

  return (
    <div class="scoreboard" style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
      {/* Player Panel */}
      <PlayerPanel
        label="You"
        score={store.player.score}
        strikes={store.player.strikes}
        isActive={store.currentTurn === 'player' && !store.isRivalThinking && store.phase === 'playing'}
        isThinking={false}
        color="#38BDF8"
        target={store.targetScore}
      />
      {/* VS divider */}
      <div class="scoreboard-versus" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', color: '#A8A29E', fontWeight: '700', fontSize: '14px' }}>
        vs
      </div>
      {/* Rival Panel */}
      <PlayerPanel
        label="Rival"
        score={store.rival.score}
        strikes={store.rival.strikes}
        isActive={store.currentTurn === 'rival' || store.isRivalThinking}
        isThinking={store.isRivalThinking}
        color="#FB923C"
        target={store.targetScore}
      />
    </div>
  );
});

interface PPProps {
  label: string;
  score: number;
  strikes: number;
  isActive: boolean;
  isThinking: boolean;
  color: string;
  target: number;
}

const PlayerPanel = component$<PPProps>(({ label, score, strikes, isActive, isThinking, color, target }) => {
  return (
    <div
      style={{
        flex: 1, minWidth: '120px',
        background: '#292524',
        borderRadius: '12px',
        border: `2px solid ${isActive ? color : '#44403C'}`,
        padding: '12px',
        transition: 'border-color 0.25s, box-shadow 0.3s, color 0.25s',
        boxShadow: isActive ? `0 0 12px ${color}33` : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontWeight: '700', color: isActive ? color : '#A8A29E', fontSize: '14px', transition: 'color 0.2s' }}>
          {label}
          {isThinking && <span class="animate-pulse-glow" style={{ marginLeft: '6px', fontSize: '12px' }}>🤔</span>}
        </span>
        <span style={{ fontFamily: "'Courier New', monospace", fontSize: '22px', fontWeight: '700', color: '#FAFAF9' }}>
          {score}
          <span style={{ fontSize: '11px', color: '#A8A29E' }}>/{target}</span>
        </span>
      </div>
      {/* Strike icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: strikes === 2 ? '#FACC15' : '#D6D3D1', fontSize: '11px' }}>
          Strikes {strikes}/{MAX_STRIKES}
        </span>
        <div aria-hidden="true" style={{ display: 'flex', gap: '6px' }}>
          {Array.from({ length: MAX_STRIKES }).map((_, i) => (
            <span
              key={i}
              class={`strike-icon${i < strikes ? (strikes === MAX_STRIKES - 1 ? ' strike-warning' : ' strike-filled') : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
