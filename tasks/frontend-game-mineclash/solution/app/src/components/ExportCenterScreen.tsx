import { component$, useContext, useSignal } from '@builder.io/qwik';
import { AppCtx } from '../context';
import type { Difficulty, MatchLogEntry } from '../types';

function isMatchLogEntry(v: unknown): v is MatchLogEntry {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.playerName === 'string' &&
    (r.difficulty === 'easy' || r.difficulty === 'medium' || r.difficulty === 'hard') &&
    typeof r.playerRoundWins === 'number' &&
    typeof r.rivalRoundWins === 'number' &&
    typeof r.playerTotalOre === 'number' &&
    typeof r.rivalTotalOre === 'number' &&
    (r.winner === 'player' || r.winner === 'rival' || r.winner === 'draw') &&
    Array.isArray(r.rounds) &&
    typeof r.endedAt === 'string'
  );
}

function download(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const ExportCenterScreen = component$(() => {
  const store = useContext(AppCtx);
  const copiedMatch = useSignal(false);
  const copiedArchive = useSignal(false);
  const importText = useSignal('');
  const importMessage = useSignal('');
  const importOk = useSignal(false);

  const latest = store.matchLog.length > 0 ? store.matchLog[store.matchLog.length - 1] : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#F59E0B', margin: 0 }}>📥 Export / Import</h1>
        <button
          class="btn-secondary"
          style={{ fontSize: '13px', padding: '8px 16px' }}
          onClick$={() => {
            if (store.phase === 'export-center') store.phase = 'setup';
          }}
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
              onClick$={() => {
                if (!latest) return;
                download(`mineclash-match-${latest.endedAt}.json`, JSON.stringify(latest, null, 2));
              }}
            >
              ⬇️ Download
            </button>
            <button
              class="btn-secondary"
              style={{ fontSize: '14px', padding: '10px 16px' }}
              disabled={!latest}
              onClick$={async () => {
                if (!latest) return;
                await navigator.clipboard.writeText(JSON.stringify(latest, null, 2));
                copiedMatch.value = true;
                setTimeout(() => { copiedMatch.value = false; }, 1500);
              }}
            >
              {copiedMatch.value ? '✓ Copied' : '📋 Copy'}
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
              class="btn-primary"
              style={{ fontSize: '14px', padding: '10px 16px' }}
              disabled={store.matchLog.length === 0}
              onClick$={() => {
                download('mineclash-archive.json', JSON.stringify({ matches: store.matchLog }, null, 2));
              }}
            >
              ⬇️ Download
            </button>
            <button
              class="btn-secondary"
              style={{ fontSize: '14px', padding: '10px 16px' }}
              disabled={store.matchLog.length === 0}
              onClick$={async () => {
                await navigator.clipboard.writeText(JSON.stringify({ matches: store.matchLog }, null, 2));
                copiedArchive.value = true;
                setTimeout(() => { copiedArchive.value = false; }, 1500);
              }}
            >
              {copiedArchive.value ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Import */}
        <div class="panel">
          <div style={{ fontWeight: '700', marginBottom: '8px' }}>Import</div>
          <p style={{ fontSize: '13px', color: '#A8A29E', margin: '0 0 8px' }}>
            Paste a single-match JSON or an archive JSON exported from MineClash.
          </p>
          <textarea
            class="input input-bordered w-full"
            style={{ background: '#292524', border: '1px solid #44403C', color: '#FAFAF9', padding: '10px', borderRadius: '8px', fontSize: '13px', width: '100%', minHeight: '96px', fontFamily: "'Courier New', monospace" }}
            value={importText.value}
            onInput$={(e) => { importText.value = (e.target as HTMLTextAreaElement).value; }}
            aria-label="Import JSON"
          />
          <button
            type="button"
            class="btn-secondary"
            style={{ marginTop: '8px', fontSize: '14px', padding: '10px 16px' }}
            onClick$={() => {
              try {
                const parsed = JSON.parse(importText.value);
                const isArchive = Array.isArray(parsed?.matches);
                const candidates: unknown[] = isArchive ? parsed.matches : [parsed];
                if (candidates.length === 0 || !candidates.every(isMatchLogEntry)) {
                  importOk.value = false;
                  importMessage.value = 'Import failed: the file is invalid — it is missing required match fields.';
                  return;
                }
                const records = (candidates as MatchLogEntry[]).map((c) => ({
                  playerName: c.playerName,
                  difficulty: c.difficulty as Difficulty,
                  playerRoundWins: c.playerRoundWins,
                  rivalRoundWins: c.rivalRoundWins,
                  playerTotalOre: c.playerTotalOre,
                  rivalTotalOre: c.rivalTotalOre,
                  winner: c.winner,
                  rounds: c.rounds,
                  endedAt: c.endedAt,
                }));
                if (isArchive) {
                  store.matchLog = records;
                } else {
                  store.matchLog.push(...records);
                }
                importOk.value = true;
                importMessage.value = `Imported ${candidates.length} match record${candidates.length === 1 ? '' : 's'}.`;
                importText.value = '';
              } catch {
                importOk.value = false;
                importMessage.value = 'Import failed: the file is invalid — it is not valid JSON.';
              }
            }}
          >
            📥 Import
          </button>
          {importMessage.value && (
            <div role="status" style={{ marginTop: '8px', fontSize: '13px', color: importOk.value ? '#4ADE80' : '#EF4444' }}>
              {importMessage.value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
