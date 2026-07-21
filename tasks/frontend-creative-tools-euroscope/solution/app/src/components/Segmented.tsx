import { For } from "solid-js";

// Segmented choice control with a visible active selection (used for the
// colour-blindness simulation and the Before / After compare toggle).

export default function Segmented<T extends string>(props: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  small?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={props.label}
      class="inline-flex overflow-hidden rounded-md border-2 border-scope-bg3 bg-scope-bg2"
    >
      <For each={props.options}>
        {(opt) => (
          <button
            type="button"
            aria-pressed={props.value === opt.value}
            onClick={() => props.onChange(opt.value)}
            classList={{
              "cursor-pointer font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-scope-accent":
                true,
              [props.small ? "px-2.5 py-1 text-xs" : "px-3 py-2 text-sm"]: true,
              "bg-scope-accent text-white": props.value === opt.value,
              "text-scope-fg2 hover:bg-white hover:text-scope-fg1":
                props.value !== opt.value,
            }}
          >
            {opt.label}
          </button>
        )}
      </For>
    </div>
  );
}
