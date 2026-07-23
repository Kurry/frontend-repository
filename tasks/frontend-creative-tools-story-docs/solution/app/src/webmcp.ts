/**
 * WebMCP contract surface (zto-webmcp-v1).
 *
 * Modules: browse-query-v1, form-workflow-v1, entity-collection-v1,
 * artifact-transfer-v1 — exactly the operations declared in the Bindings.
 * Every handler invokes the same application logic as the visible UI
 * (the shared Nanostores + mutation functions), so automation and the
 * rendered board can never diverge. Results carry observable postconditions
 * but never artifact contents (those stay a Playwright/clipboard concern).
 */
import {
  scenesStore,
  viewModeStore,
  statusFilterStore,
  searchFilterStore,
  activeSlideIndexStore,
  filteredScenes,
  addScene,
  editScene,
  deleteScene,
  reorderScenes,
  toggleCheckbox,
  type Scene,
} from './store';
import {
  isExportDrawerOpenStore,
  isCommandPaletteOpenStore,
  isImportModalOpenStore,
  isAddSceneOpenStore,
  exportFormatStore,
  createStepStore,
  openAddScene,
  closeAddScene,
  formDefaultsStore,
  formExternalErrorsStore,
  showToast,
  type CreateStep,
} from './store/ui';
import { validateSceneFields, STATUSES, type Status } from './lib/schema';
import { isExportFormat, type ExportFormat } from './lib/exporters';
import { compileArtifact } from './lib/exporters';
import { copyTextToClipboard } from './components/features/ExportDrawer';
import { checklistStats, toggleChecklistLine } from './lib/markdown';

type ToolResult = Record<string, unknown>;

const DESTINATIONS = ['scene-list', 'scene-detail', 'tutorial-steps', 'export-drawer', 'command-palette'] as const;
const FORM_STEPS: CreateStep[] = ['intro', 'edit', 'review'];

function sceneSummary(s: Scene) {
  return {
    id: s.id,
    order: s.order,
    title: s.title,
    status: s.status,
    cameraNote: s.cameraNote ?? null,
    checklist: checklistStats(s.body),
    versions: s.versions.length,
  };
}

function boardPostconditions() {
  return {
    sceneCount: scenesStore.get().length,
    visibleCount: filteredScenes.get().length,
    viewMode: viewModeStore.get(),
    statusFilter: statusFilterStore.get(),
    search: searchFilterStore.get(),
    visibleScenes: filteredScenes.get().map((s) => ({ id: s.id, order: s.order, title: s.title, status: s.status })),
  };
}

function fail(error: string, extra: Record<string, unknown> = {}): ToolResult {
  return { success: false, error, ...extra };
}

/* ----------------------------- handlers ----------------------------- */

function handleBrowseOpen(params: Record<string, unknown>): ToolResult {
  const destination = params.destination as string;
  if (!DESTINATIONS.includes(destination as (typeof DESTINATIONS)[number])) {
    return fail(`Unknown destination "${destination}". Declared: ${DESTINATIONS.join(', ')}.`);
  }
  switch (destination) {
    case 'scene-list':
      viewModeStore.set('tile');
      return { success: true, destination, ...boardPostconditions() };
    case 'scene-detail': {
      viewModeStore.set('slide');
      const id = typeof params.id === 'string' ? params.id : null;
      if (id) {
        let visible = filteredScenes.get();
        let idx = visible.findIndex((s) => s.id === id);
        if (idx === -1) {
          statusFilterStore.set('all');
          searchFilterStore.set('');
          visible = filteredScenes.get();
          idx = visible.findIndex((s) => s.id === id);
        }
        if (idx === -1) return fail(`No scene with id "${id}".`, boardPostconditions());
        activeSlideIndexStore.set(idx);
        return {
          success: true,
          destination,
          activeScene: sceneSummary(visible[idx]),
          slideIndex: idx,
          slideCount: visible.length,
        };
      }
      return {
        success: true,
        destination,
        slideIndex: activeSlideIndexStore.get(),
        slideCount: filteredScenes.get().length,
        ...boardPostconditions(),
      };
    }
    case 'tutorial-steps': {
      statusFilterStore.set('all');
      searchFilterStore.set('');
      viewModeStore.set('tile');
      window.scrollTo({ top: 0 });
      return { success: true, destination, stepCount: scenesStore.get().length, ...boardPostconditions() };
    }
    case 'export-drawer': {
      const format = params.format;
      if (format !== undefined && !isExportFormat(format)) {
        return fail(`Unknown export format "${format}". Declared: markdown, json, outline.`);
      }
      if (isExportFormat(format)) exportFormatStore.set(format);
      isExportDrawerOpenStore.set(true);
      return { success: true, destination, format: exportFormatStore.get(), sceneCount: scenesStore.get().length };
    }
    case 'command-palette':
      isCommandPaletteOpenStore.set(true);
      return { success: true, destination, commandCount: 9 };
  }
  return fail('Unreachable');
}

