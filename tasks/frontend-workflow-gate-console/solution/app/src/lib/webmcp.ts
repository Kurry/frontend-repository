import { STAGE_NAMES, type GateState, type NoteCategory, type StageName } from './contracts';
import { consoleStore } from './console-store.svelte';

type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => unknown | Promise<unknown>;
};

const objectSchema = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: 'object', properties, required, additionalProperties: false
});
const stringEnum = (values: readonly string[]) => ({ type: 'string', enum: values });
const result = (message: string, extra: Record<string, unknown> = {}) => ({ ok: true, message, ...extra });

export function registerWebMCP() {
  window.__stagegateConsole = consoleStore;
  const context = navigator.modelContext;

  const tools: Tool[] = [
    {
      name: 'browse_open', description: 'Open a bounded acceptance console destination.',
      inputSchema: objectSchema({
        destination: stringEnum(['run-list', 'run-detail', 'stage-detail', 'certificate', 'registry', 'timeline', 'export', 'import']),
        runId: { type: 'string' }, stage: stringEnum(STAGE_NAMES)
      }, ['destination']),
      execute: ({ destination, runId, stage }) => {
        if (typeof runId === 'string') consoleStore.selectRun(runId);
        if (typeof stage === 'string' && STAGE_NAMES.includes(stage as StageName)) consoleStore.selectStage(stage as StageName);
        if (destination === 'registry') consoleStore.activeView = 'registry';
        else if (destination === 'export') consoleStore.openExport();
        else if (destination === 'import') consoleStore.openImport();
        else if (destination === 'certificate') consoleStore.openCertificate((stage as StageName) || consoleStore.selectedStage.name);
        else {
          consoleStore.activeView = 'pipeline';
          if (destination === 'timeline') setTimeout(() => document.getElementById('event-timeline')?.scrollIntoView({ block: 'start' }), 0);
        }
        return result(`Opened ${String(destination)}`, { destination });
      }
    },
    {
      name: 'browse_search', description: 'Search the visible run list by identifier, branch, or commit.',
      inputSchema: objectSchema({ query: { type: 'string', maxLength: 100 } }, ['query']),
      execute: ({ query }) => {
        consoleStore.runSearch = String(query ?? '');
        consoleStore.activeView = 'pipeline';
        return result('Run search applied', { visibleCount: consoleStore.visibleRuns.length });
      }
    },
    {
      name: 'browse_apply_filter', description: 'Apply a bounded severity or timeline entry type filter.',
      inputSchema: objectSchema({
        filter: stringEnum(['severity', 'timeline-entry-type']),
        value: stringEnum(['S1', 'S2', 'S3', 're-run', 'rejection', 'certificate', 'note'])
      }, ['filter', 'value']),
      execute: ({ filter, value }) => {
        if (filter === 'severity' && ['S1', 'S2', 'S3'].includes(String(value))) {
          consoleStore.severityFilter = value as 'S1' | 'S2' | 'S3';
          consoleStore.activeView = 'registry';
        } else if (filter === 'timeline-entry-type' && ['re-run', 'rejection', 'certificate', 'note'].includes(String(value))) {
          consoleStore.timelineFilter = value as 're-run' | 'rejection' | 'certificate' | 'note';
          consoleStore.activeView = 'pipeline';
        } else return { ok: false, message: 'Filter and value do not match' };
        return result('Filter applied', { filter, value });
      }
    },
    {
      name: 'browse_clear_filter', description: 'Clear the selected bounded filter.',
      inputSchema: objectSchema({ filter: stringEnum(['severity', 'timeline-entry-type']) }, ['filter']),
      execute: ({ filter }) => {
        if (filter === 'severity') consoleStore.severityFilter = 'all';
        else consoleStore.timelineFilter = 'all';
        return result('Filter cleared', { filter });
      }
    },
    {
      name: 'browse_sort', description: 'Sort runs by submitted time.',
      inputSchema: objectSchema({ direction: stringEnum(['newest', 'oldest']) }, ['direction']),
      execute: ({ direction }) => {
        consoleStore.runSort = direction === 'oldest' ? 'oldest' : 'newest';
        return result('Runs sorted', { direction: consoleStore.runSort });
      }
    },
    {
      name: 'browse_set_locale', description: 'Set the console locale to its supported English locale.',
      inputSchema: objectSchema({ locale: stringEnum(['en']) }, ['locale']),
      execute: () => result('Locale set', { locale: 'en' })
    },
    {
      name: 'browse_set_theme', description: 'Set the visible console theme.',
      inputSchema: objectSchema({ theme: stringEnum(['light', 'dark']) }, ['theme']),
      execute: ({ theme }) => {
        consoleStore.setTheme(theme === 'dark' ? 'dark' : 'light');
        return result('Theme set', { theme: consoleStore.theme });
      }
    },
    {
      name: 'editor_select', description: 'Select a gate or note object in the current recorded run.',
      inputSchema: objectSchema({ objectType: stringEnum(['gate', 'note']), gateId: { type: 'string' } }, ['objectType', 'gateId']),
      execute: ({ objectType, gateId }) => {
        const match = consoleStore.selectedRun.stages.find((candidate) => candidate.gates.some((gate) => gate.id === gateId));
        if (!match) return { ok: false, message: 'Gate not found in selected run' };
        consoleStore.selectStage(match.name);
        consoleStore.expandedGates.add(String(gateId));
        if (objectType === 'note') consoleStore.openNoteForm(String(gateId));
        return result(`${String(objectType)} selected`, { gateId, stage: match.name });
      }
    },
    {
      name: 'editor_switch_mode', description: 'Switch stage detail between recorded and what-if modes.',
      inputSchema: objectSchema({ mode: stringEnum(['recorded', 'what-if']) }, ['mode']),
      execute: ({ mode }) => {
        if (mode === 'what-if') consoleStore.enterWhatIf(); else consoleStore.revertWhatIf();
        return result('Editor mode switched', { mode });
      }
    },
    {
      name: 'editor_update_property', description: 'Update a gate simulated-state property in what-if mode.',
      inputSchema: objectSchema({
        property: stringEnum(['simulated-state']), gateId: { type: 'string' }, value: stringEnum(['pass', 'fail'])
      }, ['property', 'gateId', 'value']),
      execute: ({ gateId, value }) => {
        const updated = consoleStore.setSimulatedState(String(gateId), value as GateState);
        return updated ? result('Simulated gate state updated', { gateId, value, outcome: consoleStore.displayedStageStatus }) : { ok: false, message: 'What-if mode is not active for this gate' };
      }
    },
    {
      name: 'editor_add', description: 'Add an API-shaped gate note to the selected stage.',
      inputSchema: objectSchema({
        objectType: stringEnum(['note']), gateId: { type: 'string' }, text: { type: 'string', minLength: 1, maxLength: 200 },
        category: stringEnum(['observation', 'waiver-request', 'follow-up'])
      }, ['objectType', 'gateId', 'text', 'category']),
      execute: ({ gateId, text, category }) => {
        const added = consoleStore.addNote(String(gateId), { text: String(text), category: category as NoteCategory });
        return added ? result('Gate note added', { gateId }) : { ok: false, message: 'Gate note failed validation or gate was not found' };
      }
    },
    {
      name: 'session_start', description: 'Start the stage-re-run demo through the same command as the visible control.',
      inputSchema: objectSchema({ demo: stringEnum(['stage-re-run']), stage: stringEnum(STAGE_NAMES) }, ['demo', 'stage']),
      execute: async ({ stage }) => {
        const started = await consoleStore.startRerun(stage as StageName);
        return started ? result('Stage re-run completed', { stage, status: consoleStore.selectedRun.stages.find((item) => item.name === stage)?.status }) : { ok: false, message: 'A re-run is already active or the stage was not found' };
      }
    },
    {
      name: 'artifact_export', description: 'Open a live export preview for a bounded artifact format.',
      inputSchema: objectSchema({ format: stringEnum(['fingerprint-hash', 'acceptance-package-json', 'certificate-chain-markdown']) }, ['format']),
      execute: ({ format }) => {
        if (format === 'fingerprint-hash') consoleStore.openCertificate();
        else consoleStore.openExport(format === 'certificate-chain-markdown' ? 'markdown' : 'json');
        return result('Export preview opened', { format, runId: consoleStore.selectedRun.id });
      }
    },
    {
      name: 'artifact_import', description: 'Open the acceptance-package import surface for visible paste validation.',
      inputSchema: objectSchema({ mode: stringEnum(['acceptance-package']) }, ['mode']),
      execute: () => {
        consoleStore.openImport();
        return result('Import surface opened', { mode: 'acceptance-package' });
      }
    },
    {
      name: 'artifact_copy', description: 'Open the bounded artifact surface whose visible copy control performs clipboard mechanics.',
      inputSchema: objectSchema({ format: stringEnum(['fingerprint-hash', 'acceptance-package-json', 'certificate-chain-markdown']) }, ['format']),
      execute: ({ format }) => {
        if (format === 'fingerprint-hash') consoleStore.openCertificate();
        else consoleStore.openExport(format === 'certificate-chain-markdown' ? 'markdown' : 'json');
        return result('Artifact copy surface opened; use its visible Copy control', { format });
      }
    }
  ];

  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    modules: ['browse-query-v1', 'structured-editor-v1', 'command-session-v1', 'artifact-transfer-v1'],
    toolNames: tools.map((tool) => tool.name)
  });
  window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  window.webmcp_invoke_tool = async (name, args) => {
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`Unknown registered tool: ${name}`);
    return tool.execute(args ?? {});
  };

  if (!context?.registerTool) return true;

  for (const tool of tools) {
    try { context.registerTool(tool); } catch { /* already registered during hot reload */ }
  }
  return true;
}
