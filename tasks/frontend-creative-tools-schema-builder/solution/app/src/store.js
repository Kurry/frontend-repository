// Shared application state (Zustand, in-memory only). Every pane derives
// from the one shared tree of the active schema; the validation run engine
// lives here and drives steps, rollups, timeline, and tree annotations.
import { create } from 'zustand';
import {
  uid, makeNode, rootNode, findNode, findParent, updateNode, removeNode,
  reorderChildren, uniqueKey, uniqueSchemaName, countFields,
  compileSchema, generateExample, formatInstruction, nodeToFieldDef, fieldDefToNode,
  validateFieldPayload, validateSchemaPackage, inferFields, inferredToNode,
  versionNameSchema, KEY_PATTERN,
} from './lib.js';
import { buildSeeds, SEED_METADATA_FIELDS } from './seeds.js';

let toastSeq = 0;
let runSeq = 0;

const burst = { active: false, base: null, label: '', timer: null };

function deepCopy(v) {
  return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}

function remapIds(node) {
  const copy = { ...node, id: uid() };
  if (node.children) copy.children = node.children.map(remapIds);
  return copy;
}

function ev(key, to, label) {
  return { id: uid('ev'), t: Date.now(), key, to, label: label || undefined };
}

export function copyToClipboard(text) {
  const legacy = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(legacy);
  }
  legacy();
  return Promise.resolve();
}

export function downloadTextFile(text, filename) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ------------------------------ Selectors -------------------------------- */

export const activeSchema = (s) => s.schemas.find((sc) => sc.id === s.activeId) || null;

export const displayedTree = (s) => {
  const sc = activeSchema(s);
  if (!sc) return null;
  if (s.viewIndex !== null && s.viewIndex < sc.past.length) return sc.past[s.viewIndex].tree;
  return sc.tree;
};

export const isScrubbing = (s) => {
  const sc = activeSchema(s);
  return !!(sc && s.viewIndex !== null && s.viewIndex < sc.past.length);
};

export function compiledText(s) {
  const sc = activeSchema(s);
  const tree = displayedTree(s);
  if (!sc || !tree) return '';
  return JSON.stringify(compileSchema(tree, sc.name), null, 2);
}

export function examplePayload(s) {
  const sc = activeSchema(s);
  const tree = displayedTree(s);
  if (!sc || !tree) return {};
  if (sc.exampleOverride) return sc.exampleOverride;
  return generateExample(tree);
}

export function formatText(s) {
  const sc = activeSchema(s);
  const tree = displayedTree(s);
  if (!sc || !tree) return '';
  if (sc.formatOverride) return sc.formatOverride;
  return formatInstruction(tree);
}

export function metadataMap(s, sc) {
  const map = {};
  s.metaFields.forEach((mf) => {
    map[mf.label] = String(sc.metaValues[mf.label] ?? '');
  });
  return map;
}

export function packageObject(s) {
  const sc = activeSchema(s);
  const tree = displayedTree(s);
  if (!sc || !tree) return null;
  return {
    schemaVersion: 'schema-package-v1',
    name: sc.name,
    jsonSchema: compileSchema(tree, sc.name),
    fields: (tree.children || []).map(nodeToFieldDef),
    metadata: metadataMap(s, sc),
    examplePayload: examplePayload(s),
    formatInstruction: formatText(s),
  };
}

export function reportObject(s) {
  const r = s.run;
  if (!r || r.status !== 'done') return null;
  const sc = activeSchema(s);
  return {
    generatedAt: new Date(r.completedAt).toISOString(),
    schemaName: sc ? sc.name : '',
    payloadSummary: {
      topLevelFields: r.total,
      fieldsChecked: r.checked,
      failures: r.failures,
    },
    perField: r.steps.map((st) => {
      const ann = r.annotations[st.nodeId];
      return {
        path: st.key,
        status: st.status,
        pass: ann ? ann.pass : st.status === 'complete',
        message: st.error || (ann && ann.message) || (st.status === 'complete' ? 'All checks passed' : ''),
      };
    }),
    failureCount: r.failures,
    events: r.events.map((e) => ({ at: new Date(e.t).toISOString(), field: e.key, to: e.to, label: e.label || e.to })),
  };
}

/* -------------------------------- Store ---------------------------------- */

