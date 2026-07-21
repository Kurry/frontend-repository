// Transient editor chrome state: edit/diff mode, the overlay panels (Import, Profiles,
// command palette, Compare themes), the compare surface's A/B selections, and the first-run
// tour. None of this serializes into the generated config; mode and panel flags persist
// across category navigation but the compare surface never mutates overrides until Apply.

import {THEMES} from "$lib/utils/contracts";

export type EditorMode = "edit" | "diff";

export const editor = $state<{mode: EditorMode;}>({mode: "edit"});

export const panels = $state<{
    importOpen: boolean;
    profilesOpen: boolean;
    paletteOpen: boolean;
    compareOpen: boolean;
}>({importOpen: false, profilesOpen: false, paletteOpen: false, compareOpen: false});

export const compare = $state<{sideA: string; sideB: string;}>({sideA: THEMES[0], sideB: THEMES[1]});

export function setEditorMode(mode: EditorMode): void {
    editor.mode = mode;
    // Diff is a viewing mode over the generated panel, not an overlay — close the compare
    // surface when switching so the two never stack.
    if (mode === "diff") panels.compareOpen = false;
}

export function toggleDiff(): EditorMode {
    const next: EditorMode = editor.mode === "diff" ? "edit" : "diff";
    setEditorMode(next);
    return next;
}

export function openCompare(): void {
    panels.compareOpen = true;
    editor.mode = "edit";
}

export function closeCompare(): void {
    panels.compareOpen = false;
}

/** Commit one side's selection as the theme override — the same path as picking it on Colors. */
export function compareThemeFor(side: "A" | "B"): string {
    return side === "A" ? compare.sideA : compare.sideB;
}

// First-run coachmark tour --------------------------------------------------------------

const TOUR_KEY = "ghostty-tour-done";

function tourAlreadyDone(): boolean {
    if (typeof window === "undefined") return true; // prerender: never show
    try {
        return window.localStorage.getItem(TOUR_KEY) === "1";
    }
    catch {
        return true;
    }
}

export const tour = $state<{active: boolean; step: number;}>({active: false, step: 0});

export function startTourIfFirstRun(): void {
    if (tourAlreadyDone()) return;
    tour.active = true;
    tour.step = 0;
}

export function nextTourStep(totalSteps: number): void {
    if (tour.step < totalSteps - 1) {
        tour.step += 1;
        return;
    }
    endTour();
}

export function endTour(): void {
    tour.active = false;
    try {
        window.localStorage.setItem(TOUR_KEY, "1");
    }
    catch {
        // Non-fatal — the tour simply reappears next load if it cannot be remembered.
    }
}
