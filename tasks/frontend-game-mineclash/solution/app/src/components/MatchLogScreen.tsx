import { component$, useContext, useSignal } from '@builder.io/qwik';
import { AppCtx } from '../context';

export const MatchLogScreen = component$(() => {
  const store = useContext(AppCtx);
  const copiedState = useSignal(false);

  const exportMatch = (match: any) => {
    const jsonStr = JSON.stringify(match, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      copiedState.value = true;
      setTimeout(() => copiedState.value = false, 2000);
    });
  };

  const exportArchive = () => {
    const archive = { matches: store.matchLog };
    const jsonStr = JSON.stringify(archive, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      copiedState.value = true;
      setTimeout(() => copiedState.value = false, 2000);
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '24px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#F59E0B', margin: 0 }}>📜 Match log</h1>
        <button
          class="btn-secondary"
          style={{ fontSize: '13px', padding: '8px 16px' }}
          onClick$={() => {
            store.phase = 'setup';
          }}
        >
          ← Go back
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
         <button class="btn-primary" onClick$={exportArchive} disabled={store.matchLog.length === 0}>
            📤 Export Archive
         </button>
         <button class="btn-secondary" onClick$={() => store.phase = 'export-center'}>
            📥 Import
         </button>
      </div>

      {copiedState.value && (
         <div role="status" style={{ textAlign: 'center', marginBottom: '16px', color: '#4ADE80', fontWeight: 'bold' }}>
            Copied
         </div>
      )}

      {store.matchLog.length === 0 ? (
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#A8A29E' }}>
          <div aria-hidden="true" style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
          <h2 style={{ fontSize: '22px', color: '#FAFAF9', marginBottom: '8px' }}>No matches played yet</h2>
          <p style={{ fontSize: '14px', maxWidth: '280px' }}>Start a match to begin tracking your progress across all difficulty levels.</p>
        </div>
      ) : (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {store.matchLog.map((match, i) => (
               <div key={i} class="panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {match.playerName} · {match.difficulty.toUpperCase()}
                     </div>
                     <div style={{ color: '#A8A29E', fontSize: '12px' }}>
                        {new Date(match.endedAt).toLocaleString()}
                     </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                     <div>
                        Winner: <span style={{ color: match.winner === 'player' ? '#4ADE80' : match.winner === 'rival' ? '#EF4444' : '#FACC15' }}>{match.winner.toUpperCase()}</span>
                     </div>
                     <div>
                        Rounds won: <span style={{ color: '#38BDF8' }}>{match.playerRoundWins}</span> - <span style={{ color: '#FB923C' }}>{match.rivalRoundWins}</span>
                     </div>
                  </div>
                  <button class="btn-secondary" style={{ alignSelf: 'flex-start', padding: '4px 12px', fontSize: '12px' }} onClick$={() => exportMatch(match)}>
                     📤 Export Match
                  </button>
               </div>
            ))}
         </div>
      )}
    </div>
  );
});
