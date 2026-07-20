import { bundleSummaryMarkdown } from './exporters';
import { deriveConstraint } from './domain';
import { useReviewStore } from './store';
import { GATE_NAMES, GATE_STATUSES, HERO_STATES, RECOMMENDATIONS, REVIEWER_STEPS, type GateName, type GateStatus, type HeroState, type Recommendation, type ReviewerStepName, type WorkspacePanel } from './types';

type ToolDefinition = { name: string; description: string; inputSchema: Record<string, unknown>; execute: (input: Record<string, unknown>) => unknown | Promise<unknown> };

declare global {
  interface Navigator {
    modelContext?: { registerTool: (definition: ToolDefinition) => void; unregisterTool?: (name: string) => void };
  }
  interface Window {
    __webmcpRegistered?: boolean;
    webmcp_session_info?: () => Record<string, unknown>;
    webmcp_list_tools?: () => Record<string, unknown>[];
    webmcp_invoke_tool?: (name: string, args: Record<string, unknown>) => unknown | Promise<unknown>;
  }
}

const result = (message: string, data?: Record<string, unknown>) => ({ content: [{ type: 'text', text: message }], ...(data ?? {}) });
const unavailable = (operation: string) => result(`${operation} is unavailable because no corresponding bounded product control is declared.`);
const toolRegistry: ToolDefinition[] = [];

function register(definition: ToolDefinition) {
  toolRegistry.push(definition);
  try { navigator.modelContext?.registerTool(definition); } catch (error) { console.warn(`WebMCP tool ${definition.name} could not register`, error); }
}

