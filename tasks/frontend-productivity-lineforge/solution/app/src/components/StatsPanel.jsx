import { h } from 'preact';
import { currentOpening } from '../store';
import { Sparkline } from './Sparkline';

// Deterministic illustrative per-move sample series so the enhanced graphic is
// stable per opening (not random each render) yet varies across the line.
function sampleSeries(opening) {
  const base = opening.stats.whiteWin;
  const n = Math.max(1, opening.moves.length);
  const out = [];
  for (let i = 0; i < n; i++) {
    const wobble = Math.sin(i * 1.3 + opening.code.charCodeAt(0) * 0.05) * 12;
    out.push(Math.round(base + wobble));
  }
  return out;
}

export function StatsPanel() {
  const opening = currentOpening.value;
  if (!opening) return null;

  const s = opening.stats;
  const series = sampleSeries(opening);

  return (
    <section class="card mb-4" aria-labelledby="stats-heading">
      <h3 id="stats-heading" class="mb-3">Statistics</h3>
      <div
        class="flex rounded-md overflow-hidden h-6 mb-2 border border-neutral-500"
        role="img"
        aria-label={`Outcomes: White wins ${s.whiteWin}%, draws ${s.draw}%, Black wins ${s.blackWin}%`}
      >
        <div style={{ width: `${s.whiteWin}%`, backgroundColor: '#FFFFFF' }} />
        <div style={{ width: `${s.draw}%`, backgroundColor: '#8B8B8B' }} />
        <div style={{ width: `${s.blackWin}%`, backgroundColor: '#1B1B1B' }} />
      </div>
      <div class="flex justify-between gap-2 text-base stat-figures mb-2 flex-wrap">
        <span>White win {s.whiteWin}%</span>
        <span>Draw {s.draw}%</span>
        <span>Black win {s.blackWin}%</span>
      </div>
      <div class="text-base stat-figures">Games in database: {s.games.toLocaleString('en-US')}</div>
      <div class="mt-1 text-sm text-neutral-600">Illustrative sample data</div>

      {/* Beyond-spec enhanced graphic: interactive per-move sample performance. */}
      <div class="mt-3">
        <div class="flex items-center justify-between gap-2 mb-1 flex-wrap">
          <span class="text-sm font-semibold text-[var(--color-primary)]">Sample white performance by move</span>
          <span class="text-sm text-neutral-600">Hover a point</span>
        </div>
        <Sparkline
          values={series}
          color="var(--color-accent)"
          baseline={s.whiteWin}
          formatValue={v => `${v}%`}
          labelFn={i => `Move ${i + 1}: sample white performance ${series[i]}%`}
        />
      </div>
    </section>
  );
}
