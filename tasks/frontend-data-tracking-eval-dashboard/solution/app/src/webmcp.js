import { PROMPTS, pauseRunCommand, restartRunCommand, resumeRunCommand, startRunCommand, useEvalStore } from './store';
import { copyActiveArtifact } from './artifacts';

const result = (message, data = {}) => ({
  content: [{ type: 'text', text: JSON.stringify({ ok: true, message, ...data }) }],
});

const errorResult = (message) => ({
  isError: true,
  content: [{ type: 'text', text: JSON.stringify({ ok: false, message }) }],
});

function register(definition) {
  window.__evalStudioWebMcpTools ||= {};
  window.__evalStudioWebMcpTools[definition.name] = definition;
  try {
    navigator.modelContext?.registerTool?.(definition);
  } catch (error) {
    console.info(`WebMCP registration deferred for ${definition.name}`, error);
  }
}

export function registerWebMcpTools() {
  const promptIds = PROMPTS.map((prompt) => prompt.id);
  const suiteIds = () => useEvalStore.getState().suites.map((suite) => suite.id);
  const tools = [
    {
      name: 'entity_suite_create',
      description: 'Create one evaluation suite using the same command as New Suite.',
      inputSchema: { type: 'object', additionalProperties: false, required: ['name', 'promptIds'], properties: { name: { type: 'string', minLength: 1, maxLength: 80 }, promptIds: { type: 'array', minItems: 1, items: { type: 'string', enum: promptIds } } } },
      execute: async ({ name, promptIds: ids }) => {
        try { return result('Suite created', { suiteId: useEvalStore.getState().createSuite({ name, promptIds: ids }) }); } catch (error) { return errorResult(error.message); }
      },
    },
    {
      name: 'entity_suite_select',
      description: 'Select an evaluation suite and update all visible result surfaces.',
      inputSchema: { type: 'object', additionalProperties: false, required: ['suiteId'], properties: { suiteId: { type: 'string' } } },
      execute: async ({ suiteId }) => {
        if (!suiteIds().includes(suiteId)) return errorResult('Unknown suiteId');
        useEvalStore.getState().selectSuite(suiteId);
        return result('Suite selected', { suiteId });
      },
    },
    {
      name: 'entity_suite_update',
      description: 'Update a suite name and prompt selection.',
      inputSchema: { type: 'object', additionalProperties: false, required: ['suiteId', 'name', 'promptIds'], properties: { suiteId: { type: 'string' }, name: { type: 'string', minLength: 1, maxLength: 80 }, promptIds: { type: 'array', minItems: 1, items: { type: 'string', enum: promptIds } } } },
      execute: async ({ suiteId, name, promptIds: ids }) => {
        if (!suiteIds().includes(suiteId)) return errorResult('Unknown suiteId');
        try { useEvalStore.getState().updateSuite(suiteId, { name, promptIds: ids }); return result('Suite updated', { suiteId }); } catch (error) { return errorResult(error.message); }
      },
    },
    {
      name: 'entity_suite_delete',
      description: 'Delete exactly one suite. Explicit confirm=true is required.',
      inputSchema: { type: 'object', additionalProperties: false, required: ['suiteId', 'confirm'], properties: { suiteId: { type: 'string' }, confirm: { type: 'boolean' } } },
      execute: async ({ suiteId, confirm }) => {
        if (!confirm) return errorResult('Delete requires confirm=true');
        if (!suiteIds().includes(suiteId)) return errorResult('Unknown suiteId');
        useEvalStore.getState().deleteSuite(suiteId);
        return result('Suite deleted', { suiteId });
      },
    },
    {
      name: 'entity_suite_toggle',
      description: 'Toggle the bounded night-mode field for one suite.',
      inputSchema: { type: 'object', additionalProperties: false, required: ['suiteId', 'field'], properties: { suiteId: { type: 'string' }, field: { type: 'string', enum: ['night-mode'] } } },
      execute: async ({ suiteId }) => {
        if (!suiteIds().includes(suiteId)) return errorResult('Unknown suiteId');
        useEvalStore.getState().toggleNightMode(suiteId);
        return result('Suite night mode toggled', { suiteId, nightMode: useEvalStore.getState().suites.find((suite) => suite.id === suiteId)?.nightMode });
      },
    },
    {
      name: 'session_start',
      description: 'Start the selected suite evaluation session.',
      inputSchema: { type: 'object', additionalProperties: false, properties: {} },
      execute: async () => startRunCommand() ? result('Evaluation started') : errorResult('A run is already active or no suite is selected'),
    },
    {
      name: 'session_pause',
      description: 'Pause the active evaluation at its current checkpoint.',
      inputSchema: { type: 'object', additionalProperties: false, properties: {} },
      execute: async () => pauseRunCommand() ? result('Evaluation paused') : errorResult('No pausable run'),
    },
    {
      name: 'session_resume',
      description: 'Resume the paused evaluation from its checkpoint.',
      inputSchema: { type: 'object', additionalProperties: false, properties: {} },
      execute: async () => resumeRunCommand() ? result('Evaluation resumed') : errorResult('No paused run'),
    },
    {
      name: 'session_restart',
      description: 'Restart the current or selected suite evaluation.',
      inputSchema: { type: 'object', additionalProperties: false, properties: {} },
      execute: async () => restartRunCommand() ? result('Evaluation restarted') : errorResult('No suite available'),
    },
    {
      name: 'browse_open',
      description: 'Open one bounded dashboard destination.',
      inputSchema: { type: 'object', additionalProperties: false, required: ['destination'], properties: { destination: { type: 'string', enum: ['results', 'comparison', 'export-drawer'] } } },
      execute: async ({ destination }) => {
        if (destination === 'export-drawer') useEvalStore.getState().openExport();
        else useEvalStore.getState().setMainView(destination);
        return result('Destination opened', { destination });
      },
    },
    {
      name: 'browse_apply_filter',
      description: 'Apply the bounded timeline-status filter.',
      inputSchema: { type: 'object', additionalProperties: false, required: ['filter', 'value'], properties: { filter: { type: 'string', enum: ['timeline-status'] }, value: { type: 'string', enum: ['pending', 'running', 'retrying', 'paused', 'complete', 'failed'] } } },
      execute: async ({ value }) => { useEvalStore.getState().setTimelineFilter(value); return result('Timeline filter applied', { value }); },
    },
    {
      name: 'browse_clear_filter',
      description: 'Clear the timeline-status filter.',
      inputSchema: { type: 'object', additionalProperties: false, required: ['filter'], properties: { filter: { type: 'string', enum: ['timeline-status'] } } },
      execute: async () => { useEvalStore.getState().setTimelineFilter('all'); return result('Timeline filter cleared'); },
    },
    {
      name: 'browse_sort',
      description: 'Sort visible results by one declared column.',
      inputSchema: { type: 'object', additionalProperties: false, required: ['sort'], properties: { sort: { type: 'string', enum: ['prompt-title', 'model', 'score', 'latency', 'tokens', 'pass-fail'] } } },
      execute: async ({ sort }) => {
        const key = { 'prompt-title': 'promptTitle', model: 'model', score: 'score', latency: 'latencyMs', tokens: 'tokens', 'pass-fail': 'passFail' }[sort];
        useEvalStore.getState().setSort(key);
        return result('Results sorted', { sort });
      },
    },
    {
      name: 'artifact_export',
      description: 'Open the export drawer for JSON or CSV without returning artifact contents.',
      inputSchema: { type: 'object', additionalProperties: false, required: ['format'], properties: { format: { type: 'string', enum: ['json', 'csv'] } } },
      execute: async ({ format }) => { useEvalStore.getState().openExport(format); return result('Export preview opened', { format }); },
    },
    {
      name: 'artifact_import',
      description: 'Open the results-json import workflow. Artifact contents stay in the visible form.',
      inputSchema: { type: 'object', additionalProperties: false, required: ['mode'], properties: { mode: { type: 'string', enum: ['results-json'] } } },
      execute: async () => { useEvalStore.getState().openImport(); return result('Import workflow opened', { mode: 'results-json' }); },
    },
    {
      name: 'artifact_copy',
      description: 'Copy the active export preview using the same handler as the visible Copy control.',
      inputSchema: { type: 'object', additionalProperties: false, properties: {} },
      execute: async () => {
        try { await copyActiveArtifact(); return result('Active export preview copied'); } catch (error) { return errorResult(error.message); }
      },
    },
  ];
  tools.forEach(register);
  const publicTools = tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  const sessionInfo = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: ['entity-collection-v1', 'command-session-v1', 'browse-query-v1', 'artifact-transfer-v1'],
    tool_names: tools.map((tool) => tool.name),
  });
  const listTools = () => publicTools;
  const invokeTool = async (name, args = {}) => {
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`Unknown WebMCP tool: ${name}`);
    return tool.execute(args);
  };
  window.webmcp_session_info = sessionInfo;
  window.webmcp_list_tools = listTools;
  window.webmcp_invoke_tool = invokeTool;
  window.webmcp = { sessionInfo, listTools, invokeTool };
}
