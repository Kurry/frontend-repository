import {
  S,
  CATS,
  type Category,
  type Reason,
  type Filter,
  entries,
  tags,
  listEntries,
  todayMinutes,
  meaningfulRatio,
  streakDays,
  addEntry,
  updateEntry,
  deleteEntry,
  openOverlay,
  closeOverlay,
  setFilter,
  setSearch,
  startTimer,
  stopTimer,
  restartTimer,
  localInputNow,
  sessionJSONText,
  timesheetCSV,
  copyText,
  toast
} from './state.svelte';

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['entity-collection-v1', 'browse-query-v1', 'command-session-v1', 'artifact-transfer-v1'];
const DESTINATIONS = ['timeline', 'weekly-chart', 'tag-manager', 'export-drawer', 'heat-map'];
const FILTER_VALUES = ['all', 'meaningful', 'neutral', 'draining'] as const;

type Result = Record<string, unknown>;
type Handler = (args: Result) => Result | Promise<Result>;

function normalizeCategory(c: unknown): Category | null {
  const raw = String(c ?? '').trim();
  if ((CATS as string[]).includes(raw)) return raw as Category;
  const lower = raw.toLowerCase();
  if (lower === 'meaningful') return 'Meaningful';
  if (lower === 'neutral') return 'Neutral';
  if (lower === 'draining') return 'Draining';
  return null;
}

function normalizeReason(r: unknown): Reason {
  const reason = String(r ?? '');
  if (reason === 'Internal' || reason === 'External') return reason;
  return null;
}

function onlyOverlay(which: string, editId?: string) {
  // Single overlay at a time — never stack dialogs across tool calls.
  S.overlay = null;
  openOverlay(which, editId);
}

function entityCreate(args: Result): Result {
  const name = String(args.name ?? '').trim();
  if (!name) return { ok: false, error: 'name is required' };
  const category = normalizeCategory(args.category);
  if (!category) return { ok: false, error: 'category must be Meaningful, Neutral, or Draining' };
  const dur = Math.trunc(Number(args.duration ?? args.durationMinutes));
  if (!Number.isFinite(dur) || dur < 1 || dur > 1440) {
    return { ok: false, error: 'duration must be an integer from 1 to 1440 minutes' };
  }
  let startTime = String(args['start-time'] ?? args.startTime ?? '');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startTime)) startTime = localInputNow();
  const tagRaw = args.tag;
  const tag =
    tagRaw === null || tagRaw === undefined || String(tagRaw).trim() === '' ? null : String(tagRaw).trim();
  const interruptionReason = normalizeReason(args['interruption-reason'] ?? args.interruptionReason);
  const entry = addEntry({ name, category, tag, durationMinutes: dur, startTime, interruptionReason });
  toast(`Saved entry “${name}” — ${dur} min`, 'save');
  return { ok: true, operation: 'create', id: entry.id, count: entries().length };
}

function entitySelect(args: Result): Result {
  const id = String(args.id ?? '');
  const entry = entries().find((e) => e.id === id);
  if (!entry) return { ok: false, error: `entry not found: ${id}` };
  onlyOverlay('edit', id);
  return { ok: true, operation: 'select', id, entry };
}

function entityUpdate(args: Result): Result {
  const id = String(args.id ?? '');
  const entry = entries().find((e) => e.id === id);
  if (!entry) return { ok: false, error: `entry not found: ${id}` };
  const patch: Partial<typeof entry> = {};
  if (args.name !== undefined) {
    const name = String(args.name).trim();
    if (!name) return { ok: false, error: 'name cannot be empty' };
    patch.name = name;
  }
  if (args.category !== undefined) {
    const category = normalizeCategory(args.category);
    if (!category) return { ok: false, error: 'category must be Meaningful, Neutral, or Draining' };
    patch.category = category;
  }
  if (args.tag !== undefined) {
    patch.tag = args.tag === null || String(args.tag).trim() === '' ? null : String(args.tag).trim();
  }
  if (args.duration !== undefined || args.durationMinutes !== undefined) {
    const dur = Math.trunc(Number(args.duration ?? args.durationMinutes));
    if (!Number.isFinite(dur) || dur < 1 || dur > 1440) {
      return { ok: false, error: 'duration must be an integer from 1 to 1440 minutes' };
    }
    patch.durationMinutes = dur;
  }
  if (args['start-time'] !== undefined || args.startTime !== undefined) {
    const st = String(args['start-time'] ?? args.startTime);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(st)) return { ok: false, error: 'invalid start-time' };
    patch.startTime = st;
  }
  if (args['interruption-reason'] !== undefined || args.interruptionReason !== undefined) {
    patch.interruptionReason = normalizeReason(args['interruption-reason'] ?? args.interruptionReason);
  }
  updateEntry(id, patch);
  toast(`Updated “${patch.name ?? entry.name}”`, 'save');
  if (S.overlay?.which === 'edit') closeOverlay();
  return { ok: true, operation: 'update', id, entry: entries().find((e) => e.id === id) };
}

