import { calculateDerived } from './store/schema';
import { currentArtifact, useGardenStore } from './store/gardenStore';
import { plots, statuses } from './store/types';

const recordFields = {
  title: { type: 'string', minLength: 3, maxLength: 80 },
  description: { type: 'string', maxLength: 240 },
  status: { type: 'string', enum: statuses },
  date: { type: 'string', pattern: '^2026-[0-9]{2}-[0-9]{2}$' },
  plot: { type: 'string', enum: plots },
  volunteers: { type: 'integer', minimum: 1, maximum: 20 },
  durationMinutes: { type: 'integer', minimum: 15, maximum: 240, multipleOf: 15 },
};

const tools = [
  { name: 'entity_create_record', module: 'entity-collection-v1', description: 'Create one API-shaped work task through the same schema and command as the visible form.', inputSchema: { type: 'object', properties: recordFields, required: ['title', 'description', 'status', 'date', 'plot', 'volunteers', 'durationMinutes'], additionalProperties: false } },
  { name: 'entity_select_record', module: 'entity-collection-v1', description: 'Select and query one work task plus the live derived summary.', inputSchema: { type: 'object', properties: { id: { type: 'string', maxLength: 40 } }, required: ['id'], additionalProperties: false } },
  { name: 'entity_update_record', module: 'entity-collection-v1', description: 'Update declared task fields; failed-to-recovery and recovery-to-resolved route through canonical recovery commands.', inputSchema: { type: 'object', properties: { id: { type: 'string', maxLength: 40 }, fields: { type: 'object', properties: { ...recordFields, repairNote: { type: 'string', minLength: 10, maxLength: 180 } }, additionalProperties: false } }, required: ['id', 'fields'], additionalProperties: false } },
  { name: 'entity_delete_record', module: 'entity-collection-v1', description: 'Delete one work task after explicit confirmation.', inputSchema: { type: 'object', properties: { id: { type: 'string', maxLength: 40 }, confirm: { type: 'boolean', const: true } }, required: ['id', 'confirm'], additionalProperties: false } },
  { name: 'entity_toggle_record', module: 'entity-collection-v1', description: 'Toggle the archive state of one work task.', inputSchema: { type: 'object', properties: { id: { type: 'string', maxLength: 40 }, field: { type: 'string', const: 'archived' } }, required: ['id', 'field'], additionalProperties: false } },
  { name: 'entity_reorder_record', module: 'entity-collection-v1', description: 'Move one record to an exact zero-based order when gesture mechanics are not graded.', inputSchema: { type: 'object', properties: { id: { type: 'string', maxLength: 40 }, to_index: { type: 'integer', minimum: 0, maximum: 149 } }, required: ['id', 'to_index'], additionalProperties: false } },
  { name: 'artifact_export_session_json', module: 'artifact-transfer-v1', description: 'Open the visible session JSON export preview without returning file contents through WebMCP.', inputSchema: { type: 'object', properties: { format: { type: 'string', const: 'session-json' } }, required: ['format'], additionalProperties: false } },
  { name: 'artifact_import_session_json', module: 'artifact-transfer-v1', description: 'Open the visible atomic JSON import surface; file and paste contents remain user-driven.', inputSchema: { type: 'object', properties: { mode: { type: 'string', const: 'session-json' } }, required: ['mode'], additionalProperties: false } },
  { name: 'artifact_copy_session_json', module: 'artifact-transfer-v1', description: 'Copy the current visible session JSON through the app copy workflow without returning contents.', inputSchema: { type: 'object', properties: { format: { type: 'string', const: 'session-json' } }, required: ['format'], additionalProperties: false } },
];

function record(id: string) {
  return useGardenStore.getState().records.find((item) => item.id === id);
}

