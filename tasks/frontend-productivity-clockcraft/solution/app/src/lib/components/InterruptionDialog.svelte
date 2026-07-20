<script lang="ts">
	import { focusTrap } from "../utils/focusTrap";
	import { entriesStore, type InterruptionReason } from '../stores/entries';
	import { timerStore } from '../stores/timer';
	import { uiStore } from '../stores/ui';
	import { toastStore } from '../stores/toast';
	import { streakStore } from '../stores/streak';
	import { historyStore } from '../stores/history';
	import { get } from 'svelte/store';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	let pendingData: any = $state(null);
	uiStore.ui.subscribe((u) => {
		pendingData = u.pendingTimerData;
	});

	const interruptionSchema = z.object({
		interruptionReason: z.enum(['Internal', 'External'], { required_error: 'Select an interruption reason' })
	});

	const { form, errors, enhance, constraints } = superForm(
		defaults({ interruptionReason: '' as any }, zod(interruptionSchema)),
		{
			SPA: true,
			validators: zod(interruptionSchema),
			onUpdate({ form }) {
				if (form.valid) {
					// Stop the current timer
					const stopped = timerStore.stopTimer();
					if (stopped) {
						const entry = entriesStore.addEntry({
							...stopped,
							interruptionReason: form.data.interruptionReason as InterruptionReason
						});
						const currentEntries = get(entriesStore.entries);
						historyStore.pushSnapshot(currentEntries, `Timer: ${stopped.name}`);
						streakStore.updateStreak();
						toastStore.addToast(`Saved: ${stopped.name} (${stopped.duration} min)`);
					}

					uiStore.closeInterruptionDialog();

					// If we were trying to start a new timer, do it now
					if (pendingData) {
						timerStore.startTimer(pendingData.name, pendingData.category, pendingData.tag || '');
						toastStore.addToast(`Timer started: ${pendingData.name}`);
					}
				}
			}
		}
	);

	function handleCancel() {
		// Just close the dialog, leaving the timer running
		uiStore.closeInterruptionDialog();
	}
</script>

<div class="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" role="presentation" onclick={handleCancel}>
	<div
		class="bg-white radius-card p-6 w-full max-w-sm shadow-xl"
		onclick={(e) => e.stopPropagation()}
		role="dialog" use:focusTrap
		aria-label="Interruption Reason"
		tabindex="-1"
		onkeydown={(e) => { if (e.key === 'Escape') handleCancel(); }}
	>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold">Short session</h2>
			<button onclick={handleCancel} class="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg" aria-label="Close">✕</button>
		</div>

		<p class="text-sm mb-4">You stopped the timer before 25 minutes. Please provide a reason.</p>

		<form class="flex flex-col gap-3" method="POST" use:enhance>
			<div class="flex flex-col gap-1">
				<label for="interruption-reason" class="text-sm font-medium">Interruption Reason</label>
				<select
					id="interruption-reason"
					name="interruptionReason"
					bind:value={$form.interruptionReason}
					{...$constraints.interruptionReason}
					class="radius-btn border border-[var(--color-control-border)] px-3 py-2 text-sm bg-white"
				>
					<option value="">Select a reason</option>
					<option value="Internal">Internal</option>
					<option value="External">External</option>
				</select>
				{#if $errors.interruptionReason}<p class="text-sm text-[var(--color-draining)] mt-1" role="alert">{$errors.interruptionReason}</p>{/if}
			</div>

			<div class="flex gap-2 mt-2">
				<button
					type="submit"
					class="radius-btn px-4 py-2.5 text-sm font-medium bg-[var(--color-text-primary)] text-white hover:opacity-90 flex-1"
				>
					Confirm & Save
				</button>
				<button
					type="button"
					onclick={handleCancel}
					class="radius-btn px-4 py-2.5 text-sm font-medium border border-[var(--color-control-border)] hover:bg-[var(--color-bg)]"
				>
					Cancel
				</button>
			</div>
		</form>
	</div>
</div>
