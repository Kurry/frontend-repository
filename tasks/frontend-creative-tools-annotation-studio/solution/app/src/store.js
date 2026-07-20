import { create } from 'zustand';
import {
  AnnotationCreateSchema,
  LabelsPackageSchema,
  RegionCreateSchema,
  TaxonomyClassCreateSchema,
  MetadataFieldCreateSchema,
  validateMetadata,
  validateRegionAttributes,
  firstZodError,
} from './schemas';
import { createSeedState } from './seeds';

const initial = createSeedState();
const nowIso = () => new Date().toISOString();
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const clone = (value) => structuredClone(value);

const snapshotKeys = [
  'suites', 'items', 'taxonomy', 'metadataFields', 'drafts', 'historyOrder', 'selected',
  'activeSuiteId', 'activeItemId', 'regionUi', 'activeView',
];

function snapshot(state) {
  return Object.fromEntries(snapshotKeys.map((key) => [key, clone(state[key])]));
}

function transact(set, get, label, updater) {
  const before = snapshot(get());
  const id = uid('action');
  set(updater);
  const after = snapshot(get());
  set((state) => ({
    undoStack: [...state.undoStack, { id, label, before, after }],
    redoStack: [],
    actionHistory: [{ id, label, at: nowIso(), reverted: false }, ...state.actionHistory].slice(0, 30),
  }));
}

function defaultMetadata(fields) {
  return Object.fromEntries(fields.map((field) => [field.name,
    field.kind === 'select' ? field.options[0] : field.kind === 'checkbox' ? false : field.kind === 'number' ? 0 : '',
  ]));
}

function defaultAnnotation(state, itemId) {
  const draft = state.drafts[itemId];
  return {
    rating: draft?.rating || 'up',
    scores: { Accuracy: draft?.scores?.Accuracy || 3, Clarity: draft?.scores?.Clarity || 3, Relevance: draft?.scores?.Relevance || 3 },
    comment: draft?.comment || '',
    metadata: draft?.metadata || defaultMetadata(state.metadataFields),
    regions: (draft?.regions || []).map(({ id, ...region }) => region),
  };
}

export function isAgreementFlagged(row) {
  return row.annotatorA.rating !== row.annotatorB.rating
    || Object.keys(row.annotatorA.scores).some((key) => Math.abs(row.annotatorA.scores[key] - row.annotatorB.scores[key]) >= 2);
}

export function compileLabelsPackage(state) {
  return {
    schemaVersion: 'annotation-studio-labels-v1',
    taxonomy: state.taxonomy.map(({ id, name, color, icon, shortcut, attributes }) => ({ id, name, color, icon, shortcut, attributes })),
    metadataFields: state.metadataFields.map(({ id, name, kind, options }) => ({ id, name, kind, options })),
    items: Object.values(state.items).map((item) => ({
      id: item.id,
      suite: state.suites.find((suite) => suite.id === item.suiteId)?.name || item.suiteId,
      review_state: item.review_state,
      annotation: item.review_state === 'unlabeled' ? null : item.annotation,
    })),
  };
}

export function compileJsonl(state) {
  return Object.values(state.items)
    .filter((item) => item.annotation)
    .map((item) => JSON.stringify({
      prompt: item.prompt,
      response: item.response,
      ...item.annotation,
    }))
    .join('\n');
}

export function compileStats(state) {
  const suiteLines = state.suites.map((suite) => {
    const suiteItems = suite.itemIds.map((id) => state.items[id]).filter(Boolean);
    const completed = suiteItems.filter((item) => item.review_state !== 'unlabeled').length;
    const rows = state.agreement.filter((row) => row.suiteId === suite.id);
    const agreement = rows.length ? Math.round((rows.filter((row) => !isAgreementFlagged(row)).length / rows.length) * 100) : 0;
    return `${suite.name}: ${completed}/${suiteItems.length} completed · ${suiteItems.length - completed} remaining · ${agreement}% agreement`;
  });
  const classLines = state.taxonomy.map((cls) => {
    const count = Object.values(state.items).reduce((total, item) => total + (item.annotation?.regions.filter((r) => r.classId === cls.id).length || 0), 0)
      + Object.values(state.drafts).reduce((total, draft) => total + (draft.regions?.filter((r) => r.classId === cls.id).length || 0), 0);
    return `${cls.name}: ${count} regions`;
  });
  const disputed = Object.values(state.items).filter((item) => item.review_state === 'disputed').length;
  const annotations = Object.values(state.items).filter((item) => item.annotation).length;
  return [`CORVID LABELING STATS`, `Annotations: ${annotations}`, '', 'Suite progress', ...suiteLines, '', 'Class usage', ...classLines, '', `Disputed: ${disputed}`].join('\n');
}

