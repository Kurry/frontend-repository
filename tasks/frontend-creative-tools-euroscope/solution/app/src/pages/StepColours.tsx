import { For } from "solid-js";
import Alert from "../components/Alert";
import Button from "../components/Button";
import { ArrowLeft, ArrowRight } from "../components/Icon";
import {
  SWATCH_LABELS,
  THEME_ORDER,
  css,
  hexToInt,
  type ThemeName,
} from "../data/themes";
import { goBack, goNext, selectTheme, setSwatch, state } from "../store";
import PreviewPane from "./PreviewPane";

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
        <select
          aria-label="Base theme"
          class="h-[28px] w-[160px] cursor-pointer rounded-md border-2 border-scope-bg2 bg-scope-bg2 px-2 text-sm hover:border-scope-bg3 focus:border-scope-accent focus:outline-none"
          value={state.baseTheme}
          onInput={(e) => selectTheme(e.currentTarget.value as ThemeName)}
        >
          <For each={THEME_ORDER}>{(t) => <option value={t}>{t}</option>}</For>
        </select>
      </div>

      <div class="flex flex-col gap-2.5 rounded-lg border border-scope-bg3 bg-white p-4">
        <h2 class="text-base font-medium text-scope-fg1">Customise</h2>
        <For each={state.swatches}>
          {(value, i) => (
            <label class="flex items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-scope-bg2/60">
              <input
                type="color"
                aria-label={SWATCH_LABELS[i()]}
                class="h-7 w-9 shrink-0 cursor-pointer rounded border border-scope-bg3 bg-transparent"
                value={css(value)}
                onInput={(e) => setSwatch(i(), hexToInt(e.currentTarget.value))}
              />
              <span class="grow text-sm text-scope-fg1">{SWATCH_LABELS[i()]}</span>
              <span class="font-mono text-xs uppercase text-scope-fg2">
                {css(value)}
              </span>
            </label>
          )}
        </For>
      </div>

      <div class="flex flex-col gap-2.5 rounded-lg border border-scope-bg3 bg-white p-4">
        <h2 class="text-base font-medium text-scope-fg1">Preview</h2>
        <PreviewPane />
      </div>

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
