import { NODE_TYPES } from './workflow';
import { useWorkflowStore } from './store';

let registered = false;

const result = (message, extra = {}) => ({ content: [{ type: 'text', text: message }], ...extra });

const tools = [
  {
    name: 'editor_select',
    description: 'Select a workflow node or edge using the same selection command as the canvas.',
    inputSchema: { type: 'object', properties: { objectType: { enum: [...NODE_TYPES.map((type) => `${type.toLowerCase()}-node`), 'edge'] }, id: { type: 'string', minLength: 1, maxLength: 120 } }, required: ['objectType', 'id'], additionalProperties: false },
    handler: ({ objectType, id }) => {
      const state = useWorkflowStore.getState();
      if (objectType === 'edge') state.selectEdge(id); else state.selectNode(id);
      return result(`Selected ${objectType} ${id}.`, { structuredContent: { selectedId: id } });
    },
  },
  {
    name: 'editor_add',
    description: 'Add a configured workflow object. Node coordinates and handle-drag mechanics remain UI-driven.',
    inputSchema: { type: 'object', properties: { objectType: { enum: [...NODE_TYPES.map((type) => `${type.toLowerCase()}-node`), 'edge'] }, sourceId: { type: 'string', maxLength: 120 }, targetId: { type: 'string', maxLength: 120 } }, required: ['objectType'], additionalProperties: false },
    handler: ({ objectType, sourceId, targetId }) => {
      const state = useWorkflowStore.getState();
      if (objectType === 'edge') {
        if (!sourceId || !targetId) throw new Error('Edge add requires sourceId and targetId.');
        const added = state.addConnection({ source: sourceId, target: targetId, sourceHandle: 'out', targetHandle: 'in' });
        if (!added) throw new Error('The requested edge is incompatible.');
        return result(`Added edge from ${sourceId} to ${targetId}.`);
      }
      const type = objectType.split('-')[0];
      const normalized = type.charAt(0).toUpperCase() + type.slice(1);
      const id = state.addNode(normalized);
      return result(`Added ${normalized} node.`, { structuredContent: { nodeId: id } });
    },
  },
  {
    name: 'editor_delete',
    description: 'Delete one workflow node or edge by id.',
    inputSchema: { type: 'object', properties: { objectType: { enum: [...NODE_TYPES.map((type) => `${type.toLowerCase()}-node`), 'edge'] }, id: { type: 'string', minLength: 1, maxLength: 120 }, confirm: { const: true } }, required: ['objectType', 'id', 'confirm'], additionalProperties: false },
    handler: ({ objectType, id, confirm }) => {
      if (confirm !== true) throw new Error('Delete requires confirm=true.');
      useWorkflowStore.getState().deleteObject(objectType === 'edge' ? 'edge' : 'node', id);
      return result(`Deleted ${objectType} ${id}.`);
    },
  },
  {
    name: 'editor_update_property',
    description: 'Update one closed node property using the same configuration command as the modal.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', minLength: 1, maxLength: 120 },
        property: { enum: ['title', 'prompt', 'agent', 'timeout-seconds', 'rubric', 'condition-expression', 'destination-name'] },
        value: { oneOf: [{ type: 'string', minLength: 1, maxLength: 300 }, { type: 'number', minimum: 1, maximum: 300 }] },
      },
      required: ['id', 'property', 'value'],
      additionalProperties: false,
    },
    handler: ({ id, property, value }) => {
      const state = useWorkflowStore.getState();
      const node = state.nodes.find((item) => item.id === id);
      if (!node) throw new Error('Node not found.');
      const keys = { prompt: 'prompt', agent: 'agent', 'timeout-seconds': 'timeoutSeconds', rubric: 'rubric', 'condition-expression': 'conditionExpression', 'destination-name': 'destinationName' };
      if (property === 'title') state.updateNode(id, { title: String(value) });
      else state.updateNode(id, { config: { [keys[property]]: property === 'timeout-seconds' ? Number(value) : String(value) } });
      return result(`Updated ${property} on ${id}.`);
    },
  },
  ...[
    ['session_start', 'Start the workflow simulation.', () => useWorkflowStore.getState().startRun()],
    ['session_pause', 'Pause after the current node checkpoint.', () => useWorkflowStore.getState().pauseRun()],
    ['session_resume', 'Resume from the stored checkpoint.', () => useWorkflowStore.getState().resumeRun()],
    ['session_restart', 'Start a fresh workflow run.', () => useWorkflowStore.getState().startRun()],
  ].map(([name, description, command]) => ({
    name,
    description,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: async () => { command(); return result(`${name.replace('_', ' ')} requested. Observe node-status-badges and the run rollup for completion.`); },
  })),
  {
    name: 'session_trigger_demo',
    description: 'Trigger a declared session demo: seeded-workflow-run or retry-from-failed-node.',
    inputSchema: {
      type: 'object',
      properties: { demo: { enum: ['seeded-workflow-run', 'retry-from-failed-node'] } },
      required: ['demo'],
      additionalProperties: false,
    },
    handler: async ({ demo }) => {
      const state = useWorkflowStore.getState();
      if (demo === 'seeded-workflow-run') {
        const started = await state.runSeededWorkflowDemo();
        if (!started) throw new Error('Seeded workflow demo could not start. Finish or reset the current run and try again.');
        return result('Seeded workflow run demo started. Observe retries on Atlas Agent and the run rollup.');
      }
      const started = await state.runRetryFromFailedDemo();
      if (!started) throw new Error('Retry-from-failed demo could not start. Ensure a failed run is visible or reset the active run.');
      return result('Retry-from-failed-node demo started. Faultline Agent exhausts retries; use Retry from failed node or observe the failed run.');
    },
  },
  {
    name: 'entity_create',
    description: 'Create a saved-workflow snapshot from the active canvas.',
    inputSchema: { type: 'object', properties: { entity: { const: 'saved-workflow' }, name: { type: 'string', minLength: 2, maxLength: 80 } }, required: ['entity', 'name'], additionalProperties: false },
    handler: ({ name }) => {
      const saved = useWorkflowStore.getState().saveWorkflow(name);
      return result(`Created saved workflow ${saved.name}.`, { structuredContent: { savedId: saved.savedId, name: saved.name, nodeCount: saved.nodes.length } });
    },
  },
  {
    name: 'entity_select',
    description: 'Select a saved workflow and open the same replacement confirmation as the visible row.',
    inputSchema: { type: 'object', properties: { entity: { const: 'saved-workflow' }, id: { type: 'string', minLength: 1, maxLength: 120 } }, required: ['entity', 'id'], additionalProperties: false },
    handler: ({ id }) => { useWorkflowStore.getState().requestLoadWorkflow(id); return result(`Selected saved workflow ${id}; confirmation is visible.`); },
  },
  {
    name: 'entity_delete',
    description: 'Delete a saved workflow. Explicit confirmation is required.',
    inputSchema: { type: 'object', properties: { entity: { const: 'saved-workflow' }, id: { type: 'string', minLength: 1, maxLength: 120 }, confirm: { const: true } }, required: ['entity', 'id', 'confirm'], additionalProperties: false },
    handler: ({ id, confirm }) => { if (confirm !== true) throw new Error('Delete requires confirm=true.'); useWorkflowStore.getState().deleteSavedWorkflow(id); return result(`Deleted saved workflow ${id}.`); },
  },
  ...[
    ['artifact_export', 'Open the live artifact preview for JSON or Mermaid export.', ['json', 'mermaid']],
    ['artifact_copy', 'Open the artifact preview where the clipboard action remains user-driven.', ['json', 'mermaid']],
  ].map(([name, description, formats]) => ({
    name,
    description,
    inputSchema: { type: 'object', properties: { format: { enum: formats } }, required: ['format'], additionalProperties: false },
    handler: ({ format }) => {
      const state = useWorkflowStore.getState();
      state.setArtifactMode(format);
      state.setArtifactOpen(true);
      return result(`${format} artifact preview is visible and current with the active canvas.`);
    },
  })),
  {
    name: 'artifact_import',
    description: 'Open the workflow-definition import form. Raw artifact contents remain UI-driven.',
    inputSchema: { type: 'object', properties: { mode: { const: 'workflow-definition' } }, required: ['mode'], additionalProperties: false },
    handler: () => { useWorkflowStore.getState().openModal('import'); return result('Workflow-definition import form opened.'); },
  },
  {
    name: 'artifact_convert',
    description: 'Open a live JSON-to-Mermaid conversion preview without returning artifact contents.',
    inputSchema: { type: 'object', properties: { mode: { const: 'json-to-mermaid' } }, required: ['mode'], additionalProperties: false },
    handler: () => { const state = useWorkflowStore.getState(); state.setArtifactMode('mermaid'); state.setArtifactOpen(true); return result('JSON-to-Mermaid artifact preview is visible.'); },
  },
];

export function registerWebMCPTools() {
  if (registered) return;
  registered = true;
  window.webmcp_action_contract = 'zto-webmcp-v1';
  window.webmcp_tools = Object.fromEntries(tools.map((tool) => [tool.name, tool.handler]));
  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    modules: ['structured-editor-v1', 'command-session-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    toolNames: tools.map((tool) => tool.name),
  });
  window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`Unknown WebMCP tool: ${name}`);
    return tool.handler(args);
  };
  const registry = navigator.modelContext;
  if (!registry?.registerTool) return;
  tools.forEach(({ handler, ...definition }) => {
    registry.registerTool({ ...definition, execute: handler });
  });
}