function entityDelete(args: Result): Result {
  if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' };
  const id = String(args.id ?? '');
  const entry = entries().find((e) => e.id === id);
  if (!entry) return { ok: false, error: `entry not found: ${id}` };
  if (S.overlay) closeOverlay();
  deleteEntry(id);
  return { ok: true, operation: 'delete', id, count: entries().length };
}

function browseOpen(args: Result): Result {
  const destination = String(args.destination ?? '');
  if (!DESTINATIONS.includes(destination)) return { ok: false, error: `unknown destination: ${destination}` };
  if (destination === 'tag-manager') {
    onlyOverlay('tags');
    return { ok: true, operation: 'open', destination, opened: true };
  }
  if (destination === 'export-drawer') {
    onlyOverlay('export');
    return { ok: true, operation: 'open', destination, opened: true };
  }
  if (S.overlay) closeOverlay();
  const id =
    destination === 'timeline' ? 'timeline' : destination === 'weekly-chart' ? 'weekly-chart' : 'heat-map';
  const el = document.getElementById(id);
  if (!el) return { ok: false, error: `destination is not available: ${destination}` };
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return { ok: true, operation: 'open', destination, scrolledTo: destination };
}

function browseSearch(args: Result): Result {
  const query = String(args.query ?? args.q ?? args.search ?? '');
  setSearch(query);
  const visible = listEntries();
  return {
    ok: true,
    operation: 'search',
    query,
    visibleCount: visible.length,
    ids: visible.map((e) => e.id)
  };
}

function browseApplyFilter(args: Result): Result {
  const value = String(args.value ?? args.category ?? '').toLowerCase();
  if (!(FILTER_VALUES as readonly string[]).includes(value)) {
    return { ok: false, error: `category filter must be one of ${FILTER_VALUES.join(', ')}` };
  }
  setFilter(value as Filter);
  const visible = listEntries();
  return { ok: true, operation: 'apply_filter', filter: 'category', value, visibleCount: visible.length };
}

function browseClearFilter(): Result {
  setFilter('all');
  setSearch('');
  return { ok: true, operation: 'clear_filter', filter: 'category', value: 'all', visibleCount: listEntries().length };
}

function sessionStart(args: Result): Result {
  const name = String(args.name ?? '').trim();
  if (!name) return { ok: false, error: 'name is required to start the timer' };
  const category = normalizeCategory(args.category);
  if (!category) return { ok: false, error: 'category must be Meaningful, Neutral, or Draining' };
  const tagRaw = args.tag;
  const tag =
    tagRaw === null || tagRaw === undefined || String(tagRaw).trim() === '' ? null : String(tagRaw).trim();
  const reason = normalizeReason(args['interruption-reason'] ?? args.interruptionReason);
  const wasRunning = S.timer.running;
  startTimer(name, category, tag, reason ? { reason } : undefined);
  if (S.interruption) {
    return { ok: true, operation: 'interruption-required', dialogOpened: true };
  }
  return {
    ok: true,
    operation: 'start',
    name,
    category,
    running: S.timer.running,
    autoSaved: wasRunning && !S.interruption
  };
}

function sessionStop(args: Result): Result {
  if (!S.timer.running) return { ok: false, error: 'no timer is running' };
  const reason = normalizeReason(args['interruption-reason'] ?? args.interruptionReason);
  const before = entries().length;
  stopTimer(reason ?? undefined);
  if (S.interruption) {
    return {
      ok: false,
      error: 'timer ran for less than 25 minutes; interruption-reason is required (Internal or External)',
      dialogOpened: true
    };
  }
  const after = entries();
  const saved = after[after.length - 1];
  return {
    ok: true,
    operation: 'stop',
    id: saved?.id,
    duration: saved?.durationMinutes,
    count: after.length,
    grew: after.length > before
  };
}

function sessionRestart(args: Result): Result {
  const reason = normalizeReason(args['interruption-reason'] ?? args.interruptionReason);
  const ok = restartTimer(reason ? { reason } : undefined);
  if (!ok && !S.timer.running && !entries().length) {
    return { ok: false, error: 'nothing to restart' };
  }
  if (S.interruption) return { ok: true, operation: 'interruption-required', dialogOpened: true };
  return { ok: true, operation: 'restart', running: S.timer.running, name: S.timer.name };
}