function handleBrowseSearch(params: Record<string, unknown>): ToolResult {
  const query = typeof params.query === 'string' ? params.query : '';
  searchFilterStore.set(query);
  return { success: true, query, ...boardPostconditions() };
}

function handleBrowseApplyFilter(params: Record<string, unknown>): ToolResult {
  const name = params.filter_name ?? params.filter;
  const value = params.value;
  if (name === 'status') {
    if (value !== 'all' && !STATUSES.includes(value as Status)) {
      return fail(`Invalid status "${String(value)}". Declared: all, ${STATUSES.join(', ')}.`);
    }
    statusFilterStore.set(value as Status | 'all');
  } else if (name === 'search') {
    searchFilterStore.set(typeof value === 'string' ? value : '');
  } else {
    return fail(`Unknown filter "${String(name)}". Declared: status, search.`);
  }
  return { success: true, filter: name, value, ...boardPostconditions() };
}

function handleBrowseClearFilter(params: Record<string, unknown>): ToolResult {
  const name = params.filter_name ?? params.filter;
  if (name === 'status') statusFilterStore.set('all');
  else if (name === 'search') searchFilterStore.set('');
  else {
    statusFilterStore.set('all');
    searchFilterStore.set('');
  }
  return { success: true, cleared: name ?? 'all', ...boardPostconditions() };
}

/* ------------------------------- form ------------------------------- */

function normalizeFormFields(params: Record<string, unknown>) {
  const fields = (params.fields ?? {}) as Record<string, unknown>;
  return {
    title: fields.title,
    body: fields.body,
    cameraNote: fields.cameraNote,
    status: fields.status ?? 'draft',
  };
}

function handleFormValidate(params: Record<string, unknown>): ToolResult {
  const check = validateSceneFields(normalizeFormFields(params) as Record<string, unknown>);
  if (check.valid) return { success: true, valid: true, errors: {} };
  return { success: true, valid: false, errors: check.errors };
}

function handleFormSubmit(params: Record<string, unknown>): ToolResult {
  const payload = normalizeFormFields(params);
  const check = validateSceneFields(payload as Record<string, unknown>);
  if (!check.valid) {
    // Surface honest visible errors through the same form the UI uses.
    formDefaultsStore.set({
      title: typeof payload.title === 'string' ? payload.title : '',
      body: typeof payload.body === 'string' ? payload.body : '',
      cameraNote: typeof payload.cameraNote === 'string' ? payload.cameraNote : '',
      status: typeof payload.status === 'string' ? payload.status : 'draft',
    });
    formExternalErrorsStore.set(check.errors);
    openAddScene('edit');
    return fail('Validation failed — the create form is open with inline errors.', { errors: check.errors });
  }
  const scene = addScene(check.value);
  closeAddScene();
  showToast(`Scene Added as Scene ${scene.order}`);
  return { success: true, scene: sceneSummary(scene), ...boardPostconditions() };
}

function handleFormCancel(): ToolResult {
  closeAddScene();
  return { success: true, formOpen: false };
}

function handleFormAdvance(): ToolResult {
  if (!isAddSceneOpenStore.get()) openAddScene('intro');
  const idx = FORM_STEPS.indexOf(createStepStore.get());
  const next = FORM_STEPS[Math.min(idx + 1, FORM_STEPS.length - 1)];
  createStepStore.set(next);
  return { success: true, step: next, steps: FORM_STEPS };
}

