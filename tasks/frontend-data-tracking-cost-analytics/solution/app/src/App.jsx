import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  Modal,
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
  Catalog,
  CheckmarkFilled,
  ChevronDown,
  Copy,
  Download,
  Moon,
  Play,
  Printer,
  Redo,
  Restart,
  Save,
  SettingsAdjust,
  Star,
  StarFilled,
  Sun,
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
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { FEATURES, MODELS, ORIGINAL_RATES, TEAMS, quickRange } from './data';
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
  teamSparkline,
  useCostStore,
} from './store';
import { registerWebMCP } from './webmcp';

const LIGHT = {
  palette: ['#007d79', '#8a3ffc', '#1192e8', '#b28600', '#198038'],
  error: '#da1e28',
  grid: '#dfe8eb',
  axis: '#526b78',
  success: '#198038',
};
const DARK = {
  palette: ['#08bdba', '#be95ff', '#78a9ff', '#f1c21b', '#42be65'],
  error: '#ff8389',
  grid: '#393939',
  axis: '#c6c6c6',
  success: '#42be65',
};

const currency = (value, decimals = 2) => `${value < 0 ? '−' : ''}$${Math.abs(value || 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
const compactCurrency = (value) => `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

// JS media queries for prefers-reduced-motion are removed. We will rely purely on CSS for this.
// `isAnimationActive` in Recharts will default to true, but the CSS rule will freeze it if
// prefer-reduced-motion matches. Wait, Recharts SVG animations might not be frozen easily.
// Let's use a simpler approach: Recharts uses react-smooth which respects CSS animations where possible.
// Or we can just use `window.matchMedia` for Recharts only, but the user explicitly requested CSS ONLY.
function usePrefersReducedMotion() {
  return false;
}

function useChartTheme() {
  const theme = useCostStore((state) => state.theme);
  const base = theme === 'dark' ? DARK : LIGHT;
  return {
    ...base,
    teamColors: { Research: base.palette[0], Product: base.palette[1], Support: base.palette[2], Platform: base.palette[3] },
  };
}

function useAnimatedNumber(value, duration = 600, delay = 0) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);
  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      previous.current = value;
      return undefined;
    }
    const from = previous.current;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const elapsed = now - start - delay;
      if (elapsed < 0) { frame = requestAnimationFrame(tick); return; }
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - ((1 - progress) ** 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else previous.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, delay, reduced]);
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
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      // Keep focus cycling inside the open modal (Carbon's own sentinel wrap
      // is not reliable across browsers, so trap explicitly).
      const container = document.querySelector('.cds--modal.is-visible');
      if (!container) return;
      const focusables = [...container.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      )].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKey, true);
      window.setTimeout(() => {
        const restoreTarget = opener.current?.isConnected ? opener.current : document.getElementById(restoreId);
        restoreTarget?.focus();
      }, 0);
    };
  }, [open, focusId, restoreId]);
}

// Animate Carbon modal exits: keep the portal mounted for one fade-out frame
// before honoring the close request.
function useModalExit(onClose) {
  const reduced = usePrefersReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!leaving) return undefined;
    document.body.classList.add('modal-leave');
    const timer = window.setTimeout(() => {
      document.body.classList.remove('modal-leave');
      setLeaving(false);
      onCloseRef.current();
    }, reduced ? 0 : 230);
    return () => { window.clearTimeout(timer); document.body.classList.remove('modal-leave'); };
  }, [leaving, reduced]);
  return () => setLeaving(true);
}

function BudgetCapForm() {
  const cap = useCostStore((s) => s.budgetCap);
  const setBudgetCap = useCostStore((s) => s.setBudgetCap);
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(budgetCapSchema),
    mode: 'onChange',
    defaultValues: { capUsd: cap, note: '' },
  });
  useEffect(() => reset({ capUsd: cap, note: '' }), [cap, reset]);
  return (
    <form className="budget-cap" onSubmit={handleSubmit(setBudgetCap)} aria-label="Monthly budget cap form">
      <label className="header-label" htmlFor="budget-cap">Monthly cap (capUsd)</label>
      <div className="budget-inline">
        <TextInput id="budget-cap" labelText="capUsd" hideLabel type="number" min="0" step="0.01" invalid={Boolean(errors.capUsd)} {...register('capUsd', { valueAsNumber: true })} />
        <Button size="sm" type="submit" disabled={!isValid}>Save</Button>
      </div>
      {errors.capUsd && <span className="header-error" role="alert">capUsd: must be greater than 0 with at most 2 decimals</span>}
    </form>
  );
}

