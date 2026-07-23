import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion';
import {
  Copy, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  X, Trash2, Keyboard, Compass, StickyNote,
} from 'lucide-react';
import { useStore } from './store';
import { nodeLabel, hashString } from './utils';

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to Path Finder',
    body: 'Trace the fault. Prove the path. Paste or edit a stack trace on the left — frames parse instantly with language, symbol, line, and parse confidence.',
  },
  {
    title: 'Map every frame',
    body: 'Open a frame’s candidate list and press Map. The route through the frozen 26-node code graph recomputes live on the right, connector by connector.',
  },
  {
    title: 'Bridge the wrapper',
    body: 'A tail wrapper frame (like format) may not be routable from the frame above it. Collapse the wrapper to bridge it out of the route — the unresolved frame stays reported, never hidden.',
  },
  {
    title: 'Prove and ship',
    body: 'Save up to two hypotheses, Compare them side by side, check the Minimal locus, scrub the route, annotate findings, then Copy or Download the session JSON.',
  },
];

const isEditableTarget = (el) => el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT');

function mappedFramesOf(frames) {
  return frames.filter((f) => f.mappedNode && !f.collapsed && f.type === 'frame');
}

function hypothesisScore(h) {
  return mappedFramesOf(h.frames).reduce((sum, f) => sum + (f.weight || 0), 0);
}