export const useStore = create((set, get) => {
  const seeds = buildSeeds();

  function toast(message, tone = 'success') {
    toastSeq += 1;
    const id = `t${toastSeq}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  }

  function setLive(message) {
    set({ live: message });
  }

  function patchSchema(id, patch) {
    set((s) => ({ schemas: s.schemas.map((sc) => (sc.id === id ? { ...sc, ...patch } : sc)) }));
  }

  // Immediate history commit: past stores the tree BEFORE the labeled mutation.
  function commit(label, buildNewTree) {
    const s = get();
    const sc = activeSchema(s);
    if (!sc) return;
    const base = displayedTree(s);
    const newTree = buildNewTree(base);
    const past = s.viewIndex !== null && s.viewIndex < sc.past.length
      ? [...sc.past.slice(0, s.viewIndex), { label, tree: base }]
      : [...sc.past, { label, tree: base }];
    patchSchema(sc.id, { tree: newTree, past, future: [], exampleOverride: null, formatOverride: null });
    set({ viewIndex: null });
  }

  // Panel edits arrive as a burst of valid FieldDefinition commits that
  // collapse into a single history entry after a short idle window.
  function applyPanelEdit(nodeId, patchFn, label) {
    const s = get();
    const sc = activeSchema(s);
    if (!sc || isScrubbing(s)) return;
    if (!burst.active) {
      burst.active = true;
      burst.base = sc.tree;
      burst.label = label;
    }
    const newTree = updateNode(sc.tree, nodeId, patchFn);
    patchSchema(sc.id, { tree: newTree });
    if (burst.timer) clearTimeout(burst.timer);
    burst.timer = setTimeout(() => {
      const s2 = get();
      const sc2 = activeSchema(s2);
      if (sc2 && burst.active) {
        patchSchema(sc2.id, {
          past: [...sc2.past, { label: burst.label, tree: burst.base }],
          future: [],
        });
      }
      burst.active = false;
      burst.base = null;
      burst.label = '';
      burst.timer = null;
    }, 1100);
  }

  /* --------------------------- Validation run engine --------------------- */

  function scheduleTick(id, i, delay) {
    setTimeout(() => tickStep(id, i), delay);
  }

  function tickStep(id, i) {
    const s = get();
    const r = s.run;
    if (!r || r.id !== id || r.status !== 'running') return;
    const key = r.steps[i].key;
    set({
      run: {
        ...r,
        steps: r.steps.map((st, idx) => (idx === i ? { ...st, status: 'running' } : st)),
        events: [...r.events, ev(key, 'running')].slice(-250),
      },
    });
    setTimeout(() => resolveStep(id, i), 320 + Math.random() * 430);
  }

  function resolveStep(id, i) {
    const s = get();
    const r = s.run;
    if (!r || r.id !== id || r.status !== 'running') return;
    const st = r.steps[i];
    if (st.attempts < st.maxAttempts - 1 && Math.random() < 0.3) {
      const attempts = st.attempts + 1;
      set({
        run: {
          ...r,
          steps: r.steps.map((x, idx) => (idx === i ? { ...x, status: 'retrying', attempts, backoff: 3 } : x)),
          events: [
            ...r.events,
            ev(st.key, 'retrying', `Slowdown detected — waiting before retry ${attempts} of ${st.maxAttempts}`),
          ].slice(-250),
        },
      });
      const iv = setInterval(() => {
        const s2 = get();
        const r2 = s2.run;
        if (!r2 || r2.id !== id) {
          clearInterval(iv);
          return;
        }
        if (r2.status === 'paused') return; // countdown freezes while paused
        const cur = r2.steps[i];
        if (cur.status !== 'retrying') {
          clearInterval(iv);
          return;
        }
        const next = cur.backoff - 1;
        if (next <= 0) {
          clearInterval(iv);
          set({
            run: {
              ...r2,
              steps: r2.steps.map((x, idx) => (idx === i ? { ...x, backoff: 0, status: 'running' } : x)),
            },
          });
          setTimeout(() => finishStep(id, i), 200);
        } else {
          set({ run: { ...r2, steps: r2.steps.map((x, idx) => (idx === i ? { ...x, backoff: next } : x)) } });
        }
      }, 430);
      return;
    }
    finishStep(id, i);
  }

  function finishStep(id, i) {
    const s = get();
    const r = s.run;
    if (!r || r.id !== id || r.status !== 'running') return;
    const st = r.steps[i];
    const tree = displayedTree(s);
    const node = tree ? findNode(tree, st.nodeId) : null;
    const res = node
      ? validateFieldPayload(node, r.payload)
      : { pass: false, message: `${st.key}: the field was removed from the schema mid-run` };
    const steps = r.steps.map((x, idx) => (idx === i ? { ...x, status: res.pass ? 'complete' : 'failed', error: res.message } : x));
    const annotations = { ...r.annotations, [st.nodeId]: { pass: res.pass, message: res.message, key: st.key } };
    const checked = r.checked + 1;
    const failures = r.failures + (res.pass ? 0 : 1);
    const events = [...r.events, ev(st.key, res.pass ? 'complete' : 'failed', res.pass ? undefined : res.message)].slice(-250);
    if (i + 1 < steps.length) {
      set({ run: { ...r, steps, annotations, checked, failures, events } });
      if (!res.pass) setLive(`Step failed — ${res.message}`);
      scheduleTick(id, i + 1, 150);
    } else {
      const passed = checked - failures;
      set({
        run: {
          ...r,
          steps,
          annotations,
          checked,
          failures,
          status: 'done',
          completedAt: Date.now(),
          events: [...events, ev('run', 'done', `Run complete — ${passed} of ${checked} passed, ${failures} failed`)].slice(-250),
        },
      });
      setLive(`Validation run complete: ${passed} of ${checked} fields passed, ${failures} failed`);
      toast(
        failures
          ? `Validation complete — ${failures} field${failures === 1 ? '' : 's'} failed, see tree annotations`
          : 'Validation complete — every field passed',
        failures ? 'error' : 'success',
      );
    }
  }

  const lastAdd = { parentId: null, t: 0 };
  const lastSave = { name: null, t: 0 };

  return {
    /* UI chrome */
    theme: 'dark',
    density: 'comfortable',
    defaultType: 'string',
    toasts: [],
    live: '',
    sidebarOpen: false,
    exportOpen: false,
    exportTab: 'schema',
    shortcutsOpen: false,
    drawerOpen: true,
    onboarding: { open: true, step: 0 },
    confirm: null,
    promptDrawerOpen: false,

    /* Layout / modes */
    tab: 'schema',
    drawerTab: 'playground',
    importTab: 'example',

    /* Library + shared state */
    schemas: seeds,
    activeId: seeds[0].id,
    metaFields: SEED_METADATA_FIELDS,
    selectedNodeId: null,
    selectedIds: [],
    collapsedIds: [],
    viewIndex: null,
    exampleNonce: 0,
    lastDroppedId: null,
    diffBaseId: null,
    diffCompareId: null,

    /* Playground / imports */
    payloadText: '',
    payloadError: '',
    run: null,
    importExampleText: '',
    importDraft: null,
    importDraftError: '',
    packageText: '',
    packageError: '',
    promptDraft: '',
    eventFilter: 'all',

    toast,
    setLive,

    setTheme: (theme) => set({ theme }),
    toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    setDensity: (density) => set({ density }),
    setDefaultType: (defaultType) => set({ defaultType }),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    setTab: (tab) => set({ tab }),
    setDrawerTab: (drawerTab) => set({ drawerTab, drawerOpen: true }),
    setImportTab: (importTab) => set({ importTab }),
    setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
    setEventFilter: (eventFilter) => set({ eventFilter }),
    setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
    setPromptDrawerOpen: (promptDrawerOpen) => set({ promptDrawerOpen }),
    setPromptDraft: (promptDraft) => set({ promptDraft }),
    dismissOnboarding: () => set({ onboarding: { open: false, step: 0 } }),
    onboardingStep: (step) => set((s) => ({ onboarding: { ...s.onboarding, step } })),

    switchMode: (mode) => {
      const map = {
        'schema-text': () => set({ tab: 'schema' }),
        example: () => set({ tab: 'example' }),
        'format-prompt': () => set({ tab: 'format' }),
        diff: () => set({ drawerTab: 'versions', drawerOpen: true }),
        playground: () => set({ drawerTab: 'playground', drawerOpen: true }),
        import: () => set({ drawerTab: 'import', drawerOpen: true }),
      };
      (map[mode] || (() => {}))();
    },

    openExport: (tabName = 'schema') => set({ exportOpen: true, exportTab: tabName }),
    closeExport: () => set({ exportOpen: false }),
    setExportTab: (exportTab) => set({ exportTab }),

    openConfirm: (confirm) => set({ confirm }),
    closeConfirm: () => set({ confirm: null }),

    /* ------------------------------ Library ------------------------------ */

    selectSchema: (id) => {
      const s = get();
      if (!s.schemas.some((sc) => sc.id === id)) return { ok: false, error: `No schema with id "${id}"` };
      set({ activeId: id, viewIndex: null, selectedNodeId: null, selectedIds: [], run: null, collapsedIds: [] });
      return { ok: true };
    },

    newSchema: (name) => {
      const s = get();
      const tree = rootNode([]);
      const finalName = uniqueSchemaName(s.schemas, name || 'Untitled schema');
      const sc = {
        id: uid('sc'),
        name: finalName,
        tree,
        past: [],
        future: [],
        versions: [],
        metaValues: {},
        exampleOverride: null,
        formatOverride: null,
      };
      set((st) => ({ schemas: [...st.schemas, sc], activeId: sc.id, viewIndex: null, selectedNodeId: null, selectedIds: [], run: null }));
      toast(`Created schema "${finalName}"`);
      return { ok: true, id: sc.id, name: finalName };
    },

    duplicateSchema: (id) => {
      const s = get();
      const sc = s.schemas.find((x) => x.id === id);
      if (!sc) return { ok: false, error: 'Schema not found' };
      const tree = remapIds(deepCopy(sc.tree));
      const name = uniqueSchemaName(s.schemas, `${sc.name} copy`);
      const copy = {
        id: uid('sc'),
        name,
        tree,
        past: [],
        future: [],
        versions: [],
        metaValues: { ...sc.metaValues },
        exampleOverride: null,
        formatOverride: null,
      };
      set((st) => ({ schemas: [...st.schemas, copy], activeId: copy.id, viewIndex: null, selectedNodeId: null, selectedIds: [] }));
      toast(`Duplicated schema as "${name}"`);
      return { ok: true, id: copy.id, name };
    },

    requestDeleteSchema: (id) => {
      const s = get();
      const sc = s.schemas.find((x) => x.id === id);
      if (!sc) return { ok: false, error: 'Schema not found' };
      get().openConfirm({
        title: 'Delete schema',
        body: `Delete "${sc.name}" and its ${countFields(sc.tree)} fields? This cannot be undone.`,
        confirmLabel: 'Delete schema',
        tone: 'danger',
        action: 'delete-schema',
        payload: { id },
      });
      return { ok: true };
    },

    doDeleteSchema: (id) => {
      const s = get();
      const sc = s.schemas.find((x) => x.id === id);
      if (!sc) return;
      const remaining = s.schemas.filter((x) => x.id !== id);
      const nextActive = s.activeId === id ? (remaining[0] ? remaining[0].id : null) : s.activeId;
      set({
        schemas: remaining,
        activeId: nextActive,
        viewIndex: null,
        selectedNodeId: nextActive === s.activeId ? s.selectedNodeId : null,
        selectedIds: [],
        run: nextActive === s.activeId ? s.run : null,
      });
      toast(`Deleted schema "${sc.name}"`, 'info');
    },

    renameSchema: (id, name) => {
      const clean = String(name).trim();
      if (!clean) return { ok: false, error: 'Schema name is required — enter 1 to 80 characters' };
      if (clean.length > 80) return { ok: false, error: 'Schema name must be 1 to 80 characters' };
      patchSchema(id, { name: clean });
      return { ok: true };
    },

    setMetaValue: (schemaId, label, value) => {
      const s = get();
      const sc = s.schemas.find((x) => x.id === schemaId);
      if (!sc) return;
      patchSchema(schemaId, { metaValues: { ...sc.metaValues, [label]: value } });
    },

    addMetadataField: (def) => {
      const field = { id: uid('mf'), label: def.label, type: def.type, ...(def.type === 'dropdown' ? { options: def.options } : {}) };
      set((s) => ({ metaFields: [...s.metaFields, field] }));
      toast(`Added metadata field "${def.label}"`);
      return { ok: true };
    },

    removeMetadataField: (id) => {
      set((s) => ({ metaFields: s.metaFields.filter((mf) => mf.id !== id) }));
      toast('Removed metadata field', 'info');
    },

    /* ---------------------------- Tree editing --------------------------- */

    selectNode: (id) => set({ selectedNodeId: id }),

    toggleCollapsed: (id) =>
      set((s) => ({
        collapsedIds: s.collapsedIds.includes(id) ? s.collapsedIds.filter((c) => c !== id) : [...s.collapsedIds, id],
      })),

    toggleSelect: (id) =>
      set((s) => ({
        selectedIds: s.selectedIds.includes(id) ? s.selectedIds.filter((c) => c !== id) : [...s.selectedIds, id],
      })),
    clearSelection: () => set({ selectedIds: [] }),

    addField: (parentId) => {
      const s = get();
      const tree = displayedTree(s);
      if (!tree) return { ok: false, error: 'No active schema — create or select one first' };
      if (isScrubbing(s)) return { ok: false, error: 'History preview is read-only — return to the current state to edit' };
      const parent = findNode(tree, parentId || tree.id);
      if (!parent) return { ok: false, error: 'Parent node not found' };
      if (parent.type !== 'object' && parent.type !== 'array') {
        return { ok: false, error: `${parent.key} is a ${parent.type} — fields can only be added inside object or array nodes` };
      }
      const now = Date.now();
      if (lastAdd.parentId === parent.id && now - lastAdd.t < 150) {
        return { ok: false, error: 'ignored-duplicate' };
      }
      lastAdd.parentId = parent.id;
      lastAdd.t = now;
      const key = uniqueKey(parent);
      const node = makeNode({ key, type: get().defaultType, required: false });
      commit('Add field', (base) => {
        const p = findNode(base, parent.id) || base;
        return updateNode(base, p.id, (n) => ({ ...n, children: [...(n.children || []), { ...node }] }));
      });
      return { ok: true, id: node.id, key };
    },

    renameNode: (id, newKey) => {
      const s = get();
      const tree = displayedTree(s);
      if (!tree) return { ok: false, error: 'No active schema' };
      const node = findNode(tree, id);
      if (!node) return { ok: false, error: 'Node not found' };
      const key = String(newKey).trim();
      if (key === node.key) return { ok: true };
      if (!key || key.length > 40 || !KEY_PATTERN.test(key)) {
        return { ok: false, error: 'Key must be 1 to 40 characters — letters, digits, and underscores only (no spaces or punctuation)' };
      }
      const parent = findParent(tree, id);
      if (parent && (parent.children || []).some((c) => c.id !== id && c.key === key)) {
        return { ok: false, error: `A sibling field named "${key}" already exists — keys must be unique among siblings` };
      }
      commit('Rename field', (base) => updateNode(base, id, (n) => ({ ...n, key })));
      return { ok: true };
    },

    checkSiblingKey: (id, key) => {
      const s = get();
      const tree = displayedTree(s);
      if (!tree) return null;
      const parent = findParent(tree, id);
      if (parent && (parent.children || []).some((c) => c.id !== id && c.key === key)) {
        return `A sibling field named "${key}" already exists — keys must be unique among siblings`;
      }
      return null;
    },

    applyPanelEdit: (id, patchFn, label) => applyPanelEdit(id, patchFn, label || 'Update field'),

    setNodeRequired: (id, required) => {
      const s = get();
      const tree = displayedTree(s);
      const node = tree && findNode(tree, id);
      if (!node) return { ok: false, error: 'Node not found' };
      commit(required ? 'Set required' : 'Clear required', (base) => updateNode(base, id, (n) => ({ ...n, required: !!required })));
      return { ok: true };
    },

    bulkSetRequired: (ids, required) => {
      commit(required ? 'Set required (bulk)' : 'Clear required (bulk)', (base) => {
        let t = base;
        ids.forEach((id) => {
          t = updateNode(t, id, (n) => ({ ...n, required: !!required }));
        });
        return t;
      });
      set({ selectedIds: [] });
      toast(required ? `Marked ${ids.length} field${ids.length === 1 ? '' : 's'} required` : `Cleared required on ${ids.length} field${ids.length === 1 ? '' : 's'}`);
    },

    requestDeleteNode: (id) => {
      const s = get();
      const tree = displayedTree(s);
      const node = tree && findNode(tree, id);
      if (!node) return { ok: false, error: 'Node not found' };
      const descendants = countFields(node);
      get().openConfirm({
        title: 'Delete field',
        body:
          descendants > 0
            ? `Delete "${node.key}" and its ${descendants} nested field${descendants === 1 ? '' : 's'}?`
            : `Delete "${node.key}"?`,
        confirmLabel: 'Delete',
        tone: 'danger',
        action: 'delete-node',
        payload: { id },
      });
      return { ok: true, confirm: true };
    },

    doDeleteNode: (id) => {
      const s = get();
      const tree = displayedTree(s);
      const node = tree && findNode(tree, id);
      if (!node) return;
      commit('Delete field', (base) => removeNode(base, id));
      set((st) => ({
        selectedNodeId: st.selectedNodeId === id ? null : st.selectedNodeId,
        selectedIds: st.selectedIds.filter((x) => x !== id),
      }));
      toast(`Deleted field "${node.key}"`, 'info');
    },

    requestBulkDelete: (ids) => {
      const s = get();
      const tree = displayedTree(s);
      if (!tree || !ids.length) return { ok: false, error: 'Nothing selected' };
      get().openConfirm({
        title: 'Delete selected fields',
        body: `Delete ${ids.length} selected field${ids.length === 1 ? '' : 's'} and all of their descendants?`,
        confirmLabel: `Delete ${ids.length} selected`,
        tone: 'danger',
        action: 'bulk-delete',
        payload: { ids },
      });
      return { ok: true };
    },

    doBulkDelete: (ids) => {
      commit('Delete selected fields', (base) => {
        let t = base;
        ids.forEach((id) => {
          t = removeNode(t, id);
        });
        return t;
      });
      set({ selectedIds: [], selectedNodeId: null });
      toast(`Deleted ${ids.length} field${ids.length === 1 ? '' : 's'}`, 'info');
    },

    nestNode: (id) => {
      const s = get();
      const tree = displayedTree(s);
      if (!tree) return { ok: false, error: 'No active schema' };
      const parent = findParent(tree, id);
      if (!parent) return { ok: false, error: 'The root node cannot be nested' };
      const siblings = parent.children || [];
      const idx = siblings.findIndex((c) => c.id === id);
      const prev = siblings[idx - 1];
      if (!prev || prev.type !== 'object') {
        return { ok: false, error: `Nest needs an object sibling immediately before this field${prev ? ` — "${prev.key}" is a ${prev.type}` : ''}` };
      }
      const node = siblings[idx];
      commit('Nest field', (base) => {
        const t = removeNode(base, id);
        return updateNode(t, prev.id, (n) => ({ ...n, children: [...(n.children || []), deepCopy(node)] }));
      });
      return { ok: true };
    },

    unnestNode: (id) => {
      const s = get();
      const tree = displayedTree(s);
      if (!tree) return { ok: false, error: 'No active schema' };
      const parent = findParent(tree, id);
      if (!parent) return { ok: false, error: 'Node not found' };
      if (parent.id === tree.id) return { ok: false, error: 'This field is already at the top level' };
      const grand = findParent(tree, parent.id);
      if (!grand) return { ok: false, error: 'Cannot move further up' };
      const node = findNode(tree, id);
      commit('Un-nest field', (base) => {
        const parentIdx = (grand.children || []).findIndex((c) => c.id === parent.id);
        const t = removeNode(base, id);
        return updateNode(t, grand.id, (n) => {
          const children = [...(n.children || [])];
          children.splice(parentIdx + 1, 0, deepCopy(node));
          return { ...n, children };
        });
      });
      return { ok: true };
    },

    reorderNode: (parentId, fromIdx, toIdx) => {
      if (fromIdx === toIdx) return { ok: true };
      commit('Reorder field', (base) => reorderChildren(base, parentId, fromIdx, toIdx));
      return { ok: true };
    },

    setLastDropped: (id) => {
      set({ lastDroppedId: id });
      setTimeout(() => set((s) => ({ lastDroppedId: s.lastDroppedId === id ? null : s.lastDroppedId })), 500);
    },

    /* -------------------------- History / undo ---------------------------- */

    undo: () => {
      const s = get();
      const sc = activeSchema(s);
      if (!sc || !sc.past.length) return { ok: false, error: 'Nothing to undo' };
      const entry = sc.past[sc.past.length - 1];
      patchSchema(sc.id, {
        tree: entry.tree,
        past: sc.past.slice(0, -1),
        future: [...sc.future, { label: entry.label, tree: sc.tree }],
        exampleOverride: null,
        formatOverride: null,
      });
      return { ok: true, label: entry.label };
    },

    redo: () => {
      const s = get();
      const sc = activeSchema(s);
      if (!sc || !sc.future.length) return { ok: false, error: 'Nothing to redo' };
      const entry = sc.future[sc.future.length - 1];
      patchSchema(sc.id, {
        tree: entry.tree,
        future: sc.future.slice(0, -1),
        past: [...sc.past, { label: entry.label, tree: sc.tree }],
        exampleOverride: null,
        formatOverride: null,
      });
      return { ok: true, label: entry.label };
    },

    scrubTo: (index) => set({ viewIndex: index }),

    setDiffBase: (diffBaseId) => set({ diffBaseId }),
    setDiffCompare: (diffCompareId) => set({ diffCompareId }),

    /* ------------------------------ Versions ------------------------------ */

    saveVersion: (name) => {
      const s = get();
      const sc = activeSchema(s);
      if (!sc) return { ok: false, error: 'No active schema' };
      const parsed = versionNameSchema.safeParse(String(name ?? '').trim());
      if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
      const now = Date.now();
      if (lastSave.name === parsed.data && now - lastSave.t < 400) return { ok: false, error: 'ignored-duplicate' };
      lastSave.name = parsed.data;
      lastSave.t = now;
      const v = { id: uid('v'), name: parsed.data, ts: now, tree: deepCopy(displayedTree(s)) };
      patchSchema(sc.id, { versions: [v, ...sc.versions] });
      toast(`Saved version "${v.name}"`);
      return { ok: true, id: v.id };
    },

    /* ----------------------------- Playground ----------------------------- */

    setPayloadText: (payloadText) => set({ payloadText, payloadError: '' }),

    startRun: () => {
      const s = get();
      const sc = activeSchema(s);
      if (!sc) return { ok: false, error: 'No active schema' };
      const r = s.run;
      if (r && ['running', 'retrying', 'paused'].includes(r.status)) {
        return { ok: false, error: 'A validation run is already in progress — pause or finish it first' };
      }
      const text = s.payloadText.trim();
      if (!text) {
        const msg = 'The playground payload is empty — paste a JSON payload to validate';
        set({ payloadError: msg });
        return { ok: false, error: msg };
      }
      let payload;
      try {
        payload = JSON.parse(text);
      } catch (e) {
        const msg = `Invalid JSON payload — ${e.message}`;
        set({ payloadError: msg });
        return { ok: false, error: msg };
      }
      const tree = displayedTree(s);
      const fields = tree.children || [];
      if (!fields.length) {
        const msg = 'The active schema has no top-level fields — add a field before validating';
        set({ payloadError: msg });
        return { ok: false, error: msg };
      }
      set({ payloadError: '' });
      runSeq += 1;
      const id = runSeq;
      const run = {
        id,
        status: 'running',
        payload,
        steps: fields.map((f) => ({ nodeId: f.id, key: f.key, status: 'pending', attempts: 0, maxAttempts: 3, backoff: 0, error: null })),
        events: [ev('run', 'started', `Run started — ${fields.length} step${fields.length === 1 ? '' : 's'}`)],
        annotations: {},
        checked: 0,
        failures: 0,
        total: fields.length,
        completedAt: null,
      };
      set({ run });
      setLive(`Validation run started — ${fields.length} steps`);
      scheduleTick(id, 0, 130);
      return { ok: true, message: `Validation run started with ${fields.length} steps` };
    },

    pauseRun: () => {
      const r = get().run;
      if (!r || !['running', 'retrying'].includes(r.status)) return { ok: false, error: 'No active run to pause' };
      set({ run: { ...r, status: 'paused', events: [...r.events, ev('run', 'paused', 'Run paused')].slice(-250) } });
      setLive('Validation run paused');
      return { ok: true };
    },

    resumeRun: () => {
      const r = get().run;
      if (!r || r.status !== 'paused') return { ok: false, error: 'No paused run to resume' };
      let idx = r.steps.findIndex((st) => st.status === 'running' || st.status === 'retrying');
      if (idx < 0) idx = r.steps.findIndex((st) => st.status === 'pending');
      set({ run: { ...r, status: 'running', events: [...r.events, ev('run', 'resumed', 'Run resumed')].slice(-250) } });
      setLive('Validation run resumed');
      if (idx >= 0 && r.steps[idx].status !== 'retrying') scheduleTick(r.id, idx, 220);
      return { ok: true };
    },

    advanceRun: () => {
      const r = get().run;
      if (!r) return { ok: false, error: 'No validation run exists' };
      if (r.status === 'paused') return get().resumeRun();
      if (r.status === 'done') return { ok: false, error: 'The run already completed' };
      return { ok: true, message: 'The run is advancing automatically' };
    },

    retryStep: (index) => {
      const r = get().run;
      if (!r || !r.steps[index] || r.steps[index].status !== 'failed') {
        return { ok: false, error: 'Only failed steps can be retried' };
      }
      const st = r.steps[index];
      const annotations = { ...r.annotations };
      delete annotations[st.nodeId];
      const status = r.status === 'done' ? 'running' : r.status;
      set({
        run: {
          ...r,
          status,
          annotations,
          checked: Math.max(0, r.checked - 1),
          failures: Math.max(0, r.failures - 1),
          steps: r.steps.map((x, i) => (i === index ? { ...x, status: 'pending', attempts: 0, backoff: 0, error: null } : x)),
          events: [...r.events, ev(st.key, 'retry', `Manual retry of "${st.key}"`)].slice(-250),
        },
      });
      scheduleTick(r.id, index, 150);
      return { ok: true };
    },

    regenerateExample: () => {
      const s = get();
      const sc = activeSchema(s);
      if (!sc) return { ok: false, error: 'No active schema' };
      patchSchema(sc.id, { exampleOverride: null });
      set({ exampleNonce: s.exampleNonce + 1 });
      toast('Regenerated example payload');
      return { ok: true };
    },

    /* -------------------------- Import from example ----------------------- */

    setImportExampleText: (importExampleText) => set({ importExampleText, importDraftError: '' }),

    inferDraft: () => {
      const s = get();
      const text = s.importExampleText.trim();
      if (!text) {
        const msg = 'Paste a JSON object first — the inferred draft follows the pasted example';
        set({ importDraftError: msg });
        return { ok: false, error: msg };
      }
      let obj;
      try {
        obj = JSON.parse(text);
      } catch (e) {
        const msg = `Invalid JSON — ${e.message}`;
        set({ importDraftError: msg });
        return { ok: false, error: msg };
      }
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        const msg = 'Import from example expects a JSON object at the root (for example {"name": "value"})';
        set({ importDraftError: msg });
        return { ok: false, error: msg };
      }
      const fields = inferFields(obj);
      set({ importDraft: { fields }, importDraftError: '' });
      return { ok: true, count: fields.length };
    },

    toggleDraftField: (id) => {
      const s = get();
      if (!s.importDraft) return;
      set({
        importDraft: {
          fields: s.importDraft.fields.map((f) => (f.id === id ? { ...f, accepted: !f.accepted } : f)),
        },
      });
    },

    applyImportDraft: () => {
      const s = get();
      if (!s.importDraft) return { ok: false, error: 'No inferred draft — paste a JSON object and press Infer draft first' };
      const accepted = s.importDraft.fields.filter((f) => f.accepted);
      if (!accepted.length) return { ok: false, error: 'Every field is rejected — accept at least one inferred field to apply' };
      commit('Import from example', () => rootNode(accepted.map(inferredToNode)));
      set({ importDraft: null });
      toast(`Applied ${accepted.length} inferred field${accepted.length === 1 ? '' : 's'}`);
      return { ok: true, count: accepted.length };
    },

    /* ----------------------------- Package import ------------------------- */

    setPackageText: (packageText) => set({ packageText, packageError: '' }),

    importPackage: () => {
      const s = get();
      const sc = activeSchema(s);
      if (!sc) return { ok: false, error: 'No active schema — create or select one first' };
      const text = s.packageText.trim();
      if (!text) {
        const msg = 'Paste a SchemaPackage JSON first';
        set({ packageError: msg });
        return { ok: false, error: msg };
      }
      const v = validateSchemaPackage(text);
      if (!v.ok) {
        set({ packageError: v.error });
        return { ok: false, error: v.error };
      }
      const pkg = v.pkg;
      const newTree = rootNode(pkg.fields.map(fieldDefToNode));
      commit('Import schema package', () => newTree);
      patchSchema(sc.id, {
        name: pkg.name,
        exampleOverride: pkg.examplePayload,
        formatOverride: pkg.formatInstruction,
        metaValues: { ...sc.metaValues, ...pkg.metadata },
      });
      set({ packageError: '' });
      toast(`Imported schema package "${pkg.name}"`);
      return { ok: true, name: pkg.name };
    },

    /* ------------------------------- Export -------------------------------- */

    copyText: (text, label) => {
      copyToClipboard(text);
      toast(`Copied ${label} to clipboard`);
      return { ok: true };
    },

    downloadText: (text, filename, label) => {
      downloadTextFile(text, filename);
      toast(`Downloaded ${label}`);
      return { ok: true };
    },

    insertIntoPromptDraft: () => {
      const s = get();
      const text = formatText(s);
      set({ promptDraft: s.promptDraft ? `${s.promptDraft}\n\n${text}` : text, promptDrawerOpen: true });
      toast('Inserted format instruction into prompt draft');
      return { ok: true };
    },

    /* ------------------------------ Confirm -------------------------------- */

    doConfirm: () => {
      const s = get();
      const c = s.confirm;
      if (!c) return;
      set({ confirm: null });
      if (c.action === 'delete-node') get().doDeleteNode(c.payload.id);
      if (c.action === 'bulk-delete') get().doBulkDelete(c.payload.ids);
      if (c.action === 'delete-schema') get().doDeleteSchema(c.payload.id);
    },
  };
});
