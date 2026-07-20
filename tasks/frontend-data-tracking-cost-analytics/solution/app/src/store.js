import { create } from 'zustand';
import { differenceInCalendarDays, eachDayOfInterval, endOfMonth, format, parseISO, subDays } from 'date-fns';
import { DEFAULT_RANGE, FEATURES, INITIAL_CEILINGS, MODELS, ORIGINAL_RATES, TEAMS, seedEvents } from './data';
import { formulaValues } from './contracts';

const initialEvents = seedEvents();

export const currentRate = (state, model) => state.rateOverrides[model] ?? ORIGINAL_RATES[model];
export const pricedCost = (event, state) => Number((((event.promptTokens + event.completionTokens) / 1000) * currentRate(state, event.model)).toFixed(6));
export const dateOf = (event) => event.timestamp.slice(0, 10);

export function scopedEvents(state, includeRange = true) {
  return state.events.filter((event) => {
    const date = dateOf(event);
    if (includeRange && (date < state.range.from || date > state.range.to)) return false;
    if (state.filter.day && date !== state.filter.day) return false;
    if (state.filter.dimension && event[state.filter.dimension] !== state.filter.member) return false;
    return true;
  });
}

export function totalsFor(events, state) {
  return events.reduce((acc, event) => ({
    cost: acc.cost + pricedCost(event, state),
    promptTokens: acc.promptTokens + event.promptTokens,
    completionTokens: acc.completionTokens + event.completionTokens,
    eventCount: acc.eventCount + 1,
  }), { cost: 0, promptTokens: 0, completionTokens: 0, eventCount: 0 });
}

export function dailySeries(state, previous = false) {
  let from = parseISO(state.range.from);
  let to = parseISO(state.range.to);
  const length = differenceInCalendarDays(to, from) + 1;
  if (previous) {
    to = subDays(from, 1);
    from = subDays(to, length - 1);
  }
  const map = new Map(eachDayOfInterval({ start: from, end: to }).map((date) => [format(date, 'yyyy-MM-dd'), 0]));
  state.events.forEach((event) => {
    const day = dateOf(event);
    if (day < format(from, 'yyyy-MM-dd') || day > format(to, 'yyyy-MM-dd')) return;
    if (state.filter.day && day !== state.filter.day) return;
    if (state.filter.dimension && event[state.filter.dimension] !== state.filter.member) return;
    map.set(day, (map.get(day) || 0) + pricedCost(event, state));
  });
  let cumulative = 0;
  return [...map].map(([date, spend]) => {
    cumulative += spend;
    return { date, label: format(parseISO(date), 'MMM d'), spend, cumulative, exact: Number(cumulative.toFixed(6)) };
  });
}

export function dimensionSeries(state) {
  const members = state.dimension === 'model' ? MODELS : state.dimension === 'team' ? TEAMS : FEATURES;
  const days = eachDayOfInterval({ start: parseISO(state.range.from), end: parseISO(state.range.to) });
  const rows = new Map(days.map((day) => [format(day, 'yyyy-MM-dd'), {}]));
  scopedEvents(state).forEach((event) => {
    const day = dateOf(event);
    const member = event[state.dimension];
    const row = rows.get(day);
    if (row) row[member] = (row[member] || 0) + pricedCost(event, state);
  });
  return { members, rows: [...rows].map(([date, values]) => ({ date, label: format(parseISO(date), 'MMM d'), ...values })) };
}

export function anomalyData(state) {
  const allDaily = new Map();
  state.events.forEach((event) => {
    if (state.filter.dimension && event[state.filter.dimension] !== state.filter.member) return;
    const day = dateOf(event);
    allDaily.set(day, (allDaily.get(day) || 0) + pricedCost(event, state));
  });
  const days = [...allDaily.keys()].sort();
  return days.map((date, index) => {
    if (index < 7) return null;
    const trailing = days.slice(index - 7, index).reduce((sum, d) => sum + allDaily.get(d), 0) / 7;
    const spend = allDaily.get(date);
    if (date < state.range.from || date > state.range.to || spend <= trailing * 2) return null;
    const events = state.events.filter((event) => dateOf(event) === date).sort((a, b) => pricedCost(b, state) - pricedCost(a, state)).slice(0, 3);
    return { date, spend, percentAboveTrend: Math.round(((spend - trailing) / trailing) * 100), events };
  }).filter(Boolean);
}

export function teamAnalytics(state) {
  const events = scopedEvents(state);
  const span = Math.max(1, differenceInCalendarDays(parseISO(state.range.to), parseISO(state.range.from)) + 1);
  const projectionDays = differenceInCalendarDays(endOfMonth(parseISO(state.range.to)), new Date(parseISO(state.range.to).getFullYear(), parseISO(state.range.to).getMonth(), 1)) + 1;
  return TEAMS.map((team) => {
    const spendToDate = events.filter((e) => e.team === team).reduce((sum, e) => sum + pricedCost(e, state), 0);
    return { team, ceilingUsd: state.teamCeilings[team], spendToDate, projectedMonthEnd: (spendToDate / span) * projectionDays };
  });
}

