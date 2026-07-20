import { triage } from './triage.svelte';
import { REASONS, RUN_COUNTS, type Reason, type RunCount } from './types';

type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => unknown | Promise<unknown>;
};

const objectSchema = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: 'object',
  additionalProperties: false,
  properties,
  required,
});

function scrollToDestination(destination: string): boolean {
  const element = document.getElementById(destination);
  if (!element) return false;
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

export function registerWebMcpTools(): void {
  const tools: Tool[] = [
    {
      name: 'browse_open',
      description: 'Open a declared triage workspace destination.',
      inputSchema: objectSchema({ destination: { type: 'string', enum: ['triage-queue', 'test-detail', 'quarantine-map', 'audit-timeline'] } }, ['destination']),
      execute: ({ destination }) => ({ opened: scrollToDestination(String(destination)), destination }),
    },
    {
      name: 'browse_search',
      description: 'Search visible tests by test identifier.',
      inputSchema: objectSchema({ query: { type: 'string', minLength: 0, maxLength: 120 } }, ['query']),
      execute: ({ query }) => ({ applied: triage.setSearch(String(query)), visibleCount: triage.visibleTests.length }),
    },
    {
      name: 'browse_apply_filter',
      description: 'Apply a bounded verdict, reason, suite, or timeline-entry-type filter.',
      inputSchema: objectSchema(
        {
          filter: { type: 'string', enum: ['verdict', 'reason', 'suite', 'timeline-entry-type'] },
          value: { type: 'string', minLength: 1, maxLength: 120 },
        },
        ['filter', 'value'],
      ),
      execute: ({ filter, value }) => {
        const key = String(filter);
        const choice = String(value);
        const applied = key === 'verdict'
          ? triage.setVerdictFilter(choice)
          : key === 'reason'
            ? triage.setReasonFilter(choice)
            : key === 'suite'
              ? triage.selectSuite(choice)
              : key === 'timeline-entry-type'
                ? triage.setTimelineFilter(choice)
                : false;
        return { applied, filter: key, visibleCount: triage.visibleTests.length };
      },
    },
    {
      name: 'browse_clear_filter',
      description: 'Clear one declared triage filter.',
      inputSchema: objectSchema({ filter: { type: 'string', enum: ['verdict', 'reason', 'suite', 'timeline-entry-type'] } }, ['filter']),
      execute: ({ filter }) => {
        triage.clearFilter(String(filter) as 'verdict' | 'reason' | 'suite' | 'timeline-entry-type');
        return { cleared: true, filter, visibleCount: triage.visibleTests.length };
      },
    },
    {
      name: 'browse_sort',
      description: 'Sort tests by divergent-run count.',
      inputSchema: objectSchema({ sort: { type: 'string', enum: ['divergence'] }, direction: { type: 'string', enum: ['asc', 'desc'] } }, ['sort', 'direction']),
      execute: ({ direction }) => {
        triage.toggleDivergenceSort(direction as 'asc' | 'desc');
        return { sorted: true, sort: 'divergence', direction, visibleCount: triage.visibleTests.length };
      },
    },
    {
      name: 'browse_set_theme',
      description: 'Set the visible application theme.',
      inputSchema: objectSchema({ theme: { type: 'string', enum: ['light', 'dark'] } }, ['theme']),
      execute: ({ theme }) => {
        triage.setTheme(theme as 'light' | 'dark');
        return { theme: triage.theme };
      },
    },
    {
      name: 'entity_select',
      description: 'Select a test in the active suite and show its detail.',
      inputSchema: objectSchema({ testId: { type: 'string', minLength: 1, maxLength: 180 } }, ['testId']),
      execute: ({ testId }) => ({ selected: triage.selectTest(String(testId)), testId }),
    },
    {
      name: 'entity_update',
      description: 'Update the constrained reason field for a test.',
      inputSchema: objectSchema(
        {
          testId: { type: 'string', minLength: 1, maxLength: 180 },
          reason: { type: 'string', enum: [...REASONS] },
        },
        ['testId', 'reason'],
      ),
      execute: ({ testId, reason }) => ({ updated: triage.updateReason({ testId: String(testId), reason: reason as Reason }), testId, reason }),
    },
    {
      name: 'session_start',
      description: 'Start one bounded simulated re-run session for a test.',
      inputSchema: objectSchema(
        {
          testId: { type: 'string', minLength: 1, maxLength: 180 },
          runCount: { type: 'integer', enum: [...RUN_COUNTS] },
        },
        ['testId', 'runCount'],
      ),
      execute: ({ testId, runCount }) => ({ started: triage.startRerun(String(testId), { runCount: runCount as RunCount }), testId, runCount }),
    },
    {
      name: 'session_stop',
      description: 'Stop the active re-run for a test and freeze completed results.',
      inputSchema: objectSchema({ testId: { type: 'string', minLength: 1, maxLength: 180 } }, ['testId']),
      execute: ({ testId }) => ({ stopped: triage.stopRerun(String(testId)), testId }),
    },
    {
      name: 'artifact_export',
      description: 'Open a live export preview for a declared report format.',
      inputSchema: objectSchema({ format: { type: 'string', enum: ['quarantine-text', 'triage-report-json'] } }, ['format']),
      execute: ({ format }) => {
        triage.openExport(format as 'quarantine-text' | 'triage-report-json');
        return { opened: true, format, suiteId: triage.activeSuite.id };
      },
    },
    {
      name: 'artifact_copy',
      description: 'Copy the currently generated declared report format to the clipboard.',
      inputSchema: objectSchema({ format: { type: 'string', enum: ['quarantine-text', 'triage-report-json'] } }, ['format']),
      execute: async ({ format }) => {
        const selected = format as 'quarantine-text' | 'triage-report-json';
        triage.openExport(selected);
        return { copied: await triage.copyExport(selected), format };
      },
    },
    {
      name: 'artifact_import',
      description: 'Open the visible replace-suite import form. Artifact contents remain a user form interaction.',
      inputSchema: objectSchema({ mode: { type: 'string', enum: ['replace-suite'] } }, ['mode']),
      execute: ({ mode }) => {
        triage.openImport();
        return { opened: true, mode };
      },
    },
  ];

  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    modules: ['browse-query-v1', 'entity-collection-v1', 'command-session-v1', 'artifact-transfer-v1'],
    toolNames: tools.map((tool) => tool.name),
  });
  window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  window.webmcp_invoke_tool = async (
    nameOrRequest: string | { name: string; arguments?: Record<string, unknown> },
    args: Record<string, unknown> = {},
  ) => {
    const name = typeof nameOrRequest === 'string' ? nameOrRequest : nameOrRequest?.name;
    const input = typeof nameOrRequest === 'string' ? args : nameOrRequest?.arguments ?? {};
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`Unknown WebMCP tool: ${name}`);
    return tool.execute(input);
  };

  const context = navigator.modelContext;
  if (!context?.registerTool) return;

  for (const tool of tools) {
    try {
      context.registerTool(tool);
    } catch {
      // Registration can be repeated during Vite hot reload; existing tools remain valid.
    }
  }
}
