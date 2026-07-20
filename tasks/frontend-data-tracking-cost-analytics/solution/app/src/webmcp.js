import { dateRangeSchema, scheduleSchema, savedViewSchema, teamCeilingSchema } from './contracts';
import { FEATURES, MODELS, TEAMS } from './data';
import { buildCostReport, useCostStore } from './store';

const DESTINATIONS = {
  'spend-overview': null,
  'spend-over-time': 'spend-over-time',
  'dimension-breakdown': 'dimension-breakdown',
  'team-budgets': 'team-budgets',
  'anomaly-list': 'anomaly-list',
  'event-table': 'event-table',
  'unit-cost-explorer': 'unit-cost-explorer',
  'report-history': 'report-history',
};
const SORTS = { timestamp: 'timestamp', model: 'model', feature: 'feature', team: 'team', 'prompt-tokens': 'promptTokens', 'completion-tokens': 'completionTokens', cost: 'cost' };

function ok(message, details = {}) { return { ok: true, message, ...details }; }
function fail(message) { return { ok: false, error: message }; }
function download(name, type, body) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
function csv(report) {
  const keys = ['timestamp', 'model', 'feature', 'team', 'promptTokens', 'completionTokens', 'cost', 'tag'];
  const cell = (v) => /[",\n]/.test(String(v)) ? `"${String(v).replaceAll('"', '""')}"` : String(v);
  return [keys.join(','), ...report.events.map((row) => keys.map((key) => cell(row[key])).join(','))].join('\n');
}

const tools = {
  browse_open: (args = {}) => {
    if (!(args.destination in DESTINATIONS)) return fail('destination must be a declared dashboard destination');
    const id = DESTINATIONS[args.destination];
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); else window.scrollTo({ top: 0, behavior: 'smooth' });
    return ok(`Opened ${args.destination}`);
  },
  browse_apply_filter: (args = {}) => {
    const state = useCostStore.getState();
    if (args.filter === 'date-range') {
      const parsed = dateRangeSchema.safeParse({ from: args.from, to: args.to });
      if (!parsed.success) return fail('date range: to must not precede from and both dates must use YYYY-MM-DD');
      state.applyRange(parsed.data); return ok('Date range applied');
    }
    if (args.filter === 'breakdown-dimension' && ['model', 'feature', 'team'].includes(args.dimension)) { state.setDimension(args.dimension); return ok('Breakdown dimension applied'); }
    if (args.filter === 'series-toggle') { state.toggleSeries(String(args.member)); return ok('Series visibility toggled'); }
    if (args.filter === 'drill-down-chip' && /^\d{4}-\d{2}-\d{2}$/.test(args.day) && ['model', 'feature', 'team'].includes(args.dimension)) { state.applyDrilldown(args.day, args.dimension, args.member); return ok('Drill-down applied'); }
    if (args.filter === 'anomaly-day' && /^\d{4}-\d{2}-\d{2}$/.test(args.day)) { state.applyAnomalyDay(args.day); return ok('Anomaly day applied'); }
    if (args.filter === 'saved-view' && state.savedViews.some((v) => v.id === args.id)) { state.applyView(args.id); return ok('Saved view applied'); }
    if (args.filter === 'period-compare-toggle' && typeof args.value === 'boolean') { state.setCompare(args.value); return ok('Period compare updated'); }
    return fail('filter or bounded filter values are invalid');
  },
  browse_clear_filter: () => { useCostStore.getState().clearFilter(); return ok('Applied drill-down filters cleared'); },
  browse_sort: (args = {}) => { if (!SORTS[args.sort]) return fail('sort is outside the declared set'); useCostStore.getState().setSort(SORTS[args.sort]); return ok(`Sorted by ${args.sort}`); },
  entity_select: (args = {}) => {
    const ids = Array.isArray(args.ids) ? args.ids : args.id ? [args.id] : [];
    const valid = new Set(useCostStore.getState().events.map((e) => e.id));
    if (!ids.length || ids.some((id) => !valid.has(id))) return fail('ids must name seeded usage events');
    useCostStore.getState().setSelected(ids); return ok(`${ids.length} usage events selected`);
  },
  entity_update: (args = {}) => {
    const state = useCostStore.getState();
    if (args.field === 'budget-cap') { const capUsd = Number(args.value); if (!(capUsd > 0) || Math.round(capUsd * 100) !== capUsd * 100) return fail('capUsd must be positive with at most 2 decimals'); state.setBudgetCap({ capUsd }); return ok('Budget cap updated'); }
    if (args.field === 'team-ceiling') {
      const parsed = teamCeilingSchema.safeParse({ team: args.team, ceilingUsd: Number(args.value) }); if (!parsed.success) return fail('team and ceilingUsd are invalid');
      const sum = TEAMS.reduce((n, team) => n + (team === parsed.data.team ? parsed.data.ceilingUsd : state.teamCeilings[team]), 0);
      if (sum > state.budgetCap) return fail(`team ceilings exceed capUsd by $${(sum - state.budgetCap).toFixed(2)}`);
      state.setTeamCeiling(parsed.data); return ok('Team ceiling updated');
    }
    if (args.field === 'what-if-rate') {
      const rate = Number(args.value ?? args.rate);
      if (!MODELS.includes(args.model) || !(rate > 0)) return fail('model or rate is invalid');
      state.setRate(args.model, rate);
      return ok('What-if rate updated', { model: args.model, rate });
    }
    if (args.field === 'formula-expression') { state.setFormula(String(args.value)); return ok('Formula expression updated'); }
    if (args.field === 'team' || args.field === 'feature') {
      const valid = args.field === 'team' ? TEAMS : FEATURES; if (!valid.includes(args.value) || !state.selectedIds.length) return fail('value must use the seeded closed set and events must be selected');
      state.recategorize({ [args.field]: args.value }); return ok('Selected usage events recategorized');
    }
    if (args.field === 'report-frequency' || args.field === 'report-sections') {
      const proposed = { frequency: args.field === 'report-frequency' ? args.value : state.schedule?.frequency || 'weekly', sections: args.field === 'report-sections' ? args.value : state.schedule?.sections || [] };
      const parsed = scheduleSchema.safeParse(proposed); if (!parsed.success) return fail('frequency or sections request body is invalid'); state.saveSchedule(parsed.data); return ok('Report schedule updated');
    }
    if (args.field === 'saved-view-name') {
      const body = { name: args.value, dimension: state.dimension, range: state.range }; const parsed = savedViewSchema.safeParse(body); if (!parsed.success) return fail('saved-view name must be a trimmed string of 2–60 characters'); state.saveView(parsed.data); return ok('Saved view created');
    }
    return fail('field is outside the declared entity fields');
  },
  entity_create: (args = {}) => tools.entity_update(args),
  entity_delete: (args = {}) => {
    if (args.confirm !== true) return fail('delete requires confirm=true');
    const state = useCostStore.getState();
    if (args.savedViewId && state.savedViews.some((v) => v.id === args.savedViewId)) { state.deleteView(args.savedViewId); return ok('Saved view deleted; active filters remain visible'); }
    return fail('Only declared saved views can be deleted');
  },
  session_trigger_demo: (args = {}) => { if (args.demo !== 'run-schedule-now') return fail('demo must be run-schedule-now'); if (!useCostStore.getState().schedule) return fail('Save a valid schedule first'); useCostStore.getState().runScheduleNow(); return ok('One report snapshot generated'); },
  artifact_export: (args = {}) => {
    const report = buildCostReport(useCostStore.getState());
    if (args.format === 'cost-report-json') download('cost-analytics-report.json', 'application/json', JSON.stringify(report, null, 2));
    else if (args.format === 'cost-report-csv') download('cost-analytics-report.csv', 'text/csv;charset=utf-8', csv(report));
    else return fail('format must be cost-report-json or cost-report-csv');
    return ok(`${args.format} download started`, { eventCount: report.totals.eventCount });
  },
};