export function kpiData(state) {
  const primary = dailySeries(state);
  const previous = dailySeries(state, true);
  const total = primary.at(-1)?.cumulative || 0;
  const today = primary.at(-1)?.spend || 0;
  const days = primary.length || 1;
  const monthDays = Number(format(endOfMonth(parseISO(state.range.to)), 'd'));
  const projected = (total / days) * monthDays;
  const previousTotal = previous.at(-1)?.cumulative || 0;
  const previousToday = previous.at(-1)?.spend || 0;
  const previousProjected = (previousTotal / days) * monthDays;
  const delta = (value, old) => old === 0 ? 0 : ((value - old) / old) * 100;
  return {
    total,
    today,
    projected,
    remaining: state.budgetCap - projected,
    deltas: {
      total: delta(total, previousTotal),
      today: delta(today, previousToday),
      projected: delta(projected, previousProjected),
      remaining: delta(state.budgetCap - projected, state.budgetCap - previousProjected),
    },
  };
}

export function evaluateFormula(expression, events, state) {
  if (!formulaValues.includes(expression)) return { error: `Accepted forms: ${formulaValues.join(', ')}` };
  const totals = totalsFor(events, state);
  if (expression === '=SUM(cost)') return { label: 'Sum of cost', value: totals.cost, currency: true };
  if (expression === '=AVG(cost)') return { label: 'Average cost', value: events.length ? totals.cost / events.length : 0, currency: true };
  if (expression === '=COUNT()') return { label: 'Event count', value: events.length };
  if (expression === '=SUM(prompt_tokens)') return { label: 'Prompt tokens', value: totals.promptTokens };
  return { label: 'Completion tokens', value: totals.completionTokens };
}

const snapshot = (state) => ({
  events: state.events,
  teamCeilings: state.teamCeilings,
  savedViews: state.savedViews,
  schedule: state.schedule,
  range: state.range,
  dimension: state.dimension,
  filter: state.filter,
});

const withHistory = (state, patch) => ({ ...patch, history: [...state.history.slice(-19), snapshot(state)], future: [] });

