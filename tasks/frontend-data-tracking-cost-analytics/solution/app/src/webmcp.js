import { dateRangeSchema, formulaValues, scheduleSchema, savedViewSchema, teamCeilingSchema } from './contracts';
import { FEATURES, MODELS, TEAMS } from './data';
import { buildCostReport, rateBounds, useCostStore } from './store';

const DESTINATIONS = [
  'spend-overview', 'spend-over-time', 'dimension-breakdown', 'team-budgets',
  'anomaly-list', 'event-table', 'unit-cost-explorer', 'report-history',
];
const FILTERS = ['date-range', 'breakdown-dimension', 'series-toggle', 'drill-down-chip', 'anomaly-day', 'saved-view', 'period-compare-toggle'];
const SORTS = { timestamp: 'timestamp', model: 'model', feature: 'feature', team: 'team', 'prompt-tokens': 'promptTokens', 'completion-tokens': 'completionTokens', cost: 'cost' };
const ENTITY_FIELDS = ['team', 'feature', 'tag', 'team-ceiling', 'what-if-rate', 'budget-cap', 'saved-view-name', 'formula-expression', 'report-frequency', 'report-sections'];
const DIMENSIONS = ['model', 'feature', 'team'];
const membersFor = (dimension) => (dimension === 'model' ? MODELS : dimension === 'team' ? TEAMS : FEATURES);
const ALL_MEMBERS = [...MODELS, ...TEAMS, ...FEATURES];

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
    if (!DESTINATIONS.includes(args.destination)) return fail(`destination must be one of: ${DESTINATIONS.join(', ')}`);
    const element = document.getElementById(args.destination);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' }); else window.scrollTo({ top: 0, behavior: 'smooth' });
    return ok(`Opened ${args.destination}`);
  },
  browse_apply_filter: (args = {}) => {

    if (args.filter === 'date-range') {
      const parsed = dateRangeSchema.safeParse({ from: args.from, to: args.to });
      if (!parsed.success) return fail('date range: both dates must use YYYY-MM-DD and to must be on or after from');
      useCostStore.getState().applyRange(parsed.data); return ok('Date range applied', parsed.data);
    }
    if (args.filter === 'breakdown-dimension') {
      if (!DIMENSIONS.includes(args.dimension)) return fail('dimension must be one of: model, feature, team');
      useCostStore.getState().setDimension(args.dimension); return ok(`Breakdown dimension set to ${args.dimension}`);
    }
    if (args.filter === 'series-toggle') {
      if (!ALL_MEMBERS.includes(args.member)) return fail('member must be a seeded model, team, or feature name');
      useCostStore.getState().toggleSeries(String(args.member));
      return ok(`Series ${args.member} toggled`, { hidden: Boolean(useCostStore.getState().hiddenSeries[args.member]) });
    }
    if (args.filter === 'drill-down-chip') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(args.day || '') || !DIMENSIONS.includes(args.dimension)) return fail('drill-down needs a YYYY-MM-DD day and a dimension in model, feature, team');
      if (!membersFor(args.dimension).includes(args.member)) return fail(`member must be one of the seeded ${args.dimension} names`);
      useCostStore.getState().applyDrilldown(args.day, args.dimension, args.member); return ok(`Drill-down applied to ${args.day} · ${args.dimension}: ${args.member}`);
    }
    if (args.filter === 'anomaly-day') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(args.day || '')) return fail('day must use YYYY-MM-DD');
      useCostStore.getState().applyAnomalyDay(args.day); return ok(`Anomaly day ${args.day} applied as the table filter`);
    }
    if (args.filter === 'saved-view') {
      if (!useCostStore.getState().savedViews.some((v) => v.id === args.id)) return fail('id must name an existing saved view');
      useCostStore.getState().applyView(args.id); return ok('Saved view applied — its filters, dimension, and range are restored');
    }
    if (args.filter === 'period-compare-toggle') {
      if (typeof args.value !== 'boolean') return fail('value must be true or false');
      useCostStore.getState().setCompare(args.value); return ok(`Period compare ${args.value ? 'on' : 'off'}`);
    }
    return fail(`filter must be one of: ${FILTERS.join(', ')}`);
  },
  browse_clear_filter: () => { useCostStore.getState().clearFilter(); return ok('Applied drill-down and anomaly filters cleared'); },
  browse_sort: (args = {}) => {
    if (!SORTS[args.sort]) return fail(`sort must be one of: ${Object.keys(SORTS).join(', ')}`);
    useCostStore.getState().setSort(SORTS[args.sort]); return ok(`Sorted by ${args.sort}`);
  },
  entity_select: (args = {}) => {
    const ids = Array.isArray(args.ids) ? args.ids : args.id ? [args.id] : [];
    const valid = new Set(useCostStore.getState().events.map((e) => e.id));
    if (!ids.length || ids.some((id) => !valid.has(id))) return fail('ids must name seeded usage events');
    useCostStore.getState().setSelected(ids); return ok(`${ids.length} usage events selected`);
  },
  entity_update: (args = {}) => {

    if (args.field === 'budget-cap') {
      const capUsd = Number(args.value);
      if (!(capUsd > 0) || Math.round(capUsd * 100) !== capUsd * 100) return fail('capUsd must be greater than 0 with at most 2 decimal places');
      useCostStore.getState().setBudgetCap({ capUsd }); return ok(`Budget cap updated to $${capUsd.toFixed(2)}`);
    }
    if (args.field === 'team-ceiling') {
      const parsed = teamCeilingSchema.safeParse({ team: args.team, ceilingUsd: Number(args.value) });
      if (!parsed.success) return fail('team must be a seeded team and ceilingUsd must be greater than 0 with at most 2 decimals');
      const sum = TEAMS.reduce((n, team) => n + (team === parsed.data.team ? parsed.data.ceilingUsd : useCostStore.getState().teamCeilings[team]), 0);
      if (sum > useCostStore.getState().budgetCap) return fail(`team ceilings would exceed capUsd by $${(sum - useCostStore.getState().budgetCap).toFixed(2)} — lower another ceiling or raise the cap first`);
      useCostStore.getState().setTeamCeiling(parsed.data); return ok(`${parsed.data.team} ceiling updated to $${parsed.data.ceilingUsd.toFixed(2)}`);
    }
    if (args.field === 'what-if-rate') {
      const rate = Number(args.value ?? args.rate);
      if (!MODELS.includes(args.model)) return fail(`model must be one of: ${MODELS.join(', ')}`);
      const bounds = rateBounds(args.model);
      if (!(rate > 0) || rate < bounds.min || rate > bounds.max) return fail(`rate for ${args.model} must be between ${bounds.min} and ${bounds.max} (0.25×–2.5× of the seeded rate)`);
      useCostStore.getState().setRate(args.model, rate);
      return ok('What-if rate updated — tiles, charts, table, and estimator are repriced', { model: args.model, rate });
    }
    if (args.field === 'formula-expression') {
      const value = String(args.value ?? '');
      if (!formulaValues.includes(value)) return fail(`formula must be exactly one of: ${formulaValues.join(', ')}`);
      useCostStore.getState().setFormula(value); return ok(`Formula set to ${value}`);
    }
    if (args.field === 'team' || args.field === 'feature') {
      const valid = args.field === 'team' ? TEAMS : FEATURES;
      if (!valid.includes(args.value)) return fail(`value must be one of the seeded ${args.field} names: ${valid.join(', ')}`);
      if (!useCostStore.getState().selectedIds.length) return fail('select usage events first (entity_select)');
      const count = useCostStore.getState().selectedIds.length;
      useCostStore.getState().recategorize({ [args.field]: args.value });
      return ok(`${count} usage events recategorized — every aggregate recomputed`);
    }
    if (args.field === 'tag') {
      const value = String(args.value ?? '').trim();
      if (!value || value.length > 40) return fail('tag must be a string of 1–40 characters');
      if (!useCostStore.getState().selectedIds.length) return fail('select usage events first (entity_select)');
      const count = useCostStore.getState().selectedIds.length;
      useCostStore.getState().recategorize({ tag: value });
      return ok(`${count} usage events tagged "${value}"`);
    }
    if (args.field === 'report-frequency' || args.field === 'report-sections') {
      const proposed = {
        frequency: args.field === 'report-frequency' ? args.value : useCostStore.getState().schedule?.frequency || 'weekly',
        sections: args.field === 'report-sections' ? args.value : useCostStore.getState().schedule?.sections || [],
      };
      const parsed = scheduleSchema.safeParse(proposed);
      if (!parsed.success) return fail('frequency must be daily, weekly, or monthly, and sections must be a non-empty subset of totals, per-dimension-tables, anomalies');
      useCostStore.getState().saveSchedule(parsed.data); return ok('Report schedule updated');
    }
    if (args.field === 'saved-view-name') {
      const body = { name: String(args.value ?? ''), dimension: useCostStore.getState().dimension, range: useCostStore.getState().range };
      const parsed = savedViewSchema.safeParse(body);
      if (!parsed.success) return fail('saved-view name must be a trimmed string of 2–60 characters');
      useCostStore.getState().saveView(parsed.data);
      return ok(`Saved view "${parsed.data.name}" created and now active`);
    }
    return fail(`field must be one of: ${ENTITY_FIELDS.join(', ')}`);
  },
  entity_create: (args = {}) => tools.entity_update(args),
  entity_delete: (args = {}) => {
    if (args.confirm !== true) return fail('delete requires confirm=true');

    if (args.savedViewId && useCostStore.getState().savedViews.some((v) => v.id === args.savedViewId)) {
      useCostStore.getState().deleteView(args.savedViewId);
      return ok('Saved view deleted — its currently applied filters remain active');
    }
    return fail('savedViewId must name an existing saved view');
  },
  session_trigger_demo: (args = {}) => {
    if (args.demo !== 'run-schedule-now') return fail('demo must be run-schedule-now');

    if (!useCostStore.getState().schedule) return fail('Save a valid schedule first (entity_update field=report-frequency / report-sections)');
    const ran = useCostStore.getState().runScheduleNow();
    return ran
      ? ok('One report snapshot generated — report history and the capacity gauge updated')
      : ok('Run was pressed again inside the dedupe window — exactly one snapshot was kept');
  },
  artifact_export: (args = {}) => {
    const report = buildCostReport(useCostStore.getState());
    if (args.format === 'cost-report-json') download('cost-analytics-report.json', 'application/json', JSON.stringify(report, null, 2));
    else if (args.format === 'cost-report-csv') download('cost-analytics-report.csv', 'text/csv;charset=utf-8', csv(report));
    else return fail('format must be cost-report-json or cost-report-csv');
    return ok(`${args.format} download started`, { eventCount: report.totals.eventCount, totalCost: report.totals.cost });
  },
};

