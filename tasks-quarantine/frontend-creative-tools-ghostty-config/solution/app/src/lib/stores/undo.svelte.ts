// Undo/redo for setting mutations.
//
// The whole config is checkpointed: any burst of mutations (a slider drag, a typed value, a
// bulk import) records the pre-burst state once, so Undo reverts the generated line, the
// override count, and the live preview together. Bindings write straight into `config`, so
// this module observes the store instead of wrapping setters — one code path for every
// mutation source (visible controls, WebMCP, Import, profiles).

import config from "$lib/stores/config.svelte";

type Snapshot = Record<string, unknown>;

const MAX_STACK = 100;
const BURST_MS = 900;

function cloneConfig(): Snapshot {
    return JSON.parse(JSON.stringify(config)) as Snapshot;
}

let past: Snapshot[] = $state([]);
let future: Snapshot[] = $state([]);
let committed: Snapshot = cloneConfig();
let lastChangeAt = 0;
let suspended = false;

function applySnapshot(snapshot: Snapshot) {
    suspended = true;
    try {
        for (const key of Object.keys(config)) {
            const value = snapshot[key];
            if (value === undefined) continue;
            (config as Record<string, unknown>)[key] = Array.isArray(value) ? [...value] : value;
        }
    }
    finally {
        suspended = false;
    }
    committed = cloneConfig();
    lastChangeAt = Date.now();
}

if (typeof window !== "undefined") {
    $effect.root(() => {
        $effect(() => {
            // Deep-read the store so any nested mutation triggers this effect.
            const current = JSON.stringify(config);
            if (suspended) return;
            if (current === JSON.stringify(committed)) return;

            const now = Date.now();
            if (now - lastChangeAt > BURST_MS) {
                // A fresh burst: checkpoint the last stable state as the undo target.
                past = [...past.slice(-(MAX_STACK - 1)), committed];
                future = [];
            }
            lastChangeAt = now;
            committed = JSON.parse(current) as Snapshot;
        });
    });
}

export function canUndo(): boolean {
    return past.length > 0;
}

export function canRedo(): boolean {
    return future.length > 0;
}

export function undo(): boolean {
    if (!past.length) return false;
    const target = past[past.length - 1];
    past = past.slice(0, -1);
    future = [...future, cloneConfig()];
    applySnapshot(target);
    return true;
}

export function redo(): boolean {
    if (!future.length) return false;
    const target = future[future.length - 1];
    future = future.slice(0, -1);
    past = [...past.slice(-(MAX_STACK - 1)), cloneConfig()];
    applySnapshot(target);
    return true;
}

/**
 * Run a bulk mutation (Import, profile apply, Reset all) as ONE undo entry: the state before
 * the bulk op is the checkpoint, and everything inside `fn` lands atomically.
 */
export function withUndoEntry(fn: () => void): void {
    const before = committed;
    suspended = true;
    try {
        fn();
    }
    finally {
        suspended = false;
    }
    past = [...past.slice(-(MAX_STACK - 1)), before];
    future = [];
    committed = cloneConfig();
    lastChangeAt = Date.now();
}

/** Sync the checkpoint without recording history (used after restores that are not user edits). */
export function absorbCurrentState(): void {
    committed = cloneConfig();
    lastChangeAt = Date.now();
}
