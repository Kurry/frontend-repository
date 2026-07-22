import { Component, For, Show } from 'solid-js';
import {
  store,
  filteredAuditLog,
  setAuditFilter,
  AUDIT_FILTER_OPTIONS,
} from '../store';

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString();
}

const AuditLog: Component = () => {
  const entries = () => filteredAuditLog();
  const summaryCount = () => store.auditLog.length;
  const summaryLabel = () => `${summaryCount()} recorded ${summaryCount() === 1 ? 'action' : 'actions'}`;

  return (
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-slate-100">Audit log</h1>
          <p class="text-sm text-slate-400">Identity and permission activity for this vault.</p>
          <p class="text-xs text-slate-500 mt-1">{summaryLabel()}</p>
        </div>
        <label class="text-sm text-slate-400 flex items-center gap-2">
          Action type
          <select
            data-testid="audit-filter"
            class="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={store.auditFilter}
            onChange={(e) => setAuditFilter(e.currentTarget.value as typeof store.auditFilter)}
          >
            <For each={AUDIT_FILTER_OPTIONS}>
              {(opt) => <option value={opt.value}>{opt.label}</option>}
            </For>
          </select>
        </label>
      </div>

      <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        <Show
          when={entries().length > 0}
          fallback={
            <div class="text-sm text-slate-400">
              {store.auditFilter === 'all'
                ? 'No activity yet.'
                : `No ${AUDIT_FILTER_OPTIONS.find((o) => o.value === store.auditFilter)?.label ?? 'matching'} entries.`}
            </div>
          }
        >
          <ul class="space-y-2" data-testid="audit-log-list">
            <For each={entries()}>
              {(entry) => (
                <li class="hover-wash flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-700/50 gap-3">
                  <span class="text-sm text-slate-200">{entry.message}</span>
                  <span class="text-xs text-slate-500 shrink-0">{formatTime(entry.ts)}</span>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </div>
  );
};

export default AuditLog;
