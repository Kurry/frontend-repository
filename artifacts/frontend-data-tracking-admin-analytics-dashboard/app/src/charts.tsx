import React, { useState, useEffect, useCallback } from 'react';

// Module-level tooltip bus so a single portal renders the floating tooltip.
type Tip = { x: number; y: number; html: string } | null;
const listeners = new Set<(t: Tip) => void>();
let current: Tip = null;
export const setTip = (t: Tip) => { current = t; listeners.forEach((l) => l(t)); };
export const useTip = () => {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l); l();
    return () => { listeners.delete(l); };
  }, []);
  return current;
};
export function TooltipPortal() {
  const tip = useTip();
  if (!tip) return null;
  return <div className="chart-tooltip" style={{ left: tip.x + 12, top: tip.y - 8 }} dangerouslySetInnerHTML={{ __html: tip.html }} />;
}

const show = (e: React.MouseEvent, html: string) => setTip({ x: e.clientX, y: e.clientY, html });
const move = (e: React.MouseEvent, html: string) => setTip({ x: e.clientX, y: e.clientY, html });
const hide = () => setTip(null);

export function ColumnChart({ values, labels, color = 'var(--c-teal)', height = 200, showAvg = false }:
  { values: number[]; labels: string[]; color?: string; height?: number; showAvg?: boolean }) {
  const W = 600, H = height, pad = 8;
  const max = Math.max(...values) * 1.1;
  const bw = (W - pad * 2) / values.length;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const avgY = H - pad - (avg / max) * (H - pad * 2);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Column chart" preserveAspectRatio="none" style={{ height }}>
      {showAvg && <line x1={pad} x2={W - pad} y1={avgY} y2={avgY} stroke="var(--c-amber)" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.8} />}
      {values.map((v, i) => {
        const h = (v / max) * (H - pad * 2); const x = pad + i * bw + bw * 0.12; const y = H - pad - h;
        return <rect key={i} className="bar" x={x} y={y} width={bw * 0.76} height={h} rx={3} fill={color}
          onMouseEnter={(e) => show(e, `<b>${labels[i]}</b><br/>${v.toLocaleString()}`)}
          onMouseMove={(e) => move(e, `<b>${labels[i]}</b><br/>${v.toLocaleString()}`)} onMouseLeave={hide} />;
      })}
    </svg>
  );
}

export function LineChart({ values, color = 'var(--c-sky)', height = 150, suffix = '' }:
  { values: number[]; color?: string; height?: number; suffix?: string }) {
  const W = 320, H = height, pad = 10;
  const max = Math.max(...values) * 1.12, min = Math.min(...values) * 0.88;
  const x = (i: number) => pad + (i / (values.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart" preserveAspectRatio="none" style={{ height }}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} />
      {values.map((v, i) => (
        <circle key={i} className="pt" cx={x(i)} cy={y(v)} r={3.2} fill={color}
          onMouseEnter={(e) => show(e, `<b>Point ${i + 1}</b><br/>${v.toLocaleString()}${suffix}`)}
          onMouseMove={(e) => move(e, `<b>Point ${i + 1}</b><br/>${v.toLocaleString()}${suffix}`)} onMouseLeave={hide} />
      ))}
    </svg>
  );
}

export function DonutChart({ data, size = 168 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const visible = data.filter((d) => !hidden[d.label]);
  const total = visible.reduce((a, b) => a + b.value, 0) || 1;
  const r = 60, c = 2 * Math.PI * r, cx = size / 2, cy = size / 2;
  let offset = 0;
  const toggle = useCallback((label: string) => setHidden((h) => ({ ...h, [label]: !h[label] })), []);
  return (
    <div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart" style={{ display: 'block', margin: '0 auto' }}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {visible.map((d, i) => {
            const frac = d.value / total; const len = frac * c;
            const seg = (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={18}
                strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} style={{ transition: 'stroke .3s ease', cursor: 'pointer' }}
                onMouseEnter={(e) => show(e, `<b>${d.label}</b><br/>${d.value.toLocaleString()} (${Math.round(frac * 100)}%)`)}
                onMouseMove={(e) => move(e, `<b>${d.label}</b><br/>${d.value.toLocaleString()} (${Math.round(frac * 100)}%)`)} onMouseLeave={hide} />
            );
            offset += len; return seg;
          })}
        </g>
      </svg>
      <div className="legend" style={{ justifyContent: 'center', marginTop: '.6rem' }}>
        {data.map((d) => (
          <button key={d.label} type="button" className={hidden[d.label] ? 'off' : ''} onClick={() => toggle(d.label)}
            aria-pressed={!hidden[d.label]} aria-label={`Toggle ${d.label}`}>
            <span className="lg-dot" style={{ background: d.color }} />{d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Radial({ value, size = 96, color = 'var(--color-base-content)' }: { value: number; size?: number; color?: string }) {
  const r = 38, c = 2 * Math.PI * r;
  return (
    <div className="radial" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-base-300)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dasharray .5s ease' }} />
      </svg>
      <span className="r-label">{value}%</span>
    </div>
  );
}

export function Uptime({ series }: { series: number[] }) {
  return (
    <div className="uptime" aria-label="Uptime bars">
      {series.map((ok, i) => <i key={i} className={ok ? '' : 'bad'} style={{ height: ok ? '100%' : '40%' }} title={ok ? 'operational' : 'degraded'} />)}
    </div>
  );
}

export function Spark({ values, color = 'var(--color-success)', w = 56, h = 22 }: { values: number[]; color?: string; w?: number; h?: number }) {
  const max = Math.max(...values), min = Math.min(...values);
  const x = (i: number) => (i / (values.length - 1)) * (w - 2) + 1;
  const y = (v: number) => h - 1 - ((v - min) / (max - min || 1)) * (h - 2);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return <svg width={w} height={h} className="k-spark" aria-hidden="true"><path d={d} fill="none" stroke={color} strokeWidth={1.5} /></svg>;
}
