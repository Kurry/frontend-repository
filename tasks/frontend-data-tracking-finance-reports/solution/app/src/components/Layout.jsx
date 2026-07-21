import { useFocusTrap } from '../hooks.jsx';
import {
  displayCurrency,
  setCurrency,
  undoStack,
  redoStack,
  undo,
  redo,
  openExport,
  openImport,
  mobileNav,
  shortcutLegend,
  showToast,
  FX_VISIBLE,
} from '../state.js';
import { Icon } from './Icon.jsx';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'lucide:layout-dashboard' },
  { id: 'accounts', label: 'Accounts', icon: 'lucide:landmark' },
  { id: 'transactions', label: 'Transactions', icon: 'lucide:receipt' },
  { id: 'cashflow', label: 'Cash Flow', icon: 'lucide:git-compare-arrows' },
  { id: 'reports', label: 'Reports', icon: 'lucide:bar-chart-3', active: true },
  { id: 'budget', label: 'Budget', icon: 'lucide:target' },
];

const DEMO = [
  { label: 'Filters', icon: 'lucide:sliders-horizontal' },
  { label: 'Save', icon: 'lucide:save' },
  { label: 'Sort', icon: 'lucide:arrow-up-down' },
  { label: 'Columns', icon: 'lucide:columns-2' },
  { label: 'Bulk edit', icon: 'lucide:table-cells-merge' },
];

function BrandMark() {
  return (
    <div class="flex items-center gap-2.5 px-5 py-5">
      <span class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#0f3d3e] to-[#1f6b68] shadow-md ring-1 ring-white/10">
        <Icon name="lucide:book-lock" decorative size={20} class="text-[#8af0d3]" />
      </span>
      <div class="leading-tight">
        <div class="font-display text-xl font-semibold tracking-tight text-white">Ledger</div>
        <div class="text-[11px] font-medium uppercase tracking-[0.18em] text-[#7fb8ad]">Reports workspace</div>
      </div>
    </div>
  );
}

