import { useState } from 'preact/hooks';
import {
  filteredTransactions,
  selection,
  filters,
  displayCurrency,
  sort,
  search,
  setFilters,
  clearFilters,
  setSort,
  setCurrency,
  toggleSelect,
  setSelectAll,
  openCreate,
  openEdit,
  deleteTransaction,
  bulkCategorize,
  bulkDelete,
  showToast,
} from '../state.js';
import { CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_META } from '../schemas.js';
import { formatMoney, formatDate } from '../format.js';
import { useAutoAnimate } from '../hooks.jsx';
import { Icon } from './Icon.jsx';

const STATUS_STYLE = {
  cleared: 'bg-[#e3f6ee] text-[#047857]',
  pending: 'bg-[#fef6e6] text-[#b45309]',
  reconciled: 'bg-[#e6f0ff] text-[#1d4ed8]',
};

function Select({ id, label, value, onChange, children }) {
  return (
    <label class="flex flex-col gap-1 text-xs font-semibold text-[#7e958f]">
      <span class="uppercase tracking-wide">{label}</span>
      <select
        id={id}
        class="rounded-lg border border-[#d7eae3] bg-white px-2.5 py-1.5 text-sm font-normal text-[#102a2a] transition focus:border-[#2c8a85] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c8a85]/40"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function SortButton({ k, label, icon }) {
  const s = sort.value;
  const active = s.key === k;
  const dirIcon = !active ? 'lucide:chevrons-up-down' : s.dir === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down';
  return (
    <button
      type="button"
      class={`inline-flex items-center gap-1 px-1 text-left text-xs font-semibold uppercase tracking-wide transition ${
        active ? 'text-[#0f3d3e]' : 'text-[#7e958f] hover:text-[#0f3d3e]'
      }`}
      aria-sort={active ? (s.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      onClick={() => setSort(k)}
    >
      {label}
      <Icon name={dirIcon} decorative size={13} />
    </button>
  );
}

export function TransactionsTable() {
  const rows = filteredTransactions.value;
  const sel = selection.value;
  const f = filters.value;
  const cur = displayCurrency.value;
  const q = search.value;
  const rowsRef = useAutoAnimate();

  const [dateDraft, setDateDraft] = useState({ start: f.dateStart || '', end: f.dateEnd || '' });
  const [rangeError, setRangeError] = useState('');

  const selectedInView = rows.filter((r) => sel.includes(r.id));
  const allInView = rows.length > 0 && selectedInView.length === rows.length;
  const someInView = selectedInView.length > 0 && !allInView;

  const applyRange = (start, end) => {
    if (start && end && end < start) {
      setRangeError('End date is before start date — range not applied');
      return;
    }
    setRangeError('');
    setFilters({ dateStart: start || null, dateEnd: end || null });
  };

  const hasFilter = !!(f.category || f.type || f.dateStart || f.dateEnd || q);

  const emptyIsFilter = hasFilter && rows.length === 0;
  const emptyIsTotal = rows.length === 0 && !hasFilter;

  const bulkCategoryChange = (cat) => {
    if (!cat) return;
    bulkCategorize(sel, cat);
    showToast(`Re-categorized ${sel.length} transaction${sel.length > 1 ? 's' : ''} to ${cat}`, 'success');
  };

  return (
    <section id="ld-table" aria-labelledby="ld-table-title" class="rounded-2xl border border-[#e3efe9] bg-white shadow-sm">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef4f1] px-4 py-3">
        <div>
          <h2 id="ld-table-title" class="flex items-center gap-2 font-display text-lg font-semibold text-[#0f3d3e]">
            <Icon name="lucide:table-2" decorative size={18} />
            Transactions
          </h2>
          <p class="text-xs text-[#7e958f]">{rows.length} row{rows.length === 1 ? '' : 's'} in view · {cur}</p>
        </div>
        <button type="button" class="btn btn-sm bg-[#0f3d3e] text-white hover:bg-[#175250]" onClick={() => openCreate()}>
          <Icon name="lucide:plus" decorative size={16} />
          Add transaction
        </button>
      </header>

      <div class="flex flex-wrap items-end gap-3 border-b border-[#eef4f1] bg-[#f7fcfa] px-4 py-3">
        <Select id="ld-f-category" label="Category" value={f.category || ''} onChange={(v) => setFilters({ category: v || null })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select id="ld-f-type" label="Type" value={f.type || ''} onChange={(v) => setFilters({ type: v || null })}>
          <option value="">Income &amp; expenses</option>
          <option value="income">Income only</option>
          <option value="expense">Expenses only</option>
        </Select>
        <label class="flex flex-col gap-1 text-xs font-semibold text-[#7e958f]">
          <span class="uppercase tracking-wide">From</span>
          <input
            type="date"
            class="rounded-lg border border-[#d7eae3] bg-white px-2.5 py-1.5 text-sm font-normal text-[#102a2a] focus:border-[#2c8a85] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c8a85]/40"
            value={dateDraft.start}
            onInput={(e) => {
              const v = e.target.value;
              setDateDraft((d) => ({ ...d, start: v }));
              applyRange(v, dateDraft.end);
            }}
          />
        </label>
        <label class="flex flex-col gap-1 text-xs font-semibold text-[#7e958f]">
          <span class="uppercase tracking-wide">To</span>
          <input
            type="date"
            class="rounded-lg border border-[#d7eae3] bg-white px-2.5 py-1.5 text-sm font-normal text-[#102a2a] focus:border-[#2c8a85] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c8a85]/40"
            value={dateDraft.end}
            onInput={(e) => {
              const v = e.target.value;
              setDateDraft((d) => ({ ...d, end: v }));
              applyRange(dateDraft.start, v);
            }}
          />
        </label>
        <label class="flex flex-1 flex-col gap-1 text-xs font-semibold text-[#7e958f] min-w-[10rem]">
          <span class="uppercase tracking-wide">Search payee / note</span>
          <input
            type="search"
            class="rounded-lg border border-[#d7eae3] bg-white px-2.5 py-1.5 text-sm font-normal text-[#102a2a] focus:border-[#2c8a85] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c8a85]/40"
            value={q}
            onInput={(e) => (search.value = e.target.value)}
          />
        </label>
        <button
          type="button"
          class="btn btn-sm bg-white text-[#0f3d3e] ring-1 ring-[#d7eae3] hover:bg-[#e6f7f1] disabled:opacity-50"
          disabled={!hasFilter}
          onClick={() => {
            clearFilters();
            setDateDraft({ start: '', end: '' });
            setRangeError('');
          }}
        >
          <Icon name="lucide:filter-x" decorative size={15} />
          Clear filters
        </button>
      </div>
      {rangeError && (
        <p role="alert" class="flex items-center gap-1 bg-[#fff1e9] px-4 py-1.5 text-xs font-medium text-[#c2410c]">
          <Icon name="lucide:circle-alert" decorative size={13} />
          {rangeError}
        </p>
      )}

      {sel.length > 0 && (
        <div class="flex flex-wrap items-center gap-3 border-b border-[#eef4f1] bg-[#e6f7f1] px-4 py-2.5">
          <span class="flex items-center gap-1.5 text-sm font-semibold text-[#0f3d3e]">
            <Icon name="lucide:list-checks" decorative size={16} />
            {sel.length} selected
          </span>
          <label class="flex items-center gap-2 text-xs font-semibold text-[#175250]">
            Bulk categorize
            <select
              class="rounded-lg border border-[#c5f5e7] bg-white px-2 py-1 text-sm font-normal text-[#102a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c8a85]/40"
              value=""
              onChange={(e) => bulkCategoryChange(e.target.value)}
            >
              <option value="">Choose category…</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="Salary">Salary</option>
              <option value="Freelance">Freelance</option>
            </select>
          </label>
          <button
            type="button"
            class="btn btn-sm bg-[#c2410c] text-white hover:bg-[#9a3412]"
            onClick={() => {
              const n = sel.length;
              bulkDelete(sel);
              showToast(`Deleted ${n} transaction${n > 1 ? 's' : ''}`, 'success');
            }}
          >
            <Icon name="lucide:trash-2" decorative size={15} />
            Delete selected
          </button>
          <button
            type="button"
            class="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#175250] hover:text-[#0f3d3e]"
            onClick={() => setSelectAll(rows.map((r) => r.id), false)}
          >
            <Icon name="lucide:x" decorative size={14} />
            Clear selection
          </button>
        </div>
      )}

      <div class="scroll-area overflow-x-auto">
        <table class="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-[#eef4f1] text-[#7e958f]">
              <th class="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  aria-label="Select all visible transactions"
                  class="checkbox checkbox-sm accent-[#0f3d3e]"
                  checked={allInView}
                  ref={(el) => {
                    if (el) el.indeterminate = someInView;
                  }}
                  onChange={(e) => setSelectAll(rows.map((r) => r.id), e.target.checked)}
                />
              </th>
              <th class="px-3 py-2.5">
                <SortButton k="date" label="Date" />
              </th>
              <th class="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Payee</th>
              <th class="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Category</th>
              <th class="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Account</th>
              <th class="px-3 py-2.5 text-right">
                <span class="inline-flex">
                  <SortButton k="amount" label="Amount" />
                </span>
              </th>
              <th class="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Status</th>
              <th class="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody ref={rowsRef}>
            {rows.map((r) => {
              const meta = CATEGORY_META[r.category];
              const income = r.amount > 0;
              return (
                <tr key={r.id} class="group border-b border-[#f1f6f3] transition hover:bg-[#f2faf7]">
                  <td class="px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.label}`}
                      class="checkbox checkbox-sm accent-[#0f3d3e]"
                      checked={sel.includes(r.id)}
                      onChange={() => toggleSelect(r.id)}
                    />
                  </td>
                  <td class="tnum whitespace-nowrap px-3 py-2.5 text-[#4a6460]">{formatDate(r.date)}</td>
                  <td class="px-3 py-2.5">
                    <div class="flex items-center gap-2.5">
                      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0f3d3e] text-[#8af0d3]" title={r.category}>
                        <Icon name={categoryIcon(r.category)} decorative size={16} />
                      </span>
                      <div class="min-w-0">
                        <div class="truncate font-medium text-[#102a2a]">{r.label}</div>
                        {r.note && <div class="truncate text-xs text-[#7e958f]">{r.note}</div>}
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-2.5">
                    <span class="inline-flex items-center gap-1 rounded-full bg-[#eef4f1] px-2 py-0.5 text-xs font-medium text-[#175250]">
                      <span aria-hidden>{meta.emoji}</span>
                      {r.category}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-2.5 text-[#4a6460]">{r.account}</td>
                  <td class={`tnum whitespace-nowrap px-3 py-2.5 text-right font-semibold ${income ? 'text-[#047857]' : 'text-[#c2410c]'}`}>
                    {formatMoney(r.amount, cur, { showSign: true })}
                  </td>
                  <td class="px-3 py-2.5">
                    {r.status ? (
                      <span class={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status] || 'bg-[#eef4f1] text-[#4a6460]'}`}>
                        {r.status}
                      </span>
                    ) : (
                      <span class="text-xs text-[#bccdc7]">—</span>
                    )}
                  </td>
                  <td class="px-3 py-2.5">
                    <div class="flex items-center justify-end gap-1 opacity-70 transition group-hover:opacity-100">
                      <button
                        type="button"
                        class="grid h-7 w-7 place-items-center rounded-md text-[#4a6460] transition hover:bg-[#e6f7f1] hover:text-[#0f3d3e]"
                        aria-label={`Edit ${r.label}`}
                        onClick={() => openEdit(r)}
                      >
                        <Icon name="lucide:pencil" decorative size={15} />
                      </button>
                      <button
                        type="button"
                        class="grid h-7 w-7 place-items-center rounded-md text-[#4a6460] transition hover:bg-[#fff1e9] hover:text-[#c2410c]"
                        aria-label={`Delete ${r.label}`}
                        onClick={() => {
                          deleteTransaction(r.id);
                          showToast(`Deleted ${r.label}`, 'success');
                        }}
                      >
                        <Icon name="lucide:trash-2" decorative size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {emptyIsTotal && (
          <EmptyState
            icon="lucide:receipt-text"
            title="No transactions yet"
            body="This ledger is empty. Add your first income or expense to start tracking totals, thresholds, and flows."
            action={<button type="button" class="btn btn-sm bg-[#0f3d3e] text-white hover:bg-[#175250]" onClick={() => openCreate()}><Icon name="lucide:plus" decorative size={15} />Add transaction</button>}
          />
        )}
        {emptyIsFilter && (
          <EmptyState
            icon="lucide:search-x"
            title="No matching transactions"
            body="Nothing matches the current filters. Clear them or widen the date range to see the full ledger again."
            action={<button type="button" class="btn btn-sm bg-white text-[#0f3d3e] ring-1 ring-[#d7eae3] hover:bg-[#e6f7f1]" onClick={() => { clearFilters(); setDateDraft({ start: '', end: '' }); setRangeError(''); }}><Icon name="lucide:filter-x" decorative size={15} />Clear filters</button>}
          />
        )}
      </div>
    </section>
  );
}

function EmptyState({ icon, title, body, action }) {
  return (
    <div class="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span class="grid h-14 w-14 place-items-center rounded-2xl bg-[#e6f7f1] text-[#0f3d3e]">
        <Icon name={icon} decorative size={26} />
      </span>
      <div>
        <h3 class="font-display text-base font-semibold text-[#0f3d3e]">{title}</h3>
        <p class="mx-auto mt-1 max-w-sm text-sm text-[#7e958f]">{body}</p>
      </div>
      {action}
    </div>
  );
}

function categoryIcon(category) {
  const map = {
    Groceries: 'lucide:shopping-cart',
    Restaurants: 'lucide:utensils',
    Transport: 'lucide:car',
    Housing: 'lucide:home',
    Utilities: 'lucide:zap',
    Entertainment: 'lucide:film',
    Healthcare: 'lucide:stethoscope',
    Shopping: 'lucide:shopping-bag',
    Salary: 'lucide:banknote',
    Freelance: 'lucide:laptop',
  };
  return map[category] || 'lucide:circle-dollar-sign';
}
