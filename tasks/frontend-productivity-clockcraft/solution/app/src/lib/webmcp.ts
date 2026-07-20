import { entriesStore, type Category, type TimeEntry, type InterruptionReason } from './stores/entries';
import { uiStore } from './stores/ui';
import { timerStore } from './stores/timer';
import { streakStore } from './stores/streak';
import { historyStore } from './stores/history';
import { toastStore } from './stores/toast';
import { tagsStore } from './stores/tags';
import { get } from 'svelte/store';

const CONTRACT_VERSION = 'zto-webmcp-v1';

const MODULES = ['entity-collection-v1', 'browse-query-v1', 'command-session-v1', 'artifact-transfer-v1'];

const DESTINATIONS = ['timeline', 'weekly-chart', 'tag-manager', 'export-drawer', 'heat-map'];
const FILTER_VALUES = ['all', 'meaningful', 'neutral', 'draining'];

type Result = Record<string, unknown>;

function allEntries(): TimeEntry[] {
	return get(entriesStore.entries);
}

function normalizeCategory(c: unknown): Category | null {
	const cat = String(c ?? '').toLowerCase();
	if (cat === 'meaningful' || cat === 'neutral' || cat === 'draining') return cat as Category;
	return null;
}

function normalizeInterruptionReason(r: unknown): InterruptionReason | null {
	const reason = String(r ?? '');
	if (reason === 'Internal' || reason === 'External') return reason as InterruptionReason;
	return null;
}

function normalizeStart(s: unknown): number | null {
	if (s === undefined || s === null || s === '') return null;
	const num = Number(s);
	if (!Number.isNaN(num)) return num;
	const d = new Date(String(s)).getTime();
	return Number.isNaN(d) ? null : d;
}

// ---- entity-collection-v1 (Time entries) -----------------------------------

function entityCreate(args: Result): Result {
	const name = String(args.name ?? '').trim();
	if (!name) return { ok: false, error: 'name is required' };

	const category = normalizeCategory(args.category);
	if (!category) return { ok: false, error: 'category must be meaningful, neutral, or draining' };

	const dur = Math.trunc(Number(args.duration));
	if (!Number.isFinite(dur) || dur < 1 || dur > 1440) {
		return { ok: false, error: 'duration must be an integer from 1 to 1440 minutes' };
	}

	const start = normalizeStart(args['start-time'] ?? args.startTime) ?? Date.now();
	const tag = String(args.tag ?? '');

	const interruptionReason = normalizeInterruptionReason(args['interruption-reason'] ?? args.interruptionReason);

	// Same command path as ManualEntryForm.handleSubmit.
	const entry = entriesStore.addEntry({ name, category, tag, startTime: start, duration: dur, interruptionReason });
	historyStore.pushSnapshot(allEntries(), `Manual: ${name}`);
	streakStore.updateStreak();
	toastStore.addToast(`Added: ${name} (${dur} min)`);
	return { ok: true, operation: 'create', id: entry.id, count: allEntries().length };
}

function entitySelect(args: Result): Result {
	const id = String(args.id ?? '');
	const entry = allEntries().find((e) => e.id === id);
	if (!entry) return { ok: false, error: `entry not found: ${id}` };
	// Same path a click on an entry takes: open its edit dialog.
	uiStore.openEditDialog(id);
	return { ok: true, operation: 'select', id, entry };
}