function handleFormReturn(): ToolResult {
  if (!isAddSceneOpenStore.get()) openAddScene('intro');
  const idx = FORM_STEPS.indexOf(createStepStore.get());
  const prev = FORM_STEPS[Math.max(idx - 1, 0)];
  createStepStore.set(prev);
  return { success: true, step: prev, steps: FORM_STEPS };
}

/* ------------------------------ entity ------------------------------ */

function findScene(id: unknown): Scene | undefined {
  return typeof id === 'string' ? scenesStore.get().find((s) => s.id === id) : undefined;
}

function handleEntityCreate(params: Record<string, unknown>): ToolResult {
  if (params.entity !== 'scene') return fail('Only entity "scene" is declared.');
  const check = validateSceneFields(normalizeFormFields(params) as Record<string, unknown>);
  if (!check.valid) return fail('Scene rejected by the field contract.', { errors: check.errors });
  const scene = addScene(check.value);
  // Keep MCP and UI coherent: a committed create supersedes any open create form.
  closeAddScene();
  showToast(`Scene Added as Scene ${scene.order}`);
  return { success: true, scene: sceneSummary(scene), ...boardPostconditions() };
}

function handleEntitySelect(params: Record<string, unknown>): ToolResult {
  if (params.entity !== 'scene') return fail('Only entity "scene" is declared.');
  const scene = findScene(params.id);
  if (!scene) return fail(`No scene with id "${String(params.id)}".`, boardPostconditions());
  statusFilterStore.set('all');
  searchFilterStore.set('');
  viewModeStore.set('slide');
  const idx = filteredScenes.get().findIndex((s) => s.id === scene.id);
  activeSlideIndexStore.set(Math.max(0, idx));
  return { success: true, scene: sceneSummary(scene), slideIndex: idx, slideCount: filteredScenes.get().length };
}

function handleEntityUpdate(params: Record<string, unknown>): ToolResult {
  if (params.entity !== 'scene') return fail('Only entity "scene" is declared.');
  const scene = findScene(params.id);
  if (!scene) return fail(`No scene with id "${String(params.id)}".`, boardPostconditions());
  const fields = (params.fields ?? {}) as Record<string, unknown>;
  const allowed = ['title', 'body', 'cameraNote', 'status'] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) if (key in fields) updates[key] = fields[key];
  if (Object.keys(updates).length === 0) return fail('No updatable fields provided (title, body, cameraNote, status).');

  const merged = {
    title: 'title' in updates ? updates.title : scene.title,
    body: 'body' in updates ? updates.body : scene.body,
    cameraNote: 'cameraNote' in updates ? updates.cameraNote : scene.cameraNote ?? '',
    status: 'status' in updates ? updates.status : scene.status,
  };
  const check = validateSceneFields(merged as Record<string, unknown>);
  if (!check.valid) return fail('Update rejected by the field contract.', { errors: check.errors });

  editScene(scene.id, check.value);
  const updated = findScene(scene.id)!;
  return { success: true, scene: sceneSummary(updated), ...boardPostconditions() };
}

function handleEntityDelete(params: Record<string, unknown>): ToolResult {
  if (params.entity !== 'scene') return fail('Only entity "scene" is declared.');
  if (params.confirm !== true) return fail('entity_delete requires confirm=true.');
  const scene = findScene(params.id);
  if (!scene) return fail(`No scene with id "${String(params.id)}".`, boardPostconditions());
  deleteScene(scene.id);
  showToast('Scene Deleted');
  return { success: true, deletedId: scene.id, ...boardPostconditions() };
}

