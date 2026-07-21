// Named profiles: snapshots of the full settings state that can be saved, applied, renamed,
// and deleted. Applying a profile replaces the current state under a single undo entry; the
// stored overrides are exactly what diff() would have emitted when the profile was saved.

import config, {diffFromDefaults} from "$lib/stores/config.svelte";
import {withUndoEntry} from "$lib/stores/undo.svelte";

type Snapshot = Record<string, unknown>;

export interface Profile {
    id: string;
    name: string;
    snapshot: Snapshot;
    createdAt: number;
}

const STORAGE_KEY = "ghostty-config-profiles";
let nextProfileId = 0;

function cloneConfig(): Snapshot {
    return JSON.parse(JSON.stringify(config)) as Snapshot;
}

let profiles: Profile[] = $state([]);

function persist() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    }
    catch {
        // Storage full or unavailable — profiles survive for the session regardless.
    }
}

function restore() {
    if (typeof window === "undefined") return;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw) as Profile[];
        if (!Array.isArray(saved)) return;
        profiles = saved.filter(p => p && typeof p.name === "string" && p.snapshot && typeof p === "object");
        for (const p of profiles) {
            const numeric = Number(String(p.id).replace("profile-", ""));
            if (!Number.isNaN(numeric) && numeric >= nextProfileId) nextProfileId = numeric + 1;
        }
    }
    catch {
        // Corrupt payload — start with no profiles.
    }
}

restore();

if (typeof window !== "undefined") {
    $effect.root(() => {
        $effect(() => {
            // Deep-read so renames/adds/removes all persist.
            JSON.stringify(profiles);
            persist();
        });
    });
}

export function getProfiles(): Profile[] {
    return profiles;
}

/** Number of overrides stored in a profile, the same rule diff() uses against defaults. */
export function profileOverrideCount(profile: Profile): number {
    return Object.keys(diffFromDefaults(profile.snapshot as never)).length;
}

export type ProfileResult = {ok: true; profile: Profile;} | {ok: false; error: string;};

function validateName(name: string, ignoreId?: string): string | null {
    const trimmed = name.trim();
    if (!trimmed) return "Name is required";
    const conflict = profiles.find(p => p.id !== ignoreId && p.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
    if (conflict) return `A profile named "${conflict.name}" already exists`;
    return null;
}

/** Save the current settings state under a required, conflict-free name. */
export function saveProfile(name: string): ProfileResult {
    const nameError = validateName(name);
    if (nameError) return {ok: false, error: nameError};

    const profile: Profile = {
        id: `profile-${++nextProfileId}`,
        name: name.trim(),
        snapshot: cloneConfig(),
        createdAt: Date.now()
    };
    profiles = [...profiles, profile];
    return {ok: true, profile};
}

/** Apply a profile's stored overrides onto the editor as one undoable step. */
export function applyProfile(id: string): ProfileResult {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return {ok: false, error: "Profile not found"};

    const snapshot = JSON.parse(JSON.stringify(profile.snapshot)) as Snapshot;
    withUndoEntry(() => {
        for (const key of Object.keys(config)) {
            const value = snapshot[key];
            if (value === undefined) continue;
            (config as Record<string, unknown>)[key] = Array.isArray(value) ? [...value] : value;
        }
    });
    return {ok: true, profile};
}

export function deleteProfile(id: string): ProfileResult {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return {ok: false, error: "Profile not found"};
    profiles = profiles.filter(p => p.id !== id);
    return {ok: true, profile};
}

/**
 * Rename a profile. The same non-empty trimmed name contract applies; a name duplicating
 * ANOTHER profile is rejected naming the conflict, while renaming to its own current name
 * is a no-op success (not a conflict).
 */
export function renameProfile(id: string, newName: string): ProfileResult {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return {ok: false, error: "Profile not found"};

    const trimmed = newName.trim();
    if (!trimmed) return {ok: false, error: "Name is required"};
    if (trimmed === profile.name) return {ok: true, profile};

    const nameError = validateName(trimmed, id);
    if (nameError) return {ok: false, error: nameError};

    profiles = profiles.map(p => p.id === id ? {...p, name: trimmed} : p);
    return {ok: true, profile: profiles.find(p => p.id === id)!};
}

/** Look a profile up by display name (case-insensitive) for automation. */
export function findProfileByName(name: string): Profile | undefined {
    const trimmed = String(name ?? "").trim();
    return profiles.find(p => p.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
}