export const useCostStore = create((set, get) => ({
  events: initialEvents,
  rateOverrides: {},
  teamCeilings: INITIAL_CEILINGS,
  budgetCap: 100,
  budgetNote: '',
  range: DEFAULT_RANGE,
  compare: false,
  dimension: 'model',
  hiddenSeries: {},
  filter: { day: null, dimension: null, member: null },
  selectedIds: [],
  sort: { key: 'timestamp', direction: 'desc' },
  savedViews: [],
  activeViewId: null,
  schedule: null,
  snapshots: [],
  lastReportRunAt: 0,
  formula: '=SUM(cost)',
  history: [],
  future: [],
  toast: null,
  announce: '',

  setToast: (toast) => set({ toast }),
  setBudgetCap: ({ capUsd, note }) => set({ budgetCap: capUsd, budgetNote: note || '', announce: `Monthly budget cap set to $${capUsd.toFixed(2)}` }),
  applyRange: (range) => set({ range, selectedIds: [], activeViewId: null }),
  setCompare: (compare) => set({ compare }),
  setDimension: (dimension) => set({ dimension, hiddenSeries: {}, activeViewId: null }),
  toggleSeries: (member) => set((state) => ({ hiddenSeries: { ...state.hiddenSeries, [member]: !state.hiddenSeries[member] } })),
  applyDrilldown: (day, dimension, member) => set({ filter: { day, dimension, member }, selectedIds: [], activeViewId: null }),
  applyAnomalyDay: (day) => set({ filter: { day, dimension: null, member: null }, selectedIds: [], activeViewId: null }),
  clearFilter: () => set({ filter: { day: null, dimension: null, member: null }, selectedIds: [], activeViewId: null }),
  clearAllFilters: () => set({ range: DEFAULT_RANGE, filter: { day: null, dimension: null, member: null }, selectedIds: [], activeViewId: null }),
  setSort: (key) => set((state) => ({ sort: { key, direction: state.sort.key === key && state.sort.direction === 'asc' ? 'desc' : 'asc' } })),
  setSelected: (ids) => set({ selectedIds: ids }),
  toggleSelected: (id) => set((state) => ({ selectedIds: state.selectedIds.includes(id) ? state.selectedIds.filter((x) => x !== id) : [...state.selectedIds, id] })),
  recategorize: ({ team, feature }) => set((state) => withHistory(state, {
    events: state.events.map((event) => state.selectedIds.includes(event.id) ? { ...event, ...(team ? { team } : {}), ...(feature ? { feature } : {}) } : event),
    selectedIds: [],
    announce: `${state.selectedIds.length} events recategorized`,
  })),
  setTeamCeiling: ({ team, ceilingUsd }) => set((state) => withHistory(state, { teamCeilings: { ...state.teamCeilings, [team]: ceilingUsd }, announce: `${team} ceiling updated` })),
  setRate: (model, rate) => set((state) => ({ rateOverrides: { ...state.rateOverrides, [model]: rate } })),
  revertRates: () => set({ rateOverrides: {}, announce: 'What-if rates reverted' }),
  setFormula: (formula) => set({ formula }),
  saveView: ({ name, dimension, range }) => set((state) => {
    const view = { id: `view-${Date.now()}`, name: name.trim(), dimension, range, filter: state.filter };
    return withHistory(state, {
      savedViews: [...state.savedViews, view],
      activeViewId: view.id,
      toast: { kind: 'success', title: 'View saved', subtitle: `${view.name} is ready to restore.` },
      announce: `Saved view ${view.name}`,
    });
  }),
  applyView: (id) => set((state) => {
    const view = state.savedViews.find((item) => item.id === id);
    return view ? { range: view.range, dimension: view.dimension, filter: view.filter, activeViewId: id, hiddenSeries: {}, selectedIds: [] } : {};
  }),
  deleteView: (id) => set((state) => withHistory(state, { savedViews: state.savedViews.filter((view) => view.id !== id), activeViewId: state.activeViewId === id ? null : state.activeViewId })),
  saveSchedule: (schedule) => set((state) => withHistory(state, {
    schedule,
    toast: { kind: 'success', title: 'Schedule saved', subtitle: `${schedule.frequency} report schedule is active.` },
    announce: `${schedule.frequency} report schedule saved`,
  })),
  runScheduleNow: () => set((state) => {
    const now = Date.now();
    if (now - state.lastReportRunAt < 600) return {};
    const totals = totalsFor(scopedEvents(state), state);
    const report = { id: `report-${now}`, generatedAt: new Date(now).toISOString(), totals };
    return { snapshots: [...state.snapshots, report], lastReportRunAt: now, toast: { kind: 'success', title: 'Report generated', subtitle: 'A live snapshot was added to history.' }, announce: 'Report generated' };
  }),
  undo: () => set((state) => {
    if (!state.history.length) return {};
    const prior = state.history.at(-1);
    return { ...prior, history: state.history.slice(0, -1), future: [snapshot(state), ...state.future], selectedIds: [], toast: null, announce: 'Change undone' };
  }),
  redo: () => set((state) => {
    if (!state.future.length) return {};
    const next = state.future[0];
    return { ...next, history: [...state.history, snapshot(state)], future: state.future.slice(1), selectedIds: [], announce: 'Change redone' };
  }),
}));

export function buildCostReport(state) {
  const events = scopedEvents(state).map((event) => ({
    timestamp: event.timestamp,
    model: event.model,
    feature: event.feature,
    team: event.team,
    promptTokens: event.promptTokens,
    completionTokens: event.completionTokens,
    cost: pricedCost(event, state),
    tag: event.tag,
  }));
  const totals = totalsFor(events, { ...state, rateOverrides: {} });
  totals.cost = events.reduce((sum, e) => sum + e.cost, 0);
  const aggregate = (key, members) => members.map((name) => {
    const cost = events.filter((e) => e[key] === name).reduce((sum, e) => sum + e.cost, 0);
    return { name, cost: Number(cost.toFixed(6)), share: totals.cost ? Number((cost / totals.cost).toFixed(6)) : 0 };
  });
  const kpi = kpiData(state);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    filters: {
      from: state.range.from,
      to: state.range.to,
      dimension: state.dimension,
      team: state.filter.dimension === 'team' ? state.filter.member : null,
      feature: state.filter.dimension === 'feature' ? state.filter.member : null,
      compare: state.compare,
    },
    totals: { ...totals, cost: Number(totals.cost.toFixed(6)) },
    byModel: aggregate('model', MODELS),
    byTeam: aggregate('team', TEAMS),
    byFeature: aggregate('feature', FEATURES),
    anomalies: anomalyData(state).map(({ date, spend, percentAboveTrend }) => ({ date, spend: Number(spend.toFixed(6)), percentAboveTrend })),
    events,
    budget: { capUsd: state.budgetCap, projectedMonthEnd: Number(kpi.projected.toFixed(6)), remainingUsd: Number(kpi.remaining.toFixed(6)) },
    teamCeilings: teamAnalytics(state).map((row) => ({ ...row, spendToDate: Number(row.spendToDate.toFixed(6)), projectedMonthEnd: Number(row.projectedMonthEnd.toFixed(6)) })),
  };
}
