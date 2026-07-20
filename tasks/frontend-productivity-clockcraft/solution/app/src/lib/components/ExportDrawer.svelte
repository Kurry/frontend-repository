<script lang="ts">
	import { focusTrap } from "../utils/focusTrap";
	import { uiStore, entriesStore, tagsStore, streakStore, toastStore } from '../stores';
	import { get } from 'svelte/store';
	import { z } from 'zod';

	let activeTab: 'json' | 'csv' = $state('json');

	const entries = $derived(get(entriesStore.entries));
	const tags = $derived(get(tagsStore.tags));
	const streak = $derived(get(streakStore.streak));

	let importError = $state<string | null>(null);

	const jsonPreview = $derived(() => {
		const today = new Date();
		const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
		const endOfDay = startOfDay + 86400000;

		let meaningful = 0;
		let draining = 0;
		let neutral = 0;

		for (const e of entries) {
			if (e.startTime >= startOfDay && e.startTime < endOfDay) {
				if (e.category === 'meaningful') meaningful += e.duration;
				else if (e.category === 'neutral') neutral += e.duration;
				else draining += e.duration;
			}
		}

		const total = meaningful + draining;
		const ratio = total > 0 ? Math.round((meaningful / total) * 100) : 50;

		const payload = {
			schemaVersion: "clockcraft.session.v1",
			exportedAt: new Date().toISOString(),
			tags: tags.map(t => ({ name: t })),
			entries: entries.map(e => ({
				name: e.name,
				category: e.category,
				tag: e.tag || null,
				durationMinutes: e.duration,
				startTime: new Date(e.startTime).toISOString().slice(0,16),
				interruptionReason: e.interruptionReason || null
			})),
			rollup: {
				todayMinutes: meaningful + neutral + draining,
				meaningfulRatio: ratio,
				streakDays: streak.count
			}
		};

		return JSON.stringify(payload, null, 2);
	});

	const csvPreview = $derived(() => {
		let rows = ['name,category,tag,durationMinutes,startTime,interruptionReason'];
		for (const e of entries) {
			const startStr = new Date(e.startTime).toISOString().slice(0, 16);
			// Escape fields containing commas or quotes
			const safeName = e.name.includes(',') || e.name.includes('"') ? `"${e.name.replace(/"/g, '""')}"` : e.name;
			const safeTag = (e.tag || '').includes(',') || (e.tag || '').includes('"') ? `"${(e.tag || '').replace(/"/g, '""')}"` : (e.tag || '');
			rows.push(`${safeName},${e.category},${safeTag},${e.duration},${startStr},${e.interruptionReason || ''}`);
		}
		return rows.join('\n');
	});

	async function handleCopy() {
		const text = activeTab === 'json' ? jsonPreview() : csvPreview();
		try {
			await navigator.clipboard.writeText(text);
			toastStore.addToast(`Copied ${activeTab.toUpperCase()} to clipboard`);
		} catch (err) {
			toastStore.addToast('Failed to copy', 'draining');
		}
	}

	function handleDownload() {
		const text = activeTab === 'json' ? jsonPreview() : csvPreview();
		const blob = new Blob([text], { type: activeTab === 'json' ? 'application/json' : 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `clockcraft-session-${new Date().toISOString().slice(0, 10)}.${activeTab}`;
		a.click();
		URL.revokeObjectURL(url);
		toastStore.addToast(`Downloaded ${activeTab.toUpperCase()}`);
	}

	function handleImport(event: Event) {
		importError = null;
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				const data = JSON.parse(content);

				// Validate schema
				if (data.schemaVersion !== "clockcraft.session.v1") {
					importError = "Invalid schemaVersion";
					return;
				}
				if (!data.exportedAt) {
					importError = "Missing exportedAt";
					return;
				}
				if (!Array.isArray(data.tags)) {
					importError = "Invalid tags";
					return;
				}
				if (!Array.isArray(data.entries)) {
					importError = "Invalid entries";
					return;
				}
				if (!data.rollup) {
					importError = "Missing rollup";
					return;
				}

				// Reconstruct state
				let newTags: string[] = [];
				for (const t of data.tags) {
					if (!t.name || t.name.length > 40) {
						importError = "Invalid tag name";
						return;
					}
					newTags.push(t.name);
				}

				let newEntries: import('../stores/entries').TimeEntry[] = [];
				for (const en of data.entries) {
					if (!en.name || en.name.length > 120) {
						importError = "Invalid entry name";
						return;
					}
					if (!['meaningful', 'neutral', 'draining'].includes(en.category)) {
						importError = "Invalid category";
						return;
					}
					if (en.durationMinutes < 1 || en.durationMinutes > 1440) {
						importError = "Invalid durationMinutes";
						return;
					}
					if (!en.startTime || isNaN(new Date(en.startTime).getTime())) {
						importError = "Invalid startTime";
						return;
					}
					if (en.interruptionReason && !['Internal', 'External'].includes(en.interruptionReason)) {
						importError = "Invalid interruptionReason";
						return;
					}

					newEntries.push({
						id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
						name: en.name,
						category: en.category as any,
						tag: en.tag || '',
						duration: en.durationMinutes,
						startTime: new Date(en.startTime).getTime(),
						interruptionReason: en.interruptionReason || null
					});
				}

				// Check rollup
				const today = new Date();
				const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
				const endOfDay = startOfDay + 86400000;
				let m = 0; let n = 0; let d = 0;
				for (const en of newEntries) {
					if (en.startTime >= startOfDay && en.startTime < endOfDay) {
						if (en.category === 'meaningful') m += en.duration;
						else if (en.category === 'neutral') n += en.duration;
						else d += en.duration;
					}
				}
				const total = m + d;
				const ratio = total > 0 ? Math.round((m / total) * 100) : 50;

				if (data.rollup.todayMinutes !== m + n + d) {
					importError = "Invalid rollup todayMinutes";
					return;
				}
				if (data.rollup.meaningfulRatio !== ratio) {
					importError = "Invalid rollup meaningfulRatio";
					return;
				}

				// Apply updates
				tagsStore.tags.set(newTags);
				entriesStore.setEntries(newEntries);
				streakStore.updateStreak();
				toastStore.addToast('Session imported successfully');
				uiStore.closeExportDrawer();
			} catch (err) {
				importError = "Invalid JSON file";
			} finally {
				input.value = ''; // Reset file input
			}
		};
		reader.readAsText(file);
	}
