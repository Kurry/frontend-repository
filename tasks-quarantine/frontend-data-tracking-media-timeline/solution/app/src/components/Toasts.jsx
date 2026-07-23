import { For, createSignal, createEffect } from "solid-js";
import { state } from "../store";
import { IconCheck, IconAlertTriangle, IconInfoCircle, IconX } from "@tabler/icons-solidjs";

export function LiveRegion() {
  const [text, setText] = createSignal("");
  // mirror store toasts into an always-present polite live region
  createEffect(() => {
    const t = state.toasts;
    if (t.length) setText(t[t.length - 1].message);
  });
  return (
    <div aria-live="polite" aria-atomic="true" role="status" class="sr-only">
      {text()}
    </div>
  );
}

export default function Toasts() {
  return (
    <div class="fixed top-4 right-4 z-[120] flex flex-col gap-2 w-[min(92vw,340px)] pointer-events-none" aria-hidden="true">
      <For each={state.toasts}>
        {(t) => (
          <div
            class={`pointer-events-auto flex items-start gap-2 rounded-xl px-3.5 py-2.5 shadow-lg border text-sm ${
              t.leaving ? "anim-toast-out" : "anim-toast-in"
            } ${
              t.kind === "error"
                ? "bg-[#7a1f1f] text-[#ffe9e3] border-[#a33b4a]"
                : "bg-[#1d2a22] text-[#eafff1] border-[#1b6b4a]"
            }`}
            role="presentation"
          >
            <span class="mt-0.5 shrink-0">
              {t.kind === "error" ? <IconAlertTriangle size={18} /> : t.kind === "success" ? <IconCheck size={18} /> : <IconInfoCircle size={18} />}
            </span>
            <span class="flex-1 leading-snug">{t.message}</span>
          </div>
        )}
      </For>
    </div>
  );
}
