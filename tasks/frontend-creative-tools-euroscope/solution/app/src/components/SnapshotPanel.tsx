import { For, Show, createSignal } from "solid-js";
import { css } from "../data/colour";
import { SWATCH_LABELS } from "../data/themes";
import {
  deleteSnapshot,
  restoreSnapshot,
  saveSnapshot,
  setCompareView,
  state,
  toggleCompare,
} from "../store";
import Button from "./Button";
import Segmented from "./Segmented";
import { SnapshotIcon, Trash } from "./Icon";

// Palette snapshots with before/after compare. A snapshot row carries the
// Palette snapshot payload (name + the same six camelCase colour keys as the
// recipe) and can be restored, compared, or deleted.

export default function SnapshotPanel() {
  const [name, setName] = createSignal("");
  const [error, setError] = createSignal("");

  const save = () => {
    const result = saveSnapshot(name());
    if (!result.ok) {
      setError(result.error ?? "Snapshot name must not be empty.");
      return;
    }
    setError("");
    setName("");
  };

  return (
    <div class="flex flex-col gap-2.5 rounded-lg border border-scope-bg3 bg-white p-4">
      <h2 class="text-base font-medium text-scope-fg1">Palette snapshots</h2>

      <div class="flex gap-2">
        <input
          value={name()}
          onInput={(e) => {
            setName(e.currentTarget.value);
            if (error()) setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
          aria-label="Snapshot name"
          aria-invalid={error() ? true : undefined}
          placeholder="Snapshot name, e.g. Night ops"
          class="h-11 w-full rounded-md border-2 border-scope-bg2 bg-scope-bg2 px-2.5 text-sm text-scope-fg1 transition-colors duration-100 hover:border-scope-bg3 focus:border-scope-accent focus:outline-none"
        />
        <Button variant="ghost" class="shrink-0" onClick={save}>
          <SnapshotIcon />
          <span>Save snapshot</span>
        </Button>
      </div>
      <Show when={error()}>
        <p role="status" class="text-xs font-medium text-red-600">
          {error()}
        </p>
      </Show>

      <Show
        when={state.snapshots.length > 0}
        fallback={
          <p class="text-xs text-scope-fg2">
            No saved snapshots yet. Save one to compare a before/after edit.
          </p>
        }
      >
        <ul class="flex flex-col gap-1.5">
          <For each={state.snapshots}>
            {(snap) => {
              const comparing = () => state.compare?.id === snap.id;
              return (
                <li class="flex flex-wrap items-center gap-2 rounded-md border border-scope-bg3 bg-scope-bg2/40 px-2.5 py-2 transition-colors duration-100 hover:bg-scope-bg2/70">
                  <span class="min-w-0 grow truncate text-sm font-medium text-scope-fg1">
                    {snap.name}
                  </span>
                  <span class="flex shrink-0 gap-0.5" aria-hidden="true">
                    <For each={snap.colours}>
                      {(c, i) => (
                        <span
                          class="h-4 w-4 rounded-sm border border-black/10"
                          style={{ background: css(c) }}
                          title={`${SWATCH_LABELS[i()]} ${css(c)}`}
                        />
                      )}
                    </For>
                  </span>
                  <Show when={comparing()}>
                    <Segmented
                      small
                      label={`Compare ${snap.name}`}
                      value={state.compare?.view ?? "before"}
                      options={[
                        { value: "before", label: "Before" },
                        { value: "after", label: "After" },
                      ]}
                      onChange={(v) => setCompareView(v)}
                    />
                  </Show>
                  <Button small variant="ghost" onClick={() => restoreSnapshot(snap.id)}>
                    Restore
                  </Button>
                  <Button
                    small
                    variant="ghost"
                    aria-pressed={comparing()}
                    onClick={() => toggleCompare(snap.id)}
                  >
                    {comparing() ? "End compare" : "Compare"}
                  </Button>
                  <Button
                    small
                    variant="ghost"
                    aria-label={`Delete snapshot ${snap.name}`}
                    onClick={() => deleteSnapshot(snap.id)}
                  >
                    <Trash size={14} />
                  </Button>
                </li>
              );
            }}
          </For>
        </ul>
      </Show>
    </div>
  );
}