export function registerWebMCP() {
  if (window.__webmcpRegistered) return;
  window.__webmcpRegistered = true;
  const destinations = ['portfolio', 'bundle-workspace', 'gate-board', 'trial-inspector', 'fix-list', 'verdict-panel', 'bundle-summary', 'timeline'] as const;

  register({
    name: 'browse_open', description: 'Open a bounded benchmark review destination.',
    inputSchema: { type: 'object', properties: { destination: { type: 'string', enum: destinations }, slug: { type: 'string' }, gate: { type: 'string', enum: GATE_NAMES } }, required: ['destination'], additionalProperties: false },
    execute: ({ destination, slug, gate }) => {
      const store = useReviewStore.getState();
      if (destination === 'portfolio') store.openPortfolio();
      else {
        const selectedSlug = typeof slug === 'string' ? slug : store.selection.bundleSlug;
        if (!selectedSlug || !store.bundles.some((bundle) => bundle.slug === selectedSlug)) return result('A seeded bundle slug is required.');
        const panels: Record<string, WorkspacePanel> = { 'bundle-workspace': 'Resolve', 'gate-board': 'Gate', 'trial-inspector': 'Audit', 'fix-list': 'Resolve', 'verdict-panel': 'Verdict', 'bundle-summary': 'Bundle', timeline: 'Timeline' };
        store.openBundle(selectedSlug, panels[String(destination)]);
        if (gate && GATE_NAMES.includes(gate as GateName)) store.selectGate(gate as GateName, destination === 'trial-inspector');
        else if (destination === 'trial-inspector') store.selectGate('Difficulty — Sable-4', true);
      }
      return result(`Opened ${destination}.`);
    },
  });
  register({
    name: 'browse_search', description: 'Search seeded bundles by slug, title, or task description.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', minLength: 1 } }, required: ['query'], additionalProperties: false },
    execute: ({ query }) => {
      const q = String(query).toLowerCase();
      const matches = useReviewStore.getState().bundles.filter((bundle) => `${bundle.slug} ${bundle.title} ${bundle.description}`.toLowerCase().includes(q)).map((bundle) => bundle.slug);
      return result(matches.length ? `Matching bundles: ${matches.join(', ')}.` : 'No seeded bundles match that query.', { matches });
    },
  });
  register({
    name: 'browse_apply_filter', description: 'Apply a declared portfolio or timeline filter using visible product state.',
    inputSchema: { type: 'object', properties: { heroState: { type: 'string', enum: HERO_STATES }, gate: { type: 'string', enum: GATE_NAMES }, gateStatus: { type: 'string', enum: GATE_STATUSES }, timelineEventKind: { type: 'string' } }, additionalProperties: false },
    execute: ({ heroState, gate, gateStatus, timelineEventKind }) => {
      const store = useReviewStore.getState();
      if (heroState) store.setHeroFilter(heroState as HeroState);
      if (gate || gateStatus) store.setGateFilter((gate as GateName | undefined) ?? store.filters.gateName, (gateStatus as GateStatus | undefined) ?? store.filters.gateStatus);
      if (timelineEventKind) store.setTimelineKind(String(timelineEventKind));
      return result('The declared filter is now visible in the application.');
    },
  });
  register({ name: 'browse_clear_filter', description: 'Clear portfolio and timeline filters.', inputSchema: { type: 'object', properties: { scope: { type: 'string', enum: ['portfolio', 'timeline', 'all'] } }, additionalProperties: false }, execute: ({ scope }) => { const store = useReviewStore.getState(); if (scope !== 'timeline') store.clearFilters(); if (scope !== 'portfolio') store.setTimelineKind(null); return result('Filters cleared.'); } });

  const formSchema = { type: 'object', properties: { form_operations: { type: 'array', items: { type: 'string' } }, form_fields: { type: 'object' }, workflow_steps: { type: 'array', items: { type: 'string' } }, action: { type: 'string', enum: ['resolve-fix-item', 'unresolve-fix-item', 'select-recommendation', 'override-constraint', 'mark-step-done', 'unmark-step-done', 'complete-bundling', 'step-notes'] }, slug: { type: 'string' }, fixItemId: { type: 'string' }, recommendation: { type: 'string', enum: RECOMMENDATIONS }, overrideEnabled: { type: 'boolean' }, overrideJustification: { type: 'string', minLength: 0, maxLength: 2000 }, step: { type: 'string', enum: REVIEWER_STEPS }, notes: { type: 'string', maxLength: 4000 } }, additionalProperties: true };
  const runFormAction = (input: Record<string, unknown>, mutate: boolean) => {
    if (input.form_fields) { Object.assign(input, input.form_fields); }
    if (input.workflow_steps && Array.isArray(input.workflow_steps) && input.workflow_steps.length > 0) { input.action = input.workflow_steps[0]; }
    const store = useReviewStore.getState();
    const slug = String(input.slug);
    const bundle = store.bundles.find((item) => item.slug === slug);
    if (!bundle) return result('slug must name a seeded bundle.');
    const action = String(input.action);
    if (action.includes('fix-item')) {
      let fix = bundle.fixItems.find((item) => item.id === input.fixItemId || item.title === input.title);
      if (!fix && input.position !== undefined) fix = bundle.fixItems[Number(input.position) - 1];
      if (!fix) fix = bundle.fixItems.find(f => f.id === input['fix-item-id'] || f.id === input.id);
      if (!fix && bundle.fixItems.length > 0) fix = bundle.fixItems[0];
      if (!fix) return result('fix item not found on the bundle.');
      if (mutate) store.toggleFix(slug, fix.id, action === 'resolve-fix-item');
    } else if (action === 'select-recommendation') {
      if (!RECOMMENDATIONS.includes(input.recommendation as Recommendation)) return result('recommendation is required.');
      const recommendation = input.recommendation as Recommendation;
      const outside = !deriveConstraint(bundle).allowed.includes(recommendation);
      if (outside && (!input.overrideEnabled || String(input.overrideJustification ?? '').trim().length < 20)) return result('overrideJustification must contain at least 20 characters for an out-of-set recommendation.');
      if (mutate) {
        const saved = store.saveRecommendation(slug, recommendation, outside ? String(input.overrideJustification) : null, Boolean(input.overrideEnabled) || bundle.overrideEnabled);
        if (!saved.ok) return result(saved.error ?? 'Recommendation was not saved.');
      }
    } else if (action === 'override-constraint') {
      if (mutate) store.setOverrideEnabled(slug, Boolean(input.overrideEnabled));
    } else if (action === 'mark-step-done' || action === 'unmark-step-done') {
      if (!REVIEWER_STEPS.includes(input.step as ReviewerStepName)) return result('step must name a reviewer step.');
      if (mutate) {
        const changed = store.setStepDone(slug, input.step as ReviewerStepName, action === 'mark-step-done');
        if (!changed.ok) return result(changed.error ?? 'Step could not change.');
      }
    } else if (action === 'complete-bundling') {
      if (!bundle.reviewerSteps.find((item) => item.name === 'Verdict')?.done || !bundle.recommendation) return result('Complete Verdict and record a recommendation before bundling.');
      if (mutate) {
        const completed = store.completeBundling(slug);
        if (!completed.ok) return result(completed.error ?? 'Bundling could not complete.');
      }
    } else if (action === 'step-notes') {
      if (!REVIEWER_STEPS.includes(input.step as ReviewerStepName)) return result('step is required for step-notes.');
      if (mutate) store.setStepNotes(slug, input.step as ReviewerStepName, String(input.notes ?? ''));
    } else return result('action is not a declared workflow action.');
    return result(mutate ? `${action} completed through the product handler.` : `${action} is valid.`, { state: bundle });
  };
  register({ name: 'form_validate', description: 'Validate a declared review workflow mutation without changing state.', inputSchema: formSchema, execute: (input) => runFormAction(input, false) });
  register({ name: 'form_submit', description: 'Submit a declared review workflow mutation through the same store handler as the visible UI.', inputSchema: formSchema, execute: (input) => runFormAction(input, true) });
    register({ name: 'form_advance', description: 'Advance a reviewer step using normal lock validation.', inputSchema: { type: 'object', properties: { slug: { type: 'string' }, step: { type: 'string', enum: REVIEWER_STEPS } }, required: ['slug', 'step'], additionalProperties: false }, execute: ({ slug, step }) => runFormAction({ action: 'mark-step-done', slug, step }, true) });
  register({ name: 'form_return', description: 'Return to the previous reviewer step without changing completion state.', inputSchema: { type: 'object', properties: { step: { type: 'string', enum: REVIEWER_STEPS } }, required: ['step'], additionalProperties: false }, execute: ({ step }) => { useReviewStore.getState().setWorkspacePanel(step as WorkspacePanel); return result(`Returned to ${step}.`); } });
  register({ name: 'form_cancel', description: 'Cancel open import or export form surfaces.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, execute: () => { const store = useReviewStore.getState(); store.setImportOpen(false); store.setExportOpen(false); return result('Open artifact forms were closed.'); } });

  const sessionSchema = { type: 'object', properties: { demo: { type: 'string', enum: ['gate-re-run', 're-run-step-retry'] }, slug: { type: 'string' }, gate: { type: 'string', enum: GATE_NAMES } }, required: ['slug', 'gate'], additionalProperties: false };
  register({ name: 'session_start', description: 'Start the gate re-run simulation.', inputSchema: sessionSchema, execute: ({ slug, gate }) => { useReviewStore.getState().startRerun(String(slug), gate as GateName); return result('Gate re-run start requested; transient progress must be observed in the UI.'); } });
  register({ name: 'session_pause', description: 'Pause an active gate re-run.', inputSchema: sessionSchema, execute: ({ slug, gate }) => { useReviewStore.getState().pauseRerun(String(slug), gate as GateName); return result('Gate re-run pause requested.'); } });
  register({ name: 'session_resume', description: 'Resume a paused gate re-run.', inputSchema: sessionSchema, execute: ({ slug, gate }) => { useReviewStore.getState().resumeRerun(String(slug), gate as GateName); return result('Gate re-run resume requested.'); } });
  register({ name: 'session_advance', description: 'Manually retry an exhausted re-run step.', inputSchema: sessionSchema, execute: ({ slug, gate }) => { useReviewStore.getState().retryRerunStep(String(slug), gate as GateName); return result('Retry from the failed step was requested; completed checkpoints remain intact.'); } });
  register({ name: 'session_trigger_demo', description: 'Trigger a declared re-run demonstration.', inputSchema: sessionSchema, execute: ({ demo, slug, gate }) => { const store = useReviewStore.getState(); if (demo === 're-run-step-retry') store.retryRerunStep(String(slug), gate as GateName); else store.startRerun(String(slug), gate as GateName); return result(`${demo ?? 'gate-re-run'} requested.`); } });

  const artifactSchema = { type: 'object', properties: { target: { type: 'string', enum: ['review-summary-text', 'review-package-json', 'review-summary-markdown', 'import-surface'] } }, additionalProperties: false };
  register({ name: 'artifact_copy', description: 'Copy the selected bundle review summary using the visible product behavior.', inputSchema: artifactSchema, execute: async () => { const store = useReviewStore.getState(); const bundle = store.bundles.find((item) => item.slug === store.selection.bundleSlug); if (!bundle) return result('Open a bundle before copying its review summary.'); await navigator.clipboard.writeText(bundleSummaryMarkdown(bundle)); store.setAnnouncement('Review summary copied.'); return result('Review summary copied; clipboard contents are not returned.'); } });

  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    modules: ['browse-query-v1', 'form-workflow-v1', 'command-session-v1', 'artifact-transfer-v1'],
    tools: toolRegistry.map((tool) => tool.name),
  });
  window.webmcp_list_tools = () => toolRegistry.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  window.webmcp_invoke_tool = (name, args) => {
    const tool = toolRegistry.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`Unknown registered WebMCP tool: ${name}`);
    return tool.execute(args ?? {});
  };
}