async function invoke(name: string, args: Record<string, any> = {}) {
  const state = useGardenStore.getState();
  switch (name) {
    case 'entity_create_record': {
      const before = state.records.length;
      const result = state.createRecord(args);
      if (!result.ok) return { ok: false, errors: result.errors, before, after: before };
      const next = useGardenStore.getState();
      return { ok: true, created_id: next.selectionId, before, after: next.records.length, event_count: next.history.length };
    }
    case 'entity_select_record': {
      const selected = record(args.id);
      if (!selected) return { ok: false, error: `Record ${args.id} was not found.` };
      state.selectRecord(args.id);
      const records = useGardenStore.getState().records;
      return { ok: true, record: selected, derived: calculateDerived(records), event_count: useGardenStore.getState().history.length };
    }
    case 'entity_update_record': {
      const current = record(args.id);
      if (!current) return { ok: false, error: `Record ${args.id} was not found.` };
      const fields = args.fields ?? {};
      if (fields.status === 'recovery' && current.status === 'failed') {
        const ok = state.moveToRecovery(args.id);
        return { ok, id: args.id, status: record(args.id)?.status, event_count: useGardenStore.getState().history.length };
      }
      if (fields.status === 'resolved' && current.status === 'recovery') {
        const result = state.resolveRecovery(args.id, fields.repairNote ?? '');
        return { ...result, id: args.id, status: record(args.id)?.status, event_count: useGardenStore.getState().history.length };
      }
      const merged = { title: current.title, description: current.description, status: current.status, date: current.date, plot: current.plot, volunteers: current.volunteers, durationMinutes: current.durationMinutes, ...fields };
      delete (merged as any).repairNote;
      const result = state.updateRecord(args.id, merged);
      return { ...result, id: args.id, record: record(args.id), event_count: useGardenStore.getState().history.length };
    }
    case 'entity_delete_record': {
      if (args.confirm !== true) return { ok: false, error: 'confirm=true is required; no record changed.' };
      const before = state.records.length;
      const ok = state.deleteRecord(args.id);
      return { ok, before, after: useGardenStore.getState().records.length, event_count: useGardenStore.getState().history.length };
    }
    case 'entity_toggle_record': {
      if (args.field !== 'archived') return { ok: false, error: 'field must be archived.' };
      const ok = state.toggleArchive(args.id);
      return { ok, id: args.id, status: record(args.id)?.status, event_count: useGardenStore.getState().history.length };
    }
    case 'entity_reorder_record': {
      const ok = state.reorderTo(args.id, args.to_index);
      return { ok, id: args.id, order: record(args.id)?.order, event_count: useGardenStore.getState().history.length };
    }
    case 'artifact_export_session_json':
      document.dispatchEvent(new CustomEvent('garden:artifact', { detail: { mode: 'export' } }));
      return { ok: true, filename: 'garden-workday-v1-recovery-board.json', record_count: state.records.length, visible_postcondition: 'Export preview dialog is open.' };
    case 'artifact_import_session_json':
      document.dispatchEvent(new CustomEvent('garden:artifact', { detail: { mode: 'import' } }));
      return { ok: true, mode: 'session-json', visible_postcondition: 'Atomic import dialog is open; paste or file mechanics remain user-driven.' };
    case 'artifact_copy_session_json': {
      const text = JSON.stringify(currentArtifact(), null, 2);
      document.dispatchEvent(new CustomEvent('garden:artifact', { detail: { mode: 'export', copy: true } }));
      try { await navigator.clipboard.writeText(text); } catch { /* visible preview remains the recovery path */ }
      return { ok: true, filename: 'garden-workday-v1-recovery-board.json', visible_postcondition: 'Export preview is open and copy confirmation appears when clipboard permission allows.' };
    }
    default:
      return { ok: false, error: `Unknown tool: ${name}` };
  }
}

declare global {
  interface Window {
    webmcp_session_info: () => Promise<unknown>;
    webmcp_list_tools: () => Promise<unknown>;
    webmcp_invoke_tool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  }
}

window.webmcp_session_info = async () => ({ task_id: 'eval-intelligence/frontend-planning-community-garden-workday-planner-recovery-board-rn-canva-live-preview', contract_version: 'zto-webmcp-v1', modules: ['entity-collection-v1', 'artifact-transfer-v1'], tool_names: tools.map((tool) => tool.name) });
window.webmcp_list_tools = async () => tools;
window.webmcp_invoke_tool = invoke;