function artifactExport(args: Result): Result {
  const format = String(args.format ?? '');
  if (format !== 'json' && format !== 'csv') return { ok: false, error: 'format must be json or csv' };
  S.exportTab = format;
  onlyOverlay('export');
  return {
    ok: true,
    operation: 'export',
    format,
    drawerOpened: true,
    todayMinutes: todayMinutes(),
    meaningfulRatio: meaningfulRatio(),
    streakDays: streakDays(),
    entryCount: entries().length,
    tagCount: tags().length
  };
}

function artifactImport(args: Result): Result {
  const mode = String(args.mode ?? '');
  if (mode !== 'session-json') return { ok: false, error: 'mode must be session-json' };
  onlyOverlay('import');
  return { ok: true, operation: 'import', mode, drawerOpened: true };
}

function artifactCopy(args: Result): Result {
  const format = String(args.format ?? '');
  if (format !== 'json' && format !== 'csv') return { ok: false, error: 'format must be json or csv' };
  const text = format === 'json' ? sessionJSONText() : timesheetCSV();
  copyText(text, format === 'json' ? 'Session JSON' : 'Timesheet CSV');
  return { ok: true, operation: 'copy', format, bytes: text.length };
}

const TOOLS: { name: string; description: string; handler: Handler }[] = [
  {
    name: 'entity-create',
    description:
      'Log a new time entry. args: name, category (Meaningful|Neutral|Draining), duration (1-1440), optional tag, start-time, interruption-reason.',
    handler: entityCreate
  },
  {
    name: 'entity-select',
    description: 'Select an entry by args.id and open its edit dialog.',
    handler: entitySelect
  },
  {
    name: 'entity-update',
    description: 'Update an entry by args.id. Fields: name, category, tag, duration, start-time, interruption-reason.',
    handler: entityUpdate
  },
  {
    name: 'entity-delete',
    description: 'Delete an entry by args.id. Requires confirm=true.',
    handler: entityDelete
  },
  {
    name: 'browse-open',
    description: 'Open or scroll to timeline, weekly-chart, tag-manager, export-drawer, or heat-map.',
    handler: browseOpen
  },
  {
    name: 'browse-search',
    description: 'Narrow the entry list by name or tag. args.query. Returns visibleCount.',
    handler: browseSearch
  },
  {
    name: 'browse-apply_filter',
    description: 'Apply category filter. args.value: all|meaningful|neutral|draining.',
    handler: browseApplyFilter
  },
  {
    name: 'browse-clear_filter',
    description: 'Reset category filter to All and clear search.',
    handler: browseClearFilter
  },
  {
    name: 'session-start',
    description: 'Start the live timer. args: name, category, optional tag, optional interruption-reason when switching under 25 min.',
    handler: sessionStart
  },
  {
    name: 'session-stop',
    description: 'Stop the live timer. interruption-reason required when elapsed < 25 minutes.',
    handler: sessionStop
  },
  {
    name: 'session-restart',
    description: 'Restart the live timer from the current or last entry.',
    handler: sessionRestart
  },
  {
    name: 'artifact-export',
    description: 'Open the export drawer. args.format: json|csv.',
    handler: artifactExport
  },
  {
    name: 'artifact-import',
    description: 'Open the import drawer. args.mode: session-json.',
    handler: artifactImport
  },
  {
    name: 'artifact-copy',
    description: 'Copy Session JSON or Timesheet CSV to the clipboard. args.format: json|csv.',
    handler: artifactCopy
  }
];

export function initWebMcp() {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: MODULES,
    tools: TOOLS.map((t) => t.name)
  });
  w.webmcp_list_tools = () => TOOLS.map((t) => {
    const prefix = t.name.split('-', 1)[0];
    const moduleId = {
      entity: 'entity-collection-v1',
      browse: 'browse-query-v1',
      session: 'command-session-v1',
      artifact: 'artifact-transfer-v1'
    }[prefix];
    if (!moduleId) throw new Error(`Tool ${t.name} is not bound to an assigned WebMCP module`);
    return {
      name: t.name,
      moduleId,
      description: t.description,
      annotations: t.name === 'browse-search' ? { readOnlyHint: true } : undefined,
      inputSchema: t.name === 'artifact-export'
        ? {
            type: 'object',
            properties: { format: { type: 'string', enum: ['json', 'csv'] } },
            required: ['format'],
            additionalProperties: false
          }
        : { type: 'object', additionalProperties: true }
    };
  });
  w.webmcp_invoke_tool = async (name: string, args: Result = {}) => {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return await tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };
}
