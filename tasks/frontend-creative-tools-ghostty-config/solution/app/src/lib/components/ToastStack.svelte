<script lang="ts">
    import Toast from "$lib/components/Toast.svelte";
    import {getToasts} from "$lib/stores/toasts.svelte";

    const toasts = $derived(getToasts());
</script>

<div class="toast-stack">
    {#each toasts as toast (toast.id)}
        <Toast id={toast.id} type={toast.type} message={toast.message} />
    {/each}
</div>

<style>
    /* Transient banners float top-center and never intercept pointer events, so feedback can
       never block a click on any control — including dialogs open at the same time. */
    .toast-stack {
        position: absolute;
        top: 20px;
        left: 0;
        right: 0;
        z-index: 1200;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        pointer-events: none;
        padding: 0 20px;
    }
</style>