function PreferencesPopover() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const theme = useCostStore((s) => s.theme);
  const toggleTheme = useCostStore((s) => s.toggleTheme);
  const density = useCostStore((s) => s.density);
  const setDensity = useCostStore((s) => s.setDensity);
  const pinnedTeams = useCostStore((s) => s.pinnedTeams);
  const togglePin = useCostStore((s) => s.togglePin);
  const applyRange = useCostStore((s) => s.applyRange);
  const range = useCostStore((s) => s.range);
  useEffect(() => {
    if (!open) return undefined;
    const down = (event) => { if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false); };
    const key = (event) => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); buttonRef.current?.focus(); } };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key, true); };
  }, [open]);
  return (
    <div className="prefs-wrap" ref={wrapRef}>
      <button ref={buttonRef} type="button" className="chrome-chip" aria-expanded={open} aria-controls="preferences-popover" onClick={() => setOpen((v) => !v)}>
        <SettingsAdjust size={16} aria-hidden="true" /> Preferences
      </button>
      {open && (
        <div className="prefs-popover" id="preferences-popover" role="dialog" aria-label="Session preferences">
          <fieldset>
            <legend>Table density</legend>
            {['comfortable', 'compact'].map((value) => (
              <label key={value} className="prefs-option"><input type="radio" name="density" checked={density === value} onChange={() => setDensity(value)} /> {value[0].toUpperCase() + value.slice(1)} rows</label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Theme</legend>
            {['light', 'dark'].map((value) => (
              <label key={value} className="prefs-option"><input type="radio" name="theme" checked={theme === value} onChange={toggleTheme} /> {value[0].toUpperCase() + value.slice(1)}</label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Pinned teams</legend>
            {TEAMS.map((team) => (
              <label key={team} className="prefs-option"><input type="checkbox" checked={pinnedTeams.includes(team)} onChange={() => togglePin(team)} /> {team}</label>
            ))}
            <div className="prefs-hint">Pinned teams float to the top of the budget panel.</div>
          </fieldset>
          <fieldset>
            <legend>Quick ranges</legend>
            <div className="quick-ranges">
              {[7, 30, 60, 90].map((days) => (
                <button key={days} type="button" onClick={() => { applyRange(quickRange(days)); setOpen(false); }}>
                  {days}d{range.from === quickRange(days).from && range.to === quickRange(days).to ? ' (on)' : ''}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}

function Header({ onSaveView, onSchedule, onPalette }) {
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
  const theme = useCostStore((s) => s.theme);
  const toggleTheme = useCostStore((s) => s.toggleTheme);
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
          <Button kind="ghost" size="sm" hasIconOnly renderIcon={Undo} iconDescription="Undo" tooltipPosition="bottom" aria-label="Undo" disabled={!historyCount} onClick={undo} />
          <Button kind="ghost" size="sm" hasIconOnly renderIcon={Redo} iconDescription="Redo" tooltipPosition="bottom" aria-label="Redo" disabled={!futureCount} onClick={redo} />
          <button type="button" className="chrome-chip" onClick={onPalette} aria-label="Open command palette">
            <Catalog size={16} aria-hidden="true" /> <kbd>Ctrl K</kbd>
          </button>
          <button type="button" className="chrome-chip icon-only" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <PreferencesPopover />
          <Button id="save-view-trigger" kind="ghost" size="sm" renderIcon={Save} onClick={onSaveView}><span className="label">Save view</span></Button>
          <Button id="reports-schedule-trigger-header" kind="ghost" size="sm" renderIcon={Calculator} onClick={onSchedule}><span className="label">Reports</span></Button>
        </div>
      </div>
    </header>
  );
}

function KpiCard({ label, value, delta, compare, error, accent, caption, celebrate, delay }) {
  const animated = useAnimatedNumber(value, 600, delay);
  const positive = delta >= 0;
  return (
    <article className={`kpi ${error ? 'error' : ''} ${celebrate ? 'celebrate' : ''}`} style={{ '--accent': error ? 'var(--error)' : accent }} aria-label={`${label}: ${currency(value)}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{currency(animated)}</div>
      {error
        ? <div className="over-label"><WarningAlt size={14} aria-hidden="true" /> Over budget</div>
        : <div className="trend" aria-label={`${positive ? 'Up' : 'Down'} trend, ${caption}`}>{positive ? <ArrowUp size={16} aria-hidden="true" /> : <ArrowDown size={16} aria-hidden="true" />} {caption}</div>}
      {celebrate && <div className="recover-badge"><CheckmarkFilled size={12} aria-hidden="true" /> Back under cap</div>}
      {compare && <div style={{ position: 'absolute', right: 14, top: 14 }} className={`delta-chip ${positive ? '' : 'negative'}`}>{positive ? '+' : ''}{delta.toFixed(1)}%</div>}
    </article>
  );
}

function KpiStrip() {
  const state = useCostStore();
  const announceMessage = useCostStore((s) => s.announceMessage);
  const kpis = useMemo(() => kpiData(state), [state.events, state.rateOverrides, state.range, state.filter, state.budgetCap]);
  const over = kpis.remaining < 0;
  const previousOver = useRef(over);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    const wasOver = previousOver.current;
    previousOver.current = over;
    if (wasOver && !over) {
      announceMessage('Projected spend is back under the monthly cap');
      setCelebrate(true);
      const timer = window.setTimeout(() => setCelebrate(false), 2200);
      return () => window.clearTimeout(timer);
    }
    if (!wasOver && over) announceMessage('Warning: projected spend now exceeds the monthly cap');
    return undefined;
  }, [over, announceMessage]);
  const items = [
    ['Range spend', kpis.total, kpis.deltas.total, 'var(--series-0)', 'vs prior period'],
    ['Spend today', kpis.today, kpis.deltas.today, 'var(--series-2)', 'latest selected day'],
    ['Projected month-end', kpis.projected, kpis.deltas.projected, 'var(--series-1)', `${currency(state.budgetCap)} cap`],
    ['Remaining budget', kpis.remaining, kpis.deltas.remaining, 'var(--series-3)', over ? 'projection exceeds cap' : 'at projected pace'],
  ];
  return (
    <section className="kpi-grid" aria-label="Spend overview">
      {items.map(([label, value, delta, accent, caption], i) => (
        <KpiCard key={label} label={label} value={value} delta={delta} compare={state.compare} error={i === 3 && over} accent={accent} caption={caption} celebrate={i === 3 && celebrate} delay={i * 90} />
      ))}
    </section>
  );
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
        <div className="compact-field"><label htmlFor="date-from">From</label><input id="date-from" type="date" aria-invalid={Boolean(errors.from)} {...register('from')} /></div>
        <div className="compact-field"><label htmlFor="date-to">To</label><input id="date-to" type="date" aria-invalid={Boolean(errors.to || backwards)} {...register('to')} /></div>
        <Button type="submit" size="sm" disabled={!isValid || backwards}>Apply</Button>
        <label className="compare-toggle" title="Overlay the previous period of equal length on the spend chart">
          <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Compare prior period
        </label>
      </form>
      {(errors.to || backwards) && <div className="inline-error" role="alert">date range: to must be on or after from — swap the dates or extend the end date</div>}
    </div>
  );
}

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{payload[0]?.payload?.date || label}</div>
      {payload.map((entry) => <div key={entry.dataKey}>{entry.name}: {currency(entry.value, 2)}</div>)}
    </div>
  );
}

function SpendChart() {
  const state = useCostStore();
  const reduced = usePrefersReducedMotion();
  const chartTheme = useChartTheme();
  const anomalies = useMemo(() => anomalyData(state), [state.events, state.rateOverrides, state.range, state.filter]);
  const anomalyDates = useMemo(() => new Set(anomalies.map((a) => a.date)), [anomalies]);
  const primary = useMemo(() => dailySeries(state), [state.events, state.rateOverrides, state.range, state.filter]);
  const previous = useMemo(() => dailySeries(state, true), [state.events, state.rateOverrides, state.range, state.filter]);
  const data = primary.map((row, index) => ({ ...row, previous: previous[index]?.cumulative || 0 }));
  const anomalyDot = (props) => {
    if (!anomalyDates.has(props.payload.date)) return <circle key={`dot-${props.payload.date}`} cx={props.cx} cy={props.cy} r={2} fill={chartTheme.palette[0]} />;
    return <path key={`dot-${props.payload.date}`} role="img" aria-label={`Anomaly on ${props.payload.date}`} d={`M ${props.cx} ${props.cy - 7} L ${props.cx + 7} ${props.cy} L ${props.cx} ${props.cy + 7} L ${props.cx - 7} ${props.cy} Z`} fill={chartTheme.error} stroke="white" strokeWidth="2" />;
  };
  return (
    <section className="panel chart-panel" id="spend-over-time">
      <div className="panel-head">
        <div><div className="section-kicker">Trend</div><h2 className="panel-title">Cumulative spend</h2><div className="panel-subtitle">Daily posted inference cost · anomaly days use diamond markers</div></div>
        <RangeForm />
      </div>
      <div className="panel-body chart-height" aria-label="Cumulative spend line chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart key={`${state.range.from}|${state.range.to}|${state.filter.day}|${state.compare}`} data={data} margin={{ top: 16, right: 18, left: 4, bottom: 4 }}>
            <CartesianGrid stroke={chartTheme.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartTheme.axis }} tickLine={false} axisLine={false} minTickGap={35} />
            <YAxis tickFormatter={compactCurrency} tick={{ fontSize: 11, fill: chartTheme.axis }} tickLine={false} axisLine={false} width={55} />
            <Tooltip content={<MoneyTooltip />} />
            {state.compare && <Line type="monotone" dataKey="previous" name="Previous period" stroke={chartTheme.palette[1]} strokeWidth={2} strokeDasharray="6 5" dot={false} isAnimationActive={!reduced} animationDuration={550} />}
            <Line type="monotone" dataKey="cumulative" name="Current period" stroke={chartTheme.palette[0]} strokeWidth={3} dot={anomalyDot} activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }} isAnimationActive={!reduced} animationDuration={600} animationEasing="ease-out" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function BreakdownChart() {
  const state = useCostStore();
  const reduced = usePrefersReducedMotion();
  const chartTheme = useChartTheme();
  const setDimension = useCostStore((s) => s.setDimension);
  const toggleSeries = useCostStore((s) => s.toggleSeries);
  const applyDrilldown = useCostStore((s) => s.applyDrilldown);
  const [stacked, setStacked] = useState(true);
  const data = useMemo(() => dimensionSeries(state), [state.events, state.rateOverrides, state.range, state.filter, state.dimension]);
  const visible = data.members.filter((member) => !state.hiddenSeries[member]);
  return (
    <section className="panel chart-panel" id="dimension-breakdown">
      <div className="panel-head">
        <div><div className="section-kicker">Allocation</div><h2 className="panel-title">Dimension breakdown</h2><div className="panel-subtitle">Click any segment to filter the ledger · costs include workload multipliers</div></div>
        <div className="chart-controls">
          <div className="segmented" role="group" aria-label="Breakdown dimension">
            {['model', 'feature', 'team'].map((d) => <button key={d} type="button" className={state.dimension === d ? 'active' : ''} onClick={() => setDimension(d)} aria-pressed={state.dimension === d}>{d[0].toUpperCase() + d.slice(1)}</button>)}
          </div>
          <div className="segmented" role="group" aria-label="Bar layout">
            <button type="button" className={stacked ? 'active' : ''} onClick={() => setStacked(true)} aria-pressed={stacked}>Stacked</button>
            <button type="button" className={!stacked ? 'active' : ''} onClick={() => setStacked(false)} aria-pressed={!stacked}>Grouped</button>
          </div>
        </div>
      </div>
      <div className="legend" role="group" aria-label="Toggle chart series">
        {data.members.map((member, index) => (
          <button key={member} type="button" className={`legend-button ${state.hiddenSeries[member] ? 'muted' : ''}`} onClick={() => toggleSeries(member)} aria-pressed={!state.hiddenSeries[member]}>
            <span className="legend-swatch" style={{ background: chartTheme.palette[index % chartTheme.palette.length] }} aria-hidden="true" />{member}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="empty-chart" role="status"><div><strong>All series are hidden</strong><br />Turn on a legend item to restore the chart.</div></div>
      ) : (
        <div className="panel-body chart-height" aria-label={`${state.dimension} spend bar chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart key={`${state.range.from}|${state.range.to}|${state.filter.day}|${state.dimension}`} data={data.rows} margin={{ top: 10, right: 12, left: 4, bottom: 4 }} barGap={2}>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartTheme.axis }} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis tickFormatter={compactCurrency} tick={{ fontSize: 11, fill: chartTheme.axis }} tickLine={false} axisLine={false} width={52} />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              {visible.map((member) => {
                const index = data.members.indexOf(member);
                return (
                  <Bar
                    key={member}
                    dataKey={member}
                    name={member}
                    stackId={stacked ? 'spend' : undefined}
                    fill={chartTheme.palette[index % chartTheme.palette.length]}
                    radius={stacked ? 0 : [2, 2, 0, 0]}
                    isAnimationActive={!reduced}
                    animationDuration={500}
                    animationBegin={reduced ? 0 : index * 70}
                    animationEasing="ease-out"
                    onClick={(item) => { const row = item?.payload || item; if (row?.date) applyDrilldown(row.date, state.dimension, member); }}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function Sparkline({ points, color }) {
  const max = Math.max(...points, 0.000001);
  const step = 58 / Math.max(1, points.length - 1);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${(1 + i * step).toFixed(1)},${(18 - (p / max) * 15).toFixed(1)}`).join(' ');
  return (
    <svg className="sparkline" viewBox="0 0 60 20" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function AttainmentWheel({ rows, chartTheme }) {
  const [armed, setArmed] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const frame = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const radii = [64, 50, 36, 22];
  const summary = rows.map((row) => `${row.team} ${Math.round((row.spendToDate / row.ceilingUsd) * 100)} percent of ceiling`).join(', ');
  return (
    <div className="wheel-wrap">
      <svg className="wheel-svg" viewBox="0 0 160 160" role="img" aria-label={`Team budget attainment wheel — ${summary}`}>
        <g transform="rotate(-90 80 80)">
          {rows.map((row, i) => {
            const radius = radii[i % radii.length];
            const circumference = 2 * Math.PI * radius;
            const pct = Math.min(100, (row.spendToDate / row.ceilingUsd) * 100);
            const sweep = armed ? (pct / 100) * circumference : 0;
            const over = row.projectedMonthEnd > row.ceilingUsd;
            return (
              <g key={row.team}>
                <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--ring-track)" strokeWidth="11" />
                <circle
                  className="wheel-ring"
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={over ? chartTheme.error : chartTheme.teamColors[row.team]}
                  strokeWidth="11"
                  strokeLinecap="butt"
                  strokeDasharray={`${sweep} ${circumference}`}
                  style={{ transitionDelay: reduced ? '0ms' : `${i * 90}ms` }}
                />
              </g>
            );
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" className="wheel-center-num">{Math.round((rows.reduce((s, r) => s + r.spendToDate, 0) / rows.reduce((s, r) => s + r.ceilingUsd, 0)) * 100)}%</text>
        <text x="80" y="92" textAnchor="middle" className="wheel-center-label">of ceilings</text>
      </svg>
      <div className="wheel-legend">
        {rows.map((row) => {
          const over = row.projectedMonthEnd > row.ceilingUsd;
          return (
            <div className="wheel-key" key={row.team}>
              <span className="legend-swatch" style={{ background: over ? chartTheme.error : chartTheme.teamColors[row.team] }} aria-hidden="true" />
              <span>{row.team}</span>
              <strong>{Math.round((row.spendToDate / row.ceilingUsd) * 100)}%{over && <WarningAlt size={12} className="wheel-warn" aria-label="Projected over ceiling" />}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamRow({ row, allRows, chartTheme }) {
  const cap = useCostStore((s) => s.budgetCap);
  const setTeamCeiling = useCostStore((s) => s.setTeamCeiling);
  const pinned = useCostStore((s) => s.pinnedTeams.includes(row.team));
  const togglePin = useCostStore((s) => s.togglePin);
  const state = useCostStore();
  const spark = useMemo(() => teamSparkline(state, row.team), [state.events, state.rateOverrides, state.range, state.filter, row.team]);
  const { register, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(teamCeilingSchema), mode: 'onChange', defaultValues: { team: row.team, ceilingUsd: row.ceilingUsd },
  });
  useEffect(() => reset({ team: row.team, ceilingUsd: row.ceilingUsd }), [row.team, row.ceilingUsd, reset]);
  const nextValue = watch('ceilingUsd');
  const sum = allRows.reduce((acc, item) => acc + (item.team === row.team ? (Number(nextValue) || 0) : item.ceilingUsd), 0);
  const excess = Math.max(0, sum - cap);
  const over = row.projectedMonthEnd > row.ceilingUsd;
  const burnPct = Math.min(100, (row.projectedMonthEnd / row.ceilingUsd) * 100);
  return (
    <div className={`team-row ${over ? 'over' : ''}`}>
      <div className="team-top">
        <span className="team-name">
          <button type="button" className={`pin-btn ${pinned ? 'pinned' : ''}`} aria-pressed={pinned} aria-label={pinned ? `Unpin ${row.team}` : `Pin ${row.team} to top`} onClick={() => togglePin(row.team)}>
            {pinned ? <StarFilled size={13} aria-hidden="true" /> : <Star size={13} aria-hidden="true" />}
          </button>
          {row.team}
        </span>
        <span className="team-numbers"><Sparkline points={spark} color={chartTheme.teamColors[row.team]} /> {currency(row.spendToDate)} / {currency(row.ceilingUsd)}</span>
      </div>
      <div className="burn-track" role="img" aria-label={`${row.team} projected ${currency(row.projectedMonthEnd)} against a ${currency(row.ceilingUsd)} ceiling`}>
        <div className="burn-fill" style={{ width: `${burnPct}%` }} />
      </div>
      {over
        ? <div className="overage-text"><WarningAlt size={12} aria-hidden="true" /> Projected overage {currency(row.projectedMonthEnd - row.ceilingUsd)}</div>
        : <div className="panel-subtitle">Projected {currency(row.projectedMonthEnd)} month-end</div>}
      <form className="ceiling-edit" onSubmit={handleSubmit(setTeamCeiling)}>
        <input type="hidden" {...register('team')} />
        <div>
          <label className="header-label ceiling-label" htmlFor={`ceiling-${row.team}`}>Ceiling (ceilingUsd)</label>
          <input id={`ceiling-${row.team}`} type="number" step="0.01" min="0" aria-invalid={Boolean(errors.ceilingUsd || excess)} {...register('ceilingUsd', { valueAsNumber: true })} />
        </div>
        <button type="submit" disabled={!isValid || excess > 0}>Save</button>
      </form>
      {errors.ceilingUsd && <div className="inline-error" role="alert">ceilingUsd: must be greater than 0 with at most 2 decimals</div>}
      {excess > 0 && <div className="inline-error" role="alert">team ceilings would exceed capUsd by {currency(excess)} — lower another ceiling or raise the cap</div>}
    </div>
  );
}

function TeamBudgetPanel() {
  const state = useCostStore();
  const chartTheme = useChartTheme();
  const pinnedTeams = useCostStore((s) => s.pinnedTeams);
  const rows = useMemo(() => teamAnalytics(state), [state.events, state.rateOverrides, state.range, state.filter, state.teamCeilings]);
  const ordered = useMemo(() => [
    ...rows.filter((row) => pinnedTeams.includes(row.team)),
    ...rows.filter((row) => !pinnedTeams.includes(row.team)),
  ], [rows, pinnedTeams]);
  return (
    <section className="panel" id="team-budgets">
      <div className="panel-head"><div><div className="section-kicker">Guardrails</div><h2 className="panel-title">Team budgets</h2><div className="panel-subtitle">Burn-rate projection against monthly ceilings · pin a team to keep it on top</div></div></div>
      <div className="panel-body">
        {ordered.map((row) => <TeamRow key={row.team} row={row} allRows={rows} chartTheme={chartTheme} />)}
        <AttainmentWheel rows={rows} chartTheme={chartTheme} />
      </div>
    </section>
  );
}

function AnomalyPanel() {
  const state = useCostStore();
  const reduced = usePrefersReducedMotion();
  const chartTheme = useChartTheme();
  const anomalies = useMemo(() => anomalyData(state), [state.events, state.rateOverrides, state.range, state.filter]);
  const applyAnomalyDay = useCostStore((s) => s.applyAnomalyDay);
  const [open, setOpen] = useState({});
  const viewEvents = (date) => {
    applyAnomalyDay(date);
    requestAnimationFrame(() => document.getElementById('event-table')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }));
  };
  return (
    <section className="panel anomaly-panel" id="anomaly-list">
      <div className="panel-head"><div><div className="section-kicker">Signals</div><h2 className="panel-title">Anomaly flags</h2><div className="panel-subtitle">More than 2× trailing seven-day average</div></div><Tag type="red">{anomalies.length} flagged</Tag></div>
      <div className="panel-body">
        {!anomalies.length && <div className="panel-subtitle">No anomalies in this range.</div>}
        {anomalies.map((item, index) => (
          <motion.div
            className="anomaly-item"
            key={`${item.date}-${anomalies.length}`}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: reduced ? 0 : index * 0.07, ease: 'easeOut' }}
          >
            <button type="button" className="anomaly-trigger" onClick={() => setOpen((value) => ({ ...value, [item.date]: !value[item.date] }))} aria-expanded={Boolean(open[item.date])}>
              <span className="anomaly-dot" aria-hidden="true" /><span><span className="anomaly-date">{format(parseISO(item.date), 'MMM d, yyyy')}</span><br /><span className="anomaly-meta">{currency(item.spend)} · {item.percentAboveTrend}% above trend</span></span><span className={`chevron ${open[item.date] ? 'open' : ''}`}><ChevronDown size={16} aria-hidden="true" /></span>
            </button>
            <div className={`disclosure ${open[item.date] ? 'open' : ''}`}>
              <div>
                <div className="contribution contribution-head"><span>Model</span><span>Team</span><span>Cost</span></div>
                {item.events.map((event) => <div className="contribution" key={event.id}><span>{event.model}</span><span>{event.team}</span><strong>{currency(pricedCost(event, state), 4)}</strong></div>)}
                <Button kind="ghost" size="sm" onClick={() => viewEvents(item.date)}>View events</Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function UnitCostExplorer() {
  const state = useCostStore();
  const chartTheme = useChartTheme();
  const setRate = useCostStore((s) => s.setRate);
  const revertRates = useCostStore((s) => s.revertRates);
  const [text, setText] = useState('');
  const tokens = text.trim() ? Math.max(1, Math.ceil(text.trim().length / 4)) : 0;
  const active = Object.keys(state.rateOverrides).length > 0;
  return (
    <div className="explorer-grid" id="unit-cost-explorer">
      <div className="panel">
        <div className="panel-head">
          <div><div className="section-kicker">Scenario lab</div><h2 className="panel-title">Unit-cost explorer</h2><div className="panel-subtitle">Rate per 1,000 tokens · dragging reprices all history through the workload multipliers</div></div>
          <div>
            {active && <span className="active-indicator"><span className="anomaly-dot what-if-dot" aria-hidden="true" />What-if active</span>}{' '}
            <Button kind="ghost" size="sm" renderIcon={Restart} disabled={!active} onClick={revertRates}>Revert</Button>
          </div>
        </div>
        <div className="panel-body">
          {MODELS.map((model) => {
            const rate = currentRate(state, model);
            const changed = state.rateOverrides[model] !== undefined;
            return (
              <div className="rate-row" key={model}>
                <span className="rate-model">{model}{changed && <span className="rate-changed" aria-label="what-if rate active">*</span>}</span>
                <Slider id={`rate-${model}`} hideTextInput labelText={`${model} what-if rate per 1,000 tokens`} min={Math.max(0.0005, ORIGINAL_RATES[model] * 0.25)} max={ORIGINAL_RATES[model] * 2.5} step={0.0005} value={rate} onChange={({ value }) => setRate(model, Number(value))} />
                <span className="rate-value">{currency(rate, 4)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div><div className="section-kicker">Quick quote</div><h2 className="panel-title">Text cost estimator</h2><div className="panel-subtitle">Uses ~4 characters per token at current what-if rates</div></div></div>
        <div className="panel-body">
          <TextArea id="sample-text" labelText="Sample text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a prompt to estimate…" />
          <div className="panel-subtitle">Estimated tokens: <strong>{tokens.toLocaleString()}</strong></div>
          <div className="estimate-grid">{MODELS.map((model) => <React.Fragment key={model}><span>{model}</span><strong>{currency((tokens / 1000) * currentRate(state, model), 4)}</strong></React.Fragment>)}</div>
        </div>
      </div>
    </div>
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
        {!result.error && (
          <div className="formula-result" aria-live="polite">
            <span>{result.label} · {events.length} events</span>
            <strong>{result.currency ? currency(result.value, 2) : Number(result.value).toLocaleString()}</strong>
          </div>
        )}
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
  const { register, handleSubmit, watch, reset } = useForm({ resolver: zodResolver(recategorizeSchema), mode: 'onChange', defaultValues: { team: '', feature: '' } });
  const team = watch('team');
  const feature = watch('feature');
  const count = selected.length;
  if (!count) return null;
  const submit = ({ team: nextTeam, feature: nextFeature }) => {
    recategorize({ team: nextTeam || undefined, feature: nextFeature || undefined });
    setToast({ kind: 'success', title: 'Events recategorized', subtitle: `${count} records were updated across every tile, chart, and panel.` });
    reset({ team: '', feature: '' });
  };
  return (
    <form className="bulk-bar" onSubmit={handleSubmit(submit)}>
      <div className="bulk-count" aria-live="polite">{count} selected</div>
      <div><label htmlFor="bulk-team">Move to team</label><select id="bulk-team" {...register('team')}><option value="">No change</option>{TEAMS.map((value) => <option key={value}>{value}</option>)}</select></div>
      <div><label htmlFor="bulk-feature">Set feature</label><select id="bulk-feature" {...register('feature')}><option value="">No change</option>{FEATURES.map((value) => <option key={value}>{value}</option>)}</select></div>
      <Button size="sm" type="submit" disabled={!team && !feature}>Apply</Button>
      <Button size="sm" kind="ghost" type="button" onClick={() => setSelected([])}>Clear</Button>
      {!team && !feature && <div className="bulk-error" role="alert">team or feature is required — pick at least one destination</div>}
    </form>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <motion.span
      className="chip-wrap"
      layout
      initial={{ opacity: 0, y: -6, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.94 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <span className="filter-chip">{label}
        <button type="button" aria-label={`Remove filter: ${label}`} onClick={onRemove}><span aria-hidden="true">×</span></button>
      </span>
    </motion.span>
  );
}

const columns = [
  ['timestamp', 'Timestamp'], ['model', 'Model'], ['feature', 'Feature'], ['team', 'Team'], ['promptTokens', 'Prompt tokens'], ['completionTokens', 'Completion tokens'], ['cost', 'Cost'], ['tag', 'Tag'],
];

function EventLedger() {
  const state = useCostStore();
  const density = useCostStore((s) => s.density);
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
  const rowHeight = density === 'compact' ? 32 : 44;
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({ count: events.length, getScrollElement: () => parentRef.current, estimateSize: () => rowHeight, overscan: 10 });
  useEffect(() => { virtualizer.measure(); }, [rowHeight, virtualizer]);
  const allSelected = events.length > 0 && events.every((event) => state.selectedIds.includes(event.id));
  const selectAll = () => setSelected(allSelected ? [] : events.map((event) => event.id));
  const chipLabel = state.filter.day ? `${state.filter.day}${state.filter.dimension ? ` · ${state.filter.dimension}: ${state.filter.member}` : ' · anomaly day'}` : null;
  return (
    <section className="panel table-panel" id="event-table">
      <div className="panel-head table-tools">
        <div><div className="section-kicker">Usage ledger</div><h2 className="panel-title">Event table</h2><div className="panel-subtitle">{events.length.toLocaleString()} matching records · only visible rows are rendered · {density} density</div></div>
        <FormulaBox events={events} />
      </div>
      <ul className="chips" aria-label="Applied filters">
        <li className="chips-label">Applied filters</li>
        <li><Tag type="teal">Range {state.range.from} to {state.range.to}</Tag></li>
        <AnimatePresence initial={false}>
          {chipLabel && <li key="drill"><FilterChip label={chipLabel} onRemove={clearFilter} /></li>}
          {state.activeViewId && <li key="view"><FilterChip label={`Saved view: ${state.savedViews.find((v) => v.id === state.activeViewId)?.name || 'active'}`} onRemove={clearFilter} /></li>}
        </AnimatePresence>
      </ul>
      <BulkBar />
      <div className="table-scroll-outer">
        <div className="table-header virtual-table" role="row">
          <label className="event-check select-all" aria-label="Select all filtered events">
            <input type="checkbox" checked={allSelected} onChange={selectAll} />
          </label>
          {columns.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="columnheader"
              aria-sort={state.sort.key === key ? (state.sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              className="header-cell"
              onClick={() => setSort(key)}
            >
              {label}{state.sort.key === key && (state.sort.direction === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />)}
            </button>
          ))}
        </div>
        {events.length === 0 ? (
          <div className="zero-state" role="status"><div><h3>No events match these filters</h3><p>The formula result remains valid at zero.</p><Button size="sm" onClick={clearAllFilters}>Clear filters</Button></div></div>
        ) : (
          <div className={`table-scroll ${density}`} ref={parentRef} role="table" aria-label="Usage events" aria-rowcount={events.length}>
            <div className="virtual-spacer" style={{ height: virtualizer.getTotalSize() }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const event = events[virtualRow.index];
                const selected = state.selectedIds.includes(event.id);
                return (
                  <div key={event.id} className={`event-row ${selected ? 'selected' : ''}`} style={{ height: rowHeight, transform: `translateY(${virtualRow.start}px)` }} role="row">
                    <label className="event-check" aria-label={`Select ${event.id}`}>
                      <input type="checkbox" checked={selected} onChange={() => toggleSelected(event.id)} />
                    </label>
                    <div className="event-cell" role="cell">{format(parseISO(event.timestamp), 'MMM d, yyyy HH:mm')} UTC</div>
                    <div className="event-cell" role="cell">{event.model}</div>
                    <div className="event-cell" role="cell">{event.feature}</div>
                    <div className="event-cell" role="cell">{event.team}</div>
                    <div className="event-cell" role="cell">{event.promptTokens.toLocaleString()}</div>
                    <div className="event-cell" role="cell">{event.completionTokens.toLocaleString()}</div>
                    <div className="event-cell" role="cell"><strong>{currency(pricedCost(event, state), 4)}</strong></div>
                    <div className="event-cell" role="cell"><span className="tag-pill">{event.tag}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
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

const CSV_KEYS = ['timestamp', 'model', 'feature', 'team', 'promptTokens', 'completionTokens', 'cost', 'tag'];

function reportCsv(report) {
  return [CSV_KEYS.join(','), ...report.events.map((event) => CSV_KEYS.map((key) => csvCell(event[key])).join(','))].join('\n');
}

function ExportPanel() {
  const state = useCostStore();
  const setToast = useCostStore((s) => s.setToast);
  const [previewOpen, setPreviewOpen] = useState(true);
  const report = useMemo(() => buildCostReport(state), [
    state.events, state.rateOverrides, state.range, state.filter, state.dimension,
    state.compare, state.budgetCap, state.teamCeilings,
  ]);
  const jsonPreview = useMemo(() => {
    const trimmed = { ...report, events: report.events.slice(0, 6) };
    return JSON.stringify(trimmed, null, 2);
  }, [report]);
  const csvPreview = useMemo(() => [CSV_KEYS.join(','), ...report.events.slice(0, 4).map((event) => CSV_KEYS.map((key) => csvCell(event[key])).join(','))].join('\n'), [report]);
  const exportReport = (kind) => {
    if (kind === 'json') downloadFile('cost-analytics-report.json', 'application/json', JSON.stringify(report, null, 2));
    else downloadFile('cost-analytics-report.csv', 'text/csv;charset=utf-8', reportCsv(report));
    setToast({ kind: 'success', title: `${kind.toUpperCase()} downloaded`, subtitle: `${report.totals.eventCount.toLocaleString()} live events exported as cost-analytics-report.${kind}.` });
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setToast({ kind: 'success', title: 'Copied', subtitle: 'Live cost-report JSON is on the clipboard.' });
    } catch {
      setToast({ kind: 'error', title: 'Copy blocked', subtitle: 'The browser refused clipboard access — use Download JSON instead.' });
    }
  };
  return (
    <section className="panel export-panel" id="export-panel" aria-label="Export cost report">
      <div className="panel-head table-tools">
        <div>
          <div className="section-kicker">Work product</div>
          <h2 className="panel-title">Export cost report</h2>
          <div className="panel-subtitle">Compiled live from the session store — recategorizations, ceiling edits, filters, and what-if rates included</div>
        </div>
        <div className="table-actions">
          <Button kind="primary" size="sm" renderIcon={Download} onClick={() => exportReport('json')}>Download JSON</Button>
          <Button kind="tertiary" size="sm" renderIcon={Download} onClick={() => exportReport('csv')}>Download CSV</Button>
          <Button kind="ghost" size="sm" renderIcon={Copy} onClick={copy}>Copy JSON</Button>
          <Button kind="ghost" size="sm" renderIcon={Printer} onClick={() => window.print()}>Print snapshot</Button>
        </div>
      </div>
      <div className="export-body">
        <button type="button" className="preview-toggle" aria-expanded={previewOpen} onClick={() => setPreviewOpen((v) => !v)}>
          <span className={`chevron ${previewOpen ? 'open' : ''}`}><ChevronDown size={14} aria-hidden="true" /></span>
          Live report preview <span className="panel-subtitle">— schemaVersion {report.schemaVersion} · generatedAt {report.generatedAt} · {report.totals.eventCount.toLocaleString()} events · total {currency(report.totals.cost)}</span>
        </button>
        {previewOpen && (
          <div className="export-previews">
            <div>
              <div className="preview-label" id="json-preview-label">cost-analytics-report.json (first 6 of {report.totals.eventCount.toLocaleString()} events shown)</div>
              <pre className="export-preview" aria-labelledby="json-preview-label">{jsonPreview}</pre>
            </div>
            <div>
              <div className="preview-label" id="csv-preview-label">cost-analytics-report.csv (header + first rows)</div>
              <pre className="export-preview" aria-labelledby="csv-preview-label">{csvPreview}</pre>
              <div className="panel-subtitle">The downloaded CSV carries the same {report.totals.eventCount.toLocaleString()} event rows under this exact header.</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SaveViewModal({ open, onClose }) {
  const state = useCostStore();
  const saveView = useCostStore((s) => s.saveView);
  const requestClose = useModalExit(onClose);
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm({ resolver: zodResolver(savedViewSchema), mode: 'onChange', defaultValues: { name: '', dimension: state.dimension, range: state.range } });
  useDialogKeyboard(open, requestClose, 'view-name', 'save-view-trigger');
  useEffect(() => { if (open) reset({ name: '', dimension: state.dimension, range: state.range }); }, [open, state.dimension, state.range, reset]);
  const submit = (body) => { saveView(body); requestClose(); };
  return (
    <Modal open={open} modalHeading="Save analytics view" primaryButtonText="Save view" secondaryButtonText="Cancel" primaryButtonDisabled={!isValid} onRequestSubmit={handleSubmit(submit)} onRequestClose={requestClose} size="sm">
      <form className="modal-form" onSubmit={handleSubmit(submit)}>
        <TextInput id="view-name" labelText="View name (2–60 characters)" invalid={Boolean(errors.name)} invalidText={errors.name?.message || 'name must be 2–60 characters'} {...register('name')} />
        <Select id="view-dimension" labelText="Breakdown dimension" invalid={Boolean(errors.dimension)} invalidText={errors.dimension?.message} {...register('dimension')}>
          <SelectItem value="model" text="Model" /><SelectItem value="feature" text="Feature" /><SelectItem value="team" text="Team" />
        </Select>
        <TextInput id="view-from" type="date" labelText="Range from" invalid={Boolean(errors.range?.from)} invalidText={errors.range?.from?.message} {...register('range.from')} />
        <TextInput id="view-to" type="date" labelText="Range to" invalid={Boolean(errors.range?.to)} invalidText={errors.range?.to?.message || 'to must be on or after from'} {...register('range.to')} />
      </form>
    </Modal>
  );
}

function ScheduleModal({ open, onClose }) {
  const existing = useCostStore((s) => s.schedule);
  const saveSchedule = useCostStore((s) => s.saveSchedule);
  const requestClose = useModalExit(onClose);
  const { register, handleSubmit, reset, watch, formState: { errors, isValid } } = useForm({ resolver: zodResolver(scheduleSchema), mode: 'onChange', defaultValues: existing || { frequency: 'weekly', sections: [] } });
  useDialogKeyboard(open, requestClose, 'report-frequency', 'reports-schedule-trigger-header');
  useEffect(() => { if (open) reset(existing || { frequency: 'weekly', sections: [] }); }, [open, existing, reset]);
  const sections = watch('sections') || [];
  const submit = (body) => { saveSchedule(body); requestClose(); };
  return (
    <Modal open={open} modalHeading="Schedule cost report" primaryButtonText="Save schedule" secondaryButtonText="Cancel" primaryButtonDisabled={!isValid || !sections.length} onRequestSubmit={handleSubmit(submit)} onRequestClose={requestClose} size="sm">
      <form className="modal-form" onSubmit={handleSubmit(submit)}>
        <Select id="report-frequency" labelText="Frequency" invalid={Boolean(errors.frequency)} invalidText={errors.frequency?.message} {...register('frequency')}>
          <SelectItem value="daily" text="Daily" /><SelectItem value="weekly" text="Weekly" /><SelectItem value="monthly" text="Monthly" />
        </Select>
        <fieldset>
          <legend className="cds--label">Sections to include</legend>
          <div className="checkbox-group">
            <Checkbox id="section-totals" labelText="Totals" value="totals" {...register('sections')} />
            <Checkbox id="section-dimensions" labelText="Per-dimension tables" value="per-dimension-tables" {...register('sections')} />
            <Checkbox id="section-anomalies" labelText="Anomalies" value="anomalies" {...register('sections')} />
          </div>
          {!sections.length && <div className="inline-error" role="alert">sections: select at least one section to include</div>}
          {errors.sections && sections.length > 0 && <div className="inline-error" role="alert">{errors.sections.message}</div>}
        </fieldset>
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
  const requestClose = useModalExit(() => setPendingDelete(null));
  useDialogKeyboard(Boolean(pendingDelete), requestClose, '', 'saved-view-new');
  return (
    <section className="panel" id="saved-views">
      <div className="panel-head"><div><div className="section-kicker">Workspace</div><h2 className="panel-title">Saved views</h2><div className="panel-subtitle">Restore range, dimension, and drill-down in one click</div></div><Button id="saved-view-new" size="sm" renderIcon={Add} onClick={onCreate}>New</Button></div>
      <div className="panel-body">
        {!views.length && <div className="empty-inline"><strong>No saved views yet.</strong> Capture the current filters, dimension, and range with Save view.</div>}
        <div className="saved-list">{views.map((view) => (
          <div key={view.id} className={`saved-item ${active === view.id ? 'active' : ''}`}>
            <button type="button" onClick={() => applyView(view.id)}><strong>{view.name}</strong><div className="panel-subtitle">{view.dimension} · {view.range.from} to {view.range.to}</div></button>
            <button type="button" className="saved-delete" aria-label={`Delete ${view.name}`} onClick={() => setPendingDelete(view)}><TrashCan size={16} aria-hidden="true" /></button>
          </div>
        ))}</div>
      </div>
      <Modal open={Boolean(pendingDelete)} danger modalHeading="Delete saved view?" primaryButtonText="Delete view" selectorPrimaryFocus=".cds--btn--danger" secondaryButtonText="Cancel" onRequestSubmit={() => { if (pendingDelete) deleteView(pendingDelete.id); requestClose(); }} onRequestClose={requestClose} size="xs">
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
  const requestClose = useModalExit(() => setOpened(null));
  useDialogKeyboard(Boolean(opened), requestClose, '', 'reports-schedule-trigger');
  return (
    <section className="panel" id="report-history">
      <div className="panel-head"><div><div className="section-kicker">Delivery</div><h2 className="panel-title">Scheduled reports</h2><div className="panel-subtitle">Snapshots preserve live totals at generation</div></div><Button id="reports-schedule-trigger" size="sm" kind="secondary" onClick={onSchedule}>{schedule ? 'Edit' : 'Set schedule'}</Button></div>
      <div className="panel-body">
        {schedule
          ? <div className="schedule-summary"><strong>{schedule.frequency[0].toUpperCase() + schedule.frequency.slice(1)}</strong> · {schedule.sections.join(', ')}</div>
          : snapshots.length
            ? <div className="schedule-summary"><strong>No active schedule</strong> · showing saved snapshots</div>
            : <div className="empty-inline" role="status"><strong>No report snapshots yet.</strong> Set a schedule, then run it to preserve live totals.</div>}
        <Button renderIcon={Play} size="sm" disabled={!schedule} onClick={() => run()}>Run schedule now</Button>
        <div className="history-list" style={{ marginTop: 12 }}>{snapshots.slice().reverse().map((snapshot) => (
          <button type="button" className="history-item" id={snapshot === snapshots.at(-1) ? 'open-latest-snapshot' : undefined} key={snapshot.id} onClick={() => setOpened(snapshot)}>
            <span><strong>{format(parseISO(snapshot.generatedAt), 'MMM d, HH:mm:ss')} UTC</strong><br /><span className="panel-subtitle">{snapshot.totals.eventCount.toLocaleString()} events</span></span>
            <strong>{currency(snapshot.totals.cost)}</strong>
          </button>
        ))}</div>
      </div>
      <Modal open={Boolean(opened)} modalHeading="Report snapshot" primaryButtonText="Close" selectorPrimaryFocus=".cds--btn--primary" onRequestSubmit={requestClose} onRequestClose={requestClose} size="sm">
        {opened && (
          <div className="snapshot-body">
            <p>Generated {opened.generatedAt}</p>
            <div className="schedule-summary"><strong>{currency(opened.totals.cost)}</strong> total cost<br />{opened.totals.eventCount.toLocaleString()} events · {opened.totals.promptTokens.toLocaleString()} prompt tokens · {opened.totals.completionTokens.toLocaleString()} completion tokens</div>
          </div>
        )}
      </Modal>
    </section>
  );
}

function ToastHost() {
  const toast = useCostStore((s) => s.toast);
  const setToast = useCostStore((s) => s.setToast);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(timer);
  }, [toast, setToast]);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="toast-wrap"
          initial={reduced ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <ToastNotification kind={toast.kind} title={toast.title} subtitle={toast.subtitle} timeout={0} onClose={() => setToast(null)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const TOUR_STEPS = [
  { title: 'Drill into any segment', body: 'Click a bar in the dimension breakdown to filter the ledger to that exact day and member. Remove the chip above the table to zoom back out.' },
  { title: 'Reprice history with what-if', body: 'Drag a model rate slider in the scenario lab — every tile, chart, and table row reprices live. Revert restores the exact originals.' },
  { title: 'Ask the ledger with formulas', body: 'Type =SUM(cost) or =AVG(cost) above the event table to aggregate whatever the active filters match.' },
  { title: 'Ship the numbers', body: 'Download the live JSON or CSV cost report below the table — it always reflects this session’s edits, ceilings, and rates.' },
];

function GuidedTour() {
  const dismissed = useCostStore((s) => s.tourDismissed);
  const dismissTour = useCostStore((s) => s.dismissTour);
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  if (dismissed) return null;
  const current = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;
  return (
    <motion.aside
      className="tour-card"
      aria-label="Feature tour"
      initial={reduced ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="tour-copy">
        <div className="tour-eyebrow">Guided tour · step {step + 1} of {TOUR_STEPS.length}</div>
        <strong className="tour-title">{current.title}</strong>
        <p className="tour-body">{current.body}</p>
      </div>
      <div className="tour-right">
        <div className="tour-dots" aria-hidden="true">{TOUR_STEPS.map((item, i) => <span key={item.title} className={i === step ? 'on' : ''} />)}</div>
        <div className="tour-actions">
          <Button kind="ghost" size="sm" onClick={dismissTour}>Skip tour</Button>
          <span className="tour-nav">
            {step > 0 && <Button kind="ghost" size="sm" onClick={() => setStep(step - 1)}>Back</Button>}
            <Button size="sm" onClick={() => (last ? dismissTour() : setStep(step + 1))}>{last ? 'Finish' : 'Next'}</Button>
          </span>
        </div>
      </div>
    </motion.aside>
  );
}

function CommandPalette({ open, onClose, onSaveView, onSchedule }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const store = useCostStore();
  const announceMessage = useCostStore((s) => s.announceMessage);
  const exportReport = (kind) => {
    const report = buildCostReport(useCostStore.getState());
    if (kind === 'json') downloadFile('cost-analytics-report.json', 'application/json', JSON.stringify(report, null, 2));
    else downloadFile('cost-analytics-report.csv', 'text/csv;charset=utf-8', reportCsv(report));
    store.setToast({ kind: 'success', title: `${kind.toUpperCase()} downloaded`, subtitle: `${report.totals.eventCount.toLocaleString()} live events exported.` });
  };
  const actions = useMemo(() => [
    ['Go to Spend overview', () => window.scrollTo({ top: 0, behavior: 'smooth' })],
    ['Go to Cumulative spend chart', () => document.getElementById('spend-over-time')?.scrollIntoView({ behavior: 'smooth' })],
    ['Go to Dimension breakdown', () => document.getElementById('dimension-breakdown')?.scrollIntoView({ behavior: 'smooth' })],
    ['Go to Team budgets', () => document.getElementById('team-budgets')?.scrollIntoView({ behavior: 'smooth' })],
    ['Go to Anomaly flags', () => document.getElementById('anomaly-list')?.scrollIntoView({ behavior: 'smooth' })],
    ['Go to Event table', () => document.getElementById('event-table')?.scrollIntoView({ behavior: 'smooth' })],
    ['Go to Unit-cost explorer', () => document.getElementById('unit-cost-explorer')?.scrollIntoView({ behavior: 'smooth' })],
    ['Go to Report history', () => document.getElementById('report-history')?.scrollIntoView({ behavior: 'smooth' })],
    [`Turn period compare ${store.compare ? 'off' : 'on'}`, () => store.setCompare(!store.compare)],
    ['Revert what-if rates', () => store.revertRates()],
    ['Toggle light / dark theme', () => store.toggleTheme()],
    [`Switch to ${store.density === 'comfortable' ? 'compact' : 'comfortable'} table density`, () => store.setDensity(store.density === 'comfortable' ? 'compact' : 'comfortable')],
    ['Run schedule now', () => {
      if (!store.schedule) { announceMessage('Save a report schedule before running it'); store.setToast({ kind: 'info', title: 'No schedule yet', subtitle: 'Open Reports to save a schedule first.' }); return; }
      store.runScheduleNow();
    }],
    ['Download JSON report', () => exportReport('json')],
    ['Download CSV report', () => exportReport('csv')],
    ['Save current view…', () => onSaveView()],
    ['Edit report schedule…', () => onSchedule()],
  ], [store, onSaveView, onSchedule, announceMessage]);
  const filtered = actions.filter(([label]) => label.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (open) { setQuery(''); setActive(0); window.setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);
  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => {
    if (!open) return undefined;
    const escape = (event) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } };
    document.addEventListener('keydown', escape, true);
    return () => document.removeEventListener('keydown', escape, true);
  }, [open, onClose]);
  if (!open) return null;
  const runAction = (index) => {
    const action = filtered[index];
    if (!action) return;
    onClose();
    action[1]();
    announceMessage(action[0]);
  };
  return (
    <div className="cmd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmd-panel" role="dialog" aria-label="Command palette" onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); onClose(); }
        if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => Math.min(filtered.length - 1, i + 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
        if (event.key === 'Enter') { event.preventDefault(); runAction(active); }
      }}>
        <input
          ref={inputRef}
          className="cmd-input"
          type="text"
          aria-label="Search commands"
          placeholder="Type a command… (arrows to move, Enter to run, Esc to close)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="cmd-list" role="listbox" aria-label="Commands" aria-activedescendant={`cmd-option-${active}`}>
          {filtered.map(([label], index) => (
            <li
              key={label}
              id={`cmd-option-${index}`}
              role="option"
              aria-selected={index === active}
              className={index === active ? 'active' : ''}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => { event.preventDefault(); runAction(index); }}
            >
              {label}
            </li>
          ))}
          {!filtered.length && <li className="cmd-empty" role="option" aria-selected="false">No matching commands</li>}
        </ul>
      </div>
    </div>
  );
}

export default function App() {
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const announce = useCostStore((s) => s.announce);
  const theme = useCostStore((s) => s.theme);
  useEffect(() => registerWebMCP(), []);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.carbonTheme = theme === 'dark' ? 'g100' : 'white';
    root.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    const shortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to dashboard</a>
      <Header onSaveView={() => setSaveViewOpen(true)} onSchedule={() => setScheduleOpen(true)} onPalette={() => setPaletteOpen(true)} />
      <main className="main" id="main-content">
        <KpiStrip />
        <GuidedTour />
        <div className="charts-layout">
          <div className="chart-stack"><SpendChart /><BreakdownChart /></div>
          <aside className="side-stack" aria-label="Budgets and anomalies"><TeamBudgetPanel /><AnomalyPanel /></aside>
        </div>
        <div className="explorer"><UnitCostExplorer /></div>
        <EventLedger />
        <ExportPanel />
        <div className="reports-layout"><SavedViewsPanel onCreate={() => setSaveViewOpen(true)} /><ReportPanel onSchedule={() => setScheduleOpen(true)} /></div>
        <footer className="app-foot">Cost Command · seeded inference telemetry · all figures recompute from one shared event store</footer>
      </main>
      <SaveViewModal open={saveViewOpen} onClose={() => setSaveViewOpen(false)} />
      <ScheduleModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onSaveView={() => setSaveViewOpen(true)} onSchedule={() => setScheduleOpen(true)} />
      <ToastHost />
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announce}</div>
    </div>
  );
}
