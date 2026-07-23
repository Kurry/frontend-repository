import { For, Show } from "solid-js";
import { STEPS } from "../store";
import { Check } from "./Icon";

// Four-stage progress bar: completed stages show a check mark, the active
// stage carries its full label plus aria-current="step", upcoming stages show
// a muted number — so the current step reaches assistive tech, not just colour.

export default function Progress(props: { current: number }) {
  return (
    <ol
      class="flex items-center gap-2 overflow-hidden rounded-lg bg-scope-bg2/50 p-2.5"
      aria-label={`Patching wizard progress — step ${props.current + 1} of ${STEPS.length}: ${STEPS[props.current]}`}
    >
      <For each={STEPS}>
        {(stage, index) => {
          const complete = () => index() < props.current;
          const active = () => index() === props.current;
          return (
            <li
              aria-current={active() ? "step" : undefined}
              class="flex min-w-0 items-center gap-2"
            >
              <div
                classList={{
                  "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300":
                    true,
                  "bg-scope-accent text-white": active(),
                  "bg-scope-accent2 text-white": complete(),
                  "bg-scope-bg3 text-scope-fg2": !active() && !complete(),
                }}
              >
                <Show when={complete()} fallback={<span>{index() + 1}</span>}>
                  <Check size={14} />
                  <span class="sr-only">done</span>
                </Show>
              </div>

              <Show
                when={active()}
                fallback={
                  <div
                    classList={{
                      "h-px w-5 shrink-0 bg-scope-bg3": true,
                      hidden: index() === STEPS.length - 1,
                    }}
                  />
                }
              >
                <div class="flex min-w-0 grow items-center gap-2">
                  <h1 class="truncate text-base font-semibold text-scope-accent">
                    {stage}
                  </h1>
                  <div class="h-px grow bg-scope-bg3" />
                </div>
              </Show>
            </li>
          );
        }}
      </For>
    </ol>
  );
}
