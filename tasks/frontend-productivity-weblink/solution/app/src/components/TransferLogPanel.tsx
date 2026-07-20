import { For, Show } from "solid-js";
import { Motion } from "@motionone/solid";
import { state } from "../store";

function formatLogTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function TransferLogPanel() {
  return (
    <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-800/60 mt-4 flex flex-col max-h-[300px]">
      <div class="flex items-center justify-between mb-3">
         <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
           Transfer Log
         </h2>
      </div>
      <div class="flex-1 overflow-y-auto space-y-1">
        <Show
           when={state.transferLog.length > 0}
           fallback={<p class="text-xs text-slate-400 mt-2">No transfer actions recorded yet.</p>}
        >
          <For each={state.transferLog}>
             {(entry) => (
                <Motion.div
                   initial={{ opacity: 0, x: -5 }}
                   animate={{ opacity: 1, x: 0 }}
                   class="flex gap-3 text-xs border-b border-slate-100 py-1.5 last:border-0 dark:border-slate-800/50"
                >
                   <span class="text-slate-400 shrink-0 font-mono tabular-nums">{formatLogTime(entry.at)}</span>
                   <span class="font-medium text-slate-600 dark:text-slate-300 w-20 shrink-0">{entry.event}</span>
                   <span class="text-slate-500 truncate" title={entry.fileName}>{entry.fileName}</span>
                </Motion.div>
             )}
          </For>
        </Show>
      </div>
    </section>
  );
}
