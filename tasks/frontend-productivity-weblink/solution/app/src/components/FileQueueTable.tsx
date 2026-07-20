import { For, Show, createSignal } from "solid-js";
import { Motion } from "@motionone/solid";
import { usePrefersReducedMotion } from "../reducedMotion";
import { state, startTransfer, pauseTransfer, resumeTransfer, cancelTransfer, retryTransfer, removeSelectedFiles, retrySelectedFiles, reorderFiles, type QueuedFile } from "../store";

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_CLASS: Record<string, string> = {
  "not-started": "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300",
  "transferring": "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "paused": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "completed": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "canceled": "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const STATUS_LABEL: Record<string, string> = {
  "not-started": "Not Started",
  "transferring": "Transferring",
  "paused": "Paused",
  "completed": "Completed",
  "canceled": "Canceled",
};

export default function FileQueueTable() {
  const reducedMotion = usePrefersReducedMotion();
  const [selectedIds, setSelectedIds] = createSignal<Set<string>>(new Set());

  const toggleSelectAll = (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    if (checked) {
      setSelectedIds(new Set(state.files.queue.map(f => f.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds());
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const isAllSelected = () => state.files.queue.length > 0 && selectedIds().size === state.files.queue.length;

  const handleRemoveSelected = () => {
    removeSelectedFiles(Array.from(selectedIds()));
    setSelectedIds(new Set());
  };

  const handleRetrySelected = () => {
    retrySelectedFiles(Array.from(selectedIds()));
  };

  let dragSourceIndex: number | null = null;

  const handleDragStart = (e: DragEvent, index: number) => {
    dragSourceIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      const target = e.target as HTMLElement;
      // Add a slight lift effect
      target.classList.add("opacity-50", "scale-[1.02]", "shadow-lg");
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault(); // necessary to allow dropping
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: DragEvent, index: number) => {
    e.preventDefault();
    if (dragSourceIndex !== null && dragSourceIndex !== index) {
      reorderFiles(dragSourceIndex, index);
    }
    dragSourceIndex = null;
    const target = e.target as HTMLElement;
    target.closest("tr")?.classList.remove("border-sky-400", "border-b-2");
  };

  const handleDragEnter = (e: DragEvent) => {
    const target = e.target as HTMLElement;
    const tr = target.closest("tr");
    if (tr) tr.classList.add("border-sky-400", "border-b-2");
  };

  const handleDragLeave = (e: DragEvent) => {
    const target = e.target as HTMLElement;
    const tr = target.closest("tr");
    if (tr) tr.classList.remove("border-sky-400", "border-b-2");
  };

  const handleDragEnd = (e: DragEvent) => {
    const target = e.target as HTMLElement;
    target.classList.remove("opacity-50", "scale-[1.02]", "shadow-lg");
  };

  const moveUp = (index: number) => {
    if (index > 0) reorderFiles(index, index - 1);
  };

  const moveDown = (index: number) => {
    if (index < state.files.queue.length - 1) reorderFiles(index, index + 1);
  };

  return (
    <div class="mt-4 flex flex-col gap-2 overflow-x-auto">
      <Show when={selectedIds().size > 0}>
        <Motion.div
          initial={reducedMotion() ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          class="flex items-center justify-between rounded-lg bg-sky-50 px-4 py-2 text-sm dark:bg-sky-900/30"
          data-testid="bulk-action-bar"
        >
          <span class="font-medium text-sky-800 dark:text-sky-300">
            {selectedIds().size} selected
          </span>
          <div class="flex gap-2">
            <button
              onClick={handleRemoveSelected}
              class="rounded bg-white px-3 py-1 text-rose-600 shadow-sm transition hover:bg-rose-50 active:scale-95 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-slate-700"
            >
              Remove Selected
            </button>
            <button
              onClick={handleRetrySelected}
              class="rounded bg-white px-3 py-1 text-sky-600 shadow-sm transition hover:bg-sky-50 active:scale-95 dark:bg-slate-800 dark:text-sky-400 dark:hover:bg-slate-700"
            >
              Retry Selected
            </button>
          </div>
        </Motion.div>
      </Show>

      <table class="w-full text-left text-xs min-w-[500px]" data-testid="file-queue-table">
        <thead>
          <tr class="text-slate-500 border-b border-slate-200 dark:border-slate-700">
            <th class="py-2 w-8 text-center">
              <label class="sr-only">Select All</label>
              <input
                type="checkbox"
                class="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                checked={isAllSelected()}
                onChange={toggleSelectAll}
                data-testid="select-all-checkbox"
              />
            </th>
            <th class="py-2 w-8"></th>{/* Drag handle */}
            <th class="py-2 font-medium">Name</th>
            <th class="py-2 font-medium">Size</th>
            <th class="py-2 font-medium">Status</th>
            <th class="py-2 font-medium">Progress</th>
            <th class="py-2 w-32 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <For each={state.files.queue}>
            {(f, idx) => {
              const progressPercent = () => f.size === 0
                ? (f.status === "completed" ? 100 : 0)
                : Math.floor((f.bytesTransferred / f.size) * 100);

              return (
                <Motion.tr
                  initial={reducedMotion() ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  class="group border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/40 relative"
                  draggable={true}
                  onDragStart={(e: DragEvent) => handleDragStart(e, idx())}
                  onDragOver={handleDragOver}
                  onDrop={(e: DragEvent) => handleDrop(e, idx())}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                >
                  <td class="py-2 text-center align-middle">
                     <label class="sr-only">Select {f.name}</label>
                     <input
                        type="checkbox"
                        class="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        checked={selectedIds().has(f.id)}
                        onChange={(e) => toggleSelect(f.id, e.target.checked)}
                        aria-label={`Select ${f.name}`}
                     />
                  </td>
                  <td class="py-2 text-center align-middle text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <circle cx="9" cy="5" r="1"></circle>
                      <circle cx="9" cy="12" r="1"></circle>
                      <circle cx="9" cy="19" r="1"></circle>
                      <circle cx="15" cy="5" r="1"></circle>
                      <circle cx="15" cy="12" r="1"></circle>
                      <circle cx="15" cy="19" r="1"></circle>
                    </svg>
                    <div class="sr-only flex flex-col">
                      <button type="button" onClick={() => moveUp(idx())} disabled={idx() === 0}>Move up</button>
                      <button type="button" onClick={() => moveDown(idx())} disabled={idx() === state.files.queue.length - 1}>Move down</button>
                    </div>
                  </td>
                  <td class="max-w-[120px] truncate py-2 align-middle font-medium text-slate-700 dark:text-slate-200" data-testid="file-queue-name">
                    {f.name}
                  </td>
                  <td class="py-2 text-slate-500 align-middle whitespace-nowrap">{formatSize(f.size)}</td>
                  <td class="py-2 align-middle">
                    <span class={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[f.status]}`}>
                      {STATUS_LABEL[f.status]}
                    </span>
                  </td>
                  <td class="py-2 align-middle min-w-[100px]">
                    <div class="flex items-center gap-2">
                       <div class="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative" role="progressbar" aria-valuenow={progressPercent()} aria-valuemin="0" aria-valuemax="100">
                          <div
                            class="absolute top-0 bottom-0 left-0 bg-sky-500 transition-all duration-200 ease-out"
                            style={{ width: `${progressPercent()}%` }}
                          />
                       </div>
                       <span class="text-[10px] text-slate-500 tabular-nums w-24 text-right">
                         {progressPercent()}% ({formatSize(f.bytesTransferred)})
                       </span>
                    </div>
                  </td>
                  <td class="py-2 text-right align-middle">
                    <div class="flex items-center justify-end gap-1">
                      <Show when={f.status === "not-started"}>
                        <button class="px-2 py-1 text-xs text-sky-600 hover:bg-sky-50 rounded transition active:scale-95 dark:hover:bg-slate-800" onClick={() => startTransfer(f.id)}>Start</button>
                      </Show>
                      <Show when={f.status === "transferring"}>
                        <button class="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition active:scale-95 dark:hover:bg-slate-800" onClick={() => pauseTransfer(f.id)}>Pause</button>
                        <button class="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded transition active:scale-95 dark:hover:bg-slate-800" onClick={() => cancelTransfer(f.id)}>Cancel</button>
                      </Show>
                      <Show when={f.status === "paused"}>
                         <button class="px-2 py-1 text-xs text-sky-600 hover:bg-sky-50 rounded transition active:scale-95 dark:hover:bg-slate-800" onClick={() => resumeTransfer(f.id)}>Resume</button>
                         <button class="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded transition active:scale-95 dark:hover:bg-slate-800" onClick={() => cancelTransfer(f.id)}>Cancel</button>
                      </Show>
                      <Show when={f.status === "canceled" || f.status === "completed"}>
                         <button class="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition active:scale-95 dark:hover:bg-slate-800 dark:text-slate-400" onClick={() => retryTransfer(f.id)}>Retry</button>
                      </Show>
                    </div>
                  </td>
                </Motion.tr>
              );
            }}
          </For>
        </tbody>
      </table>
    </div>
  );
}
