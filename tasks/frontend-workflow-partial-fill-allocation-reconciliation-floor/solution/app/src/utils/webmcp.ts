import { useAppStore } from '../store/store';
import { exportBatchJSON, exportExceptionCSV, exportReconciliationCSV } from './export';

type Args = Record<string, unknown>;

const modules = ['entity-collection-v1', 'structured-editor-v1', 'artifact-transfer-v1'];
const tools = [
  { name: 'entity.create', module: modules[0], description: 'Load import records or create a bounded allocation.', inputSchema: { type: 'object', additionalProperties: false, properties: { fields: { type: 'object', additionalProperties: { type: 'string', maxLength: 200 } } } } },
  { name: 'entity.select', module: modules[0], description: 'Select a public fill, intent, or allocation id.', inputSchema: { type: 'object', additionalProperties: false, required: ['id'], properties: { id: { type: 'string', maxLength: 128 } } } },
  { name: 'entity.update', module: modules[0], description: 'Update declared fields on an import row.', inputSchema: { type: 'object', additionalProperties: false, required: ['id', 'fields'], properties: { id: { type: 'string' }, fields: { type: 'object', additionalProperties: { type: 'string' } } } } },
  { name: 'entity.delete', module: modules[0], description: 'Exclude an import row or clear an allocation.', inputSchema: { type: 'object', additionalProperties: false, required: ['id', 'confirm'], properties: { id: { type: 'string' }, confirm: { const: true } } } },
  { name: 'entity.toggle', module: modules[0], description: 'Toggle an exception review marker.', inputSchema: { type: 'object', additionalProperties: false, required: ['id'], properties: { id: { type: 'string' }, field: { type: 'string' } } } },
  { name: 'editor.select', module: modules[1], description: 'Select a declared editor object.', inputSchema: { type: 'object', additionalProperties: false, required: ['id'], properties: { id: { type: 'string' } } } },
  { name: 'editor.update_property', module: modules[1], description: 'Update a declared import, exception, or ledger property.', inputSchema: { type: 'object', additionalProperties: false, required: ['id', 'property', 'value'], properties: { id: { type: 'string' }, property: { type: 'string' }, value: { type: 'string' } } } },
  { name: 'editor.set_content', module: modules[1], description: 'Repair an import row quantity.', inputSchema: { type: 'object', additionalProperties: false, required: ['id', 'content'], properties: { id: { type: 'string' }, content: { type: 'string' } } } },
  { name: 'editor.switch_mode', module: modules[1], description: 'Select a declared reconciliation workspace mode.', inputSchema: { type: 'object', additionalProperties: false, required: ['mode'], properties: { mode: { type: 'string', enum: ['import-repair', 'allocation-floor', 'execution-ledger', 'variance-matrix', 'checkpoint-compare', 'export'] } } } },
  { name: 'editor.preview', module: modules[1], description: 'Read a bounded reconciliation summary.', inputSchema: { type: 'object', additionalProperties: false, properties: {} } },
  { name: 'artifact.export', module: modules[2], description: 'Export a declared reconciliation format.', inputSchema: { type: 'object', additionalProperties: false, required: ['format'], properties: { format: { type: 'string', enum: ['api-batch-json', 'reconciliation-csv', 'exception-csv'] } } } },
  { name: 'artifact.import', module: modules[2], description: 'Start the fixture-backed API batch import diagnostic.', inputSchema: { type: 'object', additionalProperties: false, required: ['mode'], properties: { mode: { const: 'api-batch-json' } } } },
  { name: 'artifact.copy', module: modules[2], description: 'Prepare the current reconciliation package for the visible copy workflow.', inputSchema: { type: 'object', additionalProperties: false, properties: {} } },
];

