import { Show } from "solid-js";
import { state, queueFile } from "../store";
import FileQueueTable from "./FileQueueTable";

export default function FilePanel() {
  let fileInputRef: HTMLInputElement | undefined;

  const handleFiles = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const files = input.files;
    if (!files) return;
    Array.from(files).forEach((f) => queueFile(f.name, f.size));
    input.value = "";
  };

  return (
    <section
      class="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-800/60"
      data-testid="file-panel"
    >
      <div class="flex items-center justify-between mb-3">
         <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
           File transfer
         </h2>
      </div>

      <button
        type="button"
        class="mb-3 w-full rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm
          text-slate-500 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600
          active:scale-95 dark:border-slate-700 dark:hover:bg-slate-900/40"
        onClick={() => fileInputRef?.click()}
        data-testid="choose-file-button"
      >
        Choose file to queue
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        class="hidden"
        onChange={handleFiles}
        data-testid="file-input"
      />

      <Show
        when={state.files.queue.length > 0}
        fallback={
          <div class="mt-4 p-6 border-2 border-dashed border-slate-100 rounded-lg text-center dark:border-slate-800/60">
             <p class="text-sm text-slate-400" data-testid="file-queue-empty">
               No files queued yet. Choosing a file does not require a connected recipient.
             </p>
          </div>
        }
      >
        <FileQueueTable />
      </Show>
    </section>
  );
}