function handleEntityToggle(params: Record<string, unknown>): ToolResult {
  if (params.entity !== 'scene') return fail('Only entity "scene" is declared.');
  const scene = findScene(params.id);
  if (!scene) return fail(`No scene with id "${String(params.id)}".`, boardPostconditions());
  const stats = checklistStats(scene.body);
  if (stats.total > 0) {
    const rawIndex = typeof params.item_index === 'number' ? Math.floor(params.item_index) : 0;
    const index = Math.min(Math.max(rawIndex, 0), stats.total - 1);
    const nextBody = toggleChecklistLine(scene.body, index);
    if (!nextBody) return fail('Checklist toggle failed.');
    // Same domain command as clicking the rendered checkbox: no version snapshot.
    toggleCheckbox(scene.id, nextBody);
    const after = checklistStats(nextBody);
    return {
      success: true,
      toggled: 'checklist-item',
      item_index: index,
      checked: after.checked,
      total: after.total,
      ...boardPostconditions(),
    };
  }
  // No checklist on this scene: toggle its status between draft and ready.
  const nextStatus: Status = scene.status === 'ready' ? 'draft' : 'ready';
  editScene(scene.id, { status: nextStatus });
  return { success: true, toggled: 'status', status: nextStatus, ...boardPostconditions() };
}

function handleEntityReorder(params: Record<string, unknown>): ToolResult {
  if (params.entity !== 'scene') return fail('Only entity "scene" is declared.');
  const scenes = [...scenesStore.get()].sort((a, b) => a.order - b.order);
  let from: number;
  if (typeof params.from_index === 'number') from = params.from_index;
  else {
    const idx = scenes.findIndex((s) => s.id === params.id);
    if (idx === -1) return fail(`No scene with id "${String(params.id)}".`);
    from = idx;
  }
  const to = typeof params.to_index === 'number' ? params.to_index : from;
  const ok = reorderScenes(from, to);
  if (!ok) return fail(`Cannot move index ${from} to ${to} (board has ${scenes.length} scenes).`);
  showToast('Scenes Reordered');
  return {
    success: true,
    order: scenesStore.get().map((s) => ({ id: s.id, order: s.order, title: s.title })),
    ...boardPostconditions(),
  };
}

/* ------------------------------ artifact ----------------------------- */

function handleArtifactExport(params: Record<string, unknown>): ToolResult {
  const format = params.format;
  if (format !== undefined && !isExportFormat(format)) {
    return fail(`Unknown export format "${format}". Declared: markdown, json, outline.`);
  }
  const fmt: ExportFormat = isExportFormat(format) ? format : exportFormatStore.get();
  exportFormatStore.set(fmt);
  isExportDrawerOpenStore.set(true);
  return { success: true, format: fmt, sceneCount: scenesStore.get().length, drawerOpen: true };
}

function handleArtifactImport(params: Record<string, unknown>): ToolResult {
  const mode = params.mode ?? 'storyboard-json';
  if (mode !== 'storyboard-json') return fail(`Unknown import mode "${String(mode)}". Declared: storyboard-json.`);
  isImportModalOpenStore.set(true);
  return {
    success: true,
    mode,
    importOpen: true,
    note: 'Paste the package text or choose a file in the open Import dialog; raw payloads are not accepted over WebMCP.',
  };
}

async function handleArtifactCopy(params: Record<string, unknown>): Promise<ToolResult> {
  const format = params.format;
  if (format !== undefined && !isExportFormat(format)) {
    return fail(`Unknown export format "${format}". Declared: markdown, json, outline.`);
  }
  const fmt: ExportFormat = isExportFormat(format) ? format : exportFormatStore.get();
  exportFormatStore.set(fmt);
  isExportDrawerOpenStore.set(true);
  const ok = await copyTextToClipboard(compileArtifact(scenesStore.get(), fmt));
  if (ok) showToast('Copied to Clipboard');
  return { success: ok, format: fmt, copied: ok };
}

/* --------------------------- surface setup --------------------------- */

