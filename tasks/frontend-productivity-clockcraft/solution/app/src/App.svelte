<script lang="ts">
	import { onMount } from 'svelte';
	import Header from './lib/components/Header.svelte';
	import TimerForm from './lib/components/TimerForm.svelte';
	import ManualEntryForm from './lib/components/ManualEntryForm.svelte';
	import Timeline from './lib/components/Timeline.svelte';
	import WeeklyChart from './lib/components/WeeklyChart.svelte';
	import EntryList from './lib/components/EntryList.svelte';
	import FilterBar from './lib/components/FilterBar.svelte';
	import SearchInput from './lib/components/SearchInput.svelte';
	import TagManager from './lib/components/TagManager.svelte';
	import EditDialog from './lib/components/EditDialog.svelte';
	import DeleteConfirm from './lib/components/DeleteConfirm.svelte';
	import HistoryPanel from './lib/components/HistoryPanel.svelte';
	import InterruptionDialog from './lib/components/InterruptionDialog.svelte';
	import ExportDrawer from './lib/components/ExportDrawer.svelte';
	import CommandPalette from './lib/components/CommandPalette.svelte';
	import Toast from './lib/components/Toast.svelte';
	import { uiStore, historyStore, entriesStore, streakStore } from './lib/stores';

	let showManual = $state(false);
	let showTagManager = $state(false);
	let showEditDialog = $state(false);
	let showDeleteConfirm = $state(false);
	let showHistoryPanel = $state(false);
	let showInterruptionDialog = $state(false);
	let showExportDrawer = $state(false);

	uiStore.ui.subscribe((ui) => {
		showManual = ui.showManualForm;
		showTagManager = ui.showTagManager;
		showEditDialog = ui.showEditDialog;
		showDeleteConfirm = ui.showDeleteConfirm;
		showHistoryPanel = ui.showHistoryPanel;
		showInterruptionDialog = ui.showInterruptionDialog;
		showExportDrawer = ui.showExportDrawer;
	});

	// On mount, take initial snapshot for history
	onMount(() => {
		let entries: import('./lib/stores/entries').TimeEntry[] = [];
		const unsub = entriesStore.entries.subscribe((e) => {
			entries = e;
		});
		unsub();

		if (entries.length > 0 && historyStore.history) {
			let hstate: any = null;
			const hunsub = historyStore.history.subscribe((h) => { hstate = h; });
			hunsub();

			if (hstate && hstate.snapshots.length === 0) {
				historyStore.pushSnapshot(entries, 'Initial load');
			}
		}

		// Update streak on load
		streakStore.updateStreak();
	});
</script>

<div class="min-h-screen">
	<Header />

	<main class="max-w-5xl mx-auto px-4 py-6 sm:px-6">
		<!-- Top section: Timer + Manual Entry -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
			<TimerForm />
			{#if showManual}
				<ManualEntryForm />
			{:else}
				<div class="bg-white radius-card border border-[var(--color-border)] border-dashed p-5 flex items-center justify-center">
					<button
						onclick={() => uiStore.toggleManualForm()}
						class="radius-btn px-4 py-3 text-sm font-medium border-2 border-dashed border-[var(--color-control-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] hover:border-[var(--color-text-primary)]"
					>
						Add entry manually
					</button>
				</div>
			{/if}
		</div>

		<!-- Filter + Search -->
		<div class="flex flex-col sm:flex-row gap-3 mb-6">
			<FilterBar />
			<div class="flex-1">
				<SearchInput />
			</div>
		</div>

		<!-- Timeline + Weekly Chart -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
			<Timeline />
			<WeeklyChart />
		</div>

		<!-- Entry List -->
		<EntryList />
	</main>

	<!-- Footer -->
	<footer class="text-center py-6 text-xs text-[var(--color-text-muted)]">
		ClockCraft — Track your time, own your day.
	</footer>

	<!-- Modals & Overlays -->
	{#if showTagManager}
		<TagManager />
	{/if}
	{#if showEditDialog}
		<EditDialog />
	{/if}
	{#if showDeleteConfirm}
		<DeleteConfirm />
	{/if}
	{#if showHistoryPanel}
		<HistoryPanel />
	{/if}
	{#if showInterruptionDialog}
		<InterruptionDialog />
	{/if}
	{#if showExportDrawer}
		<ExportDrawer />
	{/if}

	<CommandPalette />

	<!-- Toasts -->
	<Toast />
</div>
