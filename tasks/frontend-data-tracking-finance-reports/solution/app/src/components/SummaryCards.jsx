import { totals, displayCurrency, filteredTransactions } from '../state.js';
import { formatMoney, formatPercent } from '../format.js';
import { Icon } from './Icon.jsx';

function Card({ icon, label, value, sub, accent, chip, val }) {
  return (
    <article class="group relative overflow-hidden rounded-2xl border border-[#e3efe9] bg-white p-4 shadow-sm transition hover:shadow-md">
      <span class={`absolute inset-y-0 left-0 w-1 ${accent}`} />
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wide text-[#7e958f]">{label}</span>
        <span class={`grid h-8 w-8 place-items-center rounded-lg ${chip}`}>
          <Icon name={icon} decorative size={16} />
        </span>
      </div>
      <div class={`mt-2 font-display text-2xl font-semibold tabular-nums ${val}`}>{value}</div>
      <div class="mt-1 text-xs text-[#7e958f]">{sub}</div>
    </article>
  );
}

export function SummaryCards() {
  const t = totals.value;
  const cur = displayCurrency.value;
  const n = filteredTransactions.value.length;
  return (
    <section aria-labelledby="ld-kpi-heading" class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <h2 id="ld-kpi-heading" class="sr-only">
        Summary metrics
      </h2>
      <Card
        icon="lucide:arrow-down-to-line"
        label="Total income"
        value={formatMoney(t.income, cur)}
        sub={`${cur} · across ${n} filtered rows`}
        accent="bg-[#047857]"
        chip="bg-[#e3f6ee] text-[#047857]"
        val="text-[#047857]"
      />
      <Card
        icon="lucide:arrow-up-from-line"
        label="Total expenses"
        value={formatMoney(t.expenses, cur)}
        sub={`${cur} · spending this period`}
        accent="bg-[#c2410c]"
        chip="bg-[#fff1e9] text-[#c2410c]"
        val="text-[#c2410c]"
      />
      <Card
        icon="lucide:wallet"
        label="Total net income"
        value={formatMoney(t.net, cur, { showSign: true })}
        sub={t.net >= 0 ? 'Income exceeds spending' : 'Spending exceeds income'}
        accent="bg-[#0f3d3e]"
        chip="bg-[#e6f7f1] text-[#0f3d3e]"
        val="text-[#0f3d3e]"
      />
      <Card
        icon="lucide:piggy-bank"
        label="Savings rate"
        value={formatPercent(t.savingsRate)}
        sub="Net income ÷ total income"
        accent="bg-[#22c79a]"
        chip="bg-[#e6f7f1] text-[#175250]"
        val="text-[#175250]"
      />
    </section>
  );
}
