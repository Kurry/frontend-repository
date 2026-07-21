import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { STEPS, goToStep, selectTheme } from "../store";
import { THEME_ORDER, type ThemeName } from "../data/themes";
import { Search } from "./Icon";

type Result = {
  kind: "Stage" | "Theme";
  label: string;
  hint: string;
  run: () => void;
};

const ALL_RESULTS: Result[] = [
  ...STEPS.map((label, i) => ({
    kind: "Stage" as const,
    label,
    hint: `Stage ${i + 1}`,
    run: () => goToStep(i),
  })),
  ...THEME_ORDER.map((name) => ({
    kind: "Theme" as const,
    label: `Theme ${name}`,
    hint: "Apply palette",
    run: () => selectTheme(name as ThemeName),
  })),
];

// Modal command palette (Ctrl+K / Cmd+K): dialog semantics with aria-modal,
// focus trapped while open, Escape closes, focus returns to the opener.

export default function CommandPalette(props: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = createSignal("");
  const [highlight, setHighlight] = createSignal(0);
  const [rendered, setRendered] = createSignal(false);
  const [closing, setClosing] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;
  let dialogEl: HTMLDivElement | undefined;

  const results = () => {
    const q = query().trim().toLowerCase();
    if (!q) return ALL_RESULTS;
    return ALL_RESULTS.filter((r) => r.label.toLowerCase().includes(q));
  };

  createEffect(() => {
    if (props.open) {
      setQuery("");
      setHighlight(0);
      setClosing(false);
      setRendered(true);
      queueMicrotask(() => inputRef?.focus());
    } else if (rendered()) {
      setClosing(true);
      const t = setTimeout(() => {
        setRendered(false);
        setClosing(false);
      }, 180);
      onCleanup(() => clearTimeout(t));
    }
  });

  const activate = (r: Result) => {
    r.run();
    props.onClose();
  };

  const onDialogKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      props.onClose();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = results().length;
      if (!n) return;
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setHighlight((h) => (h + delta + n) % n);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const r = results()[highlight()];
      if (r) activate(r);
      return;
    }
    if (e.key === "Tab") {
      // keep focus inside the dialog
      e.preventDefault();
      const focusables: HTMLElement[] = [
        inputRef,
        ...(dialogEl?.querySelectorAll<HTMLElement>("button[data-result]") ?? []),
      ].filter(Boolean) as HTMLElement[];
      if (!focusables.length) return;
      const idx = focusables.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey
        ? (idx - 1 + focusables.length) % focusables.length
        : (idx + 1) % focusables.length;
      focusables[next].focus();
    }
  };

  return (
    <Show when={rendered()}>
      <div
        classList={{
          "fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[16vh] transition-opacity duration-150":
            true,
          "opacity-0": closing(),
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) props.onClose();
        }}
      >
        <div
          ref={dialogEl}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onKeyDown={onDialogKeyDown}
          classList={{
            "w-full max-w-[440px] overflow-hidden rounded-lg border border-scope-bg3 bg-white shadow-xl":
              true,
            "palette-closing": closing(),
            "palette-opening": !closing(),
          }}
        >
          <div class="flex items-center gap-2 border-b border-scope-bg3 px-3">
            <span class="text-scope-fg2">
              <Search size={16} />
            </span>
            <input
              ref={inputRef}
              value={query()}
              onInput={(e) => {
                setQuery(e.currentTarget.value);
                setHighlight(0);
              }}
              aria-label="Search stages and themes"
              placeholder="Type to search stages and themes…"
              class="h-11 w-full bg-transparent text-sm text-scope-fg1 placeholder:text-scope-fg3 focus:outline-none"
            />
            <kbd class="shrink-0 rounded border border-scope-bg3 bg-scope-bg2 px-1.5 py-0.5 text-[10px] text-scope-fg2">
              esc
            </kbd>
          </div>
          <ul class="max-h-[280px] overflow-y-auto p-1.5" aria-label="Results">
            <Show
              when={results().length > 0}
              fallback={
                <li class="px-3 py-6 text-center text-sm text-scope-fg2">
                  No stage or theme matched{" "}
                  <span class="font-medium text-scope-fg1">“{query()}”</span>.
                </li>
              }
            >
              <For each={results()}>
                {(r, i) => (
                  <li>
                    <button
                      type="button"
                      data-result
                      onMouseEnter={() => setHighlight(i())}
                      onFocus={() => setHighlight(i())}
                      onClick={() => activate(r)}
                      classList={{
                        "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors duration-100 focus:outline-none":
                          true,
                        "bg-scope-accent text-white": highlight() === i(),
                        "text-scope-fg1": highlight() !== i(),
                      }}
                    >
                      <span
                        classList={{
                          "w-14 shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide":
                            true,
                          "bg-white/20 text-white": highlight() === i(),
                          "bg-scope-bg2 text-scope-fg2": highlight() !== i(),
                        }}
                      >
                        {r.kind}
                      </span>
                      <span class="min-w-0 grow truncate">{r.label}</span>
                      <span
                        classList={{
                          "shrink-0 text-[10px]": true,
                          "text-white/70": highlight() === i(),
                          "text-scope-fg3": highlight() !== i(),
                        }}
                      >
                        {r.hint}
                      </span>
                    </button>
                  </li>
                )}
              </For>
            </Show>
          </ul>
          <div class="border-t border-scope-bg3 bg-scope-bg2/60 px-3 py-1.5 text-[10px] text-scope-fg2">
            ↑↓ to navigate · Enter to activate · Esc to close
          </div>
        </div>
      </div>
    </Show>
  );
}
