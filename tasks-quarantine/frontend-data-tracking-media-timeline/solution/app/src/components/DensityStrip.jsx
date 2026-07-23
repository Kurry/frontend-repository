import { For } from "solid-js";
import { CATEGORIES, density } from "../store";

export default function DensityStrip(props) {
  return (
    <div class={props.class || "flex flex-wrap gap-1.5"} role="group" aria-label="Category density of events in view">
      <For each={CATEGORIES}>
        {(c) => {
          const on = () => (props.enabled ? props.enabled().includes(c.id) : true);
          return (
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border transition-opacity"
              style={{
                "border-color": c.color + "55",
                "background-color": on() ? c.color + "1a" : "transparent",
                opacity: on() ? "1" : "0.4",
              }}
              title={`${c.id}: ${density()[c.id] || 0} in view`}
            >
              <span class="w-2 h-2 rounded-full" style={{ background: c.color }} />
              <span class="text-[color:var(--ink-soft)]">{c.id}</span>
              <span class="font-display tabular-nums" style={{ color: c.color }}>
                {density()[c.id] || 0}
              </span>
            </span>
          );
        }}
      </For>
    </div>
  );
}
