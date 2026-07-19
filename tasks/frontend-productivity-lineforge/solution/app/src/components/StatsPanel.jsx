import { h } from 'preact';
import { currentOpening } from '../store';

export function StatsPanel() {
  const opening = currentOpening.value;
  if (!opening) return null;

  const s = opening.stats;

  return (
    <section class="card mb-4">
      <h3 class="mb-3">Statistics</h3>
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
    </section>
  );
}
