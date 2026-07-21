import { createForm } from "@tanstack/solid-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { For, Show, createMemo, createEffect, on } from "solid-js";
import { Motion } from "@motionone/solid";
import { state, sendMessage } from "../store";
import { ChatMessageSchema } from "../schemas";
import { usePrefersReducedMotion } from "../reducedMotion";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPanel() {
  const reducedMotion = usePrefersReducedMotion();
  const sessionActive = createMemo(
    () => state.room.status === "connecting" || state.room.status === "waiting"
  );
  const chatDisabled = createMemo(() => !sessionActive());

  const form = createForm(() => ({
    defaultValues: {
      text: "",
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      if (chatDisabled()) return;
      sendMessage(value.text);
      form.reset();
    },
  }));

  let messageListRef: HTMLDivElement | undefined;

  createEffect(on(() => state.chat.messages.length, () => {
    if (messageListRef) {
       messageListRef.scrollTop = messageListRef.scrollHeight;
    }
  }));

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      form.handleSubmit();
    }
  };

  return (
    <section
      class="flex min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-800/60"
      data-testid="chat-panel"
    >
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Chat (local / loopback demo)
      </h2>
      <div
        class="mb-3 flex-1 space-y-3 overflow-y-auto pr-2"
        data-testid="chat-messages"
        ref={messageListRef}
      >
        <For each={state.chat.messages}>
          {(m) => (
            <Motion.div
               initial={reducedMotion() ? false : { opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               class={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}
            >
              <div
                class={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-colors ${
                  m.from === "you"
                    ? "bg-sky-700 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 rounded-bl-sm"
                }`}
              >
                <p class="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                <div class="mt-1 flex items-center justify-between gap-3 text-[10px] opacity-60">
                  <span class="font-medium uppercase tracking-wider">{m.from === "demo" ? "Local / Demo" : "You"}</span>
                  <span>{formatTime(m.at)}</span>
                </div>
              </div>
            </Motion.div>
          )}
        </For>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        class="flex flex-col gap-2"
      >
        <form.Field
          name="text"
          validators={{ onSubmit: ChatMessageSchema.shape.text }}
        >
          {(field) => (
            <div class="relative flex gap-2 items-start">
               <div class="flex-1 flex flex-col">
                  <label class="sr-only" for="chat-input">Message text</label>
                  <textarea
                    id="chat-input"
                    class="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 disabled:opacity-50 dark:border-slate-700 dark:focus:ring-sky-900 resize-none"
                    placeholder={
                      chatDisabled()
                        ? "Join a room to start chatting (local demo)"
                        : "Ctrl + Enter or Shift + Enter to send..."
                    }
                    rows={2}
                    value={field().state.value}
                    onInput={(e) => field().handleChange(e.target.value)}
                    onBlur={field().handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={chatDisabled()}
                    data-testid="chat-input"
                  />
                  <Show when={field().state.meta.errors.length > 0}>
                    <Motion.p
                      initial={reducedMotion() ? false : { opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      class="mt-1 text-xs text-rose-500"
                      role="alert"
                    >
                      {field().state.meta.errors[0]?.toString()}
                    </Motion.p>
                  </Show>
               </div>
              <button
                type="submit"
                class="touch-target rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50 h-[52px]"
                disabled={chatDisabled() || !form.state.values.text.trim()}
                data-testid="chat-send-button"
              >
                Send
              </button>
            </div>
          )}
        </form.Field>
      </form>
      <Show when={chatDisabled()}>
        <p class="mt-2 text-xs text-slate-600 dark:text-slate-400" data-testid="chat-disabled-note">
          Sending is disabled while disconnected — no peer session is active.
        </p>
      </Show>
    </section>
  );
}