const TOOL_DESCRIPTORS: { name: string; description: string }[] = [
  { name: 'browse_open', description: 'Open a declared destination: scene-list, scene-detail, tutorial-steps, export-drawer, or command-palette.' },
  { name: 'browse_search', description: 'Search scenes by case-insensitive substring against title or body (params: query).' },
  { name: 'browse_apply_filter', description: 'Apply a declared filter (params: filter_name=status|search, value).' },
  { name: 'browse_clear_filter', description: 'Clear a declared filter, or both when filter_name is omitted.' },
  { name: 'form_validate', description: 'Validate Add Scene fields (title, body, cameraNote, status) against the field contract without submitting.' },
  { name: 'form_submit', description: 'Submit Add Scene fields; valid input adds one scene, invalid input opens the form with inline errors.' },
  { name: 'form_cancel', description: 'Close the Add Scene form without creating a scene.' },
  { name: 'form_advance', description: 'Advance the Add Scene workflow one step (intro → edit → review).' },
  { name: 'form_return', description: 'Return the Add Scene workflow one step (review → edit → intro).' },
  { name: 'entity_create', description: 'Create a scene (params: entity=scene, fields={title, body, cameraNote?, status?}); validated against the field contract.' },
  { name: 'entity_select', description: 'Open a scene as the active slide (params: entity=scene, id).' },
  { name: 'entity_update', description: 'Update scene fields title/body/cameraNote/status (params: entity=scene, id, fields); appends a version on change.' },
  { name: 'entity_delete', description: 'Delete a scene (params: entity=scene, id, confirm=true required).' },
  { name: 'entity_toggle', description: 'Toggle a scene checklist item (params: entity=scene, id, item_index?), or the scene status when it has no checklist.' },
  { name: 'entity_reorder', description: 'Move a scene to a new board position (params: entity=scene, from_index|id, to_index); renumbers contiguously.' },
  { name: 'artifact_export', description: 'Open the export drawer on a format tab (params: format=markdown|json|outline).' },
  { name: 'artifact_import', description: 'Open the storyboard-json import dialog (params: mode=storyboard-json).' },
  { name: 'artifact_copy', description: 'Copy the compiled artifact for a format to the clipboard (params: format=markdown|json|outline).' },
];

const TOOLS = {
  browse_open: handleBrowseOpen,
  browse_search: handleBrowseSearch,
  browse_apply_filter: handleBrowseApplyFilter,
  browse_clear_filter: handleBrowseClearFilter,
  form_validate: handleFormValidate,
  form_submit: handleFormSubmit,
  form_cancel: () => handleFormCancel(),
  form_advance: () => handleFormAdvance(),
  form_return: () => handleFormReturn(),
  entity_create: handleEntityCreate,
  entity_select: handleEntitySelect,
  entity_update: handleEntityUpdate,
  entity_delete: handleEntityDelete,
  entity_toggle: handleEntityToggle,
  entity_reorder: handleEntityReorder,
  artifact_export: handleArtifactExport,
  artifact_import: handleArtifactImport,
  artifact_copy: handleArtifactCopy,
} as const;

export function initWebMCP() {
  if (typeof window === 'undefined') return;
  const w = window as unknown as Record<string, unknown>;

  w.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    app: 'Story Docs — 1. Getting Started',
    modules: ['browse-query-v1', 'form-workflow-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    bound_modules: ['browse-query-v1', 'form-workflow-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    browsable_entity: 'scenes',
    destinations: [...DESTINATIONS],
    filters: ['status', 'search'],
    entity: 'scene',
    entity_operations: ['create', 'select', 'update', 'delete', 'toggle', 'reorder'],
    entity_fields: ['title', 'body', 'cameraNote', 'status', 'order'],
    form_fields: ['title', 'body', 'cameraNote', 'status'],
    form_operations: ['validate', 'submit', 'cancel', 'advance', 'return'],
    workflow_steps: [...FORM_STEPS],
    artifact_operations: ['export', 'import', 'copy'],
    export_formats: ['markdown', 'json', 'outline'],
    import_modes: ['storyboard-json'],
  });

  w.webmcp_list_tools = () => ({ tools: TOOL_DESCRIPTORS });

  w.webmcp_invoke_tool = (toolName: string, params?: Record<string, unknown>) => {
    const handler = TOOLS[toolName as keyof typeof TOOLS] as
      | ((p: Record<string, unknown>) => ToolResult | Promise<ToolResult>)
      | undefined;
    if (!handler) {
      return fail(`Unknown tool "${toolName}". Run webmcp_list_tools for the declared surface.`);
    }
    try {
      const result = handler(params ?? {});
      if (result instanceof Promise) {
        return result.catch((e) => fail(e instanceof Error ? e.message : String(e)));
      }
      return result;
    } catch (e) {
      return fail(e instanceof Error ? e.message : String(e));
    }
  };
}

// Register as early as possible (module evaluation precedes island mount).
initWebMCP();
