import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  InlineNotification,
  Modal,
  NumberInput,
  Select,
  SelectItem,
  Slider,
  Tag,
  TextArea,
  TextInput,
  ToastNotification,
} from '@carbon/react';
import {
  Add,
  ArrowDown,
  ArrowUp,
  Calculator,
  ChevronDown,
  Copy,
  Download,
  Play,
  Redo,
  Restart,
  Save,
  TrashCan,
  Undo,
  WarningAlt,
} from '@carbon/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { DEFAULT_RANGE, FEATURES, MODELS, ORIGINAL_RATES, TEAMS } from './data';
import {
  budgetCapSchema,
  dateRangeSchema,
  formulaValues,
  recategorizeSchema,
  savedViewSchema,
  scheduleSchema,
  teamCeilingSchema,
} from './contracts';
import {
  anomalyData,
  buildCostReport,
  currentRate,
  dailySeries,
  dimensionSeries,
  evaluateFormula,
  kpiData,
  pricedCost,
  scopedEvents,
  teamAnalytics,
  useCostStore,
} from './store';
import { registerWebMCP } from './webmcp';

const PALETTE = ['#007d79', '#8a3ffc', '#1192e8', '#b28600', '#eb6200'];
const TEAM_COLORS = { Research: '#007d79', Product: '#8a3ffc', Support: '#1192e8', Platform: '#b28600' };
const currency = (value, decimals = 2) => `${value < 0 ? '−' : ''}$${Math.abs(value || 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
const compactCurrency = (value) => `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

function useAnimatedNumber(value, duration = 600) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      previous.current = value;
      return undefined;
    }
    const from = previous.current;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - ((1 - progress) ** 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else previous.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return display;
}

function useDialogKeyboard(open, onClose, focusId, restoreId) {
  const opener = useRef(null);
  const wasOpen = useRef(false);
  const onCloseRef = useRef(onClose);
  if (open && !wasOpen.current) opener.current = document.activeElement;
  wasOpen.current = open;
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return undefined;
    const focusTimer = window.setTimeout(() => document.getElementById(focusId)?.focus(), 30);
    const escape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', escape, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', escape, true);
      window.setTimeout(() => {
        const restoreTarget = opener.current?.isConnected ? opener.current : document.getElementById(restoreId);
        restoreTarget?.focus();
      }, 0);
    };
  }, [open, focusId, restoreId]);
}

function BudgetCapForm() {
  const cap = useCostStore((s) => s.budgetCap);
  const setBudgetCap = useCostStore((s) => s.setBudgetCap);
  const { register, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(budgetCapSchema),
    mode: 'onChange',
    defaultValues: { capUsd: cap, note: '' },
  });
  return (
    <form className="budget-cap" onSubmit={handleSubmit(setBudgetCap)} aria-label="Monthly budget cap form">
      <label className="header-label" htmlFor="budget-cap">Monthly cap</label>
      <div className="budget-inline">
        <TextInput id="budget-cap" labelText="" hideLabel type="number" min="0" step="0.01" invalid={Boolean(errors.capUsd)} {...register('capUsd', { valueAsNumber: true })} />
        <Button size="sm" type="submit" disabled={!isValid}>Save</Button>
      </div>
      {errors.capUsd && <span className="header-error" role="alert">capUsd: {errors.capUsd.message}</span>}
    </form>
  );
}

function Header({ onSaveView, onSchedule }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef(null);
  const mobileButtonRef = useRef(null);
  const eventCount = useCostStore((s) => s.events.length);
  const savedCount = useCostStore((s) => s.savedViews.length);
  const reportCount = useCostStore((s) => s.snapshots.length);
  const historyCount = useCostStore((s) => s.history.length);
  const futureCount = useCostStore((s) => s.future.length);
  const undo = useCostStore((s) => s.undo);
  const redo = useCostStore((s) => s.redo);
  const count = eventCount + savedCount + reportCount;
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const mobileViewport = window.matchMedia('(max-width: 768px)');
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileOpen(false);
        mobileButtonRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...headerRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!headerRef.current.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const handleViewportChange = (event) => { if (!event.matches) setMobileOpen(false); };
    document.addEventListener('keydown', handleKeyDown, true);
    mobileViewport.addEventListener('change', handleViewportChange);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      mobileViewport.removeEventListener('change', handleViewportChange);
    };
  }, [mobileOpen]);
  return (
    <header className="topbar">
      <div ref={headerRef} className={`topbar-inner ${mobileOpen ? 'mobile-expanded' : ''}`}>
        <div>
          <div className="brand-eyebrow">Inference operations</div>
          <h1 className="brand-title">Cost Command</h1>
          <div className="brand-subtitle">Live AI spend intelligence · July 2026</div>
        </div>
        <button ref={mobileButtonRef} className="mobile-menu" type="button" aria-expanded={mobileOpen} aria-controls="header-workspace-controls" onClick={() => setMobileOpen((open) => !open)}>
          <span>{mobileOpen ? 'Close controls' : 'Workspace controls'}</span><ChevronDown className={mobileOpen ? 'open' : ''} size={18} aria-hidden="true" />
        </button>
        <BudgetCapForm />
        <div className="capacity" aria-label={`${count} of 2000 records stored`}>
          <span className="header-label">Records capacity</span>
          <div className="capacity-copy"><span>{count.toLocaleString()} stored</span><span>2,000 max</span></div>
          <div className="capacity-track"><div className="capacity-fill" style={{ width: `${Math.min(100, count / 20)}%` }} /></div>
        </div>
        <div className="toolbar" id="header-workspace-controls" aria-label="History and workspace actions">
          <Button kind="ghost" size="sm" hasIconOnly renderIcon={Undo} iconDescription="Undo" disabled={!historyCount} onClick={undo} />
          <Button kind="ghost" size="sm" hasIconOnly renderIcon={Redo} iconDescription="Redo" disabled={!futureCount} onClick={redo} />
          <Button kind="ghost" size="sm" renderIcon={Save} onClick={onSaveView}><span className="label">Save view</span></Button>
          <Button kind="ghost" size="sm" renderIcon={Calculator} onClick={onSchedule}><span className="label">Reports</span></Button>
        </div>
      </div>
    </header>
  );
}