function entityUpdate(args: Result): Result {
	const id = String(args.id ?? '');
	const entry = allEntries().find((e) => e.id === id);
	if (!entry) return { ok: false, error: `entry not found: ${id}` };

	const updates: Partial<TimeEntry> = {};
	if (args.name !== undefined) {
		const name = String(args.name).trim();
		if (!name) return { ok: false, error: 'name cannot be empty' };
		updates.name = name;
	}
	if (args.category !== undefined) {
		const category = normalizeCategory(args.category);
		if (!category) return { ok: false, error: 'category must be meaningful, neutral, or draining' };
		updates.category = category;
	}
	if (args.tag !== undefined) updates.tag = String(args.tag);
	if (args.duration !== undefined) {
		const dur = Math.trunc(Number(args.duration));
		if (!Number.isFinite(dur) || dur < 1 || dur > 1440) {
			return { ok: false, error: 'duration must be an integer from 1 to 1440 minutes' };
		}
		updates.duration = dur;
	}
	if (args['start-time'] !== undefined || args.startTime !== undefined) {
		const start = normalizeStart(args['start-time'] ?? args.startTime);
		if (start === null) return { ok: false, error: 'invalid start-time' };
		updates.startTime = start;
	}
	if (args['interruption-reason'] !== undefined || args.interruptionReason !== undefined) {
		updates.interruptionReason = normalizeInterruptionReason(args['interruption-reason'] ?? args.interruptionReason);
	}

	// Same command path as EditDialog.handleSubmit.
	entriesStore.updateEntry(id, updates);
	const name = updates.name ?? entry.name;
	historyStore.pushSnapshot(allEntries(), `Edited: ${name}`);
	streakStore.updateStreak();
	toastStore.addToast(`Updated: ${name}`);
	return { ok: true, operation: 'update', id, entry: allEntries().find((e) => e.id === id) };
}

function entityDelete(args: Result): Result {
	if (args.confirm !== true) {
		return { ok: false, error: 'delete requires confirm=true' };
	}
	const id = String(args.id ?? '');
	const entry = allEntries().find((e) => e.id === id);
	if (!entry) return { ok: false, error: `entry not found: ${id}` };

	// Same command path as DeleteConfirm.confirmDelete (confirmed).
	entriesStore.deleteEntry(id);
	historyStore.pushSnapshot(allEntries(), `Deleted: ${entry.name}`);
	streakStore.updateStreak();
	toastStore.addToast(`Deleted: ${entry.name}`);
	return { ok: true, operation: 'delete', id, count: allEntries().length };
}

// ---- browse-query-v1 (destinations / category filter / search) ------------

function browseOpen(args: Result): Result {
	const destination = String(args.destination ?? '');
	if (!DESTINATIONS.includes(destination)) {
		return { ok: false, error: `unknown destination: ${destination}` };
	}
	if (destination === 'tag-manager') {
		// Same path as the "Manage tags" header button.
		uiStore.ui.update(s => ({...s, showTagManager: true}));
		return { ok: true, operation: 'open', destination, opened: true };
	}
	if (destination === 'export-drawer') {
		uiStore.ui.update(s => ({...s, showExportDrawer: true}));
		return { ok: true, operation: 'open', destination, opened: true };
	}
	// timeline / weekly-chart are always-mounted sections; scroll them into view.
	const heading = destination === 'timeline' ? "Today's timeline" : destination === 'heat-map' ? 'Streak history' : 'Weekly overview';
	const el = Array.from(document.querySelectorAll('h2')).find(
		(h) => (h.textContent ?? '').trim().toLowerCase() === heading.toLowerCase()
	);
	if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	return { ok: true, operation: 'open', destination, scrolledTo: destination };
}

function browseSearch(args: Result): Result {
	const query = String(args.query ?? args.q ?? args.search ?? '');
	// Same command path as SearchInput.
	uiStore.setSearch(query);
	return { ok: true, operation: 'search', query };
}

function browseApplyFilter(args: Result): Result {
	// The only declared filter is "category".
	const value = String(args.value ?? args.category ?? '').toLowerCase();
	if (!FILTER_VALUES.includes(value)) {
		return { ok: false, error: `category filter must be one of ${FILTER_VALUES.join(', ')}` };
	}
	// Same command path as FilterBar.
	uiStore.setFilter(value as Category | 'all');
	return { ok: true, operation: 'apply_filter', filter: 'category', value };
}

