import React, { useEffect, useMemo, useState, useRef } from 'react';

const SCHEMA_VERSION = 'icon-family-optical-studio-v1';
const ANCHOR_TYPES = ['move', 'line', 'quadratic', 'cubic', 'close'];
const MIN_ANCHORS = 3;
const UNDO_DEPTH = 50;

const initialAnchors = [
  { id: 'a1', x: 4, y: 4, type: 'move' },
  { id: 'a2', x: 20, y: 4, type: 'line' },
  { id: 'a3', x: 20, y: 20, type: 'line' },
  { id: 'a4', x: 4, y: 20, type: 'close' },
];
const seededIcons = [
  { id: 'outline', name: 'Outline', state: 'base', inherited: false },
  { id: 'filled', name: 'Filled', state: 'base', inherited: true },
  { id: 'hover', name: 'Hover', state: 'hover', inherited: true },
  { id: 'focus', name: 'Focus', state: 'focus', inherited: true },
];
const seededSvgSymbols = seededIcons.map((icon) => ({
  id: `icon-${icon.id}`,
  titleId: `icon-${icon.id}-title`,
  title: icon.name,
}));
const tools = [
  { name: 'editor_select', module: 'structured-editor-v1', description: 'Select an icon, anchor, path, constraint, variant, hint, or branch.' },
  { name: 'editor_add', module: 'structured-editor-v1', description: 'Add a bounded editor object.' },
  { name: 'editor_delete', module: 'structured-editor-v1', description: 'Delete a selected editor object.' },
  { name: 'editor_update_property', module: 'structured-editor-v1', description: 'Update an editor property.' },
  { name: 'editor_set_content', module: 'structured-editor-v1', description: 'Replace the current family content.' },
  { name: 'editor_switch_mode', module: 'structured-editor-v1', description: 'Switch between edit and preview modes.' },
  { name: 'editor_preview', module: 'structured-editor-v1', description: 'Preview the family at a requested size.' },
  { name: 'artifact_export', module: 'artifact-transfer-v1', description: 'Prepare a JSON, SVG, CSS, or Markdown artifact.' },
  { name: 'artifact_import', module: 'artifact-transfer-v1', description: 'Import a validated JSON family document.' },
];

const roundMil = (v) => Math.round(v * 1000) / 1000;
const clampCoord = (v) => Math.max(0, Math.min(24, roundMil(Number(v) || 0)));

function computeChecksum(list) {
  let h = 7;
  for (const a of list) {
    h = (h * 31 + Math.round((Number(a.x) || 0) * 1000)) % 65521;
    h = (h * 31 + Math.round((Number(a.y) || 0) * 1000)) % 65521;
    h = (h * 31 + (typeof a.type === 'string' ? a.type.length : 0)) % 65521;
  }
  return h.toString(16).padStart(4, '0').toUpperCase();
}

