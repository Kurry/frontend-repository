import { createSignal, Show } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { setState, persist, cancelPendingJoin, clearAllTransferIntervals } from "../store";
import { SessionPackSchema } from "../schemas";

export default function ImportDialog() {
  const [open, setOpen] = createSignal(false);
  const [jsonText, setJsonText] = createSignal("");
  const [errorMsg, setErrorMsg] = createSignal("");

  const handleImport = () => {
    setErrorMsg("");
    try {
      const parsed = JSON.parse(jsonText());
      const result = SessionPackSchema.safeParse(parsed);

      if (!result.success) {
        // Find the first descriptive error
        const firstErr = result.error.errors[0];
        const path = firstErr.path.join(".");
        setErrorMsg(`Validation failed at ${path || "root"}: ${firstErr.message}`);
        return;
      }

      const pack = result.data;

      // Additional checks matching constraints
      if (pack.fileQueue.some(f => f.status === "transferring")) {
         setErrorMsg("Validation failed: fileQueue status cannot be 'transferring'");
         return;
      }
      if (pack.fileQueue.some(f => f.bytesTransferred > f.sizeBytes)) {
         setErrorMsg("Validation failed: bytesTransferred cannot exceed sizeBytes");
         return;
      }

      // Apply to store
      setState("identity", "name", pack.peer.displayName);
      setState("identity", "clientId", pack.peer.clientId);
      setState("room", "roomId", pack.roomId);
      setState("ui", "theme", pack.theme);

      // Normalize messages to the state shape
      const mappedMessages = pack.messages.map(m => ({
        id: m.id,
        text: m.text,
        from: (m.role === "demo" ? "demo" : "you") as "demo" | "you",
        at: new Date(m.createdAt).getTime(),
      }));
      setState("chat", "messages", mappedMessages);

      // Normalize file queue rows to the store shape (sizeBytes -> size)
      const mappedQueue = pack.fileQueue.map(f => ({
        id: f.id,
        name: f.name,
        size: f.sizeBytes,
        status: f.status,
        bytesTransferred: f.bytesTransferred,
      }));
      // Stop any timers still ticking for the outgoing queue before it's
      // replaced: a stale interval that resolves by id against the new
      // queue could otherwise double-advance bytesTransferred once a
      // matching row is resumed.
      clearAllTransferIntervals();
      setState("files", "queue", mappedQueue);
      setState("transferLog", pack.transferLog);

      // Connection badge resets to idle; cancel any pending join attempt so
      // its timer cannot flip the badge back to "waiting" after import.
      cancelPendingJoin();
      setState("room", "status", "idle");

      persist();
      setOpen(false);
      setJsonText("");
    } catch (err) {
      setErrorMsg("Failed to parse JSON.");
    }
  };

  return (
    <Dialog open={open()} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setJsonText(""); setErrorMsg(""); } }}>
      <Dialog.Trigger class="touch-target rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:hover:bg-slate-800">
        Import Session
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" />
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content class="w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 outline-none">
            <div class="flex items-center justify-between mb-4">
              <Dialog.Title class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Import Session Pack
              </Dialog.Title>
              <Dialog.CloseButton class="rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                   <path d="M18 6l-12 12"></path>
                   <path d="M6 6l12 12"></path>
                </svg>
                <span class="sr-only">Close</span>
              </Dialog.CloseButton>
            </div>

            <Dialog.Description class="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Paste a Session Pack JSON to restore identity, chat history, file queue, and transfer logs. This will replace your current session state.
            </Dialog.Description>

            <label for="import-json" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Session Pack JSON
            </label>
            <textarea
              id="import-json"
              class="w-full flex-1 min-h-[200px] mb-2 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300 focus-visible:outline-none dark:border-slate-700 dark:focus:ring-sky-800 resize-none"
              placeholder="Paste JSON here..."
              value={jsonText()}
              onInput={(e) => setJsonText(e.currentTarget.value)}
            />

            <Show when={errorMsg()}>
               <p class="mb-4 text-xs text-rose-500" role="alert">{errorMsg()}</p>
            </Show>

            <div class="flex justify-end mt-auto pt-2">
               <button onClick={handleImport} disabled={!jsonText().trim()} class="touch-target rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:opacity-50 disabled:cursor-not-allowed">
                 Apply Import
               </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}
