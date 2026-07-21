import { useEffect, useState } from 'preact/hooks';
import { computedThresholds, displayCurrency, commitThresholdCeiling } from '../state.js';
import { ceilingInputSchema, CATEGORY_META } from '../schemas.js';
import { formatMoney } from '../format.js';
import { Icon } from './Icon.jsx';

const STATUS_STYLE = {
  under: { chip: 'bg-[#e3f6ee] text-[#047857]', bar: 'bg-[#047857]', label: 'Under' },
  near: { chip: 'bg-[#fef6e6] text-[#b45309]', bar: 'bg-[#d97706]', label: 'Near' },
  over: { chip: 'bg-[#fff1e9] text-[#c2410c]', bar: 'bg-[#c2410c]', label: 'Over' },
};

export function ThresholdsPanel() {
  const rows = computedThresholds.value;
  const cur = displayCurrency.value;
  const ceilingKey = rows.map((r) => `${r.category}=${r.ceiling}`).join('|');
  const [drafts, setDrafts] = useState(() => Object.fromEntries(rows.map((r) => [r.category, String(r.ceiling)])));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      rows.forEach((r) => {
        if (!(r.category in next) || Number(next[r.category]) === r.ceiling || next[r.category] === '') {
          next[r.category] = String(r.ceiling);
        }
      });
      return next;
    });
    setErrors({});
  }, [ceilingKey]);

  const onChange = (category, value) => {
    setDrafts((d) => ({ ...d, [category]: value }));
    const r = ceilingInputSchema.safeParse(value);
    if (!r.success) {
      setErrors((e) => ({ ...e, [category]: r.error.issues[0].message }));
      return;
    }
    setErrors((e) => {
      if (!(category in e)) return e;
      const n = { ...e };
      delete n[category];
      return n;
    });
    const num = Number(value);
    const current = rows.find((x) => x.category === category);
    if (current && num !== current.ceiling) commitThresholdCeiling(category, num);
  };

  return (
    <section id="ld-thresholds" aria-labelledby="ld-thresholds-title" class="rounded-2xl border border-[#e3efe9] bg-white p-4 shadow-sm">
      <header class="mb-3 flex items-center justify-between">
        <div>
          <h2 id="ld-thresholds-title" class="flex items-center gap-2 font-display text-lg font-semibold text-[#0f3d3e]">
            <Icon name="lucide:gauge" decorative size={18} />
            Monthly thresholds
          </h2>
          <p class="text-xs text-[#7e958f]">Editable spend ceilings · status recomputes live</p>
        </div>
        <span class="hidden text-xs text-[#7e958f] sm:block">Values in {cur}</span>
      </header>

      <ul class="divide-y divide-[#eef4f1]">
        {rows.map((r) => {
          const st = STATUS_STYLE[r.status];
          const pct = Math.min(100, Math.round(r.ratio * 100));
          const overBy = r.status === 'over' ? r.monthToDate - r.ceiling : 0;
          return (
            <li key={r.category} class={`py-3 ${r.status === 'over' ? 'rounded-lg bg-[#fff1e9]/40 px-2 -mx-2' : ''}`}>
              <div class="flex flex-wrap items-center gap-3">
                <span class="flex w-40 items-center gap-2 text-sm font-medium text-[#102a2a]">
                  <span class="text-base">{CATEGORY_META[r.category].emoji}</span>
                  {r.category}
                </span>

                <div class="flex items-center gap-1.5">
                  <label for={`ld-ceil-${r.category}`} class="text-xs font-semibold text-[#7e958f]">
                    Ceiling
                  </label>
                  <span class="tnum text-sm text-[#4a6460]">{CURRENCY_SYM(cur)}</span>
                  <input
                    id={`ld-ceil-${r.category}`}
                    type="text"
                    inputMode="decimal"
                    aria-invalid={!!errors[r.category]}
                    class={`tnum w-24 rounded-lg border bg-white px-2 py-1 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c8a85]/40 ${
                      errors[r.category] ? 'border-[#c2410c] bg-[#fff1e9]' : 'border-[#d7eae3] focus:border-[#2c8a85]'
                    }`}
                    value={drafts[r.category] ?? ''}
                    onInput={(e) => onChange(r.category, e.target.value)}
                  />
                </div>

                <div class="ml-auto flex items-center gap-3">
                  <div class="text-right">
                    <div class="text-[11px] uppercase tracking-wide text-[#7e958f]">Month to date</div>
                    <div class="tnum text-sm font-semibold text-[#0f3d3e]">{formatMoney(r.monthToDate, cur)}</div>
                  </div>
                  <span class={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${st.chip}`}>
                    <Icon
                      name={r.status === 'over' ? 'lucide:triangle-alert' : r.status === 'near' ? 'lucide:circle-dot' : 'lucide:circle-check'}
                      decorative
                      size={13}
                    />
                    {st.label}
                  </span>
                </div>
              </div>

              <div class="mt-2 flex items-center gap-2">
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-[#eef4f1]">
                  <div class={`h-full rounded-full ${st.bar} transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <span class="tnum w-12 text-right text-[11px] text-[#7e958f]">{pct}%</span>
              </div>

              {errors[r.category] ? (
                <p class="mt-1 flex items-center gap-1 text-xs font-medium text-[#c2410c]">
                  <Icon name="lucide:circle-alert" decorative size={12} />
                  Ceiling: {errors[r.category]} — previous value kept.
                </p>
              ) : (
                r.status === 'over' && (
                  <p class="mt-1 flex items-center gap-1 text-xs font-medium text-[#c2410c]">
                    <Icon name="lucide:triangle-alert" decorative size={12} />
                    Over budget by {formatMoney(overBy, cur)} this month.
                  </p>
                )
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CURRENCY_SYM(c) {
  return c === 'EUR' ? '€' : c === 'GBP' ? '£' : '$';
}