function KpiCard({ label, value, delta, compare, error, accent, caption }) {
  const animated = useAnimatedNumber(value);
  const positive = delta >= 0;
  return (
    <article className={`kpi ${error ? 'error' : ''}`} style={{ '--accent': error ? '#da1e28' : accent }} aria-label={`${label}: ${currency(value)}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{currency(animated)}</div>
      {error && <div className="over-label"><WarningAlt size={14} aria-hidden="true" /> Over budget</div>}
      {!error && <div className="trend" aria-label={`${positive ? 'Up' : 'Down'} trend, ${caption}`}>{positive ? <ArrowUp size={16} aria-hidden="true" /> : <ArrowDown size={16} aria-hidden="true" />} {caption}</div>}
      {compare && <div style={{ position: 'absolute', right: 14, top: 14 }} className={`delta-chip ${positive ? '' : 'negative'}`}>{positive ? '+' : ''}{delta.toFixed(1)}%</div>}
    </article>
  );
}

function KpiStrip() {
  const state = useCostStore();
  const kpis = useMemo(() => kpiData(state), [state.events, state.rateOverrides, state.range, state.filter, state.budgetCap]);
  const over = kpis.remaining < 0;
  const items = [
    ['Range spend', kpis.total, kpis.deltas.total, '#007d79', 'vs prior period'],
    ['Spend today', kpis.today, kpis.deltas.today, '#1192e8', 'latest selected day'],
    ['Projected month-end', kpis.projected, kpis.deltas.projected, '#8a3ffc', `${currency(state.budgetCap)} cap`],
    ['Remaining budget', kpis.remaining, kpis.deltas.remaining, '#b28600', over ? 'projection exceeds cap' : 'at projected pace'],
  ];
  return <section className="kpi-grid" aria-label="Spend overview">{items.map(([label, value, delta, accent, caption], i) => <KpiCard key={label} label={label} value={value} delta={delta} compare={state.compare} error={i === 3 && over} accent={accent} caption={caption} />)}</section>;
}

function RangeForm() {
  const range = useCostStore((s) => s.range);
  const applyRange = useCostStore((s) => s.applyRange);
  const compare = useCostStore((s) => s.compare);
  const setCompare = useCostStore((s) => s.setCompare);
  const { register, handleSubmit, reset, watch, formState: { errors, isValid } } = useForm({ resolver: zodResolver(dateRangeSchema), mode: 'onChange', defaultValues: range });
  const from = watch('from');
  const to = watch('to');
  const backwards = Boolean(from && to && to < from);
  useEffect(() => reset(range), [range, reset]);
  return (
    <div>
      <form className="range-form" onSubmit={handleSubmit(applyRange)} aria-label="Date range request body">
        <div className="compact-field"><label htmlFor="date-from">From</label><input id="date-from" type="date" {...register('from')} /></div>
        <div className="compact-field"><label htmlFor="date-to">To</label><input id="date-to" type="date" aria-invalid={Boolean(errors.to)} {...register('to')} /></div>
        <Button type="submit" size="sm" disabled={!isValid}>Apply</Button>
        <label className="compare-toggle"><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Compare prior period</label>
      </form>
      {(errors.to || backwards) && <div className="inline-error" role="alert">date range: to must be on or after from</div>}
    </div>
  );
}

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#071f2e', color: 'white', padding: '.6rem .75rem', boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}>
      <div style={{ color: '#b6e61d', fontSize: 11 }}>{payload[0]?.payload?.date || label}</div>
      {payload.map((entry) => <div key={entry.dataKey} style={{ fontSize: 12, marginTop: 3 }}>{entry.name}: {currency(entry.value, 6)}</div>)}
    </div>
  );
}

function SpendChart() {
  const state = useCostStore();
  const anomalies = useMemo(() => anomalyData(state), [state.events, state.rateOverrides, state.range, state.filter]);
  const anomalyDates = useMemo(() => new Set(anomalies.map((a) => a.date)), [anomalies]);
  const primary = useMemo(() => dailySeries(state), [state.events, state.rateOverrides, state.range, state.filter]);
  const previous = useMemo(() => dailySeries(state, true), [state.events, state.rateOverrides, state.range, state.filter]);
  const data = primary.map((row, index) => ({ ...row, previous: previous[index]?.cumulative || 0 }));
  const anomalyDot = (props) => {
    if (!anomalyDates.has(props.payload.date)) return <circle key={`dot-${props.payload.date}`} cx={props.cx} cy={props.cy} r={2} fill="#007d79" />;
    return <path key={`dot-${props.payload.date}`} role="img" aria-label={`Anomaly on ${props.payload.date}`} d={`M ${props.cx} ${props.cy - 7} L ${props.cx + 7} ${props.cy} L ${props.cx} ${props.cy + 7} L ${props.cx - 7} ${props.cy} Z`} fill="#da1e28" stroke="white" strokeWidth="2" />;
  };
  return (
    <section className="panel" id="spend-over-time">
      <div className="panel-head">
        <div><div className="section-kicker">Trend</div><h2 className="panel-title">Cumulative spend</h2><div className="panel-subtitle">Daily posted inference cost · anomaly days use diamond markers</div></div>
        <RangeForm />
      </div>
      <div className="panel-body chart-height" aria-label="Cumulative spend line chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 18, left: 4, bottom: 4 }}>
            <CartesianGrid stroke="#dfe8eb" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={35} />
            <YAxis tickFormatter={compactCurrency} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={55} />
            <Tooltip content={<MoneyTooltip />} />
            {state.compare && <Line type="monotone" dataKey="previous" name="Previous period" stroke="#8a3ffc" strokeWidth={2} strokeDasharray="6 5" dot={false} isAnimationActive animationDuration={500} />}
            <Line type="monotone" dataKey="cumulative" name="Current period" stroke="#007d79" strokeWidth={3} dot={anomalyDot} activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }} isAnimationActive animationDuration={500} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function BreakdownChart() {
  const state = useCostStore();
  const setDimension = useCostStore((s) => s.setDimension);
  const toggleSeries = useCostStore((s) => s.toggleSeries);
  const applyDrilldown = useCostStore((s) => s.applyDrilldown);
  const [stacked, setStacked] = useState(true);
  const data = useMemo(() => dimensionSeries(state), [state.events, state.rateOverrides, state.range, state.filter, state.dimension]);
  const visible = data.members.filter((member) => !state.hiddenSeries[member]);
  return (
    <section className="panel" id="dimension-breakdown">
      <div className="panel-head">
        <div><div className="section-kicker">Allocation</div><h2 className="panel-title">Dimension breakdown</h2><div className="panel-subtitle">Click any segment to filter the ledger</div></div>
        <div className="chart-controls">
          <div className="segmented" aria-label="Breakdown dimension">
            {['model', 'feature', 'team'].map((d) => <button key={d} className={state.dimension === d ? 'active' : ''} onClick={() => setDimension(d)} aria-pressed={state.dimension === d}>{d[0].toUpperCase() + d.slice(1)}</button>)}
          </div>
          <div className="segmented" aria-label="Bar layout">
            <button className={stacked ? 'active' : ''} onClick={() => setStacked(true)} aria-pressed={stacked}>Stacked</button>
            <button className={!stacked ? 'active' : ''} onClick={() => setStacked(false)} aria-pressed={!stacked}>Grouped</button>
          </div>
        </div>
      </div>
      <div className="legend" aria-label="Toggle chart series">
        {data.members.map((member, index) => <button key={member} className={`legend-button ${state.hiddenSeries[member] ? 'muted' : ''}`} onClick={() => toggleSeries(member)} aria-pressed={!state.hiddenSeries[member]}><span className="legend-swatch" style={{ background: PALETTE[index % PALETTE.length] }} />{member}</button>)}
      </div>
      {visible.length === 0 ? <div className="empty-chart"><div><strong>All series are hidden</strong><br />Turn on a legend item to restore the chart.</div></div> : (
        <div className="panel-body chart-height" aria-label={`${state.dimension} spend bar chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.rows} margin={{ top: 10, right: 12, left: 4, bottom: 4 }} barGap={2}>
              <CartesianGrid stroke="#dfe8eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis tickFormatter={compactCurrency} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
              <Tooltip content={<MoneyTooltip />} />
              {visible.map((member) => {
                const index = data.members.indexOf(member);
                return <Bar key={member} dataKey={member} name={member} stackId={stacked ? 'spend' : undefined} fill={PALETTE[index % PALETTE.length]} radius={stacked ? 0 : [2, 2, 0, 0]} isAnimationActive animationDuration={500} onClick={(item) => { const row = item?.payload || item; if (row?.date) applyDrilldown(row.date, state.dimension, member); }} style={{ cursor: 'pointer' }} />;
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function TeamRow({ row, allRows }) {
  const cap = useCostStore((s) => s.budgetCap);
  const setTeamCeiling = useCostStore((s) => s.setTeamCeiling);
  const { register, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(teamCeilingSchema), mode: 'onChange', defaultValues: { team: row.team, ceilingUsd: row.ceilingUsd },
  });
  useEffect(() => reset({ team: row.team, ceilingUsd: row.ceilingUsd }), [row.team, row.ceilingUsd, reset]);
  const nextValue = watch('ceilingUsd');
  const sum = allRows.reduce((acc, item) => acc + (item.team === row.team ? (Number(nextValue) || 0) : item.ceilingUsd), 0);
  const excess = Math.max(0, sum - cap);
  const over = row.projectedMonthEnd > row.ceilingUsd;
  return (
    <div className={`team-row ${over ? 'over' : ''}`}>
      <div className="team-top"><span className="team-name">{row.team}</span><span className="team-numbers">{currency(row.spendToDate)} spent / {currency(row.ceilingUsd)}</span></div>
      <div className="burn-track" aria-label={`${row.team} projected ${currency(row.projectedMonthEnd)} against ${currency(row.ceilingUsd)}`}><div className="burn-fill" style={{ width: `${Math.min(100, (row.projectedMonthEnd / row.ceilingUsd) * 100)}%` }} /></div>
      {over ? <div className="overage-text"><WarningAlt size={12} /> Projected overage {currency(row.projectedMonthEnd - row.ceilingUsd)}</div> : <div className="panel-subtitle">Projected {currency(row.projectedMonthEnd)} month-end</div>}
      <form className="ceiling-edit" onSubmit={handleSubmit(setTeamCeiling)}>
        <input type="hidden" {...register('team')} />
        <div><label className="header-label" style={{ color: '#526b78' }} htmlFor={`ceiling-${row.team}`}>Ceiling</label><input id={`ceiling-${row.team}`} type="number" step="0.01" min="0" aria-invalid={Boolean(errors.ceilingUsd || excess)} {...register('ceilingUsd', { valueAsNumber: true })} /></div>
        <button type="submit" disabled={!isValid || excess > 0}>Save</button>
      </form>
      {errors.ceilingUsd && <div className="inline-error" role="alert">ceilingUsd: {errors.ceilingUsd.message}</div>}
      {excess > 0 && <div className="inline-error" role="alert">team ceilings exceed capUsd by {currency(excess)}</div>}
    </div>
  );
}

function TeamBudgetPanel() {
  const state = useCostStore();
  const rows = useMemo(() => teamAnalytics(state), [state.events, state.rateOverrides, state.range, state.filter, state.teamCeilings]);
  const radial = rows.map((row) => ({ name: row.team, value: Math.min(100, (row.spendToDate / row.ceilingUsd) * 100), fill: TEAM_COLORS[row.team] }));
  return (
    <section className="panel" id="team-budgets">
      <div className="panel-head"><div><div className="section-kicker">Guardrails</div><h2 className="panel-title">Team budgets</h2><div className="panel-subtitle">Burn-rate projection against monthly ceilings</div></div></div>
      <div className="panel-body">
        {rows.map((row) => <TeamRow key={row.team} row={row} allRows={rows} />)}
        <div className="wheel-wrap">
          <div style={{ height: 170 }} aria-label="Team budget attainment wheel">
            <ResponsiveContainer width="100%" height="100%"><RadialBarChart innerRadius="20%" outerRadius="96%" data={radial} startAngle={90} endAngle={-270} barSize={10}><PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} /><RadialBar dataKey="value" background={{ fill: '#e5ecef' }} cornerRadius={4} isAnimationActive animationDuration={600} /></RadialBarChart></ResponsiveContainer>
          </div>
          <div className="wheel-legend">{radial.map((item) => <div className="wheel-key" key={item.name}><span className="legend-swatch" style={{ background: item.fill }} /><span>{item.name}</span><strong>{item.value.toFixed(0)}%</strong></div>)}</div>
        </div>
      </div>
    </section>
  );
}

function AnomalyPanel() {
  const state = useCostStore();
  const anomalies = useMemo(() => anomalyData(state), [state.events, state.rateOverrides, state.range, state.filter]);
  const applyAnomalyDay = useCostStore((s) => s.applyAnomalyDay);
  const [open, setOpen] = useState({});
  const viewEvents = (date) => {
    applyAnomalyDay(date);
    requestAnimationFrame(() => document.getElementById('event-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  return (
    <section className="panel" id="anomaly-list">
      <div className="panel-head"><div><div className="section-kicker">Signals</div><h2 className="panel-title">Anomaly flags</h2><div className="panel-subtitle">More than 2× trailing seven-day average</div></div><Tag type="red">{anomalies.length} flagged</Tag></div>
      <div className="panel-body">
        {!anomalies.length && <div className="panel-subtitle">No anomalies in this range.</div>}
        {anomalies.map((item) => (
          <div className="anomaly-item" key={item.date}>
            <button className="anomaly-trigger" onClick={() => setOpen((value) => ({ ...value, [item.date]: !value[item.date] }))} aria-expanded={Boolean(open[item.date])}>
              <span className="anomaly-dot" /><span><span className="anomaly-date">{format(parseISO(item.date), 'MMM d, yyyy')}</span><br /><span className="anomaly-meta">{currency(item.spend)} · {item.percentAboveTrend}% above trend</span></span><span className={`chevron ${open[item.date] ? 'open' : ''}`}><ChevronDown size={16} /></span>
            </button>
            <div className={`disclosure ${open[item.date] ? 'open' : ''}`}><div>
              {item.events.map((event) => <div className="contribution" key={event.id}><span>{event.model}</span><span>{event.team}</span><strong>{currency(pricedCost(event, state), 4)}</strong></div>)}
              <Button kind="ghost" size="sm" onClick={() => viewEvents(item.date)}>View events</Button>
            </div></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UnitCostExplorer() {
  const state = useCostStore();
  const setRate = useCostStore((s) => s.setRate);
  const revertRates = useCostStore((s) => s.revertRates);
  const [text, setText] = useState('');
  const tokens = text.trim() ? Math.max(1, Math.ceil(text.trim().length / 4)) : 0;
  const active = Object.keys(state.rateOverrides).length > 0;
  return (
    <section className="explorer-grid" id="unit-cost-explorer">
      <div className="panel">
        <div className="panel-head"><div><div className="section-kicker">Scenario lab</div><h2 className="panel-title">Unit-cost explorer</h2><div className="panel-subtitle">Rate per 1,000 tokens · drag to reprice all history</div></div><div>{active && <span className="active-indicator"><span className="anomaly-dot" style={{ background: '#007d79', width: 7, height: 7 }} />What-if active</span>} <Button kind="ghost" size="sm" renderIcon={Restart} disabled={!active} onClick={revertRates}>Revert</Button></div></div>
        <div className="panel-body">{MODELS.map((model) => {
          const rate = currentRate(state, model);
          return <div className="rate-row" key={model}><span className="rate-model">{model}</span><Slider id={`rate-${model}`} hideLabel hideTextInput labelText={`${model} what-if rate`} ariaLabelInput={`${model} what-if rate`} min={Math.max(.001, ORIGINAL_RATES[model] * .25)} max={ORIGINAL_RATES[model] * 2.5} step={0.0005} value={rate} onChange={({ value }) => setRate(model, Number(value))} /><span className="rate-value">{currency(rate, 4)}</span></div>;
        })}</div>
      </div>
      <div className="panel">
        <div className="panel-head"><div><div className="section-kicker">Quick quote</div><h2 className="panel-title">Text cost estimator</h2><div className="panel-subtitle">Uses ~4 characters per token</div></div></div>
        <div className="panel-body">
          <TextArea id="sample-text" labelText="Sample text" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a prompt to estimate…" />
          <div className="panel-subtitle">Estimated tokens: <strong>{tokens.toLocaleString()}</strong></div>
          <div className="estimate-grid">{MODELS.map((model) => <React.Fragment key={model}><span>{model}</span><strong>{currency((tokens / 1000) * currentRate(state, model), 6)}</strong></React.Fragment>)}</div>
        </div>
      </div>
    </section>
  );
}

function FormulaBox({ events }) {
  const expression = useCostStore((s) => s.formula);
  const setFormula = useCostStore((s) => s.setFormula);
  const state = useCostStore();
  const result = useMemo(() => evaluateFormula(expression, events, state), [expression, events, state.rateOverrides]);
  return (
    <div className="formula-wrap">
      <div className="formula-row">
        <TextInput id="formula" labelText="Formula over filtered events" value={expression} invalid={Boolean(result.error)} invalidText={result.error || ''} onChange={(e) => setFormula(e.target.value)} list="formula-options" />
        {!result.error && <div className="formula-result" aria-live="polite"><span>{result.label} · {events.length} events</span><strong>{result.currency ? currency(result.value, 2) : Number(result.value).toLocaleString()}</strong></div>}
      </div>
      <datalist id="formula-options">{formulaValues.map((formula) => <option key={formula} value={formula} />)}</datalist>
    </div>
  );
}

function BulkBar() {
  const selected = useCostStore((s) => s.selectedIds);
  const recategorize = useCostStore((s) => s.recategorize);
  const setSelected = useCostStore((s) => s.setSelected);
  const setToast = useCostStore((s) => s.setToast);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ resolver: zodResolver(recategorizeSchema), mode: 'onChange', defaultValues: { team: '', feature: '' } });
  const team = watch('team');
  const feature = watch('feature');
  if (!selected.length) return null;
  const submit = ({ team: nextTeam, feature: nextFeature }) => {
    recategorize({ team: nextTeam || undefined, feature: nextFeature || undefined });
    setToast({ kind: 'success', title: 'Events recategorized', subtitle: `${selected.length} records were updated across all analytics.` });
    reset({ team: '', feature: '' });
  };
  return (
    <form className="bulk-bar" onSubmit={handleSubmit(submit)}>
      <div className="bulk-count">{selected.length} selected</div>
      <div><label htmlFor="bulk-team">Move to team</label><select id="bulk-team" {...register('team')}><option value="">No change</option>{TEAMS.map((value) => <option key={value}>{value}</option>)}</select></div>
      <div><label htmlFor="bulk-feature">Set feature</label><select id="bulk-feature" {...register('feature')}><option value="">No change</option>{FEATURES.map((value) => <option key={value}>{value}</option>)}</select></div>
      <Button size="sm" type="submit" disabled={!team && !feature}>Apply</Button>
      <Button size="sm" kind="ghost" type="button" onClick={() => setSelected([])}>Clear</Button>
      {!team && !feature && <div className="bulk-error">team or feature is required</div>}
      {errors.team && <div className="bulk-error">{errors.team.message}</div>}
    </form>
  );
}

const columns = [
  ['timestamp', 'Timestamp'], ['model', 'Model'], ['feature', 'Feature'], ['team', 'Team'], ['promptTokens', 'Prompt tokens'], ['completionTokens', 'Completion tokens'], ['cost', 'Cost'], ['tag', 'Tag'],
];

function EventLedger({ onSaveView }) {
  const state = useCostStore();
  const toggleSelected = useCostStore((s) => s.toggleSelected);
  const setSelected = useCostStore((s) => s.setSelected);
  const setSort = useCostStore((s) => s.setSort);
  const clearFilter = useCostStore((s) => s.clearFilter);
  const clearAllFilters = useCostStore((s) => s.clearAllFilters);
  const events = useMemo(() => {
    const rows = scopedEvents(state);
    const key = state.sort.key;
    const direction = state.sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = key === 'cost' ? pricedCost(a, state) : a[key];
      const bv = key === 'cost' ? pricedCost(b, state) : b[key];
      const comparison = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return (comparison || a.id.localeCompare(b.id)) * direction;
    });
  }, [state.events, state.rateOverrides, state.range, state.filter, state.sort]);
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({ count: events.length, getScrollElement: () => parentRef.current, estimateSize: () => 44, overscan: 10 });
  const allSelected = events.length > 0 && events.every((event) => state.selectedIds.includes(event.id));
  const selectAll = () => setSelected(allSelected ? [] : events.map((event) => event.id));
  const chipLabel = state.filter.day ? `${state.filter.day}${state.filter.dimension ? ` · ${state.filter.dimension}: ${state.filter.member}` : ' · anomaly day'}` : null;
  return (
    <section className="panel table-panel" id="event-table">
      <div className="panel-head table-tools">
        <div><div className="section-kicker">Usage ledger</div><h2 className="panel-title">Event table</h2><div className="panel-subtitle">{events.length.toLocaleString()} matching records · only visible rows are rendered</div></div>
        <FormulaBox events={events} />
        <div className="table-actions"><Button kind="secondary" size="sm" renderIcon={Save} onClick={onSaveView}>Save view</Button><ExportButtons /></div>
      </div>
      <div className="chips" aria-label="Applied filters">
        <span className="panel-subtitle">Applied filters</span>
        <Tag type="teal">Range {state.range.from} → {state.range.to}</Tag>
        {chipLabel && <Tag className="chip" type="red" filter onClose={clearFilter}>{chipLabel}</Tag>}
        {state.activeViewId && <Tag type="purple">Saved view active</Tag>}
      </div>
      <BulkBar />
      <div className="table-header virtual-table" role="row">
        <div className="event-check"><input type="checkbox" aria-label="Select all filtered events" checked={allSelected} onChange={selectAll} /></div>
        {columns.map(([key, label]) => <button key={key} className="header-cell" onClick={() => setSort(key)}>{label}{state.sort.key === key && (state.sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</button>)}
      </div>
      {events.length === 0 ? <div className="zero-state"><div><h3>No events match these filters</h3><p>The formula result remains valid at zero.</p><Button size="sm" onClick={clearAllFilters}>Clear filters</Button></div></div> : (
        <div className="table-scroll" ref={parentRef} role="table" aria-rowcount={events.length}>
          <div className="virtual-spacer" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const event = events[virtualRow.index];
              const selected = state.selectedIds.includes(event.id);
              return <div key={event.id} className={`event-row ${selected ? 'selected' : ''}`} style={{ height: virtualRow.size, transform: `translateY(${virtualRow.start}px)` }} role="row">
                <div className="event-check"><input type="checkbox" aria-label={`Select ${event.id}`} checked={selected} onChange={() => toggleSelected(event.id)} /></div>
                <div className="event-cell">{format(parseISO(event.timestamp), 'MMM d, yyyy HH:mm')} UTC</div>
                <div className="event-cell">{event.model}</div><div className="event-cell">{event.feature}</div><div className="event-cell">{event.team}</div>
                <div className="event-cell">{event.promptTokens.toLocaleString()}</div><div className="event-cell">{event.completionTokens.toLocaleString()}</div>
                <div className="event-cell"><strong>{currency(pricedCost(event, state), 4)}</strong></div><div className="event-cell"><span className="tag-pill">{event.tag}</span></div>
              </div>;
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function downloadFile(name, type, body) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function csvCell(value) {
  const string = String(value ?? '');
  return /[",\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
}

function reportCsv(report) {
  const keys = ['timestamp', 'model', 'feature', 'team', 'promptTokens', 'completionTokens', 'cost', 'tag'];
  return [keys.join(','), ...report.events.map((event) => keys.map((key) => csvCell(event[key])).join(','))].join('\n');
}

function ExportButtons() {
  const setToast = useCostStore((s) => s.setToast);
  const exportReport = (format) => {
    const report = buildCostReport(useCostStore.getState());
    if (format === 'json') downloadFile('cost-analytics-report.json', 'application/json', JSON.stringify(report, null, 2));
    else downloadFile('cost-analytics-report.csv', 'text/csv;charset=utf-8', reportCsv(report));
    setToast({ kind: 'success', title: `${format.toUpperCase()} downloaded`, subtitle: `${report.totals.eventCount.toLocaleString()} live events exported.` });
  };
  const copy = async () => {
    const body = JSON.stringify(buildCostReport(useCostStore.getState()), null, 2);
    await navigator.clipboard.writeText(body);
    setToast({ kind: 'success', title: 'Copied', subtitle: 'Live cost-report JSON is on the clipboard.' });
  };
  return <><Button kind="ghost" size="sm" hasIconOnly renderIcon={Download} iconDescription="Download JSON" onClick={() => exportReport('json')} /><Button kind="ghost" size="sm" hasIconOnly renderIcon={Download} iconDescription="Download CSV" onClick={() => exportReport('csv')} /><Button kind="ghost" size="sm" hasIconOnly renderIcon={Copy} iconDescription="Copy JSON" onClick={copy} /></>;
}

function SaveViewModal({ open, onClose }) {
  const state = useCostStore();
  const saveView = useCostStore((s) => s.saveView);
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm({ resolver: zodResolver(savedViewSchema), mode: 'onChange', defaultValues: { name: '', dimension: state.dimension, range: state.range } });
  useDialogKeyboard(open, onClose, 'view-name');
  useEffect(() => { if (open) reset({ name: '', dimension: state.dimension, range: state.range }); }, [open, state.dimension, state.range, reset]);
  const submit = (body) => { saveView(body); onClose(); };
  return (
    <Modal open={open} modalHeading="Save analytics view" primaryButtonText="Save view" secondaryButtonText="Cancel" primaryButtonDisabled={!isValid} onRequestSubmit={handleSubmit(submit)} onRequestClose={onClose} size="sm">
      <form className="modal-form" onSubmit={handleSubmit(submit)}>
        <TextInput id="view-name" labelText="View name" invalid={Boolean(errors.name)} invalidText={errors.name?.message} {...register('name')} />
        <Select id="view-dimension" labelText="Breakdown dimension" invalid={Boolean(errors.dimension)} invalidText={errors.dimension?.message} {...register('dimension')}><SelectItem value="model" text="Model" /><SelectItem value="feature" text="Feature" /><SelectItem value="team" text="Team" /></Select>
        <TextInput id="view-from" type="date" labelText="Range from" {...register('range.from')} />
        <TextInput id="view-to" type="date" labelText="Range to" invalid={Boolean(errors.range?.to)} invalidText={errors.range?.to?.message} {...register('range.to')} />
      </form>
    </Modal>
  );
}

function ScheduleModal({ open, onClose }) {
  const existing = useCostStore((s) => s.schedule);
  const saveSchedule = useCostStore((s) => s.saveSchedule);
  const { register, handleSubmit, reset, watch, formState: { errors, isValid } } = useForm({ resolver: zodResolver(scheduleSchema), mode: 'onChange', defaultValues: existing || { frequency: 'weekly', sections: [] } });
  useDialogKeyboard(open, onClose, 'report-frequency');
  useEffect(() => { if (open) reset(existing || { frequency: 'weekly', sections: [] }); }, [open, existing, reset]);
  const sections = watch('sections') || [];
  const submit = (body) => { saveSchedule(body); onClose(); };
  return (
    <Modal open={open} modalHeading="Schedule cost report" primaryButtonText="Save schedule" secondaryButtonText="Cancel" primaryButtonDisabled={!isValid || !sections.length} onRequestSubmit={handleSubmit(submit)} onRequestClose={onClose} size="sm">
      <form className="modal-form" onSubmit={handleSubmit(submit)}>
        <Select id="report-frequency" labelText="Frequency" invalid={Boolean(errors.frequency)} invalidText={errors.frequency?.message} {...register('frequency')}><SelectItem value="daily" text="Daily" /><SelectItem value="weekly" text="Weekly" /><SelectItem value="monthly" text="Monthly" /></Select>
        <fieldset><legend className="cds--label">Sections to include</legend><div className="checkbox-group">
          <Checkbox id="section-totals" labelText="Totals" value="totals" {...register('sections')} />
          <Checkbox id="section-dimensions" labelText="Per-dimension tables" value="per-dimension-tables" {...register('sections')} />
          <Checkbox id="section-anomalies" labelText="Anomalies" value="anomalies" {...register('sections')} />
        </div>{!sections.length && <div className="inline-error" role="alert">sections: select at least one</div>}{errors.sections && sections.length > 0 && <div className="inline-error" role="alert">{errors.sections.message}</div>}</fieldset>
      </form>
    </Modal>
  );
}

function SavedViewsPanel({ onCreate }) {
  const views = useCostStore((s) => s.savedViews);
  const active = useCostStore((s) => s.activeViewId);
  const applyView = useCostStore((s) => s.applyView);
  const deleteView = useCostStore((s) => s.deleteView);
  const [pendingDelete, setPendingDelete] = useState(null);
  useDialogKeyboard(Boolean(pendingDelete), () => setPendingDelete(null), 'confirm-delete-view', 'saved-view-new');
  return (
    <section className="panel">
      <div className="panel-head"><div><div className="section-kicker">Workspace</div><h2 className="panel-title">Saved views</h2><div className="panel-subtitle">Restore range, dimension, and drill-down</div></div><Button id="saved-view-new" size="sm" renderIcon={Add} onClick={onCreate}>New</Button></div>
      <div className="panel-body">
        {!views.length && <div className="panel-subtitle">No saved views yet. Capture the current analytics scope.</div>}
        <div className="saved-list">{views.map((view) => <div key={view.id} className={`saved-item ${active === view.id ? 'active' : ''}`}><button onClick={() => applyView(view.id)}><strong>{view.name}</strong><div className="panel-subtitle">{view.dimension} · {view.range.from} → {view.range.to}</div></button><button className="saved-delete" aria-label={`Delete ${view.name}`} onClick={() => setPendingDelete(view)}><TrashCan size={16} aria-hidden="true" /></button></div>)}</div>
      </div>
      <Modal open={Boolean(pendingDelete)} danger modalHeading="Delete saved view?" primaryButtonText="Delete view" primaryButtonProps={{ id: 'confirm-delete-view' }} secondaryButtonText="Cancel" onRequestSubmit={() => { if (pendingDelete) deleteView(pendingDelete.id); setPendingDelete(null); }} onRequestClose={() => setPendingDelete(null)} size="xs">
        <p>Delete <strong>{pendingDelete?.name}</strong>? Its currently applied filters will remain active.</p>
      </Modal>
    </section>
  );
}

function ReportPanel({ onSchedule }) {
  const schedule = useCostStore((s) => s.schedule);
  const snapshots = useCostStore((s) => s.snapshots);
  const run = useCostStore((s) => s.runScheduleNow);
  const [opened, setOpened] = useState(null);
  return (
    <section className="panel" id="report-history">
      <div className="panel-head"><div><div className="section-kicker">Delivery</div><h2 className="panel-title">Scheduled reports</h2><div className="panel-subtitle">Snapshots preserve live totals at generation</div></div><Button size="sm" kind="secondary" onClick={onSchedule}>{schedule ? 'Edit' : 'Set schedule'}</Button></div>
      <div className="panel-body">
        {schedule ? <div className="schedule-summary"><strong>{schedule.frequency[0].toUpperCase() + schedule.frequency.slice(1)}</strong> · {schedule.sections.join(', ')}</div> : snapshots.length ? <div className="schedule-summary"><strong>No active schedule</strong> · showing saved snapshots</div> : <div className="empty-report"><strong>No report snapshots yet</strong><span>Set a schedule, then run it to preserve live totals.</span></div>}
        <Button renderIcon={Play} size="sm" disabled={!schedule} onClick={run}>Run schedule now</Button>
        <div className="history-list" style={{ marginTop: 12 }}>{snapshots.slice().reverse().map((snapshot) => <button className="history-item" key={snapshot.id} onClick={() => setOpened(snapshot)}><span><strong>{format(parseISO(snapshot.generatedAt), 'MMM d, HH:mm:ss')} UTC</strong><br /><span className="panel-subtitle">{snapshot.totals.eventCount.toLocaleString()} events</span></span><strong>{currency(snapshot.totals.cost)}</strong></button>)}</div>
      </div>
      <Modal open={Boolean(opened)} modalHeading="Report snapshot" primaryButtonText="Close" onRequestSubmit={() => setOpened(null)} onRequestClose={() => setOpened(null)} size="sm">
        {opened && <div><p>Generated {opened.generatedAt}</p><div className="schedule-summary"><strong>{currency(opened.totals.cost)}</strong> total cost<br />{opened.totals.eventCount.toLocaleString()} events · {opened.totals.promptTokens.toLocaleString()} prompt tokens · {opened.totals.completionTokens.toLocaleString()} completion tokens</div></div>}
      </Modal>
    </section>
  );
}

function ToastHost() {
  const toast = useCostStore((s) => s.toast);
  const setToast = useCostStore((s) => s.setToast);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(timer);
  }, [toast, setToast]);
  return <AnimatePresence>{toast && <motion.div className="toast-wrap" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}><ToastNotification kind={toast.kind} title={toast.title} subtitle={toast.subtitle} timeout={0} onClose={() => setToast(null)} /></motion.div>}</AnimatePresence>;
}

export default function App() {
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const announce = useCostStore((s) => s.announce);
  useEffect(() => registerWebMCP(), []);
  return (
    <div className="app-shell">
      <Header onSaveView={() => setSaveViewOpen(true)} onSchedule={() => setScheduleOpen(true)} />
      <main className="main">
        <KpiStrip />
        <div className="charts-layout">
          <div className="chart-stack"><SpendChart /><BreakdownChart /></div>
          <aside className="side-stack"><TeamBudgetPanel /><AnomalyPanel /></aside>
        </div>
        <div className="explorer"><UnitCostExplorer /></div>
        <EventLedger onSaveView={() => setSaveViewOpen(true)} />
        <div className="reports-layout"><SavedViewsPanel onCreate={() => setSaveViewOpen(true)} /><ReportPanel onSchedule={() => setScheduleOpen(true)} /></div>
      </main>
      <SaveViewModal open={saveViewOpen} onClose={() => setSaveViewOpen(false)} />
      <ScheduleModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
      <ToastHost />
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announce}</div>
    </div>
  );
}