</script>

<div class="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" role="presentation" onclick={() => uiStore.closeExportDrawer()}>
	<div
		class="bg-white radius-card p-6 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl"
		onclick={(e) => e.stopPropagation()}
		role="dialog" use:focusTrap
		aria-label="Export session"
		tabindex="-1"
		onkeydown={(e) => { if (e.key === 'Escape') uiStore.closeExportDrawer(); }}
	>
		<div class="flex items-center justify-between mb-4 flex-shrink-0">
			<h2 class="text-lg font-semibold">Session artifact</h2>
			<button onclick={() => uiStore.closeExportDrawer()} class="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg" aria-label="Close">✕</button>
		</div>

		<div class="flex border-b border-[var(--color-border)] mb-4 flex-shrink-0">
			<button
				onclick={() => activeTab = 'json'}
				class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'json' ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}"
			>
				Session JSON
			</button>
			<button
				onclick={() => activeTab = 'csv'}
				class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'csv' ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}"
			>
				Timesheet CSV
			</button>
		</div>

		<div class="flex-1 overflow-hidden flex flex-col min-h-0 bg-[var(--color-bg)] rounded border border-[var(--color-border)] p-4 relative">
			{#if activeTab === 'json'}
				<pre class="text-xs font-mono overflow-auto h-full text-[var(--color-text-primary)]">{jsonPreview()}</pre>
			{:else}
				<pre class="text-xs font-mono overflow-auto h-full text-[var(--color-text-primary)]">{csvPreview()}</pre>
			{/if}
		</div>

		<div class="flex items-center justify-between mt-4 flex-shrink-0">
			<div class="flex gap-2">
				<button
					onclick={handleCopy}
					class="radius-btn px-4 py-2 text-sm font-medium bg-[var(--color-text-primary)] text-white hover:opacity-90"
				>
					Copy
				</button>
				<button
					onclick={handleDownload}
					class="radius-btn px-4 py-2 text-sm font-medium border border-[var(--color-control-border)] hover:bg-[var(--color-bg)]"
				>
					Download
				</button>
			</div>

			<div class="flex flex-col items-end">
				<label class="cursor-pointer radius-btn px-4 py-2 text-sm font-medium border border-[var(--color-control-border)] hover:bg-[var(--color-bg)]">
					Import session JSON
					<input type="file" accept="application/json" class="hidden" onchange={handleImport} />
				</label>
				{#if importError}
					<span class="text-xs text-[var(--color-draining)] mt-1" role="alert" aria-live="polite">{importError}</span>
				{/if}
			</div>
		</div>
		<p class="text-xs text-[var(--color-text-muted)] mt-4">
			Importing will completely replace your current session. Download your current state first if you want to keep it.
		</p>
	</div>
</div>
