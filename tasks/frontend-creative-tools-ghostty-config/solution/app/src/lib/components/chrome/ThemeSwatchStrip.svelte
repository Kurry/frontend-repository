<script lang="ts">
    // Per-theme swatch strip on the Colors page: each bundled theme shows its background,
    // foreground, and first palette colors plus a live type sample — so palettes can be
    // compared before committing to one.
    import themes from "$lib/data/themes";
    import config, {setSetting} from "$lib/stores/config.svelte";
    import {THEMES} from "$lib/utils/contracts";
    import {success} from "$lib/stores/toasts.svelte";
    import type {ColorScheme} from "$lib/utils/colors";

    const entries = $derived(
        THEMES
            .map(name => ({name, scheme: (themes as Record<string, ColorScheme>)[name]}))
            .filter(entry => entry.scheme)
    );

    function choose(name: string) {
        if (config.theme === name) return;
        setSetting("theme", name);
        success(`Theme set to ${name}`);
    }
</script>

<section class="swatch-strip" aria-label="Theme swatch previews">
    <h3 class="strip-title">Theme swatches</h3>
    <p class="strip-note">Preview each theme's palette before committing — selecting a row applies that theme.</p>
    <div class="strip-rows">
        {#each entries as {name, scheme} (name)}
            <button
                type="button"
                class="strip-row"
                class:active={config.theme === name}
                onclick={() => choose(name)}
                aria-pressed={config.theme === name}
                aria-label={`Apply theme ${name}`}
            >
                <span class="strip-name">{name}</span>
                <span class="strip-swatches" aria-hidden="true">
                    {#each [scheme.background ?? "#000000", scheme.foreground ?? "#ffffff", ...(scheme.palette ?? []).slice(1, 7)] as color, i (i)}
                        <span class="strip-swatch" style:background={color}></span>
                    {/each}
                </span>
                <span
                    class="strip-sample"
                    aria-hidden="true"
                    style:background={scheme.background ?? "#000000"}
                    style:color={scheme.foreground ?? "#ffffff"}
                >Aa</span>
            </button>
        {/each}
    </div>
</section>

<style>
.swatch-strip {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 4px 0 14px;
    padding: 14px;
    border: 1px solid var(--border-level-1);
    border-radius: var(--radius-level-3);
    background: rgba(255, 255, 255, 0.03);
}

.strip-title {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 600;
}

.strip-note {
    margin: 0;
    color: var(--font-color-muted);
    font-size: 0.78rem;
}

.strip-rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 4px;
}

.strip-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 7px 10px;
    border: 1px solid transparent;
    border-radius: var(--radius-level-4);
    background: transparent;
    color: var(--font-color);
    cursor: pointer;
    text-align: left;
    transition: background 140ms ease, border-color 140ms ease, transform 120ms ease;
}

.strip-row:hover {
    background: rgba(255, 255, 255, 0.07);
}

.strip-row:active {
    transform: scale(0.99);
}

.strip-row:focus-visible {
    outline: var(--border-input-focus);
}

.strip-row.active {
    border-color: rgba(122, 162, 255, 0.7);
    background: rgba(122, 162, 255, 0.1);
}

.strip-name {
    width: 170px;
    flex-shrink: 0;
    font-size: 0.82rem;
    font-weight: 600;
}

.strip-swatches {
    display: inline-flex;
    gap: 4px;
    flex: 1;
    min-width: 0;
}

.strip-swatch {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.45);
    box-shadow: 0 0 1px rgba(255, 255, 255, 0.35) inset;
}

.strip-sample {
    width: 34px;
    height: 22px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.45);
    font-size: 0.78rem;
    font-weight: 700;
}

@media (max-width: 700px) {
    .strip-name {
        width: 110px;
        font-size: 0.76rem;
    }
}
</style>
