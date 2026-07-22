import { useStore } from './store';

const modules = ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1'];

const tools = [
  { name: 'editor.select', module: modules[0], description: 'Select a visible trace frame.', inputSchema: { type: 'object', required: ['id'], additionalProperties: false, properties: { id: { type: 'string' } } } },
  { name: 'editor.update_property', module: modules[0], description: 'Update one declared frame property.', inputSchema: { type: 'object', required: ['id', 'property', 'value'], additionalProperties: false, properties: { id: { type: 'string' }, property: { type: 'string', enum: ['weight', 'pinned-node', 'collapsed'] }, value: {} } } },
  { name: 'editor.set_content', module: modules[0], description: 'Replace the trace text and reparse it.', inputSchema: { type: 'object', required: ['content'], additionalProperties: false, properties: { content: { type: 'string', minLength: 1 } } } },
  { name: 'editor.preview', module: modules[0], description: 'Read the current parsed path summary.', inputSchema: { type: 'object', additionalProperties: false, properties: {} } },
  { name: 'entity.create', module: modules[1], description: 'Save the current path as a named hypothesis.', inputSchema: { type: 'object', required: ['fields'], additionalProperties: false, properties: { fields: { type: 'object', required: ['name'], additionalProperties: false, properties: { name: { type: 'string', minLength: 1 } } } } } },
  { name: 'entity.select', module: modules[1], description: 'Load a saved hypothesis.', inputSchema: { type: 'object', required: ['id'], additionalProperties: false, properties: { id: { type: 'string' } } } },
  { name: 'entity.delete', module: modules[1], description: 'Delete a saved hypothesis after confirmation.', inputSchema: { type: 'object', required: ['id', 'confirm'], additionalProperties: false, properties: { id: { type: 'string' }, confirm: { const: true } } } },
  { name: 'artifact.export', module: modules[2], description: 'Return metadata for the current portable session.', inputSchema: { type: 'object', required: ['format'], additionalProperties: false, properties: { format: { const: 'stack-path-hypothesis-json' } } } },
  { name: 'artifact.import', module: modules[2], description: 'Declare the visible JSON import workflow.', inputSchema: { type: 'object', required: ['mode'], additionalProperties: false, properties: { mode: { const: 'stack-path-hypothesis-json' } } } },
  { name: 'artifact.copy', module: modules[2], description: 'Return metadata for the visible copy workflow.', inputSchema: { type: 'object', required: ['format'], additionalProperties: false, properties: { format: { const: 'stack-path-hypothesis-json' } } } },
];

const argsObject = (args) => typeof args === 'string' ? JSON.parse(args || '{}') : (args || {});

window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', modules, tools: tools.map(tool => tool.name) });
window.webmcp_list_tools = () => tools;

window.webmcp_invoke_tool = (toolName, rawArgs) => {
  const args = argsObject(rawArgs);
  const store = useStore.getState();

  try {
    if (toolName === 'editor.select') {
      if (!store.frames.some(frame => frame.id === args.id)) return { ok: false, error: `Unknown frame: ${args.id}` };
      useStore.setState({ selection: args.id });
      return { ok: true, operation: 'select', public_ids: [args.id] };
    }
    if (toolName === 'editor.update_property') {
      if (!store.frames.some(frame => frame.id === args.id)) return { ok: false, error: `Unknown frame: ${args.id}` };
      if (args.property === 'pinned-node') store.mapCandidate(args.id, String(args.value));
      else store.updateFrame(args.id, { [args.property]: args.property === 'weight' ? Number(args.value) : Boolean(args.value) });
      return { ok: true, operation: 'update_property', public_ids: [args.id] };
    }
    if (toolName === 'editor.set_content') {
      store.setRawTrace(args.content);
      return { ok: true, operation: 'set_content', frame_count: useStore.getState().frames.length };
    }
    if (toolName === 'editor.preview') {
      const current = useStore.getState();
      return { ok: true, operation: 'preview', frame_count: current.frames.length, path: current.path, valid: current.valid };
    }
    if (toolName === 'entity.create') {
      store.saveHypothesis(args.fields.name);
      const current = useStore.getState();
      return { ok: true, operation: 'create', public_ids: [current.activeHypothesisId] };
    }
    if (toolName === 'entity.select') {
      if (!store.hypotheses.some(item => item.id === args.id)) return { ok: false, error: `Unknown hypothesis: ${args.id}` };
      store.loadHypothesis(args.id);
      return { ok: true, operation: 'select', public_ids: [args.id] };
    }
    if (toolName === 'entity.delete') {
      if (args.confirm !== true) return { ok: false, error: 'confirm=true is required' };
      if (!store.hypotheses.some(item => item.id === args.id)) return { ok: false, error: `Unknown hypothesis: ${args.id}` };
      store.deleteHypothesis(args.id);
      return { ok: true, operation: 'delete', public_ids: [args.id] };
    }
    if (toolName === 'artifact.export' || toolName === 'artifact.copy') {
      const current = useStore.getState();
      return { ok: true, operation: toolName.split('.')[1], format: args.format, schema_version: 'stack-path-hypothesis/v1', frame_count: current.frames.length, hypothesis_count: current.hypotheses.length };
    }
    if (toolName === 'artifact.import') return { ok: true, operation: 'import', mode: args.mode, completed: false, status: 'file_picker_required' };
    return { ok: false, error: `Unknown tool: ${toolName}` };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};
