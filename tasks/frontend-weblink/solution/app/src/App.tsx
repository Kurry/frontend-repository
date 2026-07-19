import { For, Show, createSignal, createMemo } from "solid-js";
import { state, setState, joinRoom, leaveRoom, sendMessage, queueFile, setName, toggleTheme, persist } from "./store";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABEL: Record<string, string> = {
  idle: "Not connected",
  connecting: "Connecting…",
  waiting: "Waiting for peer…",
  disconnected: "Disconnected",
};

const STATUS_CLASS: Record<string, string> = {
  idle: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  connecting: "bg-amber-200 text-amber-800 dark:bg-amber-500/30 dark:text-amber-300",
  waiting: "bg-sky-200 text-sky-800 dark:bg-sky-500/30 dark:text-sky-300",
  disconnected: "bg-rose-200 text-rose-800 dark:bg-rose-500/30 dark:text-rose-300",
};

export default function App() {
  const [roomInput, setRoomInput] = createSignal(state.room.roomId);
  const [messageInput, setMessageInput] = createSignal("");
  let fileInputRef: HTMLInputElement | undefined;

  const sessionActive = createMemo(
    () => state.room.status === "connecting" || state.room.status === "waiting",
  );
  const chatDisabled = createMemo(() => !sessionActive());

  const handleJoin = (e: Event) => {
    e.preventDefault();
    joinRoom(roomInput());
  };

  const handleSend = (e: Event) => {
    e.preventDefault();
    if (chatDisabled()) return;
    sendMessage(messageInput());
    setMessageInput("");
  };

  const handleFiles = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const files = input.files;
    if (!files) return;
    Array.from(files).forEach((f) => queueFile(f.name, f.size));
    input.value = "";
  };

  return (
    <div
      class="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100"
      data-theme={state.ui.theme}
    >
      <header
        class="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-3
          backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/80"
      >
        <div class="flex items-center gap-3">
          <span class="text-lg font-semibold tracking-tight">Weblink</span>
          <span class="text-xs text-slate-400">peer-to-peer chat &amp; file transfer</span>
        </div>
        <button
          type="button"
          data-testid="theme-toggle"
          class="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium transition
            hover:bg-slate-100 hover:shadow-sm active:scale-95 dark:border-slate-700 dark:hover:bg-slate-800"
          onClick={toggleTheme}
        >
          {state.ui.theme === "light" ? "Dark mode" : "Light mode"}
        </button>
      </header>

      <main class="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 md:grid-cols-[280px_1fr_280px]">
        {/* Session / identity panel */}
        <section
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors
            dark:border-slate-800 dark:bg-slate-800/60"
          data-testid="session-panel"
        >
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Session
          </h2>

          <div class="mb-4">
            <label class="mb-1 block text-xs font-medium text-slate-500" for="peer-name">
              Your name
            </label>
            <input
              id="peer-name"
              class="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-sm
                transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700
                dark:focus:ring-sky-900"
              value={state.identity.name}
              onInput={(e) => setName(e.currentTarget.value)}
              data-testid="peer-name-input"
            />
          </div>

          <div class="mb-4">
            <label class="mb-1 block text-xs font-medium text-slate-500">Client ID</label>
            <div
              class="truncate rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3
                py-1.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40"
              data-testid="client-id"
            >
              {state.identity.clientId}
            </div>
          </div>

          <form onSubmit={handleJoin} class="mb-3">
            <label class="mb-1 block text-xs font-medium text-slate-500" for="room-id">
              Room / peer identifier
            </label>
            <input
              id="room-id"
              class="mb-2 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-1.5
                text-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200
                dark:border-slate-700 dark:focus:ring-sky-900"
              placeholder="e.g. sunset-otter-42"
              value={roomInput()}
              onInput={(e) => setRoomInput(e.currentTarget.value)}
              data-testid="room-id-input"
            />
            <div class="flex gap-2">
              <button
                type="submit"
                class="flex-1 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white
                  transition hover:bg-sky-500 hover:shadow active:scale-95 disabled:cursor-not-allowed
                  disabled:opacity-50"
                disabled={!roomInput().trim() || sessionActive()}
                data-testid="join-room-button"
              >
                Join Room
              </button>
              <button
                type="button"
                class="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium
                  transition hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed
                  disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                disabled={state.room.status === "idle" || state.room.status === "disconnected"}
                onClick={leaveRoom}
                data-testid="leave-room-button"
              >
                Leave Room
              </button>
            </div>
          </form>

          <div>
            <span class="mb-1 block text-xs font-medium text-slate-500">Connection status</span>
            <span
              class={`inline-block rounded-full px-3 py-1 text-xs font-semibold transition-colors
                duration-300 ${STATUS_CLASS[state.room.status]}`}
              data-testid="connection-badge"
              data-status={state.room.status}
            >
              {STATUS_LABEL[state.room.status]}
            </span>
            <Show when={state.room.status === "waiting"}>
              <p class="mt-2 text-xs text-slate-400">
                Waiting for a peer to join room "{state.room.roomId}". No peer has connected.
              </p>
            </Show>
            <Show when={state.room.status === "disconnected"}>
              <p class="mt-2 text-xs text-slate-400">
                Session left. No peer is connected.
              </p>
            </Show>
          </div>
        </section>

        {/* Chat panel */}
        <section
          class="flex min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white p-4
            shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-800/60"
          data-testid="chat-panel"
        >
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Chat (local / loopback demo)
          </h2>
          <div class="mb-3 flex-1 space-y-2 overflow-y-auto" data-testid="chat-messages">
            <For each={state.chat.messages}>
              {(m) => (
                <div class={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}>
                  <div
                    class={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm transition-colors
                      ${
                        m.from === "you"
                          ? "bg-sky-600 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      }`}
                  >
                    <p>{m.text}</p>
                    <p class="mt-1 text-[10px] opacity-60">{formatTime(m.at)}</p>
                  </div>
                </div>
              )}
            </For>
          </div>
          <form onSubmit={handleSend} class="flex gap-2">
            <input
              class="flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm
                transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 disabled:opacity-50
                dark:border-slate-700 dark:focus:ring-sky-900"
              placeholder={
                chatDisabled()
                  ? "Join a room to start chatting (local demo)"
                  : "Ctrl + Enter or Shift + Enter to send the message"
              }
              value={messageInput()}
              disabled={chatDisabled()}
              onInput={(e) => setMessageInput(e.currentTarget.value)}
              data-testid="chat-input"
            />
            <button
              type="submit"
              class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition
                hover:bg-sky-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={chatDisabled() || !messageInput().trim()}
              data-testid="chat-send-button"
            >
              Send
            </button>
          </form>
          <Show when={chatDisabled()}>
            <p class="mt-1 text-xs text-slate-400" data-testid="chat-disabled-note">
              Sending is disabled while disconnected — no peer session is active.
            </p>
          </Show>
        </section>

        {/* File transfer panel */}
        <section
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors
            dark:border-slate-800 dark:bg-slate-800/60"
          data-testid="file-panel"
        >
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            File transfer
          </h2>
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

          <table class="w-full text-left text-xs" data-testid="file-queue-table">
            <thead>
              <tr class="text-slate-400">
                <th class="pb-1 font-medium">Name</th>
                <th class="pb-1 font-medium">Size</th>
                <th class="pb-1 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <For each={state.files.queue}>
                {(f) => (
                  <tr class="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/40">
                    <td class="max-w-[120px] truncate py-1.5" data-testid="file-queue-name">
                      {f.name}
                    </td>
                    <td class="py-1.5 text-slate-400">{formatSize(f.size)}</td>
                    <td class="py-1.5">
                      <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                        {f.status}
                      </span>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
          <Show when={state.files.queue.length === 0}>
            <p class="mt-2 text-xs text-slate-400" data-testid="file-queue-empty">
              No files queued yet. Choosing a file does not require a connected recipient.
            </p>
          </Show>
        </section>
      </main>
    </div>
  );
}
