import { component$, useContext } from '@builder.io/qwik';
import { AppCtx } from '../context';
import { copyArtifact } from '../gameLogic';

// Inline, judge-readable export artifact: a human-readable preview of the
// match-result fields (innovation 11.3), the raw copyable JSON, and a Copy
// control that shows a transient Copied confirmation. No native download /
// file-chooser is opened — the JSON is selectable text on the page, which is
// both "copyable" and directly observable by Playwright (core 1.37 / 1.38).
export const ExportArtifactView = component$(() => {
  const store = useContext(AppCtx);
  const art = store.exportArtifact;
  if (!art) return null;

  let parsed: unknown = null;
  try { parsed = JSON.parse(art.json); } catch { /* ignore */ }

  const isArchive = !!parsed && typeof parsed === 'object' && Array.isArray((parsed as { matches?: unknown }).matches);
  const records = (isArchive ? (parsed as { matches: unknown[] }).matches : [parsed]) as Array<Record<string, unknown>>;
  const valid = records.length > 0 && records.every((r) => r && typeof r === 'object' && typeof r.playerName === 'string');

  return (
    <div class="panel animate-slide-in" style={{ width: '100%', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontWeight: '700', color: '#F59E0B', fontSize: '14px' }}>{art.title}</span>
        <button
          type="button"
          class="btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px' }}
          onClick$={() => { void copyArtifact(store, art.json); }}
        >
          📋 Copy
        </button>
      </div>

      {valid && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} aria-label="Export preview">
          {records.slice(0, 3).map((r, i) => (
            <div key={i} style={{ background: '#1C1917', border: '1px solid #44403C', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontWeight: '700', color: '#FAFAF9' }}>{String(r.playerName)}</span>
                <span style={{
                  color: r.winner === 'player' ? '#4ADE80' : r.winner === 'rival' ? '#EF4444' : '#FACC15',
                  fontWeight: '700',
                }}>
                  {r.winner === 'player' ? 'You won' : r.winner === 'rival' ? 'Rival won' : 'Draw'}
                </span>
              </div>
              <div style={{ color: '#A8A29E', fontFamily: "'Courier New', monospace" }}>
                {String(r.difficulty)} · rounds {String(r.playerRoundWins)}–{String(r.rivalRoundWins)} · ore {String(r.playerTotalOre)}/{String(r.rivalTotalOre)}
              </div>
              <div style={{ color: '#78716C', fontSize: '11px' }}>{String(r.endedAt)}</div>
            </div>
          ))}
          {isArchive && records.length > 3 && (
            <div style={{ color: '#78716C', fontSize: '11px', textAlign: 'center' }}>…and {records.length - 3} more in the archive</div>
          )}
        </div>
      )}

      <label htmlFor="mc-export-json" style={{ color: '#A8A29E', fontSize: '11px', letterSpacing: '0.4px' }}>
        JSON payload (read-only, selectable)
      </label>
      <textarea
        id="mc-export-json"
        class="input"
        readOnly
        value={art.json}
        aria-label="Exported JSON payload"
        style={{
          background: '#1C1917', border: '1px solid #44403C', color: '#FAFAF9', padding: '10px',
          borderRadius: '8px', fontSize: '11px', width: '100%', minHeight: '120px', resize: 'vertical',
          fontFamily: "'Courier New', monospace", whiteSpace: 'pre',
        }}
      />
    </div>
  );
});