function nextAnchorId(list) {
  let max = 0;
  for (const a of list) {
    const m = /^a(\d+)$/.exec(a.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `a${max + 1}`;
}

function pathFrom(list, scale = 1, adjustment = 0) {
  if (!list || list.length === 0) return '';
  return list.map((a, index) => {
    const x = roundMil((a.x + adjustment) * scale);
    const y = roundMil((a.y + adjustment) * scale);
    // A path must open with a moveto command, whatever the first anchor's
    // declared segment type is (e.g. after the original move anchor is deleted).
    if (index === 0) return `M${x} ${y}`;
    if (a.type === 'move') return `M${x} ${y}`;
    if (a.type === 'line') return `L${x} ${y}`;
    if (a.type === 'quadratic') {
      const cx = roundMil(((a.cx ?? a.x - 1) + adjustment) * scale);
      const cy = roundMil(((a.cy ?? a.y) + adjustment) * scale);
      return `Q${cx} ${cy} ${x} ${y}`;
    }
    if (a.type === 'cubic') {
      const c1x = roundMil(((a.c1x ?? a.x - 1) + adjustment) * scale);
      const c1y = roundMil(((a.c1y ?? a.y) + adjustment) * scale);
      const c2x = roundMil(((a.c2x ?? a.x + 1) + adjustment) * scale);
      const c2y = roundMil(((a.c2y ?? a.y) + adjustment) * scale);
      return `C${c1x} ${c1y} ${c2x} ${c2y} ${x} ${y}`;
    }
    if (a.type === 'close') return `L${x} ${y} Z`;
    return '';
  }).join(' ');
}

function windingArea(anchors) {
  let area = 0;
  for (let i = 0; i < anchors.length; i += 1) {
    const current = anchors[i];
    const next = anchors[(i + 1) % anchors.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function validateSvgSymbols(symbols) {
  if (!Array.isArray(symbols) || symbols.length === 0) return 'SVG export requires at least one symbol';
  const symbolIds = new Set();
  const titleIds = new Set();
  for (const symbol of symbols) {
    if (!symbol?.id || !symbol?.titleId) return 'SVG symbol and title ids are required';
    if (symbolIds.has(symbol.id)) return `duplicate SVG symbol id ${symbol.id}`;
    if (titleIds.has(symbol.titleId)) return `duplicate SVG title id ${symbol.titleId}`;
    symbolIds.add(symbol.id);
    titleIds.add(symbol.titleId);
  }
  return null;
}

function buildSvgSprite(symbols, anchors) {
  const problem = validateSvgSymbols(symbols);
  if (problem) return { ok: false, error: problem };
  const path = generatePathData(anchors);
  const content = symbols.map((symbol) => (
    `<symbol id="${symbol.id}" viewBox="0 0 24 24" aria-labelledby="${symbol.titleId}">`
    + `<title id="${symbol.titleId}">${symbol.title}</title><path d="${path}"/></symbol>`
  )).join('');
  return { ok: true, artifact: `<svg xmlns="http://www.w3.org/2000/svg"><defs>${content}</defs></svg>` };
}

function generatePathData(anchors, size = 24) {
  return pathFrom(anchors, size / 24, 0);
}

// Directed dependency graph over equal constraints (target2 is derived from
// target1). Adding t1 → t2 creates a cycle when t1 is already reachable
// starting from t2.
function equalCycle(constraints, t1, t2) {
  const edges = new Map();
  for (const c of constraints) {
    if (c.kind !== 'equal' || !c.target1 || !c.target2) continue;
    if (!edges.has(c.target1)) edges.set(c.target1, []);
    edges.get(c.target1).push(c.target2);
  }
  const queue = [t2];
  const seen = new Set();
  while (queue.length) {
    const node = queue.pop();
    if (node === t1) return true;
    if (seen.has(node)) continue;
    seen.add(node);
    for (const next of edges.get(node) ?? []) queue.push(next);
  }
  return false;
}

// Returns null when valid, otherwise a human-readable rejection reason.
function validateFamilyDoc(doc) {
  if (!doc || typeof doc !== 'object') return 'Invalid family schema';
  if (doc.schemaVersion !== SCHEMA_VERSION) return 'Invalid family schema';
  if (!Array.isArray(doc.anchors)) return 'Invalid family schema';
  if (doc.anchors.length < MIN_ANCHORS) return `anchors must contain at least ${MIN_ANCHORS} points`;
  const ids = new Set();
  for (const a of doc.anchors) {
    if (!a || typeof a.id !== 'string') return 'anchor missing id';
    if (ids.has(a.id)) return `duplicate anchor id ${a.id}`;
    ids.add(a.id);
    if (typeof a.x !== 'number' || typeof a.y !== 'number' || Number.isNaN(a.x) || Number.isNaN(a.y)) return `invalid coordinates on ${a.id}`;
    if (a.x < 0 || a.x > 24 || a.y < 0 || a.y > 24) return `coordinate out of bounds on ${a.id} (0–24 grid)`;
    if (!ANCHOR_TYPES.includes(a.type)) return `invalid segment type on ${a.id}`;
    if (a.type === 'quadratic') {
      if (![a.cx, a.cy].every(Number.isFinite)) return `quadratic anchor ${a.id} requires a finite control handle`;
      if (a.cx === a.x && a.cy === a.y) return `zero-length quadratic handle on ${a.id}`;
    }
    if (a.type === 'cubic') {
      if (![a.c1x, a.c1y, a.c2x, a.c2y].every(Number.isFinite)) return `cubic anchor ${a.id} requires two finite control handles`;
      if ((a.c1x === a.x && a.c1y === a.y) || (a.c2x === a.x && a.c2y === a.y)) return `zero-length cubic handle on ${a.id}`;
    }
  }
  if (doc.anchors[0].type !== 'move') return 'open path recovery: first anchor must be move';
  if (doc.anchors.at(-1).type !== 'close' || doc.anchors.slice(0, -1).some((a) => a.type === 'close')) {
    return 'closed path recovery: exactly the final anchor must close the path';
  }
  const area = windingArea(doc.anchors);
  if (area === 0) return 'winding recovery: path area must be non-zero';
  if (area < 0) return 'winding recovery: outer path must use clockwise screen-space winding';
  if (typeof doc.checksum === 'string' && doc.checksum !== computeChecksum(doc.anchors)) {
    return 'forged checksum — geometry does not match';
  }
  if (doc.constraints !== undefined) {
    if (!Array.isArray(doc.constraints)) return 'constraints must be an array';
    for (const c of doc.constraints) {
      if (c.kind !== 'equal' || !c.target1 || !c.target2) continue;
      if (c.target1 === c.target2) return `constraint cycle: ${c.target1} constrained to itself`;
      const others = doc.constraints.filter((o) => o !== c);
      if (equalCycle(others, c.target1, c.target2)) return `constraint cycle between ${c.target1} and ${c.target2}`;
    }
  }
  if (doc.svgSymbols !== undefined) {
    const svgProblem = validateSvgSymbols(doc.svgSymbols);
    if (svgProblem) return svgProblem;
  }
  return null;
}

// Procedural 1,000-icon / 100,000-point stress family for the scale workflow.
function makeStressFamily() {
  const icons = [];
  for (let i = 0; i < 1000; i += 1) {
    const points = [];
    const lobes = 2 + (i % 7);
    for (let k = 0; k < 100; k += 1) {
      const angle = (k / 100) * Math.PI * 2;
      const radius = 7.5 + 3 * Math.sin(angle * lobes + i * 0.13);
      points.push({
        x: roundMil(12 + radius * Math.cos(angle)),
        y: roundMil(12 + radius * Math.sin(angle)),
        type: k === 0 ? 'move' : k === 99 ? 'close' : 'line',
      });
    }
    icons.push({ id: `stress-${i}`, name: `Icon ${String(i).padStart(4, '0')}`, points });
  }
  return { icons, pointTotal: 100000, branchTotal: 1000, sizes: Array.from({ length: 20 }, (_, n) => 14 + n * 2) };
}

const STRESS_ITEM_HEIGHT = 46;

function App() {
  const [mode, setMode] = useState('edit');
  const [selectedIcon, setSelectedIcon] = useState('outline');
  const [anchors, setAnchors] = useState(initialAnchors);
  const [selectedAnchor, setSelectedAnchor] = useState('a1');
  const [size, setSize] = useState(24);
  const [lens, setLens] = useState('geometric center');
  const [branch, setBranch] = useState('main');
  const [status, setStatus] = useState('Ready to shape a coherent family.');
  const [importText, setImportText] = useState('');

  const [constraints, setConstraints] = useState([{ id: 'c1', kind: 'align', value: 'keyline-box' }]);
  const [constraintFrom, setConstraintFrom] = useState('a1');
  const [constraintTo, setConstraintTo] = useState('a2');
  const [hints, setHints] = useState([16, 20, 24, 32].map((pixelSize) => ({ size: pixelSize, adjustment: 0 })));
  const [overrides, setOverrides] = useState({});
  const [branchAnchors, setBranchAnchors] = useState(null);
  const [compareDiff, setCompareDiff] = useState(false);
  const [approval, setApproval] = useState({ approved: false, checksum: null });
  const [solveGhost, setSolveGhost] = useState(null);
  const [past, setPast] = useState([]);

  // Scale stress-test state (AC-09): 1,000 icons / 100,000 points / 20 sizes /
  // 1,000 branches, with cancellation of stale preview/solver jobs.
  const [stress, setStress] = useState(null);
  const [stressSel, setStressSel] = useState({ icon: 0, branch: 1 });
  const [stressScroll, setStressScroll] = useState(0);
  const [stressJob, setStressJob] = useState({ done: 0, canceled: 0, last: 'no preview job yet' });
  const jobRef = useRef(0);

  const canvasRef = useRef(null);

  const currentAnchors = (branch === 'optical-pass' && branchAnchors) ? branchAnchors : anchors;
  const currentIconData = seededIcons.find((i) => i.id === selectedIcon);

  const displayedAnchors = currentIconData?.inherited && overrides[selectedIcon]
    ? overrides[selectedIcon]
    : currentAnchors;

  const selected = displayedAnchors.find((anchor) => anchor.id === selectedAnchor) ?? displayedAnchors[0];

  const checksum = computeChecksum(currentAnchors);
  const approvalStale = approval.approved && approval.checksum !== checksum;

  const documentState = useMemo(() => ({
    schemaVersion: SCHEMA_VERSION,
    mode,
    selectedIcon,
    size,
    lens,
    branch,
    icons: seededIcons,
    anchors: currentAnchors,
    constraints,
    hints,
    overrides,
    checksum: computeChecksum(currentAnchors),
    approval,
    svgSymbols: seededSvgSymbols,
  }), [mode, selectedIcon, size, lens, branch, currentAnchors, constraints, hints, overrides, approval]);

  // ---- undo history ---------------------------------------------------------
  const snapshot = () => ({ anchors, branchAnchors, overrides, constraints, hints, approval });
  const pushHistory = () => {
    const snap = snapshot();
    setPast((p) => [...p.slice(-(UNDO_DEPTH - 1)), snap]);
  };
  const undo = () => {
    setPast((p) => {
      if (p.length === 0) {
        setStatus('Nothing to undo.');
        return p;
      }
      const prev = p[p.length - 1];
      setAnchors(prev.anchors);
      setBranchAnchors(prev.branchAnchors);
      setOverrides(prev.overrides);
      setConstraints(prev.constraints);
      setHints(prev.hints);
      setApproval(prev.approval);
      setSolveGhost(null);
      setStatus('Undid last change.');
      return p.slice(0, -1);
    });
  };

  // ---- shared mutation core (used by both the UI and WebMCP handlers) -------
  const writeAnchors = (updateFn) => {
    if (currentIconData?.inherited && overrides[selectedIcon]) {
      setOverrides((prev) => ({ ...prev, [selectedIcon]: updateFn(prev[selectedIcon]) }));
    } else if (branch === 'optical-pass' && branchAnchors) {
      setBranchAnchors((prev) => updateFn(prev));
    } else {
      setAnchors(updateFn);
    }
  };

  const updateAnchor = (id, updates, { record = true } = {}) => {
    const next = { ...updates };
    if (next.x !== undefined) next.x = clampCoord(next.x);
    if (next.y !== undefined) next.y = clampCoord(next.y);
    if (next.type !== undefined && !ANCHOR_TYPES.includes(next.type)) delete next.type;
    const existing = displayedAnchors.find((anchor) => anchor.id === id);
    if (next.type === 'quadratic' && existing) {
      next.cx = clampCoord(existing.x - 1);
      next.cy = existing.y;
    }
    if (next.type === 'cubic' && existing) {
      next.c1x = clampCoord(existing.x - 1);
      next.c1y = existing.y;
      next.c2x = clampCoord(existing.x + 1);
      next.c2y = existing.y;
    }
    if (record) pushHistory();
    const updateFn = (items) => items.map((a) => (a.id === id ? { ...a, ...next } : a));
    if (currentIconData?.inherited && !overrides[selectedIcon]) {
      // First edit of an inherited variant declares an override with provenance
      // from the base geometry.
      setOverrides((prev) => ({ ...prev, [selectedIcon]: updateFn(currentAnchors) }));
    } else {
      writeAnchors(updateFn);
    }
    return next;
  };

  const addAnchor = () => {
    pushHistory();
    const id = nextAnchorId(displayedAnchors);
    const newAnchor = { id, x: 12, y: 12, type: 'line' };
    writeAnchors((items) => [...items, newAnchor]);
    setStatus(`Inserted anchor ${id}.`);
    return id;
  };

  const deleteAnchor = (id) => {
    if (displayedAnchors.length <= MIN_ANCHORS) {
      const message = `Delete blocked: an icon keeps at least ${MIN_ANCHORS} anchors. Recovery: insert an anchor before deleting.`;
      setStatus(message);
      return { ok: false, error: message };
    }
    pushHistory();
    writeAnchors((items) => items.filter((item) => item.id !== id));
    setStatus(`Deleted anchor ${id}.`);
    return { ok: true };
  };

  const importDoc = (raw) => {
    let doc;
    try {
      doc = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (error) {
      return { ok: false, error: error.message };
    }
    const problem = validateFamilyDoc(doc);
    if (problem) return { ok: false, error: problem };
    pushHistory();
    setAnchors(doc.anchors);
    setBranchAnchors(null);
    setBranch('main');
    setCompareDiff(false);
    setSolveGhost(null);
    if (doc.constraints) setConstraints(doc.constraints);
    if (doc.hints) setHints(doc.hints);
    if (doc.overrides) setOverrides(doc.overrides);
    if (doc.approval) setApproval(doc.approval);
    setStatus('Imported validated family document.');
    return { ok: true };
  };

  // ---- WebMCP surface -------------------------------------------------------
  const invokeToolImpl = async (name, args = {}) => {
    const input = typeof args === 'string' ? JSON.parse(args) : args;
    if (name === 'editor_select') {
      if (input.id) { setSelectedAnchor(input.id); setStatus(`Selected ${input.id}`); }
      return { ok: true, selected: input.id ?? selectedIcon };
    }
    if (name === 'editor_update_property') {
      const id = input.id ?? selectedAnchor;
      const key = input.property ?? input.key;
      if (!['x', 'y', 'type'].includes(key)) return { ok: false, error: 'property must be x, y, or type' };
      const cleaned = updateAnchor(id, { [key]: input.value });
      return { ok: true, id, property: key, value: cleaned[key] };
    }
    if (name === 'editor_switch_mode') { setMode(input.mode === 'preview' ? 'preview' : 'edit'); setSolveGhost(null); return { ok: true, mode: input.mode }; }
    if (name === 'editor_preview') {
      const nextSize = Math.max(16, Math.min(32, Number(input.size) || 24));
      setSize(nextSize);
      setMode('preview');
      return { ok: true, size: nextSize };
    }
    if (name === 'editor_set_content') {
      const result = importDoc(input.content ?? input.document ?? input.value);
      return result;
    }
    if (name === 'artifact_export') {
      const format = input.format ?? 'json';
      if (format === 'json') return { ok: true, format, artifact: JSON.stringify(documentState, null, 2) };
      if (format === 'svg') {
        const exported = buildSvgSprite(documentState.svgSymbols, displayedAnchors);
        return exported.ok ? { ...exported, format } : exported;
      }
      if (format === 'css') return { ok: true, format, artifact: ':root { --icon-grid: 24px; }' };
      return { ok: true, format, artifact: '# Icon Family Optical Studio\n\nApproved family specification.' };
    }
    if (name === 'artifact_import') {
      return importDoc(input.document ?? input.content ?? '{}');
    }
    if (name === 'editor_add') {
      const id = addAnchor();
      return { ok: true, id };
    }
    if (name === 'editor_delete') {
      return deleteAnchor(input.id ?? selectedAnchor);
    }
    return { ok: false, error: `unknown tool ${name}` };
  };

  const invokeRef = useRef(invokeToolImpl);
  invokeRef.current = invokeToolImpl;

  useEffect(() => {
    window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', modules: ['structured-editor-v1', 'artifact-transfer-v1'] });
    window.webmcp_list_tools = () => ({ tools });
    window.webmcp_invoke_tool = (name, args = {}) => invokeRef.current(name, args);
    return () => { delete window.webmcp_session_info; delete window.webmcp_list_tools; delete window.webmcp_invoke_tool; };
  }, []);

  // ---- pointer + keyboard editing ------------------------------------------
  const handlePointerDown = (e, id) => {
    if (mode === 'preview' || stress) return;
    setSelectedAnchor(id);
    const svg = canvasRef.current;
    if (!svg) return;
    pushHistory();
    setSolveGhost(null);
    const pt = svg.createSVGPoint();
    const move = (ev) => {
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      updateAnchor(id, { x: Math.round(svgP.x), y: Math.round(svgP.y) }, { record: false });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const handleKeyDown = (e, id) => {
    if (mode === 'preview' || stress) return;
    const a = displayedAnchors.find((x) => x.id === id);
    if (!a) return;
    const step = e.shiftKey ? 0.1 : 1;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowUp') dy = -step;
    if (e.key === 'ArrowDown') dy = step;
    if (e.key === 'ArrowLeft') dx = -step;
    if (e.key === 'ArrowRight') dx = step;
    if (e.key === 'Enter' || e.key === ' ') {
      setSelectedAnchor(id);
      e.preventDefault();
      return;
    }
    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      updateAnchor(id, { x: a.x + dx, y: a.y + dy });
    }
  };

  // ---- transforms, constraints, variants, hints -----------------------------
  const applyMirror = () => {
    pushHistory();
    setSolveGhost(pathFrom(displayedAnchors, mode === 'preview' ? size / 24 : 1));
    const updateFn = (items) => items.map((a) => ({ ...a, x: roundMil(24 - a.x) }));
    if (currentIconData?.inherited && !overrides[selectedIcon]) {
      setOverrides((prev) => ({ ...prev, [selectedIcon]: updateFn(currentAnchors) }));
    } else {
      writeAnchors(updateFn);
    }
    setStatus('Mirror transform applied around x=12. Before/after outlines shown.');
  };

  const addEqualConstraint = () => {
    const t1 = constraintFrom;
    const t2 = constraintTo;
    if (t1 === t2) {
      setStatus(`Constraint solver rejected: ${t1} cannot be constrained to itself (self-cycle).`);
      return;
    }
    const duplicate = constraints.some((c) => c.kind === 'equal'
      && ((c.target1 === t1 && c.target2 === t2) || (c.target1 === t2 && c.target2 === t1)));
    if (duplicate) {
      setStatus(`Constraint solver rejected: ${t1} and ${t2} are already constrained — overdetermined.`);
      return;
    }
    if (equalCycle(constraints, t1, t2)) {
      setStatus(`Constraint solver rejected: cycle detected (${t2} already resolves back to ${t1}).`);
      return;
    }
    const source = displayedAnchors.find((a) => a.id === t1);
    const target = displayedAnchors.find((a) => a.id === t2);
    if (!source || !target) {
      setStatus('Constraint solver rejected: both anchors must exist on the current path.');
      return;
    }
    pushHistory();
    setSolveGhost(pathFrom(displayedAnchors, mode === 'preview' ? size / 24 : 1));
    setConstraints((prev) => [...prev, { id: `c${prev.length + 1}`, kind: 'equal', target1: t1, target2: t2 }]);
    updateAnchor(t2, { x: source.x, y: source.y }, { record: false });
    setStatus(`Equal constraint solved: ${t2} snapped to ${t1}. Before/after outlines shown.`);
  };

  const resetVariant = () => {
    if (!currentIconData?.inherited) return;
    pushHistory();
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[selectedIcon];
      return next;
    });
    setStatus(`Variant override reset — ${currentIconData.name} matches base geometry again.`);
  };

  const cycleSizeHint = (pxSize) => {
    pushHistory();
    setHints((prev) => prev.map((h) => {
      if (h.size !== pxSize) return h;
      const nextAdjustment = h.adjustment === 0 ? 0.5 : h.adjustment === 0.5 ? -0.5 : 0;
      return { ...h, adjustment: nextAdjustment };
    }));
    const current = hints.find((h) => h.size === pxSize);
    const nextAdjustment = current?.adjustment === 0 ? '+0.5' : current?.adjustment === 0.5 ? '-0.5' : '0';
    setStatus(`Hint for ${pxSize}px set to ${nextAdjustment} design units (master geometry unchanged).`);
  };

  // ---- branches -------------------------------------------------------------
  const createOrSwitchBranch = () => {
    setSolveGhost(null);
    if (branch === 'main') {
      if (!branchAnchors) {
        setBranchAnchors(anchors.map((a) => ({ ...a })));
        setStatus('Branch optical-pass created from main.');
      } else {
        setStatus('Switched to branch optical-pass.');
      }
      setBranch('optical-pass');
    } else {
      setBranch('main');
      setCompareDiff(false);
      setStatus('Switched to main.');
    }
  };

  const compareBranch = () => {
    if (!branchAnchors) {
      setStatus('Create a branch first, then compare it against main.');
      return;
    }
    if (branch !== 'optical-pass') setBranch('optical-pass');
    setCompareDiff((v) => {
      setStatus(v ? 'Branch diff overlay hidden.' : 'Branch diff overlay: dashed main vs solid optical-pass.');
      return !v;
    });
  };

  const mergeBranch = () => {
    if (branch === 'optical-pass' && branchAnchors) {
      pushHistory();
      setAnchors(branchAnchors);
      setBranch('main');
      setBranchAnchors(null);
      setCompareDiff(false);
      setStatus('Branch optical-pass merged to main.');
    }
  };

  const approveFamily = () => {
    setApproval({ approved: true, checksum });
    setStatus(`Family approved. Checksum ${checksum} frozen.`);
  };

  // ---- transfer -------------------------------------------------------------
  const exportJson = () => {
    const link = document.createElement('a');
    link.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(documentState, null, 2))}`;
    link.download = 'icon-family-optical-studio.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatus('Exported family JSON.');
  };

  const importJson = () => {
    const result = importDoc(importText);
    if (!result.ok) setStatus(`Import error: ${result.error}`);
  };

  const copyPathData = () => {
    const write = navigator.clipboard?.writeText?.(pathD);
    if (write?.then) {
      write.then(
        () => setStatus('Path data copied to clipboard.'),
        () => setStatus('Clipboard unavailable — path data shown in the footer.'),
      );
    } else {
      setStatus('Clipboard unavailable — path data shown in the footer.');
    }
  };

  // ---- stress-test workflow (AC-09) ----------------------------------------
  const startStress = () => {
    const family = makeStressFamily();
    setStress(family);
    setStressSel({ icon: 0, branch: 1 });
    setStatus('Stress family loaded: 1,000 icons · 100,000 points · 20 sizes · 1,000 branches.');
  };

  const exitStress = () => {
    jobRef.current += 1;
    setStress(null);
    setStatus('Stress test closed — back to the seeded fixture.');
  };

  useEffect(() => {
    if (!stress) return undefined;
    const id = jobRef.current + 1;
    jobRef.current = id;
    let index = 0;
    let occupied = 0;
    let cancelTimer = null;
    let finished = false;
    const step = () => {
      if (jobRef.current !== id) return;
      const end = Math.min(index + 25, stress.icons.length);
      for (; index < end; index += 1) {
        for (const p of stress.icons[index].points) {
          if (p.x > 4 && p.x < 20 && p.y > 4 && p.y < 20) occupied += 1;
        }
      }
      if (index < stress.icons.length) {
        cancelTimer = setTimeout(step, 0);
      } else {
        finished = true;
        setStressJob((j) => ({
          ...j,
          done: j.done + 1,
          last: `preview job #${id} done — occupancy ${((occupied / stress.pointTotal) * 100).toFixed(1)}% across 100,000 points`,
        }));
      }
    };
    cancelTimer = setTimeout(step, 0);
    return () => {
      clearTimeout(cancelTimer);
      if (!finished) {
        setStressJob((j) => ({ ...j, canceled: j.canceled + 1, last: `preview job #${id} canceled (stale)` }));
      }
    };
  }, [stress, stressSel.icon, stressSel.branch, size]);

  const stressIcon = stress ? stress.icons[stressSel.icon] : null;
  const stressAnchors = useMemo(() => {
    if (!stressIcon) return null;
    const spin = (stressSel.branch / 1000) * 0.6;
    const cos = Math.cos(spin);
    const sin = Math.sin(spin);
    return stressIcon.points.map((p) => ({
      ...p,
      x: clampCoord(12 + (p.x - 12) * cos - (p.y - 12) * sin),
      y: clampCoord(12 + (p.x - 12) * sin + (p.y - 12) * cos),
    }));
  }, [stressIcon, stressSel.branch]);

  // ---- render-time geometry -------------------------------------------------
  let activeAdjustment = 0;
  if (mode === 'preview') {
    const hint = hints.find((h) => h.size === size);
    if (hint) activeAdjustment = hint.adjustment;
  }
  const displaySize = mode === 'preview' ? size : 24;
  const scale = mode === 'preview' ? size / 24 : 1;
  const renderedAnchors = stress ? stressAnchors : displayedAnchors;
  const pathD = renderedAnchors && renderedAnchors.length > 0
    ? pathFrom(renderedAnchors, scale, activeAdjustment)
    : 'M4 4H20V20H4Z';

  const showDiff = !stress && compareDiff && branch === 'optical-pass' && branchAnchors;
  const mainPathD = showDiff ? pathFrom(anchors, scale) : null;
  const changedAnchorIds = useMemo(() => {
    if (!showDiff) return new Set();
    const byId = new Map(anchors.map((a) => [a.id, a]));
    const changed = new Set();
    for (const b of branchAnchors) {
      const base = byId.get(b.id);
      if (!base || base.x !== b.x || base.y !== b.y || base.type !== b.type) changed.add(b.id);
    }
    for (const a of anchors) {
      if (!branchAnchors.some((b) => b.id === a.id)) changed.add(a.id);
    }
    return changed;
  }, [showDiff, anchors, branchAnchors]);

  const sizeOptions = stress ? stress.sizes : [16, 20, 24, 32];
  const stressStart = Math.max(0, Math.floor(stressScroll / STRESS_ITEM_HEIGHT) - 2);
  const stressVisible = stress ? stress.icons.slice(stressStart, stressStart + 10) : [];

  return <div className="studio-shell">
    <header className="topbar">
      <div>
        <p className="eyebrow">VECTOR SYSTEMS / 04</p>
        <h1>Icon Family Optical Studio</h1>
        <p className="lede">Design one coherent family across geometry, states, and pixel sizes.</p>
      </div>
      <div className="top-actions">
        <button onClick={undo}>Undo</button>
        <button onClick={() => { setMode(mode === 'edit' ? 'preview' : 'edit'); setSolveGhost(null); }}>{mode === 'edit' ? 'Preview family' : 'Back to editor'}</button>
        <button className="primary" onClick={exportJson}>Export JSON</button>
      </div>
    </header>
    <main className="workspace">
      <aside className="family-rail">
        <div className="rail-title">
          <span>FAMILY / {seededIcons.length}</span>
          <button aria-label="Create branch" onClick={createOrSwitchBranch}>＋</button>
        </div>
        {seededIcons.map((icon) => (
          <button
            className={`icon-card ${selectedIcon === icon.id ? 'selected' : ''}`}
            key={icon.id}
            onClick={() => { setSelectedIcon(icon.id); setStatus(`${icon.name} selected.`); }}
          >
            <span className="mini-icon">⌗</span>
            <span>
              <strong>{icon.name}</strong>
              <small>{icon.inherited ? 'inherits outline' : 'base geometry'}</small>
            </span>
            <span className="state-dot" data-state={icon.state} />
          </button>
        ))}
        <div className="branch-card">
          <span>BRANCH</span><strong>{branch}</strong>
          <button onClick={compareBranch}>{compareDiff ? 'Hide diff' : 'Compare branch'}</button>
          {branch === 'optical-pass' && <button onClick={mergeBranch}>Merge to main</button>}
        </div>
        <div className="branch-card">
          <span>APPROVAL</span>
          <strong>{approval.approved ? (approvalStale ? 'stale' : `frozen ${approval.checksum}`) : 'pending'}</strong>
          <button onClick={approveFamily}>{approvalStale ? 'Re-approve family' : 'Approve Family'}</button>
        </div>
        <div className="branch-card">
          <span>SCALE STRESS TEST</span>
          {!stress ? (
            <button onClick={startStress}>Load 1,000 icons / 100k points</button>
          ) : (
            <>
              <small className="stress-stats">1,000 icons · 100,000 points · 20 sizes · 1,000 branches</small>
              <div className="stress-list" onScroll={(e) => setStressScroll(e.currentTarget.scrollTop)}>
                <div style={{ height: `${stress.icons.length * STRESS_ITEM_HEIGHT}px`, position: 'relative' }}>
                  {stressVisible.map((icon, offset) => {
                    const index = stressStart + offset;
                    return (
                      <button
                        key={icon.id}
                        className={`stress-item ${stressSel.icon === index ? 'selected' : ''}`}
                        style={{ top: `${index * STRESS_ITEM_HEIGHT}px` }}
                        onClick={() => setStressSel((s) => ({ ...s, icon: index }))}
                      >
                        {icon.name} · 100 pts
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="stress-branch">Branch {stressSel.branch}/1000
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={stressSel.branch}
                  onChange={(e) => setStressSel((s) => ({ ...s, branch: Math.max(1, Math.min(1000, Number(e.target.value) || 1)) }))}
                />
              </label>
              <div className="inspector-actions">
                <button onClick={() => setStressSel((s) => ({ ...s, branch: Math.max(1, s.branch - 1) }))}>Prev</button>
                <button onClick={() => setStressSel((s) => ({ ...s, branch: Math.min(1000, s.branch + 1) }))}>Next</button>
              </div>
              <button onClick={exitStress}>Exit stress test</button>
            </>
          )}
        </div>
      </aside>
      <section className="canvas-column">
        <div className="canvas-toolbar">
          <span className="pill">{mode.toUpperCase()}</span>
          <label>Pixel preview
            <select value={size} onChange={(event) => {
              setSize(Number(event.target.value));
              if (mode !== 'preview') setMode('preview');
            }}>
              {sizeOptions.map((value) => <option key={value} value={value}>{value}px</option>)}
            </select>
          </label>
          <label>Lens
            <select value={lens} onChange={(event) => setLens(event.target.value)}>
              <option value="geometric center">geometric center</option>
              <option value="occupied bounds">occupied bounds</option>
              <option value="stroke distribution">stroke distribution</option>
              <option value="side bearings">side bearings</option>
            </select>
          </label>
        </div>
        <div className="canvas-card">
          <div className="canvas-heading">
            <div>
              <span className="eyebrow">
                {stress
                  ? `${stressIcon?.name} / branch ${stressSel.branch}`
                  : `${selected?.id ?? 'a1'} / ${selectedIcon} · ${selected ? `${selected.x}, ${selected.y}` : ''}`}
              </span>
              <h2>{displaySize} × {displaySize} construction grid</h2>
            </div>
            <span className="checksum">
              CHECKSUM / {checksum}
              {approval.approved && <em className={`approval-badge ${approvalStale ? 'stale' : ''}`}>{approvalStale ? 'APPROVAL STALE' : 'APPROVED'}</em>}
            </span>
          </div>
          <div className="vector-canvas" role="application" aria-label="Vector anchor editor">
            <div className="keyline" />

            {lens === 'geometric center' && (
              <>
                <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: 'rgba(0,0,255,0.3)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '0', width: '1px', background: 'rgba(0,0,255,0.3)', pointerEvents: 'none' }} />
                {/* Optical center slightly offset */}
                <div style={{ position: 'absolute', top: '52%', left: '0', right: '0', height: '1px', background: 'rgba(255,0,0,0.3)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '0', width: '1px', background: 'rgba(255,0,0,0.3)', pointerEvents: 'none' }} />
              </>
            )}

            <svg ref={canvasRef} viewBox={`0 0 ${displaySize} ${displaySize}`} aria-hidden="true">
              {solveGhost && <path className="ghost-path" d={solveGhost} />}
              {showDiff && <path className="diff-main-path" d={mainPathD} />}
              <path
                className="master-path"
                d={pathD}
                fill={currentIconData?.id === 'filled' && !stress ? '#157a70' : 'none'}
                stroke={currentIconData?.id === 'filled' && !stress ? 'none' : '#157a70'}
                strokeWidth={currentIconData?.id === 'filled' && !stress ? '0' : '0.45'}
              />
            </svg>

            {mode === 'edit' && !stress && displayedAnchors.map((anchor) => (
              <button
                key={anchor.id}
                className={`anchor ${selectedAnchor === anchor.id ? 'active' : ''} ${changedAnchorIds.has(anchor.id) ? 'changed' : ''}`}
                style={{
                  left: `${(anchor.x / 24) * 100}%`,
                  top: `${(anchor.y / 24) * 100}%`,
                }}
                aria-label={`Anchor ${anchor.id}`}
                onPointerDown={(e) => handlePointerDown(e, anchor.id)}
                onKeyDown={(e) => handleKeyDown(e, anchor.id)}
                onClick={() => setSelectedAnchor(anchor.id)}
              >
                {selectedAnchor === anchor.id ? '•' : ''}
              </button>
            ))}
            {showDiff && (
              <div className="diff-legend">
                Diff vs main — dashed: main · solid: optical-pass · gold ring: {changedAnchorIds.size} changed anchor{changedAnchorIds.size === 1 ? '' : 's'}
              </div>
            )}
          </div>
          <div className="canvas-footer">
            <span>Snap: <strong>grid / 1 unit (Shift+Arrow = 0.1)</strong></span>
            <span>Guide: <strong>{lens}</strong></span>
            <span>State: <strong>{mode === 'edit' ? 'editable' : 'read-only preview'}</strong></span>
            {solveGhost && <span>Solver: <strong>before (dashed) → after (solid)</strong></span>}
            {stress && <span aria-live="polite">Jobs: <strong>{stressJob.last} · {stressJob.canceled} stale canceled</strong></span>}
            <span className="path-readout">
              <button className="copy-path" onClick={copyPathData}>Copy path</button>
              <code>{pathD.length > 60 ? `${pathD.slice(0, 60)}…` : pathD}</code>
            </span>
          </div>
        </div>
      </section>
      <aside className="inspector">
        <div className="panel-header">
          <span>INSPECTOR</span>
          <span className="status-dot" />
        </div>
        <section>
          <h3>Anchor properties</h3>
          {selected && !stress ? (
            <div className="property-grid">
              <label>ID<input value={selected.id} readOnly /></label>
              <label>Type
                <select value={selected.type} onChange={(event) => updateAnchor(selected.id, { type: event.target.value })}>
                  <option value="move">move</option>
                  <option value="line">line</option>
                  <option value="quadratic">quadratic</option>
                  <option value="cubic">cubic</option>
                  <option value="close">close</option>
                </select>
              </label>
              <label>X
                <input type="number" min="0" max="24" step="0.001" value={selected.x} onChange={(event) => updateAnchor(selected.id, { x: Number(event.target.value) })} />
              </label>
              <label>Y
                <input type="number" min="0" max="24" step="0.001" value={selected.y} onChange={(event) => updateAnchor(selected.id, { y: Number(event.target.value) })} />
              </label>
            </div>
          ) : <p>{stress ? 'Anchor editing pauses during the stress test.' : 'No anchor selected.'}</p>}
          <div className="inspector-actions">
            <button onClick={addAnchor}>Insert anchor</button>
            <button onClick={() => deleteAnchor(selectedAnchor)}>Delete</button>
          </div>
          {currentIconData?.inherited && (
            <div className="inspector-actions">
              <button onClick={resetVariant} disabled={!overrides[selectedIcon]}>Reset Variant</button>
            </div>
          )}
          <div className="inspector-actions">
            <button onClick={applyMirror}>Mirror Transform</button>
          </div>
        </section>

        <section>
          <h3>Constraints</h3>
          {constraints.map((c) => (
            <div className="constraint" key={c.id}>
              <span>{c.kind.toUpperCase()} / {c.value || `${c.target1} = ${c.target2}`}</span>
              <strong>ACTIVE</strong>
            </div>
          ))}
          <div className="property-grid constraint-pickers">
            <label>From
              <select value={constraintFrom} onChange={(e) => setConstraintFrom(e.target.value)}>
                {displayedAnchors.map((a) => <option key={a.id} value={a.id}>{a.id}</option>)}
              </select>
            </label>
            <label>To
              <select value={constraintTo} onChange={(e) => setConstraintTo(e.target.value)}>
                {displayedAnchors.map((a) => <option key={a.id} value={a.id}>{a.id}</option>)}
              </select>
            </label>
          </div>
          <div className="inspector-actions">
            <button onClick={addEqualConstraint}>Add Equal Constraint</button>
          </div>
        </section>

        <section>
          <h3>Size Hints</h3>
          <div className="property-grid">
            {hints.map((h) => (
              <div key={h.size} className="hint-row">
                <span>{h.size}px Hint: {h.adjustment > 0 ? '+0.5px' : h.adjustment < 0 ? '-0.5px' : '0px'}</span>
                <button onClick={() => cycleSizeHint(h.size)}>
                  Toggle Hint
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3>Transfer</h3>
          <textarea aria-label="Import family JSON" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste a family JSON document" />
          <div className="inspector-actions">
            <button onClick={importJson}>Import JSON</button>
            <button className="primary" onClick={exportJson}>Download</button>
          </div>
        </section>
      </aside>
    </main>
    <footer className="statusbar">
      <span aria-live="polite">{status}</span>
      <span>In-memory session · reload resets fixture · {stress ? '100,000 stress points' : `${currentAnchors.length} anchors`}</span>
    </footer>
  </div>;
}

export default App;
