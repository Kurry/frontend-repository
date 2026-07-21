import { formatSchemaError } from './schemas.js';

const enumSchema = (values) => ({ type: 'string', enum: values });
const ok = (message, data = {}) => ({ ok: true, message, ...data });
const fail = (message) => ({ ok: false, message });

export function registerWebMCP(state, callbacks) {
  const modelContext = globalThis.navigator?.modelContext;

  const destinations = ['queue', 'evidence-view', 'canary', 'mutation', 'audit'];
  const reviewStates = ['all', 'unreviewed', 'review-triggered', 'confirmed-clean', 'confirmed-leak'];
  const auditVerdicts = ['all', 'confirm-clean', 'confirm-leak'];
  const mutationTasks = state.mutationSuites.map((suite) => suite.task);
  const mutationTestIds = state.mutationSuites.flatMap((suite) => suite.tests.map((test) => test.id));

  const tools = [
    {
      name: 'browse_open',
      description: 'Open a declared review-console destination using the same navigation handler as the visible navigation.',
      inputSchema: { type: 'object', properties: { destination: enumSchema(destinations) }, required: ['destination'], additionalProperties: false },
      execute: ({ destination }) => state.navigate(destination) ? ok(`Opened ${destination}.`) : fail('Evidence view requires a selected submission.')
    },
    {
      name: 'browse_search',
      description: 'Search the submissions collection by task, submitter, or submission id.',
      inputSchema: { type: 'object', properties: { query: { type: 'string', minLength: 0, maxLength: 120 } }, required: ['query'], additionalProperties: false },
      execute: ({ query }) => {
        state.searchQuery = query;
        state.setReviewFilter('all');
        state.navigate('queue');
        return ok('Submission search applied.', { visibleCount: state.visibleSubmissions.length });
      }
    },
    {
      name: 'browse_apply_filter',
      description: 'Apply the declared review-state or audit-verdict filter.',
      inputSchema: {
        type: 'object',
        oneOf: [
          { properties: { filter: { const: 'review-state' }, value: enumSchema(reviewStates.slice(1)) }, required: ['filter', 'value'], additionalProperties: false },
          { properties: { filter: { const: 'audit-verdict' }, value: enumSchema(auditVerdicts.slice(1)) }, required: ['filter', 'value'], additionalProperties: false }
        ]
      },
      execute: ({ filter, value }) => {
        if (filter === 'review-state') { state.setReviewFilter(value); state.navigate('queue'); }
        else { state.setAuditFilter(value); state.navigate('audit'); }
        return ok(`${filter} filter applied.`);
      }
    },
    {
      name: 'browse_clear_filter',
      description: 'Clear the declared review-state or audit-verdict filter.',
      inputSchema: { type: 'object', properties: { filter: enumSchema(['review-state', 'audit-verdict']) }, required: ['filter'], additionalProperties: false },
      execute: ({ filter }) => { filter === 'review-state' ? state.setReviewFilter('all') : state.setAuditFilter('all'); return ok(`${filter} filter cleared.`); }
    },
    {
      name: 'browse_sort',
      description: 'Apply the queue’s declared similarity ranking.',
      inputSchema: { type: 'object', properties: { sort: { const: 'similarity-desc' } }, required: ['sort'], additionalProperties: false },
      execute: () => { state.navigate('queue'); return ok('Submissions are ranked by similarity, highest first.'); }
    },
    {
      name: 'browse_set_locale',
      description: 'Set the review console to its declared English locale.',
      inputSchema: { type: 'object', properties: { locale: { const: 'en-US' } }, required: ['locale'], additionalProperties: false },
      execute: ({ locale }) => { state.locale = locale; document.documentElement.lang = 'en'; return ok('Locale set to en-US.'); }
    },
    {
      name: 'browse_set_theme',
      description: 'Set the visible console theme.',
      inputSchema: { type: 'object', properties: { theme: enumSchema(['light', 'dark']) }, required: ['theme'], additionalProperties: false },
      execute: ({ theme }) => { state.setTheme(theme); return ok(`Theme set to ${theme}.`); }
    },
    {
      name: 'form_validate',
      description: 'Validate a leak-review decision create payload without recording a decision.',
      inputSchema: {
        type: 'object',
        properties: { verdict: enumSchema(['confirm-clean', 'confirm-leak']), rationale: { type: 'string', minLength: 20, maxLength: 2000 } },
        required: ['verdict', 'rationale'],
        additionalProperties: false
      },
      execute: (payload) => {
        const result = state.validateDecision(payload);
        return result.success ? ok('Decision payload is valid.') : fail(formatSchemaError(result.error));
      }
    },
    {
      name: 'form_submit',
      description: 'Submit the validated verdict and rationale for the currently selected submission.',
      inputSchema: {
        type: 'object',
        properties: { verdict: enumSchema(['confirm-clean', 'confirm-leak']), rationale: { type: 'string', minLength: 20, maxLength: 2000 } },
        required: ['verdict', 'rationale'],
        additionalProperties: false
      },
      execute: async (payload) => {
        if (!state.selectedSubmissionId) {
          return fail('submissionId: Select a submission before deciding.');
        }
        const result = await state.submitDecision(payload);
        return result.ok ? ok('Decision recorded.', { requestBody: result.requestBody }) : fail(result.error);
      }
    },
    {
      name: 'form_cancel',
      description: 'Cancel the current reviewer decision without changing submission or audit state.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: () => { state.cancelDecision(); return ok('Decision cancelled.'); }
    },
    {
      name: 'entity_toggle',
      description: 'Toggle a declared mutation test inclusion using the same handler as its visible switch.',
      inputSchema: {
        type: 'object',
        properties: { task: enumSchema(mutationTasks), testId: enumSchema(mutationTestIds), included: { type: 'boolean' } },
        required: ['task', 'testId', 'included'],
        additionalProperties: false
      },
      execute: ({ task, testId, included }) => {
        const updated = state.toggleMutationTest(task, testId, included);
        state.navigate('mutation');
        return updated
          ? ok('Mutation test inclusion updated.')
          : fail('mutationSuites.tests.id: task and testId must identify the same declared test.');
      }
    },
    {
      name: 'artifact_export',
      description: 'Open the export panel on a declared artifact format; artifact contents remain in the visible UI.',
      inputSchema: { type: 'object', properties: { format: enumSchema(['summary-text', 'review-report-json']) }, required: ['format'], additionalProperties: false },
      execute: ({ format }) => { state.openExport(format); return ok(`Export panel opened for ${format}.`); }
    },
    {
      name: 'artifact_copy',
      description: 'Copy the active visible export preview through the product copy handler.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: async () => { await callbacks.copyExport(); return ok('Active export preview copied.'); }
    },
    {
      name: 'artifact_import',
      description: 'Open the visible Review report JSON file picker; file selection remains a user or Playwright action.',
      inputSchema: { type: 'object', properties: { mode: { const: 'review-report-json' } }, required: ['mode'], additionalProperties: false },
      execute: () => { callbacks.openImportPicker(); return ok('Review report JSON picker opened.'); }
    }
  ];

  const sessionInfo = {
    contractVersion: 'zto-webmcp-v1',
    modules: ['browse-query-v1', 'form-workflow-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    toolNames: tools.map((tool) => tool.name)
  };
  const sessionInfoHandler = () => sessionInfo;
  const listToolsHandler = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  const invokeToolHandler = async (name, args = {}) => {
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) return fail(`Unknown WebMCP tool: ${name}`);
    return tool.execute(args);
  };

  globalThis.webmcp_session_info = sessionInfoHandler;
  globalThis.webmcp_list_tools = listToolsHandler;
  globalThis.webmcp_invoke_tool = invokeToolHandler;

  const cleanups = [];
  if (modelContext?.registerTool) {
    for (const tool of tools) {
      try {
        const registration = modelContext.registerTool(tool);
        if (typeof registration === 'function') cleanups.push(registration);
        else if (registration?.unregister) cleanups.push(() => registration.unregister());
      } catch (error) {
        console.warn(`WebMCP tool registration skipped for ${tool.name}:`, error);
      }
    }
  }
  return () => {
    cleanups.forEach((cleanup) => cleanup());
    if (globalThis.webmcp_session_info === sessionInfoHandler) delete globalThis.webmcp_session_info;
    if (globalThis.webmcp_list_tools === listToolsHandler) delete globalThis.webmcp_list_tools;
    if (globalThis.webmcp_invoke_tool === invokeToolHandler) delete globalThis.webmcp_invoke_tool;
  };
}