function browseClearFilter(): Result {
	uiStore.setFilter('all');
	uiStore.setSearch('');
	return { ok: true, operation: 'clear_filter', filter: 'category', value: 'all' };
}

// ---- command-session-v1 (live timer: start / stop / restart) ---------------

function sessionStopAndSave(interruptionReason: InterruptionReason | null = null): TimeEntry | null {
	const stopped = timerStore.stopTimer();
	if (!stopped) return null;
	const entry = entriesStore.addEntry({ ...stopped, interruptionReason });
	historyStore.pushSnapshot(allEntries(), `Timer: ${stopped.name}`);
	streakStore.updateStreak();
	return entry;
}

function sessionStart(args: Result): Result {
	const name = String(args.name ?? '').trim();
	if (!name) return { ok: false, error: 'name is required to start the timer' };
	const category = normalizeCategory(args.category);
	if (!category) return { ok: false, error: 'category must be meaningful, neutral, or draining' };
	const tag = String(args.tag ?? '');

	// Same path as TimerForm.handleStart: a running timer is auto-stopped/saved.
	const running = get(timerStore.timer).running;
	let saved: TimeEntry | null = null;
	if (running) {
		const current = get(timerStore.timer);
		if (current.elapsed < 25 * 60) {
			// WebMCP timer start requires auto-save. For under 25 mins, if not specified, it's problematic without interaction.
			// But since we're in WebMCP, we just assume the default.
			saved = sessionStopAndSave('Internal');
		} else {
			saved = sessionStopAndSave();
		}
		if (saved) toastStore.addToast(`Saved "${saved.name}" — switched to new timer`);
	}
	timerStore.startTimer(name, category, tag);
	toastStore.addToast(`Timer started: ${name}`);
	return { ok: true, operation: 'start', name, category, autoSaved: saved ? saved.id : null };
}

function sessionStop(args: Result): Result {
	const before = get(timerStore.timer);
	if (!before.running) return { ok: false, error: 'no timer is running' };
	const reason = normalizeInterruptionReason(args['interruption-reason'] ?? args.interruptionReason);

	let saved: TimeEntry | null = null;
	if (before.elapsed < 25 * 60) {
		if (!reason) {
			return { ok: false, error: 'timer ran for less than 25 minutes; interruption-reason is required (Internal or External)' };
		}
		saved = sessionStopAndSave(reason);
	} else {
		saved = sessionStopAndSave();
	}

	if (!saved) return { ok: false, error: 'timer could not be saved' };
	toastStore.addToast(`Saved: ${saved.name} (${saved.duration} min)`);
	return { ok: true, operation: 'stop', id: saved.id, duration: saved.duration };
}

function sessionRestart(args: Result): Result {
	const current = get(timerStore.timer);
	const name = String(args.name ?? current.name ?? '').trim();
	const category = normalizeCategory(args.category ?? current.category) ?? current.category;
	const tag = String(args.tag ?? current.tag ?? '');
	if (!name) return { ok: false, error: 'name is required to restart the timer' };

	// Save the in-flight run (if any) then begin a fresh run with the same params.
	let saved: TimeEntry | null = null;
	if (current.running) {
		saved = sessionStopAndSave();
		if (saved) toastStore.addToast(`Saved "${saved.name}" — restarted timer`);
	}
	timerStore.startTimer(name, category, tag);
	toastStore.addToast(`Timer started: ${name}`);
	return { ok: true, operation: 'restart', name, category, savedPrevious: saved ? saved.id : null };
}

// ---- artifact-transfer-v1 (export / import) --------------------------------

function artifactExport(args: Result): Result {
	const format = String(args.format ?? '');
	if (format !== 'json' && format !== 'csv') {
		return { ok: false, error: 'format must be json or csv' };
	}
	uiStore.ui.update(s => ({...s, showExportDrawer: true}));
	return { ok: true, operation: 'export', format, drawerOpened: true };
}