async function invoke(name: string, args: Args = {}) {
  const state = useAppStore.getState();
  if (name === 'entity.create') {
    const fields = (args.fields || {}) as Record<string, string>;
    if (Object.keys(fields).length === 0) {
      state.loadFixtures();
      const next = useAppStore.getState();
      return { ok: true, operation: 'create', public_ids: [...next.rawIntents, ...next.rawFills].map(item => item.id), status: 'fixtures_loaded' };
    }
    const quantity = Number(fields.quantity);
    if (!fields['fill-id'] || !fields['intent-id'] || !Number.isInteger(quantity) || quantity <= 0) return { ok: false, error: 'fill-id, intent-id, and positive integer quantity are required' };
    const result = state.allocate(fields['fill-id'], fields['intent-id'], quantity);
    if (!result.success) return { ok: false, error: result.violations?.join(', ') || 'Allocation rejected' };
    const allocations = useAppStore.getState().allocations;
    return { ok: true, operation: 'create', public_ids: allocations.length ? [allocations[allocations.length - 1].id] : [] };
  }
  if (name === 'entity.select' || name === 'editor.select') {
    const id = String(args.id || '');
    const found = [...state.rawIntents, ...state.rawFills, ...state.intents, ...state.fills, ...state.allocations].some(item => item.id === id);
    return found ? { ok: true, operation: 'select', public_ids: [id] } : { ok: false, error: `Unknown record: ${id}` };
  }
  if (name === 'entity.update') {
    const id = String(args.id || '');
    const fields = (args.fields || {}) as Record<string, string>;
    const field = Object.keys(fields)[0];
    if (!field) return { ok: false, error: 'At least one field is required' };
    if (state.rawIntents.some(item => item.id === id)) state.repairIntent(id, field, fields[field]);
    else if (state.rawFills.some(item => item.id === id)) state.repairFill(id, field, fields[field]);
    else return { ok: false, error: `Only import rows are directly updateable: ${id}` };
    return { ok: true, operation: 'update', public_ids: [id] };
  }
  if (name === 'entity.delete') {
    const id = String(args.id || '');
    if (args.confirm !== true) return { ok: false, error: 'confirm=true is required' };
    if (state.rawIntents.some(item => item.id === id)) state.excludeIntent(id, 'webmcp-excluded');
    else if (state.rawFills.some(item => item.id === id)) state.excludeFill(id, 'webmcp-excluded');
    else if (state.allocations.some(item => item.id === id)) state.bulkClearAllocations([id]);
    else return { ok: false, error: `Unknown deletable record: ${id}` };
    return { ok: true, operation: 'delete', public_ids: [id] };
  }
  if (name === 'entity.toggle') {
    const id = String(args.id || '');
    state.addException(id, 'fill', String(args.field || 'operator-review'));
    return { ok: true, operation: 'toggle', public_ids: [id] };
  }
  if (name === 'editor.update_property') {
    const id = String(args.id || '');
    const property = String(args.property || '');
    const value = String(args.value || '');
    if (state.rawIntents.some(item => item.id === id)) state.repairIntent(id, property, value);
    else if (state.rawFills.some(item => item.id === id)) state.repairFill(id, property, value);
    else if (property === 'exception-reason') state.addException(id, 'fill', value);
    else if (property === 'ledger-time') state.scrubToTime(value);
    else return { ok: false, error: `Property ${property} is not editable for ${id}` };
    return { ok: true, operation: 'update_property', public_ids: [id] };
  }
  if (name === 'editor.set_content') {
    const id = String(args.id || '');
    const content = String(args.content || '');
    if (state.rawIntents.some(item => item.id === id)) state.repairIntent(id, 'quantity', content);
    else if (state.rawFills.some(item => item.id === id)) state.repairFill(id, 'qty', content);
    else return { ok: false, error: `Unknown import row: ${id}` };
    return { ok: true, operation: 'set_content', public_ids: [id] };
  }
  if (name === 'editor.switch_mode') return { ok: true, operation: 'switch_mode', mode: args.mode };
  if (name === 'editor.preview') return { ok: true, operation: 'preview', allocations: state.allocations.length, exceptions: state.exceptions.length, currentTime: state.currentTime };
  if (name === 'artifact.export') {
    if (args.format === 'api-batch-json') exportBatchJSON();
    else if (args.format === 'reconciliation-csv') exportReconciliationCSV();
    else if (args.format === 'exception-csv') exportExceptionCSV();
    else return { ok: false, error: `Unsupported export format: ${String(args.format)}` };
    return { ok: true, operation: 'export', format: args.format };
  }
  if (name === 'artifact.import') {
    if (args.mode !== 'api-batch-json') return { ok: false, error: 'mode must be api-batch-json' };
    state.loadFixtures();
    return { ok: true, operation: 'import', mode: args.mode, status: 'fixtures_loaded' };
  }
  if (name === 'artifact.copy') return { ok: true, operation: 'copy', status: 'ready' };
  return { ok: false, error: `Unknown tool: ${name}` };
}

export function setupWebMCP() {
  const target = window as unknown as Record<string, unknown>;
  target.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', modules, tools: tools.map(tool => tool.name) });
  target.webmcp_list_tools = () => tools;
  target.webmcp_invoke_tool = (name: string, args: Args = {}) => invoke(name, args);

  try {
    const modelContext = (navigator as Navigator & { modelContext?: { registerTool?: (tool: unknown) => void } }).modelContext;
    for (const tool of tools) modelContext?.registerTool?.({ ...tool, invoke: (args: Args) => invoke(tool.name, args) });
  } catch {
    // The window bridge remains authoritative when the optional browser API is absent.
  }
}
