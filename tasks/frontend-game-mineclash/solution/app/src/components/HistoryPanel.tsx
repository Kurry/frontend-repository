import { component$, useComputed$, useContext, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { AppCtx } from '../context';
import type { HistoryNode } from '../types';
import { undoHistory, redoHistory, applyHistoryNode } from '../gameLogic';

export const HistoryPanel = component$(() => {
  const store = useContext(AppCtx);

  // These nodes are derived from ids that change in event handlers. Keeping
  // them as computed signals prevents Qwik from serializing a stale node into
  // the history detail panel while the direct current/selected markers move.
  const current = useComputed$(() =>
    store.historyNodes.find(n => n.id === store.currentHistoryId),
  );
  const selected = useComputed$(() =>
    store.historyNodes.find(n => n.id === store.selectedHistoryId),
  );
  const canUndo = useComputed$(() => !!current.value && current.value.parentId !== null);
  const canRedo = useComputed$(() => (current.value?.childIds.length ?? 0) > 0);

  // Entries that left the list (a branch was discarded on round reset / resume)
  // keep rendering with a fade-out class briefly instead of the list snapping
  // shorter (motion 4.9).
  const fading = useSignal<HistoryNode[]>([]);

  useVisibleTask$(({ track }) => {
    const ids = track(() => store.historyNodes.map(n => n.id).join('|'));
    const currentIds = new Set(ids ? ids.split('|') : []);
    const live = fading.value.filter(n => !currentIds.has(n.id));
    if (live.length === 0) return;
    const t = setTimeout(() => {
      fading.value = [];
    }, 280);
    return () => clearTimeout(t);
  });

  useVisibleTask$(({ track }) => {
    const nodes = track(() => store.historyNodes);
    const prev = fading.value;
    const byId = new Map(prev.map(n => [n.id, n]));
    for (const n of nodes) byId.set(n.id, n);
    const removed = prev.filter(n => !nodes.some(x => x.id === n.id));
    if (removed.length === 0) return;
    fading.value = removed;
  });

  const visible = store.historyNodes;
  const allForDepth = [...visible, ...fading.value];

  return (
    <div class="panel" style={{ marginTop: '8px', fontSize: '13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: '700', color: '#F59E0B', fontSize: '13px' }}>⏳ Move history</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            class="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '12px', opacity: canUndo.value ? 1 : 0.4 }}
            disabled={!canUndo.value}
            onClick$={() => undoHistory(store)}
          >
            ↩ Undo
          </button>
          <button
            class="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '12px', opacity: canRedo.value ? 1 : 0.4 }}
            disabled={!canRedo.value}
            onClick$={() => redoHistory(store)}
          >
            Redo ↪
          </button>
        </div>
      </div>

      {/* History list */}
      <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
        {visible.map(node => {
          const isCur = node.id === store.currentHistoryId;
          const isSel = node.id === store.selectedHistoryId;
          const depth = getDepth(allForDepth, node.id);
          const branchCount = node.parentId !== null ? (allForDepth.find(n => n.id === node.parentId)?.childIds.length ?? 0) : 0;
          const isBranch = branchCount > 1;

          return (
            <button
              key={node.id}
              class={`history-node hist-enter${isCur ? ' current' : ''}${isSel ? ' selected' : ''}`}
              style={{ paddingLeft: `${8 + depth * 12}px`, textAlign: 'left', width: '100%', background: 'none', border: '1px solid transparent', color: '#FAFAF9' }}
              onClick$={() => { store.selectedHistoryId = node.id; }}
            >
              {isBranch ? '⤷ ' : ''}
              {isCur ? '▶ ' : '  '}
              {node.label}
              {isCur && <span style={{ color: '#38BDF8', marginLeft: '4px', fontSize: '10px' }}>Current</span>}
            </button>
          );
        })}
        {fading.value.map(node => {
          const depth = getDepth(allForDepth, node.id);
          return (
            <span
              key={`fade-${node.id}`}
              class="history-node hist-exit"
              aria-hidden="true"
              style={{ paddingLeft: `${8 + depth * 12}px`, textAlign: 'left', width: '100%', background: 'none', border: '1px solid transparent', color: '#78716C' }}
            >
              {'  '}{node.label}
            </span>
          );
        })}
      </div>

      {/* History state display */}
      <div style={{ background: '#1C1917', borderRadius: '8px', padding: '8px', border: '1px solid #44403C', marginBottom: '8px' }}>
        <div style={{ color: '#A8A29E', fontSize: '11px', letterSpacing: '0.4px', marginBottom: '6px' }}>
          History state
        </div>
        {selected.value ? (
          <div style={{ fontSize: '12px', lineHeight: 1.6 }}>
            <div>
              <span style={{ color: '#38BDF8', fontWeight: '700' }}>You</span>
              <span style={{ fontFamily: "'Courier New', monospace", color: '#FAFAF9', marginLeft: '6px' }}>
                {selected.value.snapshot.player.score} pts, {selected.value.snapshot.player.strikes} {selected.value.snapshot.player.strikes === 1 ? 'strike' : 'strikes'}
              </span>
            </div>
            <div>
              <span style={{ color: '#FB923C', fontWeight: '700' }}>Rival</span>
              <span style={{ fontFamily: "'Courier New', monospace", color: '#FAFAF9', marginLeft: '6px' }}>
                {selected.value.snapshot.rival.score} pts, {selected.value.snapshot.rival.strikes} {selected.value.snapshot.rival.strikes === 1 ? 'strike' : 'strikes'}
              </span>
            </div>
            <div style={{ color: '#A8A29E' }}>
              Turn: <span style={{ color: '#FAFAF9' }}>{selected.value.snapshot.currentTurn === 'player' ? 'Yours' : 'Rival\'s'}</span>
            </div>
          </div>
        ) : (
          <span style={{ color: '#A8A29E' }}>No state selected</span>
        )}
      </div>

      {/* Apply Scenario Change */}
      <button
        class="btn-primary"
        style={{ width: '100%', fontSize: '13px', padding: '8px' }}
        disabled={!selected.value || selected.value.id === store.currentHistoryId}
        onClick$={() => {
          if (store.selectedHistoryId) {
            applyHistoryNode(store, store.selectedHistoryId);
          }
        }}
      >
        Apply Scenario Change
      </button>
    </div>
  );
});

function getDepth(nodes: HistoryNode[], id: string): number {
  let depth = 0;
  let cur = nodes.find(n => n.id === id);
  while (cur?.parentId !== null) {
    depth++;
    cur = nodes.find(n => n.id === cur!.parentId);
    if (depth > 20) break;
  }
  return depth;
}
