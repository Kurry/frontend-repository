import { Component, For, Show } from 'solid-js';
import { store } from '../store';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString();
}

const AuditLog: Component = () => {
  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-100">Audit log</h1>
        <p class="text-sm text-slate-400">Identity and permission activity for this vault.</p>
      </div>

      <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        <Show
          when={store.auditLog.length > 0}
          fallback={<div class="text-sm text-slate-400">No activity yet.</div>}
        >
          <ul class="space-y-2" data-testid="audit-log-list">
            <For each={store.auditLog}>
              {(entry) => (
                <li class="hover-wash flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-700/50">
                  <span class="text-sm text-slate-200">{entry.message}</span>
                  <span class="text-xs text-slate-500">{formatTime(entry.ts)}</span>
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
