<script lang="ts">
    import {onNavigate} from "$app/navigation";
    import {fly} from "svelte/transition";
    import History from "$lib/components/History.svelte";
    import app from "$lib/stores/state.svelte";
    import type {Snippet} from "svelte";

    interface Props {
        children: Snippet;
        title?: string;
        headerExtra?: Snippet;
    }

    const {children, title = "Ghostty Config", headerExtra}: Props = $props();

    $effect(() => {app.title = title;});

    // The header height is measured, not assumed: extra chrome (the editor toolbar) can wrap
    // it to two rows on narrow widths, and the scroll buffer must follow.
    let isScrolling = $state(false);
    let headerHeight = $state(53);
    let bufferHeight = $state(53);
    let headerEl: HTMLDivElement | undefined = $state();

    function containerScroll(event: Event) {
        isScrolling = (event.target as HTMLDivElement).scrollTop > 0;
        const scrollerPos = (event.target as HTMLDivElement).scrollTop;
        bufferHeight = Math.max(headerHeight - scrollerPos, 0);
    }

    let scroller: HTMLDivElement|undefined = $state();
    onNavigate(() => {
        isScrolling = false;
        bufferHeight = headerHeight;
        if (scroller) scroller.scrollTop = 0;
    });

    if (typeof window !== "undefined") {
        $effect(() => {
            const el = headerEl;
            if (!el) return;
            headerHeight = el.clientHeight;
            bufferHeight = Math.max(headerHeight - (scroller?.scrollTop ?? 0), 0);
            const observer = new ResizeObserver(() => {
                headerHeight = el.clientHeight;
                bufferHeight = Math.max(headerHeight - (scroller?.scrollTop ?? 0), 0);
            });
            observer.observe(el);
            return () => observer.disconnect();
        });
    }
</script>



<div class="content-page">
    <div class="content-header" class:scrolling={isScrolling} bind:this={headerEl}>
        <History /><h1>{app.title}</h1>
        {#if headerExtra}
            <div class="content-header-extra">{@render headerExtra()}</div>
        {/if}
    </div>
    {#key app.title}
    <div class="content-container" in:fly={{y: 30, duration: 250}} out:fly={{y: -16, duration: 180}} bind:this={scroller} style:margin-top="{bufferHeight}px" onscroll={containerScroll}>
        {@render children()}
    </div>
    {/key}
</div>


<style>
.content-page {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    /* position: relative; */
    flex: 1;
}

.content-header {
    display: flex;
    align-items: center;
    font-size: 16pt;
    gap: 10px;
    padding: 10px 20px 5px 20px;
    background: rgba(44, 39, 51, 0.9);
    /* not top: #2E2932 */
    backdrop-filter: blur(20px);
    position: absolute;
    top: 0;
    left: var(--sidebar-width);
    right: 0;
    z-index: 1;
}

.content-header.scrolling {
    background: rgba(46, 41, 50, 0.9);
    border-bottom: 1px solid black;
}

.content-header h1 {
    font-size: 1.3rem;
    margin: 8px 0;
    font-weight: 600;
}

.content-header-extra {
    margin-left: auto;
    display: flex;
    align-items: center;
}

@media (max-width: 1100px) {
    .content-header {
        flex-wrap: wrap;
    }

    .content-header-extra {
        margin-left: 0;
        width: 100%;
    }
}

.content-container {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 8px 20px 10px 20px;
    flex: 1;
}
</style>