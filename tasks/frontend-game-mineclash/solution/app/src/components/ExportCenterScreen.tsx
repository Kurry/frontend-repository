import { component$, useContext } from '@builder.io/qwik';
import { AppCtx } from '../context';
import { applyImport, copyArtifact, exportArchive, exportMatch, goBack, latestMatch } from '../gameLogic';
import { ExportArtifactView } from './ExportArtifactView';

export const ExportCenterScreen = component$(() => {
  const store = useContext(AppCtx);
  const latest = latestMatch(store);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', maxWidth: '520px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#F59E0B', margin: 0 }}>📥 Export / Import</h1>
        <button
          class="btn-secondary"
          style={{ fontSize: '13px', padding: '8px 16px' }}
          onClick$={() => goBack(store)}
        >
          ← Go back
        </button>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Export Match */}
        <div class="panel">
          <div style={{ fontWeight: '700', marginBottom: '8px' }}>Export Match</div>
          <p style={{ fontSize: '13px', color: '#A8A29E', margin: '0 0 12px' }}>
            {latest ? `Most recent match — ${latest.playerName}, ${latest.difficulty}.` : 'No finished match yet.'}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              class="btn-primary"
              style={{ fontSize: '14px', padding: '10px 16px' }}
              disabled={!latest}
              onClick$={() => exportMatch(store, latest)}
            >
              📥 Export Match
            </button>
            <button
              class="btn-secondary"
              style={{ fontSize: '14px', padding: '10px 16px' }}
              disabled={!latest}
              onClick$={() => { if (latest) void copyArtifact(store, JSON.stringify(latest, null, 2)); }}
            >
              📋 Copy
            </button>
          </div>
        </div>

        {/* Export Archive */}
        <div class="panel">
          <div style={{ fontWeight: '700', marginBottom: '8px' }}>Export Archive</div>
          <p style={{ fontSize: '13px', color: '#A8A29E', margin: '0 0 12px' }}>
            {store.matchLog.length > 0 ? `${store.matchLog.length} match${store.matchLog.length === 1 ? '' : 'es'} recorded.` : 'No finished matches yet.'}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              class="btn-secondary"
              style={{ fontSize: '14px', padding: '10px 16px' }}
              disabled={store.matchLog.length === 0}
              onClick$={() => exportArchive(store)}
            >
              📥 Export Archive
            </button>
            <button
              class="btn-secondary"
              style={{ fontSize: '14px', padding: '10px 16px' }}
              disabled={store.matchLog.length === 0}
              onClick$={() => { void copyArtifact(store, JSON.stringify({ matches: store.matchLog }, null, 2)); }}
            >
              📋 Copy
            </button>
          </div>
        </div>

        {/* The rendered artifact (readable preview + copyable JSON) for the last
            export action taken on this screen or elsewhere. */}
        <ExportArtifactView />

        {/* Import */}
        <div class="panel">
          <div style={{ fontWeight: '700', marginBottom: '8px' }}>Import</div>
          <p style={{ fontSize: '13px', color: '#A8A29E', margin: '0 0 8px' }}>
            Paste a single-match JSON or an archive JSON exported from MineClash.
          </p>
          <textarea
            class="input"
            style={{ background: '#292524', border: '1px solid #44403C', color: '#FAFAF9', padding: '10px', borderRadius: '8px', fontSize: '13px', width: '100%', minHeight: '96px', fontFamily: "'Courier New', monospace" }}
            value={store.importText}
            onInput$={(e) => { store.importText = (e.target as HTMLTextAreaElement).value; }}
            aria-label="Import JSON"
            aria-describedby={store.importMessage ? 'mc-import-msg' : undefined}
          />
          <button
            type="button"
            class="btn-secondary"
            style={{ marginTop: '8px', fontSize: '14px', padding: '10px 16px' }}
            onClick$={() => applyImport(store)}
          >
            📥 Import
          </button>
          {store.importMessage && (
            <div id="mc-import-msg" role="status" style={{ marginTop: '8px', fontSize: '13px', color: store.importOk ? '#4ADE80' : '#EF4444' }}>
              {store.importMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
