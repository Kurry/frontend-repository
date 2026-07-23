import { For, createEffect, createSignal, untrack } from "solid-js";
import Alert from "../components/Alert";
import Button from "../components/Button";
import ContrastMatrix from "../components/ContrastMatrix";
import Segmented from "../components/Segmented";
import SnapshotPanel from "../components/SnapshotPanel";
import { ArrowLeft, ArrowRight, Dropdown, Reset } from "../components/Icon";
import {
  COLOUR_BLINDNESS_LABELS,
  HEX_RE,
  css,
  hexToInt,
  type ColourBlindness,
} from "../data/colour";
import { SWATCH_LABELS, THEME_ORDER, type ThemeName } from "../data/themes";
import {
  goBack,
  goNext,
  resetToBase,
  selectTheme,
  setColourBlindness,
  setSwatch,
  setHexError,
  state,
} from "../store";
import PreviewPane from "./PreviewPane";

// One swatch row: colour picker + hex text field. Invalid hex keeps the
// Preview on its last valid colour and shows an inline message naming the
// swatch until the value is corrected.
function SwatchRow(props: { index: number }) {
  const label = () => SWATCH_LABELS[props.index];
  const value = () => state.swatches[props.index];
  const [draft, setDraft] = createSignal(css(value()));
  const [error, setError] = createSignal(false);

  // Follow external changes (base theme select, Undo/Redo, import) while the
  // user is not mid-typo.
  createEffect(() => {
    const v = value();
    untrack(() => {
      if (HEX_RE.test(draft()) && hexToInt(draft()) === v) return;
      setDraft(css(v));
      if (error()) {
        setHexError(false);
      }
      setError(false);
    });
  });

  const onInput = (text: string) => {
    setDraft(text);
    if (HEX_RE.test(text)) {
      if (error()) {
        setHexError(false);
      }
      setError(false);
      setSwatch(props.index, hexToInt(text));
    } else {
      if (!error()) {
        setHexError(true);
      }
      setError(true);
    }
  };

  return (
    <div class="flex flex-col rounded-md px-1 py-1 transition-colors duration-100 hover:bg-scope-bg3/50">
      <div class="flex items-center gap-3">
        <input
          type="color"
          id={`swatch-picker-${props.index}`}
          aria-label={`${label()} colour picker`}
          class="h-10 w-12 shrink-0 cursor-pointer rounded border border-scope-bg3 bg-transparent p-0.5"
          value={css(value())}
          onInput={(e) => onInput(e.currentTarget.value)}
        />
        <label
          for={`swatch-hex-${props.index}`}
          class="grow cursor-default text-sm text-scope-fg1"
        >
          {label()}
        </label>
        <input
          id={`swatch-hex-${props.index}`}
          type="text"
          inputmode="text"
          spellcheck={false}
          aria-label={`${label()} hex value`}
          aria-invalid={error() ? true : undefined}
          value={draft()}
          onInput={(e) => onInput(e.currentTarget.value)}
          classList={{
            "h-9 w-[92px] shrink-0 rounded-md border-2 bg-white px-2 font-mono text-xs uppercase transition-colors duration-100 focus:outline-none":
              true,
            "border-red-400 focus:border-red-500": error(),
            "border-scope-bg2 hover:border-scope-bg3 focus:border-scope-accent": !error(),
          }}
        />
      </div>
      {error() && (
        <p role="status" aria-live="polite" class="px-1 pt-1 text-xs font-medium text-red-600">
          {label()} needs a #RRGGBB hex value, e.g. #0b4136. The preview keeps the
          last valid colour until this is corrected.
        </p>
      )}
    </div>
  );
}

export default function StepColours() {
  return (
    <>
      <div class="rounded-lg border border-scope-bg3 bg-white p-4">
        <p class="text-sm leading-relaxed">Pick new colours for your scope.</p>
      </div>

      <Alert type="info">
        <p>
          You cannot change the colour of primary text and icons; this stays
          white.
        </p>
      </Alert>

      <div class="flex flex-col gap-2.5 rounded-lg border border-scope-bg3 bg-white p-4">
        <h2 class="text-base font-medium text-scope-fg1">Base theme</h2>
        <div class="flex flex-wrap items-center gap-2">
          <span class="relative inline-flex">
            <select
              aria-label="Base theme"
              class="h-[46px] w-[180px] cursor-pointer appearance-none rounded-md border-2 border-scope-bg2 bg-scope-bg2 pl-3 pr-9 text-sm font-medium text-scope-fg1 transition-[border-color,box-shadow] duration-150 hover:border-scope-bg3 hover:shadow-sm focus:border-scope-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-scope-accent focus-visible:ring-offset-1"
              value={state.baseTheme}
              onChange={(e) => selectTheme(e.currentTarget.value as ThemeName)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                e.preventDefault();
                const current = THEME_ORDER.indexOf(state.baseTheme);
                const next = Math.max(
                  0,
                  Math.min(THEME_ORDER.length - 1, current + (e.key === "ArrowDown" ? 1 : -1)),
                );
                if (next !== current) selectTheme(THEME_ORDER[next]);
              }}
            >
              <For each={THEME_ORDER}>{(t) => <option value={t}>{t}</option>}</For>
            </select>
            <span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-scope-fg2">
              <Dropdown size={16} />
            </span>
          </span>
          <Button variant="ghost" onClick={() => resetToBase()}>
            <Reset />
            <span>Reset to base</span>
          </Button>
        </div>
        <p class="text-xs text-scope-fg2">
          Selecting a base theme replaces all six working colours with that
          palette. Reset to base restores them after custom edits.
        </p>
      </div>

      <div class="flex flex-col gap-1.5 rounded-lg border border-scope-bg3 bg-white p-4">
        <h2 class="text-base font-medium text-scope-fg1">Customise</h2>
        <For each={state.swatches}>
          {(_value, i) => <SwatchRow index={i()} />}
        </For>
      </div>

      <div class="flex flex-col gap-2.5 rounded-lg border border-scope-bg3 bg-white p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-base font-medium text-scope-fg1">Preview</h2>
          <Segmented<ColourBlindness>
            label="Colour blindness simulation"
            value={state.colourBlindness}
            options={(
              ["none", "protanopia", "deuteranopia"] as ColourBlindness[]
            ).map((v) => ({ value: v, label: COLOUR_BLINDNESS_LABELS[v] }))}
            onChange={(v) => setColourBlindness(v)}
          />
        </div>
        <PreviewPane />
        <p class="text-xs text-scope-fg2" aria-live="polite">
          {state.colourBlindness === "none"
            ? "Simulation off — panels render the working colours as-is."
            : `${COLOUR_BLINDNESS_LABELS[state.colourBlindness]} simulation shifts only the rendered preview colours; the hex values above stay unchanged.`}
        </p>
      </div>

      <ContrastMatrix />

      <SnapshotPanel />

      <div class="flex justify-between">
        <Button variant="ghost" class="w-[110px]" onClick={() => goBack()}>
          <ArrowLeft />
          <span>Back</span>
        </Button>
        <Button variant="primary" class="w-[110px]" onClick={() => goNext()}>
          <span>Continue</span>
          <ArrowRight />
        </Button>
      </div>
    </>
  );
}