const firstUnlabeled = (state, suiteId) => state.suites.find((s) => s.id === suiteId)?.itemIds.find((id) => state.items[id]?.review_state === 'unlabeled') || null;

export const useStudioStore = create((set, get) => ({
  ...initial,
  selected: [],
  activeSuiteId: initial.suites[0].id,
  activeItemId: initial.suites[0].itemIds[0],
  activeView: 'annotate',
  sidebarTab: 'queue',
  historyItemId: initial.historyOrder[0] || null,
  mobileSidebarOpen: false,
  paletteOpen: false,
  paletteQuery: '',
  paletteIndex: 0,
  regionUi: {},
  selectedRegionId: null,
  undoStack: [],
  redoStack: [],
  actionHistory: [],
  toast: null,
  liveMessage: '',
  assistRuns: {},
  activeAssistSuiteId: null,
  importOpen: false,
  actionPanelOpen: false,

  setToast: (message, kind = 'success') => {
    const id = uid('toast');
    set({ toast: { id, message, kind } });
    window.setTimeout(() => set((s) => s.toast?.id === id ? { toast: null } : {}), 2800);
  },
  setView: (activeView) => set({ activeView, mobileSidebarOpen: false }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  openHistory: (historyItemId) => set({ historyItemId, activeView: 'history', mobileSidebarOpen: false }),
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  openPalette: () => set({ paletteOpen: true, paletteQuery: '', paletteIndex: 0 }),
  closePalette: () => set({ paletteOpen: false, paletteQuery: '', paletteIndex: 0 }),
  setPaletteQuery: (paletteQuery) => set({ paletteQuery, paletteIndex: 0 }),
  setPaletteIndex: (paletteIndex) => set({ paletteIndex }),
  setImportOpen: (importOpen) => set({ importOpen }),
  setActionPanelOpen: (actionPanelOpen) => set({ actionPanelOpen }),

  selectSuite: (suiteId) => set((state) => ({
    activeSuiteId: suiteId,
    activeItemId: firstUnlabeled(state, suiteId),
    activeView: 'annotate',
    selected: [],
    mobileSidebarOpen: false,
  })),
  selectItem: (itemId) => set((state) => ({
    activeItemId: itemId,
    activeSuiteId: state.items[itemId]?.suiteId || state.activeSuiteId,
    activeView: 'annotate',
    mobileSidebarOpen: false,
  })),
  toggleSelected: (itemId) => set((state) => ({ selected: state.selected.includes(itemId) ? state.selected.filter((id) => id !== itemId) : [...state.selected, itemId] })),
  selectAllSuite: (suiteId, checked) => set((state) => ({
    selected: checked
      ? state.suites.find((suite) => suite.id === suiteId)?.itemIds.filter((id) => state.items[id]?.review_state === 'unlabeled') || []
      : state.selected.filter((id) => state.items[id]?.suiteId !== suiteId),
  })),
  clearSelection: () => set({ selected: [] }),

  updateDraft: (itemId, patch) => set((state) => ({
    drafts: { ...state.drafts, [itemId]: { ...state.drafts[itemId], ...patch } },
  })),
  updateScore: (itemId, key, value) => set((state) => ({
    drafts: {
      ...state.drafts,
      [itemId]: {
        ...state.drafts[itemId],
        scores: { ...state.drafts[itemId].scores, [key]: value },
        touchedScores: { ...state.drafts[itemId].touchedScores, [key]: true },
      },
    },
  })),
  updateMetadataValue: (itemId, name, value) => set((state) => ({
    drafts: { ...state.drafts, [itemId]: { ...state.drafts[itemId], metadata: { ...state.drafts[itemId].metadata, [name]: value } } },
  })),

  submitAnnotation: (itemId) => {
    const state = get();
    const item = state.items[itemId];
    if (!item || item.review_state !== 'unlabeled') return { ok: false, error: 'Item is no longer unlabeled' };
    const draft = state.drafts[itemId];
    if (!draft.rating) return { ok: false, error: 'rating: choose up or down' };
    if (!Object.values(draft.touchedScores).every(Boolean)) return { ok: false, error: 'scores: interact with Accuracy, Clarity, and Relevance' };
    const payload = { rating: draft.rating, scores: draft.scores, comment: draft.comment, metadata: draft.metadata, regions: draft.regions.map(({ id, ...region }) => region) };
    const result = AnnotationCreateSchema.safeParse(payload);
    if (!result.success) return { ok: false, error: firstZodError(result.error) };
    const metadataError = validateMetadata(result.data.metadata, state.metadataFields);
    if (metadataError) return { ok: false, error: `metadata.${metadataError}` };
    for (const region of result.data.regions) {
      const attributeError = validateRegionAttributes(region, state.taxonomy);
      if (attributeError) return { ok: false, error: `regions: ${attributeError}` };
    }
    transact(set, get, 'Submitted annotation', (current) => {
      const items = { ...current.items, [itemId]: { ...current.items[itemId], annotation: result.data, review_state: 'labeled', submittedAt: nowIso() } };
      const shadow = { ...current, items };
      return {
        items,
        historyOrder: [itemId, ...current.historyOrder.filter((id) => id !== itemId)],
        activeItemId: firstUnlabeled(shadow, item.suiteId),
        selected: current.selected.filter((id) => id !== itemId),
        liveMessage: `Annotation submitted for ${item.title}`,
      };
    });
    get().setToast('Annotation submitted');
    return { ok: true };
  },

  skipItems: (itemIds) => {
    const ids = itemIds.filter((id) => get().items[id]?.review_state === 'unlabeled');
    if (!ids.length) return;
    transact(set, get, ids.length === 1 ? 'Skipped item' : `Skipped ${ids.length} items`, (state) => {
      const bySuite = new Map();
      ids.forEach((id) => {
        const suiteId = state.items[id].suiteId;
        bySuite.set(suiteId, [...(bySuite.get(suiteId) || []), id]);
      });
      const suites = state.suites.map((suite) => {
        const moved = bySuite.get(suite.id) || [];
        return moved.length ? { ...suite, itemIds: [...suite.itemIds.filter((id) => !moved.includes(id)), ...moved] } : suite;
      });
      const items = { ...state.items };
      ids.forEach((id) => { items[id] = { ...items[id], skipped: items[id].skipped + 1 }; });
      return { suites, items, selected: [], activeItemId: ids.includes(state.activeItemId) ? firstUnlabeled({ ...state, suites, items }, state.activeSuiteId) : state.activeItemId };
    });
    get().setToast(ids.length === 1 ? 'Item moved to the end' : `${ids.length} items moved to the end`);
  },

  bulkMarkReviewed: () => {
    const ids = [...get().selected];
    if (!ids.length) return;
    transact(set, get, `Marked ${ids.length} items reviewed`, (state) => {
      const items = { ...state.items };
      ids.forEach((id) => {
        if (!items[id]) return;
        items[id] = { ...items[id], review_state: 'reviewed', annotation: items[id].annotation || defaultAnnotation(state, id), submittedAt: items[id].submittedAt || nowIso() };
      });
      return { items, selected: [], historyOrder: [...new Set([...ids, ...state.historyOrder])] };
    });
    get().setToast(`${ids.length} items marked Reviewed`);
  },

  addRegion: (itemId, region) => {
    const state = get();
    const clean = { ...region, attributeValues: region.attributeValues || {} };
    const parsed = RegionCreateSchema.safeParse(clean);
    if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
    const attributeError = validateRegionAttributes(parsed.data, state.taxonomy);
    if (attributeError) return { ok: false, error: attributeError };
    const id = uid('region');
    transact(set, get, 'Added region', (current) => ({
      drafts: { ...current.drafts, [itemId]: { ...current.drafts[itemId], regions: [...current.drafts[itemId].regions, { id, ...parsed.data }] } },
      selectedRegionId: id,
    }));
    return { ok: true, id };
  },
  deleteRegion: (itemId, regionId) => {
    const draft = get().drafts[itemId];
    if (!draft?.regions.some((r) => r.id === regionId)) return;
    transact(set, get, 'Deleted region', (state) => ({
      drafts: { ...state.drafts, [itemId]: { ...state.drafts[itemId], regions: state.drafts[itemId].regions.filter((r) => r.id !== regionId) } },
      selectedRegionId: state.selectedRegionId === regionId ? null : state.selectedRegionId,
    }));
  },
  selectRegion: (selectedRegionId) => set({ selectedRegionId }),
  updateRegionAttributes: (itemId, regionId, attributeValues) => set((state) => ({
    drafts: {
      ...state.drafts,
      [itemId]: {
        ...state.drafts[itemId],
        regions: state.drafts[itemId].regions.map((region) => region.id === regionId ? { ...region, attributeValues } : region),
      },
    },
  })),
  updateRegionUi: (itemId, patch) => set((state) => ({ regionUi: { ...state.regionUi, [itemId]: { zoom: 1, panX: 0, panY: 0, tool: 'draw', armedClassId: state.taxonomy[0]?.id, ...state.regionUi[itemId], ...patch } } })),

  saveTaxonomyClass: (payload, editingId = null) => {
    const parsed = TaxonomyClassCreateSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
    const state = get();
    const nameConflict = state.taxonomy.find((c) => c.id !== editingId && c.name.toLowerCase() === parsed.data.name.toLowerCase());
    if (nameConflict) return { ok: false, field: 'name', error: `Name conflicts with ${nameConflict.name}` };
    const shortcutConflict = state.taxonomy.find((c) => c.id !== editingId && c.shortcut === parsed.data.shortcut);
    if (shortcutConflict) return { ok: false, field: 'shortcut', error: `Shortcut ${parsed.data.shortcut} is already used by ${shortcutConflict.name}` };
    const id = editingId || uid('cls');
    transact(set, get, editingId ? 'Edited taxonomy class' : 'Created taxonomy class', (current) => ({
      taxonomy: editingId
        ? current.taxonomy.map((cls) => cls.id === editingId ? { id, ...parsed.data } : cls)
        : [...current.taxonomy, { id, ...parsed.data }],
    }));
    return { ok: true, id };
  },
  deleteTaxonomyClass: (classId) => {
    if (classId === 'cls-unclassified') return;
    transact(set, get, 'Deleted taxonomy class', (state) => {
      const replace = (regions) => regions.map((region) => region.classId === classId ? { ...region, classId: 'cls-unclassified', attributeValues: {} } : region);
      const items = Object.fromEntries(Object.entries(state.items).map(([id, item]) => [id, item.annotation ? { ...item, annotation: { ...item.annotation, regions: replace(item.annotation.regions) } } : item]));
      const drafts = Object.fromEntries(Object.entries(state.drafts).map(([id, draft]) => [id, { ...draft, regions: replace(draft.regions) }]));
      return { taxonomy: state.taxonomy.filter((c) => c.id !== classId), items, drafts };
    });
  },

  saveMetadataField: (payload) => {
    const parsed = MetadataFieldCreateSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
    const state = get();
    const conflict = state.metadataFields.find((f) => f.name.toLowerCase() === parsed.data.name.toLowerCase());
    if (conflict) return { ok: false, field: 'name', error: `Name conflicts with ${conflict.name}` };
    const field = { id: uid('meta'), ...parsed.data };
    const value = field.kind === 'select' ? field.options[0] : field.kind === 'checkbox' ? false : field.kind === 'number' ? 0 : '';
    transact(set, get, 'Created metadata field', (current) => ({
      metadataFields: [...current.metadataFields, field],
      drafts: Object.fromEntries(Object.entries(current.drafts).map(([id, draft]) => [id, { ...draft, metadata: { ...draft.metadata, [field.name]: value } }])),
    }));
    return { ok: true };
  },
  deleteMetadataField: (fieldId) => {
    const target = get().metadataFields.find((f) => f.id === fieldId);
    if (!target) return;
    transact(set, get, 'Deleted metadata field', (state) => {
      const items = Object.fromEntries(Object.entries(state.items).map(([id, item]) => {
        if (!item.annotation) return [id, item];
        const metadata = { ...item.annotation.metadata };
        delete metadata[target.name];
        return [id, { ...item, annotation: { ...item.annotation, metadata } }];
      }));
      const drafts = Object.fromEntries(Object.entries(state.drafts).map(([id, draft]) => {
        const metadata = { ...draft.metadata };
        delete metadata[target.name];
        return [id, { ...draft, metadata }];
      }));
      return { metadataFields: state.metadataFields.filter((f) => f.id !== fieldId), items, drafts };
    });
  },

  setReviewState: (itemId, review_state, extra = {}) => {
    const state = get();
    const item = state.items[itemId];
    if (!item) return;
    transact(set, get, review_state === 'disputed' ? 'Disputed item' : review_state === 'reviewed' ? 'Marked item reviewed' : 'Changed review state', (current) => ({
      items: {
        ...current.items,
        [itemId]: {
          ...current.items[itemId],
          review_state,
          annotation: current.items[itemId].annotation || (review_state !== 'unlabeled' ? defaultAnnotation(current, itemId) : null),
          lastDisputedAt: review_state === 'disputed' ? Date.now() : current.items[itemId].lastDisputedAt,
          ...extra,
        },
      },
      historyOrder: review_state !== 'unlabeled' && !current.historyOrder.includes(itemId) ? [itemId, ...current.historyOrder] : current.historyOrder,
    }));
  },
  resolveDispute: (itemId, rating) => {
    const item = get().items[itemId];
    if (!item?.annotation || !['up', 'down'].includes(rating)) return { ok: false, error: 'rating: choose up or down' };
    transact(set, get, 'Resolved dispute', (state) => ({
      items: { ...state.items, [itemId]: { ...state.items[itemId], review_state: 'reviewed', annotation: { ...state.items[itemId].annotation, rating }, disputeReason: '' } },
    }));
    get().setToast('Dispute resolved');
    return { ok: true };
  },

  undo: () => {
    const state = get();
    const action = state.undoStack.at(-1);
    if (!action) return;
    set({
      ...clone(action.before),
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, action],
      actionHistory: state.actionHistory.map((entry) => entry.id === action.id ? { ...entry, reverted: true } : entry),
    });
  },
  redo: () => {
    const state = get();
    const action = state.redoStack.at(-1);
    if (!action) return;
    set({
      ...clone(action.after),
      undoStack: [...state.undoStack, action],
      redoStack: state.redoStack.slice(0, -1),
      actionHistory: state.actionHistory.map((entry) => entry.id === action.id ? { ...entry, reverted: false } : entry),
    });
  },

  importLabels: (raw) => {
    let value;
    try { value = JSON.parse(raw); } catch { return { ok: false, error: 'JSON: malformed Labels JSON' }; }
    const parsed = LabelsPackageSchema.safeParse(value);
    if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
    for (const packageItem of parsed.data.items) {
      if (!packageItem.annotation) continue;
      const metadataError = validateMetadata(packageItem.annotation.metadata, parsed.data.metadataFields);
      if (metadataError) return { ok: false, error: `items.${packageItem.id}.metadata: ${metadataError}` };
      for (const region of packageItem.annotation.regions) {
        const attrError = validateRegionAttributes(region, parsed.data.taxonomy);
        if (attrError) return { ok: false, error: `items.${packageItem.id}.regions: ${attrError}` };
      }
    }
    transact(set, get, 'Imported Labels JSON', (state) => {
      const items = { ...state.items };
      const suites = [...state.suites];
      parsed.data.items.forEach((incoming) => {
        let item = items[incoming.id];
        let suite = suites.find((s) => s.name === incoming.suite);
        if (!suite) {
          suite = { id: uid('suite'), name: incoming.suite, code: incoming.suite.slice(0, 3).toUpperCase(), itemIds: [] };
          suites.push(suite);
        }
        if (!item) {
          item = { id: incoming.id, suiteId: suite.id, title: incoming.id, prompt: 'Imported evaluation prompt', response: 'Imported evaluation response', image: null, skipped: 0, submittedAt: null };
          suite.itemIds.push(incoming.id);
        }
        items[incoming.id] = { ...item, suiteId: suite.id, review_state: incoming.review_state, annotation: incoming.annotation, submittedAt: incoming.annotation ? item.submittedAt || nowIso() : null };
      });
      const metadataDefaults = defaultMetadata(parsed.data.metadataFields);
      const drafts = Object.fromEntries(Object.keys(items).map((id) => [id, {
        rating: null,
        scores: { Accuracy: 3, Clarity: 3, Relevance: 3 },
        touchedScores: { Accuracy: false, Clarity: false, Relevance: false },
        comment: '',
        ...(state.drafts[id] || {}),
        metadata: { ...metadataDefaults },
        regions: [],
      }]));
      return {
        taxonomy: parsed.data.taxonomy,
        metadataFields: parsed.data.metadataFields,
        items,
        suites,
        drafts,
        historyOrder: parsed.data.items.filter((item) => item.annotation).map((item) => item.id).reverse(),
        activeItemId: firstUnlabeled({ ...state, items, suites }, state.activeSuiteId),
        selected: [],
        liveMessage: 'Labels JSON imported successfully',
      };
    });
    get().setToast('Labels JSON imported');
    return { ok: true };
  },

  startAssist: (suiteId) => {
    const state = get();
    const itemIds = state.suites.find((s) => s.id === suiteId)?.itemIds.filter((id) => state.items[id]?.review_state === 'unlabeled') || [];
    if (!itemIds.length) return { ok: false, error: 'There is nothing to pre-label in this suite.' };
    const startedAt = Date.now();
    const run = {
      suiteId,
      status: 'running',
      startedAt,
      pausedAt: null,
      finishedAt: null,
      timelineFilter: 'all',
      selectedEventId: null,
      steps: itemIds.map((itemId, index) => ({ id: uid('step'), itemId, title: state.items[itemId].title, status: 'pending', attempts: 0, maxAttempts: 3, forceFailure: index === 2, manualRetried: false, startedAt: null, completedAt: null, retryAt: null, error: null })),
      events: [{ id: uid('event'), stepId: null, status: 'running', text: 'Assist run started', at: startedAt }],
    };
    set((current) => ({ assistRuns: { ...current.assistRuns, [suiteId]: run }, activeAssistSuiteId: suiteId }));
    return { ok: true };
  },
  pauseAssist: (suiteId) => set((state) => {
    const run = state.assistRuns[suiteId];
    if (!run || run.status !== 'running') return {};
    const at = Date.now();
    return { assistRuns: { ...state.assistRuns, [suiteId]: { ...run, status: 'paused', pausedAt: at, events: [...run.events, { id: uid('event'), stepId: null, status: 'paused', text: 'Assist run paused', at }] } } };
  }),
  resumeAssist: (suiteId) => set((state) => {
    const run = state.assistRuns[suiteId];
    if (!run || run.status !== 'paused') return {};
    const at = Date.now();
    const delta = at - run.pausedAt;
    const steps = run.steps.map((step) => ({ ...step, startedAt: step.status === 'running' && step.startedAt ? step.startedAt + delta : step.startedAt, retryAt: step.status === 'retrying' && step.retryAt ? step.retryAt + delta : step.retryAt }));
    return { assistRuns: { ...state.assistRuns, [suiteId]: { ...run, steps, status: 'running', pausedAt: null, events: [...run.events, { id: uid('event'), stepId: null, status: 'running', text: 'Assist run resumed', at }] } } };
  }),
  retryAssistStep: (suiteId, stepId) => set((state) => {
    const run = state.assistRuns[suiteId];
    if (!run) return {};
    const at = Date.now();
    return { assistRuns: { ...state.assistRuns, [suiteId]: { ...run, status: 'running', finishedAt: null, steps: run.steps.map((step) => step.id === stepId ? { ...step, status: 'running', attempts: 1, manualRetried: true, startedAt: at, completedAt: null, error: null } : step), events: [...run.events, { id: uid('event'), stepId, status: 'running', text: 'Manual retry started', at }] } } };
  }),
  setAssistFilter: (suiteId, timelineFilter) => set((state) => ({ assistRuns: { ...state.assistRuns, [suiteId]: { ...state.assistRuns[suiteId], timelineFilter } } })),
  selectAssistEvent: (suiteId, selectedEventId) => set((state) => ({ assistRuns: { ...state.assistRuns, [suiteId]: { ...state.assistRuns[suiteId], selectedEventId } } })),
  tickAssist: () => set((state) => {
    const suiteId = state.activeAssistSuiteId;
    const run = state.assistRuns[suiteId];
    if (!run || run.status !== 'running') return {};
    const at = Date.now();
    let steps = [...run.steps];
    let events = [...run.events];
    const activeIndex = steps.findIndex((step) => step.status === 'running' || step.status === 'retrying');
    if (activeIndex >= 0) {
      const step = steps[activeIndex];
      if (step.status === 'retrying' && at >= step.retryAt) {
        steps[activeIndex] = { ...step, status: 'running', attempts: step.attempts + 1, startedAt: at };
        events.push({ id: uid('event'), stepId: step.id, status: 'running', text: `Attempt ${step.attempts + 1} started`, at });
      } else if (step.status === 'running' && at - step.startedAt >= 900) {
        const shouldFail = !step.manualRetried && (step.forceFailure || (step.attempts === 1 && Math.random() < 0.13));
        if (shouldFail) {
          if (step.attempts < step.maxAttempts) {
            steps[activeIndex] = { ...step, status: 'retrying', retryAt: at + 1300, error: 'Transient model capacity error' };
            events.push({ id: uid('event'), stepId: step.id, status: 'retrying', text: `Waiting before retry ${step.attempts + 1} of ${step.maxAttempts}`, at });
          } else {
            steps[activeIndex] = { ...step, status: 'failed', completedAt: at, error: 'Assist failed after 3 attempts' };
            events.push({ id: uid('event'), stepId: step.id, status: 'failed', text: 'Step failed after 3 attempts', at });
          }
        } else {
          steps[activeIndex] = { ...step, status: 'complete', completedAt: at, error: null };
          events.push({ id: uid('event'), stepId: step.id, status: 'complete', text: 'Suggestion attached', at });
          const scoreBase = 3 + Math.floor(Math.random() * 3);
          const items = { ...state.items, [step.itemId]: { ...state.items[step.itemId], suggested: { rating: Math.random() > 0.28 ? 'up' : 'down', scores: { Accuracy: scoreBase, Clarity: 3 + Math.floor(Math.random() * 3), Relevance: 3 + Math.floor(Math.random() * 3) } } } };
          const nextRun = { ...run, steps, events };
          return { items, assistRuns: { ...state.assistRuns, [suiteId]: nextRun } };
        }
      }
    } else {
      const nextIndex = steps.findIndex((step) => step.status === 'pending');
      if (nextIndex >= 0) {
        const step = steps[nextIndex];
        steps[nextIndex] = { ...step, status: 'running', attempts: 1, startedAt: at };
        events.push({ id: uid('event'), stepId: step.id, status: 'running', text: 'Step started', at });
      } else {
        const finishedAt = at;
        return { assistRuns: { ...state.assistRuns, [suiteId]: { ...run, steps, events: [...events, { id: uid('event'), stepId: null, status: 'complete', text: 'Assist run complete', at }], status: 'complete', finishedAt } }, liveMessage: 'Assist run completed' };
      }
    }
    return { assistRuns: { ...state.assistRuns, [suiteId]: { ...run, steps, events } } };
  }),
  acceptSuggestion: (itemId) => {
    const suggestion = get().items[itemId]?.suggested;
    if (!suggestion) return;
    set((state) => ({ drafts: { ...state.drafts, [itemId]: { ...state.drafts[itemId], rating: suggestion.rating, scores: suggestion.scores, touchedScores: { Accuracy: true, Clarity: true, Relevance: true } } } }));
  },
}));

export function getClassRegionCount(state, classId) {
  return Object.values(state.items).reduce((sum, item) => sum + (item.annotation?.regions.filter((r) => r.classId === classId).length || 0), 0)
    + Object.values(state.drafts).reduce((sum, draft) => sum + draft.regions.filter((r) => r.classId === classId).length, 0);
}

export function getMetadataValueCount(state, fieldName) {
  return Object.values(state.items).filter((item) => item.annotation && Object.hasOwn(item.annotation.metadata, fieldName)).length;
}
