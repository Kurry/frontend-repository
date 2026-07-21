import { summaryStats, displayCurrency } from '../state.js';
import { formatMoney, formatDate } from '../format.js';
import { Icon } from './Icon.jsx';

export function SummaryStrip() {
  const s = summaryStats.value;
  const cur = displayCurrency.value;
  const cells = [
    { icon: 'lucide:hash', label: 'Transaction count', value: String(s.count) },
    {
      icon: 'lucide:arrow-up-right',
      label: 'Largest transaction',
      value: s.largest ? formatMoney(s.largest.amount, cur, { showSign: true }) : '—',
      sub: s.largest ? s.largest.label : 'No rows',
    },
    { icon: 'lucide:divide', label: 'Average amount', value: s.count ? formatMoney(s.average, cur, { showSign: true }) : '—' },
    {
      icon: 'lucide:calendar-range',
      label: 'Covered date range',
      value: s.dateStart && s.dateEnd ? `${formatDate(s.dateStart)} – ${formatDate(s.dateEnd)}` : '—',
    },
  ];
  return (
    <section aria-label="Filtered transactions summary" class="rounded-2xl border border-[#e3efe9] bg-gradient-to-r from-[#0f3d3e] to-[#175250] p-4 text-[#e6f7f1] shadow-sm">
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cells.map((c) => (
          <div key={c.label} class="flex items-start gap-3">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-[#8af0d3]">
              <Icon name={c.icon} decorative size={17} />
            </span>
            <div class="min-w-0">
              <div class="text-[11px] font-semibold uppercase tracking-wide text-[#a9d8cd]">{c.label}</div>
              <div class="tnum truncate font-display text-lg font-semibold text-white">{c.value}</div>
              {c.sub && <div class="truncate text-xs text-[#a9d8cd]">{c.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
