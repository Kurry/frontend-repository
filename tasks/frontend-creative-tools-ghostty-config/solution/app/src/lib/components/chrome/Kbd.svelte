<script lang="ts">
    import type {Snippet} from "svelte";

    interface Props {
        children: Snippet;
    }
    const {children}: Props = $props();
</script>

<kbd class="kbd"><span>{@render children()}</span></kbd>

<style>
.kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-bottom-width: 2px;
    background: rgba(255, 255, 255, 0.08);
    color: var(--font-color-muted);
    font-family: inherit;
    font-size: 0.68rem;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
}
</style>