// ---------------------------------------------------------------------------
// Graph view: frozen 26-node code graph with the live route highlighted.
// ---------------------------------------------------------------------------
function GraphView() {
  const graph = useStore((s) => s.graph);
  const path = useStore((s) => s.path);
  const frames = useStore((s) => s.frames);
  const scrubIndex = useStore((s) => s.scrubIndex);
  const focus = useStore((s) => s.focus);
  const selection = useStore((s) => s.selection);
  const select = useStore((s) => s.select);

  const mapped = mappedFramesOf(frames);
  const mappedSet = new Set(mapped.map((f) => f.mappedNode));
  const scrubNode = scrubIndex !== null ? mapped[scrubIndex]?.mappedNode : null;
  const pathSet = new Set(path);
  const pathEdges = new Set();
  for (let i = 0; i < path.length - 1; i++) pathEdges.add(`${path[i]}->${path[i + 1]}`);
  const focusNodes = new Set(focus?.nodeIds || []);

  const pos = {};
  graph.nodes.forEach((n, i) => {
    pos[n.id] = { x: 55 + (i % 6) * 105 + (Math.floor(i / 6) % 2) * 30, y: 46 + Math.floor(i / 6) * 66 };
  });

  return (
    <div className="panel bg-gray-800 border border-gray-700 rounded p-2 sm:p-3">
      <h3 className="font-bold mb-1 text-sm sm:text-base">Code Graph</h3>
      <p className="text-gray-400 text-xs mb-2">Frozen graph — 26 nodes, 38 call/import edges. The committed route glows green; click a node to select it for annotation.</p>
      <svg
        viewBox="0 0 700 340"
        role="img"
        aria-label="Frozen 26-node code graph with the current route highlighted"
        className="w-full h-auto select-none"
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="19" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4b5563" />
          </marker>
          <marker id="arrow-route" viewBox="0 0 10 10" refX="19" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" />
          </marker>
        </defs>
        {graph.edges.map((e) => {
          const a = pos[e.source];
          const b = pos[e.target];
          const onRoute = pathEdges.has(`${e.source}->${e.target}`);
          return (
            <line
              key={`${e.source}-${e.target}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={onRoute ? '#34d399' : '#374151'}
              strokeWidth={onRoute ? 2.5 : 1}
              strokeOpacity={onRoute ? 1 : 0.55}
              className={onRoute ? 'route-edge' : undefined}
              markerEnd={onRoute ? 'url(#arrow-route)' : 'url(#arrow)'}
            />
          );
        })}
        {graph.nodes.map((n) => {
          const p = pos[n.id];
          const onPath = pathSet.has(n.id);
          const isMapped = mappedSet.has(n.id);
          const isScrub = scrubNode === n.id;
          const isFocus = focusNodes.has(n.id);
          const isSelected = selection?.type === 'node' && selection.id === n.id;
          return (
            <g
              key={n.id}
              onClick={() => select({ type: 'node', id: n.id })}
              className="cursor-pointer"
              role="button"
              aria-label={`Select node ${nodeLabel(n.id)}`}
            >
              <title>{`${n.id} — ${n.basename}:${n.symbol} (${n.language}, lines ${n.lineRange[0]}–${n.lineRange[1]})`}</title>
              <circle
                cx={p.x} cy={p.y} r={12}
                fill={onPath ? '#065f46' : '#1f2937'}
                stroke={isFocus ? '#f87171' : isScrub ? '#fbbf24' : isSelected ? '#93c5fd' : onPath ? '#34d399' : isMapped ? '#60a5fa' : '#4b5563'}
                strokeWidth={isFocus || isScrub || isSelected ? 3 : onPath ? 2 : 1.5}
                className="graph-node"
              />
              <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="7.5" fill="#e5e7eb" className="graph-label pointer-events-none">{n.id}</text>
              <text x={p.x} y={p.y + 24} textAnchor="middle" fontSize="8" fill="#94a3b8" className="graph-label pointer-events-none">{n.symbol}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route status, unresolved-frame result, minimal locus, and the scrubber.
// ---------------------------------------------------------------------------
function RoutePanel({ reduced }) {
  const store = useStore();
  const mapped = mappedFramesOf(store.frames);
  const scrubFrame = store.scrubIndex !== null ? mapped[store.scrubIndex] : null;

  useEffect(() => {
    if (scrubFrame?.mappedNode) {
      document.getElementById(`excerpt-${scrubFrame.mappedNode}`)?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    }
  }, [scrubFrame?.mappedNode, reduced]);

  return (
    <div className="mb-4">
      <h2 className="text-base sm:text-lg font-bold mb-2">Graph Route</h2>
      {store.path.length === 0 && store.valid ? (
        <div className="panel p-3 bg-gray-800 border border-gray-700 rounded text-gray-400 text-sm">
          No route yet — expand a frame on the left and press Map on a candidate to start committing the fault path.
        </div>
      ) : store.valid ? (
        <motion.div layout className="p-3 bg-green-900/20 border border-green-700 rounded text-green-400 text-sm" data-testid="route-valid">
          <div className="font-bold mb-1">Unique valid hypothesis</div>
          <div className="flex flex-wrap items-center gap-1" aria-label="Committed route">
            {store.path.map((n, i) => (
              <React.Fragment key={`${n}-${i}`}>
                {i > 0 && <span className="text-green-600" aria-hidden="true">→</span>}
                <motion.span layout className="px-1.5 py-0.5 bg-green-900/40 border border-green-700 rounded text-xs">{n}</motion.span>
              </React.Fragment>
            ))}
          </div>
          <div className="mt-2 text-xs text-green-300/90">
            {store.unresolved.length > 0 ? (
              <>Exact unresolved frame result: {store.unresolved.map((f) => `${f.id} — “${f.text}” (trace line ${f.originalLine + 1})`).join('; ')} — kept visible, excluded from the route.</>
            ) : (
              <>All frames resolved — no unresolved frames remain.</>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm" data-testid="route-invalid">
          <div className="font-bold mb-1">Invalid path — {store.contradictions.length} contradiction{store.contradictions.length === 1 ? '' : 's'}</div>
          <ul className="space-y-1">
            {store.contradictions.map((c, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="text-left text-xs underline decoration-dotted underline-offset-2 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-400 rounded px-1 py-1 min-h-[44px] sm:min-h-0 transition-colors"
                  onClick={() => store.setFocus({ frameIds: c.frameIds, nodeIds: c.nodeIds })}
                  title="Focus the frames and graph segment involved in this contradiction"
                >
                  {c.message}
                </button>
              </li>
            ))}
          </ul>
          {store.focus && (
            <div className="mt-2 text-xs text-red-300 border-t border-red-800 pt-2">
              Focused: frames {store.focus.frameIds.join(', ') || '—'}
              {store.focus.frameIds.length > 0 && (
                <> · evidence weights {store.focus.frameIds.map((id) => {
                  const f = store.frames.find((fr) => fr.id === id);
                  return f ? `${id}=${f.weight}` : id;
                }).join(', ')}</>
              )}
              <button type="button" className="ml-2 underline hover:text-red-200" onClick={() => store.setFocus(null)}>clear</button>
            </div>
          )}
        </div>
      )}

      {store.minimalLocus && (
        <motion.div layout className="mt-2 p-3 bg-sky-900/20 border border-sky-700 rounded text-sky-300 text-xs sm:text-sm" data-testid="minimal-locus">
          <span className="font-bold">Minimal locus</span> — lowest common enclosing symbol span:{' '}
          <span className="font-bold">{store.minimalLocus.file}</span> · {store.minimalLocus.symbol} · lines {store.minimalLocus.startLine}–{store.minimalLocus.endLine} · nodes {store.minimalLocus.nodeIds.join(', ')}
        </motion.div>
      )}

      {mapped.length > 0 && (
        <div className="mt-2 p-2 bg-gray-800 border border-gray-700 rounded panel">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">Scrub route</span>
            <button
              type="button"
              aria-label="Scrub to previous frame"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 active:scale-95 transition-all"
              onClick={() => store.scrubBy(-1)}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <label className="sr-only" htmlFor="scrubber">Scrub through mapped frames</label>
            <input
              id="scrubber"
              type="range"
              min="0"
              max={mapped.length - 1}
              value={store.scrubIndex ?? 0}
              onChange={(e) => store.setScrubIndex(parseInt(e.target.value, 10))}
              className="flex-1 accent-amber-400 cursor-pointer"
            />
            <button
              type="button"
              aria-label="Scrub to next frame"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 active:scale-95 transition-all"
              onClick={() => store.scrubBy(1)}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            <span className="text-xs text-amber-300 w-32 shrink-0 text-right">
              {scrubFrame ? `${scrubFrame.id} → ${scrubFrame.mappedNode} (${scrubFrame.symbol})` : 'not scrubbing'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hypothesis comparison table.
// ---------------------------------------------------------------------------
function ComparePanel() {
  const store = useStore();
  const [h1, h2] = store.hypotheses;
  if (!store.compareOpen || !h1 || !h2) return null;

  const frameIds = [...new Set([...h1.frames.map((f) => f.id), ...h2.frames.map((f) => f.id)])];
  const mappedOf = (h, id) => h.frames.find((f) => f.id === id)?.mappedNode || '—';
  const edgesOf = (h) => {
    const out = [];
    for (let i = 0; i < h.path.length - 1; i++) out.push(`${h.path[i]}→${h.path[i + 1]}`);
    return out;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="panel mt-2 p-3 bg-gray-800 border border-blue-700 rounded overflow-x-auto"
      data-testid="compare-panel"
    >
      <h4 className="font-bold text-sm mb-2 text-blue-300">Hypothesis comparison</h4>
      <table className="w-full text-xs border-collapse min-w-[420px]">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="text-left py-1 pr-2 font-normal">Dimension</th>
            <th className="text-left py-1 pr-2">{h1.name}</th>
            <th className="text-left py-1">{h2.name}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-700/60">
            <td className="py-1 pr-2 text-gray-400">Route valid</td>
            <td className={h1.valid ? 'text-green-400' : 'text-red-400'}>{h1.valid ? 'yes' : 'no'}</td>
            <td className={h2.valid ? 'text-green-400' : 'text-red-400'}>{h2.valid ? 'yes' : 'no'}</td>
          </tr>
          <tr className="border-b border-gray-700/60">
            <td className="py-1 pr-2 text-gray-400">Connector edges</td>
            <td className="pr-2">{edgesOf(h1).join(', ') || '—'}</td>
            <td>{edgesOf(h2).join(', ') || '—'}</td>
          </tr>
          <tr className="border-b border-gray-700/60">
            <td className="py-1 pr-2 text-gray-400">Evidence score</td>
            <td className="pr-2">{hypothesisScore(h1)}</td>
            <td>{hypothesisScore(h2)}</td>
          </tr>
          <tr className="border-b border-gray-700/60">
            <td className="py-1 pr-2 text-gray-400">Contradictions</td>
            <td className="pr-2">{h1.contradictions.length}</td>
            <td>{h2.contradictions.length}</td>
          </tr>
          {frameIds.map((id) => {
            const a = mappedOf(h1, id);
            const b = mappedOf(h2, id);
            const differs = a !== b;
            return (
              <tr key={id} className="border-b border-gray-700/40">
                <td className="py-1 pr-2 text-gray-400">Frame {id}</td>
                <td className={`pr-2 ${differs ? 'text-amber-300 font-bold' : ''}`}>{a}</td>
                <td className={differs ? 'text-amber-300 font-bold' : ''}>{b}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-gray-500 text-xs mt-2">Rows in amber differ between the two hypotheses.</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Annotations: attach notes to frames, nodes, route edges, or excerpts.
// ---------------------------------------------------------------------------
function AnnotationsPanel() {
  const store = useStore();
  const [text, setText] = useState('');
  const [target, setTarget] = useState('');

  const pathEdges = [];
  for (let i = 0; i < store.path.length - 1; i++) pathEdges.push(`${store.path[i]}->${store.path[i + 1]}`);

  const selectionValue = store.selection ? `${store.selection.type}:${store.selection.id}` : '';
  const effectiveTarget = target || selectionValue;

  const submit = () => {
    if (!effectiveTarget || !text.trim()) return;
    const [targetType, targetId] = effectiveTarget.split(':');
    store.addAnnotation({ targetType, targetId, text: text.trim() });
    setText('');
  };

  return (
    <div className="panel mt-4 p-3 bg-gray-800 border border-gray-700 rounded">
      <h3 className="font-bold mb-2 text-sm sm:text-base flex items-center gap-1"><StickyNote size={14} aria-hidden="true" /> Annotations</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="sr-only" htmlFor="annotation-target">Annotation target</label>
        <select
          id="annotation-target"
          className="bg-gray-900 border border-gray-600 rounded px-2 py-2 min-h-[44px] text-xs sm:w-52"
          value={effectiveTarget}
          onChange={(e) => setTarget(e.target.value)}
        >
          <option value="">Choose target…</option>
          <optgroup label="Frames">
            {store.frames.map((f) => <option key={f.id} value={`frame:${f.id}`}>{f.id} — {f.symbol || f.type}</option>)}
          </optgroup>
          <optgroup label="Graph nodes">
            {store.graph.nodes.map((n) => <option key={n.id} value={`node:${n.id}`}>{n.id} — {n.symbol}</option>)}
          </optgroup>
          {pathEdges.length > 0 && (
            <optgroup label="Route edges">
              {pathEdges.map((e) => <option key={e} value={`edge:${e}`}>{e.replace('->', ' → ')}</option>)}
            </optgroup>
          )}
          <optgroup label="Source excerpts">
            {store.graph.excerpts.map((e) => <option key={e.id} value={`excerpt:${e.id}`}>{e.id} — {e.node}</option>)}
          </optgroup>
        </select>
        <label className="sr-only" htmlFor="annotation-text">Annotation text</label>
        <input
          id="annotation-text"
          type="text"
          className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-2 min-h-[44px] text-xs"
          placeholder="e.g. suspect: retry loop swallows the real error"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        />
        <button
          type="button"
          className="px-3 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-500 rounded text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!effectiveTarget || !text.trim()}
          onClick={submit}
        >
          Annotate
        </button>
      </div>
      {store.annotations.length === 0 ? (
        <p className="text-gray-500 text-xs mt-2">No annotations yet — pick a frame, node, edge, or excerpt above (or click a graph node) and record what you learned.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          <AnimatePresence initial={false}>
            {store.annotations.map((a) => (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="flex items-center gap-2 text-xs bg-gray-900 border border-gray-700 rounded px-2 py-1"
              >
                <span className="text-amber-300 shrink-0">[{a.targetType} {a.targetId}]</span>
                <span className="flex-1 break-words">{a.text}</span>
                <button
                  type="button"
                  aria-label={`Delete annotation on ${a.targetType} ${a.targetId}`}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
                  onClick={() => store.deleteAnnotation(a.id)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// A single frame card in the stack spine.
// ---------------------------------------------------------------------------
function FrameCard({ frame, index, total }) {
  const store = useStore();
  const mapped = mappedFramesOf(store.frames);
  const isScrubbed = store.scrubIndex !== null && mapped[store.scrubIndex]?.id === frame.id;
  const isFocused = (store.focus?.frameIds || []).includes(frame.id);
  const isSelected = store.selection?.type === 'frame' && store.selection.id === frame.id;

  const tone = frame.type === 'noise'
    ? 'bg-gray-800 border-gray-600 text-gray-400'
    : frame.type === 'unresolved'
      ? 'bg-red-900/30 border-red-700'
      : 'bg-gray-800 border-gray-500';

  return (
    <motion.li
      layout
      tabIndex={0}
      aria-label={`Frame ${frame.id}, ${frame.type}${frame.isWrapper ? ', wrapper' : ''}`}
      onClick={() => store.select({ type: 'frame', id: frame.id })}
      onKeyDown={(e) => {
        if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); store.moveFrame(frame.id, -1); }
        if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); store.moveFrame(frame.id, 1); }
      }}
      className={`p-2 border rounded ${tone} ${isScrubbed ? 'ring-2 ring-amber-400' : ''} ${isFocused ? 'ring-2 ring-red-400' : ''} ${isSelected ? 'border-blue-400' : ''} focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 transition-shadow`}
    >
      <div className="flex justify-between items-center mb-1 gap-1 flex-wrap">
        <span className="font-bold text-xs">
          {frame.id} ({frame.type}){frame.isWrapper && <span className="ml-1 px-1 bg-purple-900/60 border border-purple-600 rounded text-purple-300">wrapper</span>}
          {typeof frame.confidence === 'number' && <span className="ml-1 text-gray-500 font-normal">conf {frame.confidence}%</span>}
        </span>
        <span className="flex gap-1 items-center">
          <button
            type="button"
            aria-label={`Move frame ${frame.id} up`}
            disabled={index === 0}
            className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 active:scale-95 disabled:opacity-30 transition-all"
            onClick={(e) => { e.stopPropagation(); store.moveFrame(frame.id, -1); }}
          >
            <ChevronUp size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Move frame ${frame.id} down`}
            disabled={index === total - 1}
            className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 active:scale-95 disabled:opacity-30 transition-all"
            onClick={(e) => { e.stopPropagation(); store.moveFrame(frame.id, 1); }}
          >
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          {frame.type !== 'noise' && (
            <button
              type="button"
              className="text-xs bg-gray-700 px-2 py-1 min-h-[44px] rounded hover:bg-gray-600 active:scale-95 transition-all"
              onClick={(e) => { e.stopPropagation(); store.toggleCollapse(frame.id); }}
              title={frame.isWrapper ? 'Collapse the wrapper to bridge it out of the route' : 'Collapse this frame out of the route'}
            >
              {frame.collapsed ? 'Expand' : frame.isWrapper ? 'Collapse wrapper' : 'Collapse'}
            </button>
          )}
          {(frame.type === 'frame' || (frame.type === 'noise' && frame.priorType)) && (
            <button
              type="button"
              className="text-xs bg-gray-700 px-2 py-1 min-h-[44px] rounded hover:bg-gray-600 active:scale-95 transition-all"
              onClick={(e) => { e.stopPropagation(); store.toggleNoise(frame.id); }}
            >
              {frame.type === 'noise' ? 'Restore' : 'Mark noise'}
            </button>
          )}
        </span>
      </div>
      <div className="text-xs break-words">{frame.text}</div>
      {frame.type === 'frame' && !frame.collapsed && (!frame.candidates || frame.candidates.length === 0) && (
        <div className="mt-1 text-xs text-amber-300/90">
          No deterministic candidate: {frame.basename ? `${frame.basename}:${frame.symbol} (${frame.language}, line ${frame.line})` : 'signals'} matches no graph node — likely a language or line-range mismatch. The frame stays visible as a diagnostic.
        </div>
      )}
      {frame.candidates && frame.candidates.length > 0 && !frame.collapsed && frame.type === 'frame' && (
        <div className="mt-2 pl-2 border-l border-blue-500">
          <div className="text-xs text-gray-400">Candidates:</div>
          {frame.candidates.map((c) => {
            const isRejected = (frame.rejected || []).includes(c.id);
            const isMapped = frame.mappedNode === c.id;
            return (
              <div key={c.id} className="flex justify-between items-center py-1 gap-1 flex-wrap">
                <span className={`text-xs ${isMapped ? 'text-green-400' : ''} ${isRejected ? 'line-through text-gray-600' : ''}`}>
                  {c.basename} : {c.symbol}
                </span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    disabled={isRejected}
                    className={`text-xs px-2 py-1 min-h-[44px] min-w-[44px] rounded transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${isMapped ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={(e) => { e.stopPropagation(); store.mapCandidate(frame.id, isMapped ? null : c.id); }}
                  >
                    {isMapped ? 'Mapped' : 'Map'}
                  </button>
                  <button
                    type="button"
                    className={`text-xs px-2 py-1 min-h-[44px] rounded transition-all active:scale-95 ${isRejected ? 'bg-red-900/60 text-red-300 border border-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={(e) => { e.stopPropagation(); store.rejectCandidate(frame.id, c.id); }}
                  >
                    {isRejected ? 'Rejected' : 'Reject'}
                  </button>
                </span>
              </div>
            );
          })}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs">Weight:</span>
            <label className="sr-only" htmlFor={`weight-${frame.id}`}>Evidence weight for frame {frame.id}</label>
            <input
              id={`weight-${frame.id}`}
              type="range"
              min="0"
              max="100"
              value={frame.weight}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-400"
              onChange={(e) => store.updateFrame(frame.id, { weight: parseInt(e.target.value, 10) })}
            />
            <span className="text-xs w-8 text-right">{frame.weight}</span>
          </div>
        </div>
      )}
    </motion.li>
  );
}

// ---------------------------------------------------------------------------
// Overlays: onboarding tour (non-blocking), shortcuts, save-hypothesis modal,
// toast.
// ---------------------------------------------------------------------------
function OnboardingCard() {
  const store = useStore();
  if (!store.onboardingOpen) return null;
  const step = ONBOARDING_STEPS[store.onboardingStep];
  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="fixed bottom-3 left-3 z-40 max-w-[calc(100vw-1.5rem)] sm:max-w-sm bg-gray-800 border border-blue-600 rounded-lg shadow-xl p-3"
      aria-label="Guided tour"
      data-testid="onboarding"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-sm text-blue-300 flex items-center gap-1"><Compass size={14} aria-hidden="true" /> {step.title}</h4>
        <button
          type="button"
          aria-label="Skip tour"
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white transition-colors -mt-1 -mr-1"
          onClick={store.dismissOnboarding}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <p className="text-xs text-gray-300 mt-1">{step.body}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="flex gap-1" aria-label={`Step ${store.onboardingStep + 1} of ${ONBOARDING_STEPS.length}`}>
          {ONBOARDING_STEPS.map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full transition-colors ${i === store.onboardingStep ? 'bg-blue-400' : 'bg-gray-600'}`} />
          ))}
        </span>
        <span className="flex gap-1">
          {store.onboardingStep > 0 && (
            <button type="button" className="text-xs px-2 py-1 min-h-[44px] bg-gray-700 rounded hover:bg-gray-600 transition-colors" onClick={() => store.setOnboardingStep(store.onboardingStep - 1)}>Back</button>
          )}
          {store.onboardingStep < ONBOARDING_STEPS.length - 1 ? (
            <button type="button" className="text-xs px-2 py-1 min-h-[44px] bg-blue-600 rounded hover:bg-blue-500 transition-colors" onClick={() => store.setOnboardingStep(store.onboardingStep + 1)}>Next</button>
          ) : (
            <button type="button" className="text-xs px-2 py-1 min-h-[44px] bg-blue-600 rounded hover:bg-blue-500 transition-colors" onClick={store.dismissOnboarding}>Done</button>
          )}
        </span>
      </div>
    </motion.aside>
  );
}

function ShortcutsModal() {
  const store = useStore();
  if (!store.shortcutsOpen) return null;
  const rows = [
    ['Alt + ↑ / ↓', 'Move the focused frame up or down the spine'],
    ['[ and ]', 'Scrub to the previous / next mapped frame'],
    ['Enter / click', 'Select a frame or graph node for annotation'],
    ['?', 'Open this shortcut reference'],
    ['Esc', 'Close dialogs'],
  ];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => store.setShortcutsOpen(false)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 p-4 rounded shadow-lg border border-gray-600 max-w-md w-full"
        role="dialog"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-bold flex items-center gap-1"><Keyboard size={16} aria-hidden="true" /> Keyboard shortcuts</h2>
          <button type="button" aria-label="Close shortcuts" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white transition-colors" onClick={() => store.setShortcutsOpen(false)}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <table className="w-full text-xs">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b border-gray-700/60">
                <td className="py-1.5 pr-3 whitespace-nowrap"><kbd className="px-1.5 py-0.5 bg-gray-900 border border-gray-600 rounded">{k}</kbd></td>
                <td className="py-1.5 text-gray-300">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-gray-500 text-xs mt-2">Full keyboard parity: every drag action has a button or key equivalent.</p>
      </motion.div>
    </div>
  );
}

function Toast() {
  const toast = useStore((s) => s.toast);
  return (
    <div role="status" aria-live="polite" className="fixed bottom-3 right-3 z-50">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={`px-3 py-2 rounded shadow-lg border text-xs sm:text-sm max-w-[calc(100vw-1.5rem)] sm:max-w-sm ${
              toast.tone === 'error' ? 'bg-red-900/90 border-red-600 text-red-200'
              : toast.tone === 'success' ? 'bg-green-900/90 border-green-600 text-green-200'
              : 'bg-gray-800 border-gray-600 text-gray-200'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App shell.
// ---------------------------------------------------------------------------
function App() {
  const store = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const prefersReduced = useReducedMotion();
  const reduced = store.reduceMotion || !!prefersReduced;

  useEffect(() => {
    if (store.frames.length === 0) store.setRawTrace(store.rawTrace);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) store.setEditorOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * store.fontScale}px`;
  }, [store.fontScale]);

  useEffect(() => {
    const onKey = (e) => {
      if (isEditableTarget(e.target)) return;
      const s = useStore.getState();
      if (e.key === '?') s.setShortcutsOpen(true);
      else if (e.key === '[') s.scrubBy(-1);
      else if (e.key === ']') s.scrubBy(1);
      else if (e.key === 'Escape') { s.setShortcutsOpen(false); setIsModalOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const buildPack = () => {
    const s = useStore.getState();
    return {
      schemaVersion: 'stack-path-hypothesis/v1',
      fixture: { id: s.graph.id, hash: hashString(JSON.stringify(s.graph)) },
      rawTrace: { text: s.rawTrace, hash: hashString(s.rawTrace) },
      rawTraceText: s.rawTrace,
      frames: s.frames,
      parseEdits: s.history.filter((h) => ['update_frame', 'reorder', 'reject', 'unreject'].includes(h.op)),
      weights: Object.fromEntries(s.frames.filter((f) => f.type === 'frame').map((f) => [f.id, f.weight])),
      path: s.path,
      hypotheses: s.hypotheses,
      annotations: s.annotations,
      viewport: s.viewport,
      selection: s.selection,
      history: s.history,
      derived: {
        valid: s.valid,
        contradictions: s.contradictions,
        unresolvedFrameIds: s.unresolved.map((f) => f.id),
        minimalLocus: s.minimalLocus,
        scoreChecksum: hashString(JSON.stringify(s.frames.map((f) => [f.id, f.weight, f.mappedNode]))),
        contradictionChecksum: hashString(JSON.stringify(s.contradictions.map((c) => c.message))),
        locusChecksum: hashString(JSON.stringify(s.minimalLocus)),
      },
      exportedAt: new Date().toISOString(),
    };
  };

  const handleExport = async (format) => {
    const text = JSON.stringify(buildPack(), null, 2);
    if (format === 'copy') {
      let copied = false;
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          copied = document.execCommand('copy');
          document.body.removeChild(ta);
        } catch {
          copied = false;
        }
      }
      store.showToast(copied ? 'Session JSON copied to clipboard.' : 'Clipboard unavailable — use Download instead.', copied ? 'success' : 'error');
    } else {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stack-path-hypothesis-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      store.showToast('StackPathHypothesisPack downloaded.', 'success');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.schemaVersion !== 'stack-path-hypothesis/v1') {
          store.showToast('Import failed: file is not a stack-path-hypothesis/v1 pack.', 'error');
          return;
        }
        store.importSession(data);
      } catch (err) {
        store.showToast(`Import failed: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const scrubMapped = mappedFramesOf(store.frames);
  const scrubNode = store.scrubIndex !== null ? scrubMapped[store.scrubIndex]?.mappedNode : null;
  const focusNodes = new Set(store.focus?.nodeIds || []);

  const iconBtn = 'px-3 py-2 min-h-[44px] rounded flex items-center gap-1 transition-all duration-200 motion-reduce:transition-none active:scale-95';

  return (
    <MotionConfig transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }} reducedMotion={reduced ? 'always' : 'never'}>
      <div className={`flex flex-col min-h-screen lg:h-screen lg:overflow-hidden bg-gray-900 text-gray-100 p-3 sm:p-4 font-mono text-sm ${store.highContrast ? 'theme-contrast' : ''} ${store.reduceMotion ? 'reduce-motion' : ''}`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-3 focus:py-2 focus:rounded">Skip to content</a>

        <header className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-gray-700">
          <div className="min-w-0">
            <h1 className="font-bold text-[clamp(1.05rem,2.5vw,1.35rem)] leading-tight">Stack-Trace Path Finder</h1>
            <p className="text-gray-500 text-xs">Trace the fault. Prove the path. Ship the locus.</p>
          </div>
          <div aria-live="polite" className="sr-only">
            {store.valid ? 'Path is valid' : `Path is invalid: ${store.contradictions.map((c) => c.message).join('; ')}`}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              aria-pressed={store.reduceMotion}
              title="Reduced motion: instant endpoints with identical final routes"
              className={`${iconBtn} text-xs border ${store.reduceMotion ? 'bg-amber-700/60 border-amber-500' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}
              onClick={store.toggleReduceMotion}
            >
              Motion: {store.reduceMotion ? 'reduced' : 'full'}
            </button>
            <button
              type="button"
              aria-pressed={store.highContrast}
              title="Toggle high-contrast color mode"
              className={`${iconBtn} text-xs border ${store.highContrast ? 'bg-amber-700/60 border-amber-500' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}
              onClick={store.toggleContrast}
            >
              Contrast: {store.highContrast ? 'high' : 'standard'}
            </button>
            <span className="flex border border-gray-600 rounded overflow-hidden" role="group" aria-label="Text size">
              <button type="button" aria-label="Decrease text size" className="px-3 py-2 min-h-[44px] bg-gray-800 hover:bg-gray-700 text-xs transition-colors" onClick={() => store.setFontScale(store.fontScale - 0.1)}>A−</button>
              <button type="button" aria-label="Increase text size" className="px-3 py-2 min-h-[44px] bg-gray-800 hover:bg-gray-700 text-xs border-l border-gray-600 transition-colors" onClick={() => store.setFontScale(store.fontScale + 0.1)}>A+</button>
            </span>
            <button type="button" aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)" className={`${iconBtn} bg-gray-800 border border-gray-600 hover:bg-gray-700 text-xs`} onClick={() => store.setShortcutsOpen(true)}>
              <Keyboard size={14} aria-hidden="true" />
            </button>
            <button type="button" title="Restart the guided tour" className={`${iconBtn} bg-gray-800 border border-gray-600 hover:bg-gray-700 text-xs`} onClick={store.restartOnboarding}>
              Tour
            </button>
            <button type="button" className={`${iconBtn} bg-blue-600 hover:bg-blue-500`} onClick={() => handleExport('copy')}>
              <Copy size={16} aria-hidden="true" /> Copy
            </button>
            <button type="button" className={`${iconBtn} bg-blue-600 hover:bg-blue-500`} onClick={() => handleExport('download')}>
              <Download size={16} aria-hidden="true" /> Download
            </button>
            <label className={`${iconBtn} bg-green-600 hover:bg-green-500 cursor-pointer`}>
              Import
              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            </label>
          </div>
        </header>

        <main id="main-content" className="flex flex-col lg:flex-row flex-1 lg:min-h-0 mt-3 gap-4 lg:overflow-hidden">
          {/* Left: trace editor + frame spine */}
          <section className="flex flex-col w-full lg:w-2/5 xl:w-1/3 lg:min-h-0 lg:border-r border-gray-700 lg:pr-4 lg:overflow-hidden" aria-label="Stack parsing workbench">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base sm:text-lg font-bold">Trace Editor</h2>
              <button
                type="button"
                aria-expanded={store.editorOpen}
                className="text-xs bg-gray-800 border border-gray-600 px-2 py-1 min-h-[44px] rounded hover:bg-gray-700 transition-colors"
                onClick={() => store.setEditorOpen(!store.editorOpen)}
              >
                {store.editorOpen ? 'Hide editor' : 'Show editor'}
              </button>
            </div>
            {store.rawTrace.trim() === '' && (
              <div className="text-red-400 text-xs mb-2 bg-red-900/20 p-2 rounded border border-red-700" role="alert">
                Error: Trace cannot be empty. Paste a stack trace above (e.g. lines like <code>File "main.py", line 12, in start_app</code>) to parse frames.
              </div>
            )}
            <AnimatePresence initial={false}>
              {store.editorOpen && (
                <motion.div
                  key="editor"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden shrink-0"
                >
                  <label className="sr-only" htmlFor="trace-input">Stack Trace</label>
                  <textarea
                    id="trace-input"
                    className="w-full h-28 sm:h-32 bg-gray-800 p-2 border border-gray-600 rounded text-xs sm:text-sm mb-3"
                    value={store.rawTrace}
                    onChange={(e) => store.setRawTrace(e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <ol className="flex-1 min-h-0 lg:overflow-y-auto space-y-2 lg:pr-2 pb-4 list-none" aria-label="Parsed frames, ordered">
              {store.frames.map((frame, idx) => (
                <FrameCard key={frame.id} frame={frame} index={idx} total={store.frames.length} />
              ))}
            </ol>
          </section>

          {/* Right: route, graph, excerpts, annotations, hypotheses */}
          <section className="flex flex-col flex-1 lg:min-h-0 lg:overflow-y-auto lg:pl-2 lg:pr-1 pb-4" aria-label="Route and analysis">
            <RoutePanel reduced={reduced} />
            <GraphView />

            <div className="panel mt-4 bg-gray-800 border border-gray-700 rounded p-3">
              <h3 className="font-bold mb-2 text-sm sm:text-base">Source Excerpts</h3>
              <div className="space-y-3">
                {store.graph.excerpts.filter((e) => store.path.includes(e.node)).map((e) => (
                  <div
                    key={e.id}
                    id={`excerpt-${e.node}`}
                    className={`p-2 bg-gray-900 rounded border transition-shadow ${scrubNode === e.node ? 'border-amber-400 ring-2 ring-amber-400/50' : focusNodes.has(e.node) ? 'border-red-500 ring-2 ring-red-500/40' : 'border-gray-700'}`}
                  >
                    <div className="text-xs text-gray-400 mb-1">{e.node} (Line {e.offset})</div>
                    <pre className="text-xs sm:text-[13px] text-green-300 overflow-x-auto">{e.text}</pre>
                  </div>
                ))}
                {store.path.length === 0 && (
                  <div className="text-gray-500 text-xs">Nothing to show yet — map candidates on the left and the excerpts along the committed route appear here, synchronized with the scrubber.</div>
                )}
              </div>
            </div>

            <AnnotationsPanel />

            <div className="mt-4 pt-4 border-t border-gray-700">
              <h3 className="font-bold mb-2 flex flex-wrap justify-between items-center gap-2 text-sm sm:text-base">
                Hypotheses <span className="text-gray-500 text-xs font-normal">(max 2 for comparison)</span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs bg-blue-600 px-2 py-1 min-h-[44px] rounded hover:bg-blue-500 transition-colors duration-200 motion-reduce:transition-none"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Save Current
                  </button>
                  <button
                    type="button"
                    aria-pressed={store.compareOpen}
                    disabled={store.hypotheses.length < 2}
                    className="text-xs px-2 py-1 min-h-[44px] rounded border transition-colors duration-200 motion-reduce:transition-none disabled:opacity-40 disabled:cursor-not-allowed bg-gray-800 border-gray-600 hover:bg-gray-700 aria-pressed:bg-blue-900/60 aria-pressed:border-blue-500"
                    onClick={store.toggleCompare}
                    title={store.hypotheses.length < 2 ? 'Save two hypotheses to enable comparison' : 'Compare the two saved hypotheses'}
                  >
                    {store.compareOpen ? 'Hide compare' : 'Compare'}
                  </button>
                </span>
              </h3>
              <div className="flex gap-2 flex-wrap">
                {store.hypotheses.map((h) => (
                  <div
                    key={h.id}
                    className={`flex items-center gap-1 p-1 pl-2 border rounded text-xs ${store.activeHypothesisId === h.id ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600 hover:bg-gray-800'} transition-colors`}
                  >
                    <button type="button" className="min-h-[44px] px-1" onClick={() => store.loadHypothesis(h.id)} title={`Load hypothesis ${h.name}`}>
                      {h.name} <span className={h.valid ? 'text-green-400' : 'text-red-400'}>({h.valid ? 'valid' : 'invalid'})</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete hypothesis ${h.name}`}
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
                      onClick={() => store.deleteHypothesis(h.id)}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {store.hypotheses.length === 0 && (
                  <div className="text-xs text-gray-500">No hypotheses saved yet. Map a route, then press “Save Current” and name it — save a second one to unlock side-by-side comparison.</div>
                )}
              </div>
              <AnimatePresence>{store.compareOpen && <ComparePanel />}</AnimatePresence>
            </div>
          </section>
        </main>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-800 p-4 rounded shadow-lg border border-gray-600 w-full max-w-sm"
                role="dialog"
                aria-label="Save hypothesis"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold mb-2">Save Hypothesis</h2>
                <label className="sr-only" htmlFor="hyp-name">Hypothesis name</label>
                <input
                  id="hyp-name"
                  type="text"
                  autoFocus
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 mb-4 text-white"
                  placeholder="Name…"
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && modalInput.trim()) {
                      store.saveHypothesis(modalInput.trim());
                      setIsModalOpen(false);
                      setModalInput('');
                    }
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button type="button" className="px-4 py-2 min-h-[44px] bg-gray-700 rounded hover:bg-gray-600 transition-colors" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button
                    type="button"
                    className="px-4 py-2 min-h-[44px] bg-blue-600 rounded hover:bg-blue-500 transition-colors"
                    onClick={() => {
                      if (modalInput.trim()) {
                        store.saveHypothesis(modalInput.trim());
                        setIsModalOpen(false);
                        setModalInput('');
                      }
                    }}
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>{store.shortcutsOpen && <ShortcutsModal />}</AnimatePresence>
        <AnimatePresence>{store.onboardingOpen && <OnboardingCard />}</AnimatePresence>
        <Toast />
      </div>
    </MotionConfig>
  );
}

export default App;