const descriptions = {
  browse_open: 'Scroll to a declared Cost Command dashboard destination.',
  browse_apply_filter: 'Apply one declared analytics filter (date-range, breakdown-dimension, series-toggle, drill-down-chip, anomaly-day, saved-view, period-compare-toggle) through the same handlers the visible controls use.',
  browse_clear_filter: 'Clear the active drill-down or anomaly-day filter.',
  browse_sort: 'Sort the visible usage-event table by a declared column.',
  entity_select: 'Select seeded usage events for the bulk workflow.',
  entity_update: 'Update one bounded analytics entity field (team, feature, tag, team-ceiling, what-if-rate, budget-cap, saved-view-name, formula-expression, report-frequency, report-sections).',
  entity_create: 'Create a saved view through its bounded field contract.',
  entity_delete: 'Delete a saved view with explicit confirm=true.',
  session_trigger_demo: 'Run the saved report schedule once (demo: run-schedule-now).',
  artifact_export: 'Download the live cost report as cost-report-json or cost-report-csv.',
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
  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    app: 'Cost Command',
    toolCount: Object.keys(tools).length,
    modules: ['browse-query-v1', 'entity-collection-v1', 'command-session-v1', 'artifact-transfer-v1'],
    destinations: DESTINATIONS,
    filters: FILTERS,
    sorts: Object.keys(SORTS),
    entityFields: ENTITY_FIELDS,
    exportFormats: ['cost-report-json', 'cost-report-csv'],
    demos: ['run-schedule-now'],
  });
  const modelContext = navigator.modelContext;
  if (modelContext?.registerTool) {
    Object.entries(tools).forEach(([name, handler]) => {
      try {
        modelContext.registerTool({ name, description: descriptions[name] || `${name.replaceAll('_', ' ')} operation`, inputSchema: { type: 'object', additionalProperties: true }, execute: (args) => handler(toolArgs(args)) });
      } catch { /* The compatibility globals above remain available. */ }
    });
  }
}
