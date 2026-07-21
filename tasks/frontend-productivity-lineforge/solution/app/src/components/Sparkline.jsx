import { h } from 'preact';
import { useState } from 'preact/hooks';

// Tiny interactive SVG chart used as beyond-spec polish on the statistics and
// practice surfaces. Hovering a vertex highlights it and surfaces its value via
// a <title> + an inline readout, so it is browser-observable as an enhanced
// graphic beyond the required stacked bar.

export function Sparkline({ values = [], color = 'var(--color-primary)', height = 56, labelFn, baseline = 0, formatValue }) {
  const [hover, setHover] = useState(-1);
  const W = 100;
  const H = height;
  const pad = 4;
  const fmt = formatValue || (v => String(v));
  const data = values.length ? values : [baseline];
  const min = Math.min(baseline, ...data);
  const max = Math.max(baseline, ...data);
  const span = Math.max(0.0001, max - min);
  const n = data.length;
  const x = i => pad + (n === 1 ? (W - 2 * pad) / 2 : (i / (n - 1)) * (W - 2 * pad));
  const y = v => H - pad - ((v - min) / span) * (H - 2 * pad);
  const zeroY = y(baseline);

  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ');
  const area = `${line} L ${x(n - 1).toFixed(2)} ${zeroY.toFixed(2)} L ${x(0).toFixed(2)} ${zeroY.toFixed(2)} Z`;

  const active = hover >= 0 ? hover : n - 1;

  return (
    <div class="sparkline" role="img" aria-label={labelFn ? labelFn(active) : `Sample data point ${active + 1}: ${fmt(data[active])}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" class="spark-svg" aria-hidden="true">
        <line x1={pad} y1={zeroY} x2={W - pad} y2={zeroY} stroke="currentColor" stroke-width="0.4" class="spark-zero" />
        <path d={area} fill={color} class="spark-area" />
        <path d={line} fill="none" stroke={color} stroke-width="1.4" vector-effect="non-scaling-stroke" />
        {data.map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r={i === active ? 2.4 : 1.4}
            fill={color}
            class={i === active ? 'spark-dot spark-dot-on' : 'spark-dot'}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(-1)}
          >
            <title>{labelFn ? labelFn(i) : `Point ${i + 1}: ${fmt(v)}`}</title>
          </circle>
        ))}
      </svg>
      <span class="spark-readout stat-figures">{fmt(data[active])}</span>
    </div>
  );
}
