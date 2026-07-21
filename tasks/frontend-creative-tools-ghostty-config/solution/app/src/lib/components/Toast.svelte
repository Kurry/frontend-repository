<script lang="ts">
    import {sequoiaEase} from "$lib/utils/animations";
    import {fly} from "svelte/transition";

    interface Props {
        id: string;
        type: "success" | "error";
        message: string;
    }

    const {id, type, message}: Props = $props();
    void id;
</script>

<div class="toast-container" role="status" aria-live="polite">
    <!-- Non-interactive banner: it announces through the live region, fades on its own, and
         can never sit between the pointer and a control. -->
    <div class="toast toast-{type}" transition:fly={{y: -44, duration: 300, easing: sequoiaEase}}>
        <div class="toast-icon" aria-hidden="true">
            {#if type === "success"}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
                        fill="currentColor"
                    />
                </svg>
            {:else}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
                        fill="currentColor"
                    />
                </svg>
            {/if}
        </div>
        <div class="toast-message">{message}</div>
    </div>
</div>

<style>
    .toast-container {
        display: flex;
        pointer-events: none;
    }

    .toast {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        min-width: 280px;
        max-width: 400px;
        border: none;
        border-radius: var(--radius-level-3);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset,
            0 1px 2px rgba(0, 0, 0, 0.5);
        font-family: inherit;
        text-align: left;
    }

    .toast-success {
        background: linear-gradient(
            135deg,
            rgba(52, 199, 89, 0.9) 0%,
            rgba(48, 176, 79, 0.9) 100%
        );
        color: #ffffff;
    }

    .toast-error {
        background: linear-gradient(
            135deg,
            rgba(255, 69, 58, 0.9) 0%,
            rgba(235, 61, 50, 0.9) 100%
        );
        color: #ffffff;
    }

    .toast-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .toast-message {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
        letter-spacing: -0.01em;
    }
</style>