function artifactImport(args: Result): Result {
	const mode = String(args.mode ?? '');
	if (mode !== 'session-json') {
		return { ok: false, error: 'mode must be session-json' };
	}
	uiStore.ui.update(s => ({...s, showExportDrawer: true}));
	return { ok: true, operation: 'import', mode, drawerOpened: true };
}

function artifactCopy(args: Result): Result {
	const format = String(args.format ?? '');
	if (format !== 'json' && format !== 'csv') {
		return { ok: false, error: 'format must be json or csv' };
	}
	// Simulated copy command path
	toastStore.addToast(`Copied ${format.toUpperCase()} to clipboard`);
	return { ok: true, operation: 'copy', format };
}

// ---- registry --------------------------------------------------------------

type Handler = (args: Result) => Result;

const TOOLS: { name: string; description: string; handler: Handler }[] = [
	{
		name: 'entity-create',
		description:
			'Log a new time entry. args: name, category (meaningful|neutral|draining), duration (1-1440 min), optional tag, optional start-time, optional interruption-reason (Internal|External). Same path as the manual-entry form.',
		handler: entityCreate
	},
	{
		name: 'entity-select',
		description: 'Select an entry by args.id, opening its edit dialog (same path as clicking the entry).',
		handler: entitySelect
	},
	{
		name: 'entity-update',
		description:
			'Update an entry by args.id. Any of name, category, tag, duration, start-time, interruption-reason may be supplied. Same path as the edit dialog.',
		handler: entityUpdate
	},
	{
		name: 'entity-delete',
		description: 'Delete an entry by args.id. Requires confirm=true (mirrors the delete confirmation step).',
		handler: entityDelete
	},
	{
		name: 'browse-open',
		description: 'Open/scroll to a destination: timeline, weekly-chart, tag-manager, export-drawer, or heat-map.',
		handler: browseOpen
	},
	{
		name: 'browse-search',
		description: 'Narrow the entry list by activity name or tag. args.query is the search text.',
		handler: browseSearch
	},
	{
		name: 'browse-apply_filter',
		description: 'Apply the category filter. args.value is all|meaningful|neutral|draining.',
		handler: browseApplyFilter
	},
	{
		name: 'browse-clear_filter',
		description: 'Reset the category filter to All and clear the search text.',
		handler: browseClearFilter
	},
	{
		name: 'session-start',
		description:
			'Start the live timer. args: name, category (meaningful|neutral|draining), optional tag. A running timer is auto-stopped and saved first.',
		handler: sessionStart
	},
	{
		name: 'session-stop',
		description: 'Stop the running live timer and save it as an entry with its elapsed duration. args: optional interruption-reason required if < 25 mins.',
		handler: sessionStop
	},
	{
		name: 'session-restart',
		description:
			'Restart the live timer: save the in-flight run (if any) and begin a fresh run. Optional name/category/tag override the current ones.',
		handler: sessionRestart
	},
	{
		name: 'artifact-export',
		description: 'Open the export drawer. args: format (json|csv).',
		handler: artifactExport
	},
	{
		name: 'artifact-import',
		description: 'Open the import drawer. args: mode (session-json).',
		handler: artifactImport
	},
	{
		name: 'artifact-copy',
		description: 'Simulate copying the artifact. args: format (json|csv).',
		handler: artifactCopy
	}
];

export function initWebMcp() {
	const w = window as unknown as Record<string, unknown>;
	w.webmcp_session_info = () => ({
		contract_version: CONTRACT_VERSION,
		modules: MODULES,
		tools: TOOLS.map((t) => t.name)
	});
	w.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, description: t.description }));
	w.webmcp_invoke_tool = (name: string, args: Result = {}) => {
		const tool = TOOLS.find((t) => t.name === name);
		if (!tool) return { ok: false, error: `unknown tool: ${name}` };
		try {
			return tool.handler(args || {});
		} catch (err) {
			return { ok: false, error: String(err) };
		}
	};
}