const descriptions = {
  browse_open: 'Open a declared Cost Command dashboard destination.',
  browse_apply_filter: 'Apply one declared analytics filter using visible dashboard state.',
  browse_clear_filter: 'Clear the active drill-down or anomaly filter.',
  browse_sort: 'Sort the visible usage-event table by a declared column.',
  entity_select: 'Select declared usage events for the bulk workflow.',
  entity_update: 'Update one bounded analytics entity field.',
  entity_create: 'Create a saved view through its bounded field contract.',
  entity_delete: 'Delete a saved view with explicit confirmation.',
  session_trigger_demo: 'Run the saved report schedule once.',
  artifact_export: 'Download the live cost report as JSON or CSV.',
};

function toolArgs(value) {
  if (value && typeof value === 'object' && value.arguments && typeof value.arguments === 'object') return value.arguments;
  if (value && typeof value === 'object' && value.args && typeof value.args === 'object') return value.args;
  return value || {};
}

let registered = false;
export function registerWebMCP() {
  if (registered) return;
  registered = true;
  window.webmcp_list_tools = () => Object.keys(tools).map((name) => ({ name, description: descriptions[name] || `${name.replaceAll('_', ' ')} operation` }));
  window.webmcp_invoke_tool = async (name, args = {}) => tools[name] ? tools[name](toolArgs(args)) : fail('Unknown WebMCP tool');
  window.webmcp_session_info = () => ({ contractVersion: 'zto-webmcp-v1', app: 'Cost Command', toolCount: Object.keys(tools).length });
  const modelContext = navigator.modelContext;
  if (modelContext?.registerTool) {
    Object.entries(tools).forEach(([name, handler]) => {
      try {
        modelContext.registerTool({ name, description: descriptions[name] || `${name.replaceAll('_', ' ')} operation`, inputSchema: { type: 'object', additionalProperties: true }, execute: (args) => handler(toolArgs(args)) });
      } catch { /* The compatibility globals above remain available. */ }
    });
  }
}