function NavList({ onPick }) {
  return (
    <nav aria-label="Workspace sections" class="flex flex-col gap-1 px-3">
      {NAV.map((n) => (
        <button
          key={n.id}
          type="button"
          aria-current={n.active ? 'page' : undefined}
          class={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            n.active
              ? 'bg-white/12 text-white shadow-inner ring-1 ring-white/10'
              : 'text-[#bfe0d8] hover:bg-white/8 hover:text-white'
          }`}
          onClick={() => {
            if (onPick) onPick();
            if (!n.active) showToast(`${n.label} is a demo destination — this preview stays on Reports`, 'demo');
          }}
        >
          <Icon name={n.icon} decorative size={18} class={n.active ? 'text-[#8af0d3]' : 'text-[#7fb8ad] group-hover:text-[#8af0d3]'} />
          {n.label}
          {n.active && <span class="ml-auto h-1.5 w-1.5 rounded-full bg-[#4fe0b5]" />}
        </button>
      ))}
    </nav>
  );
}

function Profile() {
  return (
    <div class="mt-auto flex items-center gap-3 border-t border-white/10 px-4 py-4">
      <span class="grid h-9 w-9 place-items-center rounded-full bg-[#22c79a] text-sm font-bold text-[#06231f]">AR</span>
      <div class="min-w-0 leading-tight">
        <div class="truncate text-sm font-semibold text-white">Alex Rivera</div>
        <div class="truncate text-xs text-[#7fb8ad]">Personal ledger</div>
      </div>
      <Icon name="lucide:settings" decorative size={16} class="ml-auto text-[#7fb8ad]" />
    </div>
  );
}

function SidebarBody({ onPick }) {
  return (
    <div class="flex h-full flex-col">
      <BrandMark />
      <NavList onPick={onPick} />
      <Profile />
    </div>
  );
}

function CurrencyControl() {
  const cur = displayCurrency.value;
  const rate = FX_VISIBLE[cur];
  const onChange = (v) => {
    setCurrency(v);
    const r = FX_VISIBLE[v];
    showToast(`Display currency set to ${v} — amounts shown at 1 USD = ${r} ${v}`, 'info');
  };
  return (
    <label class="relative flex items-center gap-1.5">
      <span class="sr-only">Display currency</span>
      <Icon name="lucide:coins" decorative size={15} class="pointer-events-none absolute left-2.5 text-[#2c8a85]" />
      <select
        aria-label="Display currency"
        class="tnum appearance-none rounded-lg border border-[#d7eae3] bg-white py-1.5 pl-8 pr-7 text-sm font-semibold text-[#0f3d3e] transition hover:bg-[#f2faf7] focus:border-[#2c8a85] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c8a85]/40"
        value={cur}
        onChange={(e) => onChange(e.target.value)}
        title={`Mock FX rate: 1 USD = ${rate} ${cur}`}
      >
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
      </select>
      <Icon name="lucide:chevron-down" decorative size={14} class="pointer-events-none absolute right-2 text-[#7e958f]" />
      <span class="tnum hidden text-xs text-[#7e958f] sm:inline">×{rate}</span>
    </label>
  );
}

function IconButton({ icon, label, onClick, disabled, badge }) {
  return (
    <button
      type="button"
      class="relative grid h-9 w-9 place-items-center rounded-lg border border-[#d7eae3] bg-white text-[#175250] transition hover:bg-[#e6f7f1] hover:text-[#0f3d3e] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} decorative size={17} />
      {badge && <span class="sr-only">{badge}</span>}
    </button>
  );
}

function TopBar({ children }) {
  return (
    <header class="sticky top-0 z-30 border-b border-[#e3efe9] bg-[#f2faf7]/85 backdrop-blur">
      <div class="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-lg border border-[#d7eae3] bg-white text-[#175250] lg:hidden"
          aria-label="Open navigation"
          onClick={() => (mobileNav.value = true)}
        >
          <Icon name="lucide:menu" decorative size={18} />
        </button>
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-xs font-medium text-[#7e958f]">
            <Icon name="lucide:home" decorative size={13} />
            Ledger <span class="text-[#bccdc7]">/</span> <span class="text-[#175250]">Reports</span>
          </div>
          <h1 class="font-display text-xl font-semibold leading-tight text-[#0f3d3e] sm:text-2xl">Finance Reports</h1>
        </div>

        <div class="ml-auto flex flex-wrap items-center gap-2">
          <CurrencyControl />
          <button
            type="button"
            class="btn btn-sm bg-white text-[#0f3d3e] ring-1 ring-[#d7eae3] hover:bg-[#e6f7f1]"
            onClick={() => openImport()}
          >
            <Icon name="lucide:upload" decorative size={15} />
            <span class="hidden sm:inline">Import</span>
          </button>
          <button type="button" class="btn btn-sm bg-[#0f3d3e] text-white hover:bg-[#175250]" onClick={() => openExport('json')}>
            <Icon name="lucide:download" decorative size={15} />
            <span class="hidden sm:inline">Export</span>
          </button>
          <IconButton icon="lucide:undo-2" label="Undo last change" onClick={undo} disabled={undoStack.value.length === 0} />
          <IconButton icon="lucide:redo-2" label="Redo last change" onClick={redo} disabled={redoStack.value.length === 0} />
          <IconButton icon="lucide:keyboard" label="Keyboard shortcuts" onClick={() => (shortcutLegend.value = true)} />
        </div>
      </div>

      <div class="scroll-area flex items-center gap-1.5 overflow-x-auto border-t border-[#e7f1ec] px-4 py-1.5 sm:px-6">
        <span class="mr-1 hidden text-[11px] font-semibold uppercase tracking-wide text-[#9bb3ad] sm:inline">Demo controls</span>
        {DEMO.map((d) => (
          <button
            key={d.label}
            type="button"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-[#4a6460] transition hover:bg-[#e6f7f1] hover:text-[#0f3d3e]"
            onClick={() => showToast(`${d.label} is a demo control in this preview`, 'demo')}
          >
            <Icon name={d.icon} decorative size={14} />
            {d.label}
          </button>
        ))}
        <span class="ml-auto hidden shrink-0 text-[11px] text-[#9bb3ad] md:inline">
          Mock FX · 1 USD = {FX_VISIBLE.EUR} EUR · {FX_VISIBLE.GBP} GBP
        </span>
      </div>
      {children}
    </header>
  );
}

export function Layout({ children }) {
  const navOpen = mobileNav.value;
  const trapRef = useFocusTrap(navOpen, { onEscape: () => (mobileNav.value = false) });

  return (
    <div class="flex min-h-screen">
      <aside class="sticky top-0 hidden h-screen w-60 shrink-0 bg-gradient-to-b from-[#0f3d3e] to-[#0a2e2f] lg:block">
        <SidebarBody />
      </aside>

      {navOpen && (
        <div class="fixed inset-0 z-[90] lg:hidden">
          <button type="button" aria-label="Close navigation" class="absolute inset-0 bg-[#082727]/45 anim-fade-in" onClick={() => (mobileNav.value = false)} />
          <div ref={trapRef} tabindex="-1" class="anim-drawer-in absolute left-0 top-0 flex h-full w-64 flex-col bg-gradient-to-b from-[#0f3d3e] to-[#0a2e2f] shadow-2xl" style={{ transform: 'none' }}>
            <div class="flex items-center justify-end px-3 pt-3">
              <button type="button" class="grid h-8 w-8 place-items-center rounded-lg text-[#bfe0d8] hover:bg-white/10" aria-label="Close navigation" onClick={() => (mobileNav.value = false)}>
                <Icon name="lucide:x" decorative size={18} />
              </button>
            </div>
            <SidebarBody onPick={() => (mobileNav.value = false)} />
          </div>
        </div>
      )}

      <div id="ld-main" class="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main class="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-4 py-5 sm:px-6">{children}</main>
        <footer class="border-t border-[#e3efe9] px-4 py-4 text-center text-xs text-[#9bb3ad] sm:px-6">
          Ledger Reports · synthetic demo data · mock FX rates 1 USD = {FX_VISIBLE.EUR} EUR · {FX_VISIBLE.GBP} GBP · no data leaves your browser
        </footer>
      </div>
    </div>
  );
}
