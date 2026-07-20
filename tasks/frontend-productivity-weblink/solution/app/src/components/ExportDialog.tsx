import { createSignal, Show } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { generateSessionPack } from "../artifacts";

export default function ExportDialog() {
  const [open, setOpen] = createSignal(false);
  const [copied, setCopied] = createSignal(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateSessionPack());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generateSessionPack()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weblink-session-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <Dialog.Trigger class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:hover:bg-slate-800">
        Export Session
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content class="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 outline-none">
            <div class="flex items-center justify-between mb-4">
              <Dialog.Title class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Export Session Pack
              </Dialog.Title>
              <Dialog.CloseButton class="rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                   <path d="M18 6l-12 12"></path>
                   <path d="M6 6l12 12"></path>
                </svg>
                <span class="sr-only">Close</span>
              </Dialog.CloseButton>
            </div>

            <Dialog.Description class="text-sm text-slate-500 dark:text-slate-400 mb-4">
              A Session Pack contains your identity, room, chat messages, file queue (including order and partial progress), and transfer log.
            </Dialog.Description>

            <div class="flex-1 overflow-y-auto mb-6 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 p-4">
               <pre class="text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap break-words">
                 {open() ? generateSessionPack() : ""}
               </pre>
            </div>

            <div class="flex justify-end gap-3 mt-auto">
               <button onClick={handleCopy} class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:hover:bg-slate-800">
                 {copied() ? "Copied!" : "Copy to Clipboard"}
               </button>
               <button onClick={handleDownload} class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 active:scale-95">
                 Download JSON
               </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}
