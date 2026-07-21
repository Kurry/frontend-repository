import { Match, Switch, createSignal, onCleanup, onMount } from "solid-js";
import Button from "./components/Button";
import CommandPalette from "./components/CommandPalette";
import Progress from "./components/Progress";
import { RedoIcon, Search, UndoIcon } from "./components/Icon";
import StepBitmaps from "./pages/StepBitmaps";
import StepColours from "./pages/StepColours";
import StepDownload from "./pages/StepDownload";
import StepUpload from "./pages/StepUpload";
import { redo, state, undo } from "./store";

export default function App() {
  const [paletteOpen, setPaletteOpen] = createSignal(false);
  let openerRef: HTMLButtonElement | undefined;
  let restoreFocus: HTMLElement | null = null;

  const openPalette = () => {
    const active = document.activeElement as HTMLElement | null;
    restoreFocus = active && active !== document.body ? active : openerRef ?? null;
    setPaletteOpen(true);
  };
  const closePalette = () => {
    setPaletteOpen(false);
    (restoreFocus ?? openerRef)?.focus?.();
  };

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (paletteOpen()) closePalette();
        else openPalette();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        const target = e.target as HTMLElement | null;
        if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  return (
    <div class="relative min-h-screen">
      {/* soft radial accent wash behind the content */}
      <div
        aria-hidden="true"
        class="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 0%, rgba(37,99,235,0.08), transparent 70%)",
        }}
      />
      <div class="relative mx-auto flex w-full max-w-[600px] flex-col gap-5 px-4 py-8">
        <header class="flex items-center gap-2">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-md bg-scope-accent text-sm font-semibold text-white"
            role="img"
            aria-label="EuroScope badge"
          >
            ES
          </div>
          <span class="text-base font-semibold text-scope-fg1">
            Custom EuroScope
          </span>
          <span class="ml-auto text-xs text-scope-fg2">
            theme &amp; icon patcher
          </span>
        </header>

        <Progress current={state.step} />

        <div class="flex items-center gap-2">
          <Button
            small
            variant="ghost"
            onClick={() => undo()}
            disabled={state.undoDepth === 0}
            aria-label="Undo"
          >
            <UndoIcon size={14} />
            <span>Undo</span>
          </Button>
          <Button
            small
            variant="ghost"
            onClick={() => redo()}
            disabled={state.redoDepth === 0}
            aria-label="Redo"
          >
            <RedoIcon size={14} />
            <span>Redo</span>
          </Button>
          <span class="grow" />
          <Button
            small
            variant="ghost"
            ref={openerRef}
            aria-haspopup="dialog"
            aria-expanded={paletteOpen()}
            onClick={() => (paletteOpen() ? closePalette() : openPalette())}
          >
            <Search size={14} />
            <span>Commands</span>
            <kbd class="rounded border border-scope-bg3 bg-white px-1 text-[10px] text-scope-fg2">
              Ctrl K
            </kbd>
          </Button>
        </div>

        <div class="flex flex-col gap-5">
          <Switch>
            <Match when={state.step === 0}>
              <div class="step-in flex flex-col gap-5">
                <StepUpload />
              </div>
            </Match>
            <Match when={state.step === 1}>
              <div class="step-in flex flex-col gap-5">
                <StepColours />
              </div>
            </Match>
            <Match when={state.step === 2}>
              <div class="step-in flex flex-col gap-5">
                <StepBitmaps />
              </div>
            </Match>
            <Match when={state.step === 3}>
              <div class="step-in flex flex-col gap-5">
                <StepDownload />
              </div>
            </Match>
          </Switch>
        </div>
      </div>

      <CommandPalette open={paletteOpen()} onClose={closePalette} />
    </div>
  );
}
