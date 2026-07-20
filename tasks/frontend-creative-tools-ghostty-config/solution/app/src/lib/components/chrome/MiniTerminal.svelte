<script lang="ts">
    // A small themed terminal sample — same content on every pane so visible differences are
    // attributable to the theme alone. Fonts follow the live font settings; colors come from
    // the given scheme.
    import config from "$lib/stores/config.svelte";
    import type {ColorScheme} from "$lib/utils/colors";

    interface Props {
        scheme: ColorScheme;
        label: string;
    }

    const {scheme, label}: Props = $props();

    const bg = $derived(scheme.background ?? "#282c34");
    const fg = $derived(scheme.foreground ?? "#ffffff");
    const fontFamily = $derived(
        config.fontFamily.filter(Boolean).map(f => JSON.stringify(f)).join(", ") || "\"JetBrainsMono Nerd Font\""
    );
</script>

<div
    class="mini-term"
    role="img"
    aria-label={`${label}: terminal preview in this theme`}
    style:background={bg}
    style:color={fg}
    style:font-family={fontFamily}
>
    <div class="mt-line">
        <span style:color={scheme.palette?.[2] ?? "#98c379"}>➜</span>
        <span style:color={scheme.palette?.[4] ?? "#61afef"}>~/dev</span>
        <span> ghostty +show-config</span>
    </div>
    <div class="mt-line">
        <span style:color={scheme.palette?.[5] ?? "#c678dd"}>theme</span>
        <span class="mt-dim"> = </span>
        <span style:color={scheme.palette?.[3] ?? "#e5c07b"}>{label}</span>
    </div>
    <div class="mt-line">
        <span style:color={scheme.palette?.[1] ?? "#e06c75"}>cursor</span>
        <span class="mt-dim"> tracks </span>
        <span style:color={scheme.palette?.[6] ?? "#56b6c2"}>your edits</span>
    </div>
    <div class="mt-line">
        <span style:color={scheme.palette?.[2] ?? "#98c379"}>➜</span>
        <span style:color={scheme.palette?.[4] ?? "#61afef"}>~/dev</span>
        <span class="mt-cursor" style:background={fg} aria-hidden="true"></span>
    </div>
</div>

<style>
.mini-term {
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.55);
    box-shadow: 0 0 1px rgba(255, 255, 255, 0.4) inset, 0 6px 16px -8px rgba(0, 0, 0, 0.8);
    padding: 8px 10px;
    font-size: calc(var(--config-font-size) * 0.72);
    line-height: 1.55;
    user-select: none;
    transition: background 200ms ease, color 200ms ease;
}

.mt-line {
    display: flex;
    gap: 6px;
    white-space: pre;
}

.mt-dim {
    opacity: 0.6;
}

.mt-cursor {
    display: inline-block;
    width: 0.6em;
    height: 1.1em;
    margin-left: 6px;
    align-self: center;
    animation: mt-blink 1.1s steps(1) infinite;
}

@keyframes mt-blink {
    50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
    .mt-cursor {
        animation: none;
    }
    .mini-term {
        transition: none;
    }
}
</style>
