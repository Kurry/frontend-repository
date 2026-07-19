import { For, Show } from "solid-js";
import { STEPS } from "../store";

export default function Progress(props: { current: number }) {
  return (
    <div
      class="flex items-center gap-2.5 overflow-hidden p-2.5 rounded-lg bg-scope-bg2/50"
      role="list"
      aria-label="Patcher steps"
    >
      <For each={STEPS}>
        {(stage, index) => {
          const complete = () => index() < props.current;
          const active = () => index() === props.current;
          return (
            <>
              <div
                role="listitem"
                aria-current={active() ? "step" : undefined}
                classList={{
                  "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200":
                    true,
                  "bg-scope-accent text-white": active(),
                  "bg-scope-accent2 text-white": complete(),
                  "bg-scope-bg3 text-scope-fg2": !active() && !complete(),
                }}
              >
                <Show when={complete()} fallback={<span>{index() + 1}</span>}>
                  <span aria-hidden="true">&#10003;</span>
                </Show>
              </div>

              <Show
                when={active()}
                fallback={<div class="h-px w-6 shrink bg-scope-bg3 last:hidden" />}
              >
                <div class="flex min-w-0 grow items-center gap-2.5">
                  <h1 class="truncate text-base font-semibold text-scope-accent">
                    {stage}
                  </h1>
                  <div class="h-px grow bg-scope-bg3 last:hidden" />
                </div>
              </Show>
            </>
          );
        }}
      </For>
    </div>
  );
}
