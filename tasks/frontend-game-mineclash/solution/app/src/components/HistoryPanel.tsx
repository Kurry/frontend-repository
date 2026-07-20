import { component$, useContext } from '@builder.io/qwik';
import { AppCtx } from '../context';
import { undoHistory, redoHistory, applyHistoryNode } from '../gameLogic';
import autoAnimate from '@formkit/auto-animate';

export const HistoryPanel = component$(() => {
  const store = useContext(AppCtx);

  const current = store.historyNodes.find(n => n.id === store.currentHistoryId);
  const selected = store.historyNodes.find(n => n.id === store.selectedHistoryId);
  const canUndo = !!current && current.parentId !== null && !store.isRivalThinking;
  const canRedo = (current?.childIds.length ?? 0) > 0 && !store.isRivalThinking;

  return (
    <div class="panel" style={{ marginTop: '8px', fontSize: '13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: '700', color: '#F59E0B', fontSize: '13px' }}>⏳ Move history</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            class="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '12px', opacity: canUndo ? 1 : 0.4 }}
            disabled={!canUndo}
            onClick$={() => undoHistory(store)}
          >
            ↩ Undo
          </button>
          <button
            class="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '12px', opacity: canRedo ? 1 : 0.4 }}
            disabled={!canRedo}
            onClick$={() => redoHistory(store)}
          >
            Redo ↪
          </button>
        </div>
      </div>

      {/* History list */}
      <div
         ref={(el: HTMLElement) => { if (el) autoAnimate(el); }}
         style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}
      >
        {store.historyNodes.map(node => {
          const isCur = node.id === store.currentHistoryId;
          const isSel = node.id === store.selectedHistoryId;
          const depth = getDepth(store.historyNodes, node.id);
          const isBranch = node.parentId !== null && (store.historyNodes.find(n => n.id === node.parentId)?.childIds.length ?? 0) > 1;

          return (
            <button
              key={node.id}
              class={`history-node${isCur ? ' current' : ''}${isSel ? ' selected' : ''}`}
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
      </div>

      {/* History state display */}
      <div role="region" aria-label="History state" style={{ background: '#1C1917', borderRadius: '8px', padding: '8px', border: '1px solid #44403C', marginBottom: '8px' }}>
        <div style={{ color: '#A8A29E', fontSize: '11px', letterSpacing: '0.4px', marginBottom: '6px' }}>
          History state
        </div>
        {selected ? (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: '#38BDF8', fontSize: '12px' }}>You</span>
              <span style={{ fontFamily: "'Courier New', monospace", color: '#FAFAF9', marginLeft: '6px' }}>
                {selected.snapshot.player.score}pts · {selected.snapshot.player.strikes}⚡
              </span>
            </div>
            <div>
              <span style={{ color: '#FB923C', fontSize: '12px' }}>Rival</span>
              <span style={{ fontFamily: "'Courier New', monospace", color: '#FAFAF9', marginLeft: '6px' }}>
                {selected.snapshot.rival.score}pts · {selected.snapshot.rival.strikes}⚡
              </span>
            </div>
            <div style={{ color: '#A8A29E', fontSize: '11px' }}>
              Turn: {selected.snapshot.currentTurn === 'player' ? 'Yours' : 'Rival\'s'}
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
        disabled={!selected || selected.id === store.currentHistoryId || store.isRivalThinking}
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

function getDepth(nodes: { id: string; parentId: string | null }[], id: string): number {
  let depth = 0;
  let cur = nodes.find(n => n.id === id);
  while (cur?.parentId !== null) {
    depth++;
    cur = nodes.find(n => n.id === cur!.parentId);
    if (depth > 20) break;
  }
  return depth;
}
