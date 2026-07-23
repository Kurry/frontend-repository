<script lang="ts">
    // The macOS-style dock hosts this live, interactive terminal tile: it is the real
    // interactive terminal (type `help`, run its commands) scaled into the dock, and it
    // re-themes instantly as colors, fonts, palette, and cursor settings change because it
    // renders through the same --config-* CSS variables as the rest of the app.
    import InteractiveTerminalDom from "$lib/views/InteractiveTerminalDom.svelte";
    import config from "$lib/stores/config.svelte";
</script>

<div class="dock-terminal" id="dock-live-terminal" aria-label="Live terminal preview hosted in the dock">
    <div class="dock-terminal-titlebar" aria-hidden="true">
        <span class="dt-dot dt-red"></span>
        <span class="dt-dot dt-yellow"></span>
        <span class="dt-dot dt-green"></span>
        <span class="dt-title">ghostty — live preview</span>
    </div>
    <div class="dock-terminal-body">
        <InteractiveTerminalDom
            selectionClearOnCopy={false}
            selectionClearOnTyping={false}
            copyOnSelect={false}
            cursorBlink={config.cursorStyleBlink !== "false"}
            cursorStyle={config.cursorStyle as "block" | "underline" | "bar" | "block_hollow"}
        />
    </div>
</div>

<style>
.dock-terminal {
    width: min(300px, 62vw);
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow: 0 10px 24px -6px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.5) inset;
    background: var(--config-bg);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.dock-terminal:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 32px -6px rgba(0, 0, 0, 0.7), 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

.dock-terminal-titlebar {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    background: rgba(255, 255, 255, 0.09);
    border-bottom: 1px solid rgba(0, 0, 0, 0.4);
}

.dt-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.dt-red { background: #ff5f57; }
.dt-yellow { background: #febc2e; }
.dt-green { background: #28c840; }

.dt-title {
    margin-left: 6px;
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: rgba(255, 255, 255, 0.75);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dock-terminal-body {
    height: 92px;
    overflow: hidden;
}

/* Scale the shared terminal into a dock-sized tile; it stays fully interactive. */
.dock-terminal-body :global(.term) {
    height: 100%;
    font-size: max(9px, calc(var(--config-font-size) * 0.55));
    padding: 6px 8px;
    border: none;
    border-radius: 0;
    box-shadow: none;
}

.dock-terminal-body :global(.term:focus-visible) {
    outline: 2px solid rgba(122, 162, 255, 0.9);
    outline-offset: -2px;
}

/* Keep the dock low and narrow on small screens so it can never cover stacked-page
   controls or overflow the viewport. */
@media (max-width: 640px) {
    .dock-terminal {
        width: 130px;
    }

    .dock-terminal-body {
        height: 44px;
    }

    .dt-title {
        display: none;
    }
}

@media (max-width: 400px) {
    .dock-terminal {
        width: 116px;
    }
}
</style>
