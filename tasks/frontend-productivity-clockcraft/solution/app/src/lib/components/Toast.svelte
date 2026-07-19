<script lang="ts">
	import { toastStore } from '../stores/toast';

	let toasts = $state<{id: string; message: string; type: 'success' | 'error' | 'info'}[]>([]);

	toastStore.subscribe((t) => { toasts = t; });

	function removeToast(id: string) {
		toastStore.removeToast(id);
	}
</script>

<div class="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 max-w-sm" role="status" aria-live="polite" aria-atomic="true">
	{#each toasts as toast (toast.id)}
		<div
			class="radius-card px-4 py-3 shadow-lg text-sm font-medium animate-slide-up
				{toast.type === 'success' ? 'bg-[var(--color-meaningful)] text-[var(--color-text-primary)]' : toast.type === 'error' ? 'bg-[var(--color-draining)] text-white' : 'bg-[var(--color-text-primary)] text-white'}"
		>
			<div class="flex items-center gap-2">
				<span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}</span>
				<span class="flex-1">{toast.message}</span>
				<button
					onclick={() => removeToast(toast.id)}
					class="opacity-70 hover:opacity-100 ml-2 text-xs"
					aria-label="Dismiss"
				>✕</button>
			</div>
		</div>
	{/each}
</div>

<style>
	@keyframes slideUp {
		from { opacity: 0; transform: translateY(16px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-slide-up {
		animation: slideUp 0.25s ease-out;
	}
</style>
