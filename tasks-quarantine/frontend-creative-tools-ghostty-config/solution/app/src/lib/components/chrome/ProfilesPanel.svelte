<script lang="ts">
    // Named profiles panel: save the current override set under a required name, then apply,
    // rename (inline form pre-filled with the current name), or delete (with confirmation).
    // Names follow the profile-name contract: non-empty when trimmed, unique across profiles,
    // and renaming a profile to its own current name is a no-op rather than a conflict.
    import {fade, fly} from "svelte/transition";
    import Panel from "./Panel.svelte";
    import Button from "$lib/components/Button.svelte";
    import {panels} from "$lib/stores/editor.svelte";
    import {
        applyProfile,
        deleteProfile,
        getProfiles,
        profileOverrideCount,
        renameProfile,
        saveProfile
    } from "$lib/stores/profiles.svelte";
    import {confirm} from "$lib/stores/modals.svelte";
    import {error, success} from "$lib/stores/toasts.svelte";

    const profiles = $derived(getProfiles());

    let newName = $state("");
    let saveError = $state("");
    let renamingId = $state<string | null>(null);
    let renameValue = $state("");
    let renameError = $state("");

    function close() {
        panels.profilesOpen = false;
        newName = "";
        saveError = "";
        renamingId = null;
        renameError = "";
    }

    function handleSave() {
        const result = saveProfile(newName);
        if (!result.ok) {
            saveError = result.error;
            return;
        }
        saveError = "";
        newName = "";
        success(`Profile "${result.profile.name}" saved`);
    }

    function handleSaveKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSave();
        }
    }

    function handleApply(id: string, name: string) {
        const result = applyProfile(id);
        if (result.ok) success(`Profile "${name}" applied`);
        else error(result.error);
    }

    async function handleDelete(id: string, name: string) {
        const confirmed = await confirm({
            title: "Delete profile?",
            message: `"${name}" and its stored overrides will be removed. This cannot be undone.`,
            confirmText: "Delete",
            cancelText: "Cancel"
        });
        if (!confirmed) return;
        const result = deleteProfile(id);
        if (result.ok) success(`Profile "${name}" deleted`);
    }

    function startRename(id: string, currentName: string) {
        renamingId = id;
        renameValue = currentName;
        renameError = "";
    }

    function cancelRename() {
        renamingId = null;
        renameValue = "";
        renameError = "";
    }

    function submitRename(id: string) {
        const result = renameProfile(id, renameValue);
        if (!result.ok) {
            renameError = result.error;
            return;
        }
        renamingId = null;
        renameError = "";
        success(`Profile renamed to "${result.profile.name}"`);
    }

    function handleRenameKeydown(event: KeyboardEvent, id: string) {
        if (event.key === "Enter") {
            event.preventDefault();
            submitRename(id);
        }
        else if (event.key === "Escape") {
            event.stopPropagation();
            cancelRename();
        }
    }
</script>

{#if panels.profilesOpen}
<Panel title="Profiles" onclose={close} width="540px">
    <div class="save-row">
        <label class="save-label" for="profile-name-input">Name</label>
        <input
            id="profile-name-input"
            data-autofocus
            type="text"
            class="save-input"
            bind:value={newName}
            onkeydown={handleSaveKeydown}
            aria-invalid={saveError ? "true" : undefined}
            aria-describedby={saveError ? "profile-save-error" : undefined}
        />
        <Button primary onclick={handleSave}>Save profile</Button>
    </div>
    {#if saveError}
        <p id="profile-save-error" class="field-error" role="alert">{saveError}</p>
    {/if}
    <p class="save-note">Saves the current overrides as a named profile you can re-apply any time.</p>

    {#if profiles.length}
        <ul class="profile-list">
            {#each profiles as profile (profile.id)}
                {@const count = profileOverrideCount(profile)}
                <li class="profile-row">
                    {#if renamingId === profile.id}
                        <div class="rename-row" transition:fade={{duration: 180}}>
                            <label class="sr-only" for={`rename-${profile.id}`}>New name for {profile.name}</label>
                            <input
                                id={`rename-${profile.id}`}
                                type="text"
                                class="rename-input"
                                bind:value={renameValue}
                                onkeydown={(event) => handleRenameKeydown(event, profile.id)}
                                aria-invalid={renameError ? "true" : undefined}
                            />
                            <Button primary onclick={() => submitRename(profile.id)}>Save</Button>
                            <Button onclick={cancelRename}>Cancel</Button>
                        </div>
                        {#if renameError}
                            <p class="field-error" role="alert" transition:fade={{duration: 180}}>{renameError}</p>
                        {/if}
                    {:else}
                        <div class="profile-main">
                            <span class="profile-name">{profile.name}</span>
                            <span class="profile-count">{count} {count === 1 ? "override" : "overrides"}</span>
                        </div>
                        <div class="profile-actions">
                            <Button primary onclick={() => handleApply(profile.id, profile.name)}>Apply</Button>
                            <Button onclick={() => startRename(profile.id, profile.name)}>Rename</Button>
                            <Button danger onclick={() => handleDelete(profile.id, profile.name)}>Delete</Button>
                        </div>
                    {/if}
                </li>
            {/each}
        </ul>
    {:else}
        <div class="profiles-empty" transition:fly={{y: 8, duration: 200}}>
            <p class="profiles-empty-title">No profiles yet</p>
            <p>Save your current overrides under a name, then re-apply them later — even after a Reset all.</p>
        </div>
    {/if}
</Panel>
{/if}

<style>
.save-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.save-label {
    font-weight: 600;
    font-size: 0.85rem;
    flex-shrink: 0;
}

.save-input,
.rename-input {
    flex: 1;
    min-width: 0;
    background: var(--bg-level-2);
    border: 1px solid var(--border-input);
    border-radius: var(--radius-level-5);
    color: var(--font-color);
    padding: 5px 8px;
    font-size: 0.88rem;
    outline: none;
}

.save-input:focus,
.rename-input:focus {
    background: var(--bg-input-focus);
    outline: var(--border-input-focus);
}

.save-note {
    margin: -4px 0 0;
    color: var(--font-color-muted);
    font-size: 0.78rem;
}

.field-error {
    margin: 0;
    color: var(--color-danger);
    font-size: 0.8rem;
    font-weight: 500;
}

.profile-list {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.profile-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--border-level-1);
    border-radius: var(--radius-level-3);
    background: rgba(255, 255, 255, 0.04);
}

.profile-main {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
}

.profile-name {
    font-weight: 600;
}

.profile-count {
    color: var(--font-color-muted);
    font-size: 0.78rem;
}

.profile-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.rename-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.profiles-empty {
    text-align: center;
    padding: 18px 10px 8px;
    color: var(--font-color-muted);
}

.profiles-empty-title {
    margin: 0 0 6px;
    font-weight: 600;
    color: var(--font-color);
}

.profiles-empty p:last-child {
    margin: 0 auto;
    max-width: 320px;
    font-size: 0.82rem;
    line-height: 1.5;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
}
</style>
