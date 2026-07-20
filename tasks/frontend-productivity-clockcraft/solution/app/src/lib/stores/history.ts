import { writable, get, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { TimeEntry } from './entries';

const STORAGE_KEY = 'clockcraft_history';

interface HistorySnapshot {
	entries: TimeEntry[];
	timestamp: number;
	label: string;
}

interface HistoryState {
	snapshots: HistorySnapshot[];
	currentIndex: number;
	// Branching: when undoing and making new change, create branch
	branches: HistorySnapshot[];
}

function loadHistory(): HistoryState {
	if (typeof localStorage === 'undefined') {
		return { snapshots: [], currentIndex: -1, branches: [] };
	}
	try {
		const raw = null;
		return raw ? JSON.parse(raw) : { snapshots: [], currentIndex: -1, branches: [] };
	} catch {
		return { snapshots: [], currentIndex: -1, branches: [] };
	}
}

function saveHistory(state: HistoryState) {
	if (typeof localStorage === 'undefined') return;
	// Limit snapshots to prevent storage bloat
	const removedSnapshots = Math.max(0, state.snapshots.length - 50);
	const trimmed = {
		...state,
		snapshots: state.snapshots.slice(-50),
		currentIndex: state.currentIndex < 0 ? -1 : Math.max(0, state.currentIndex - removedSnapshots),
		branches: state.branches.slice(-20)
	};

}

function createHistoryStore() {
	const store: Writable<HistoryState> = writable(loadHistory());
	let _isUpdating = false;

	store.subscribe(saveHistory);

	function pushSnapshot(entries: TimeEntry[], label: string) {
		if (_isUpdating) return;
		const state = get(store);

		// Preserve the abandoned future as selectable alternate branch nodes.
		const abandonedFuture = state.currentIndex < state.snapshots.length - 1
			? state.snapshots.slice(state.currentIndex + 1)
			: [];
		const newSnapshots = [...state.snapshots.slice(0, state.currentIndex + 1)];
		newSnapshots.push({
			entries: JSON.parse(JSON.stringify(entries)),
			timestamp: Date.now(),
			label
		});

		store.set({
			snapshots: newSnapshots,
			currentIndex: newSnapshots.length - 1,
			branches: [...state.branches, ...abandonedFuture]
		});
	}

	function undo(): TimeEntry[] | null {
		const state = get(store);
		if (state.currentIndex <= 0) return null;

		const newIndex = state.currentIndex - 1;
		store.set({ ...state, currentIndex: newIndex });
		return state.snapshots[newIndex].entries;
	}

	function redo(): TimeEntry[] | null {
		const state = get(store);
		if (state.currentIndex >= state.snapshots.length - 1) return null;

		const newIndex = state.currentIndex + 1;
		store.set({ ...state, currentIndex: newIndex });
		return state.snapshots[newIndex].entries;
	}

	function goToSnapshot(index: number): TimeEntry[] | null {
		const state = get(store);
		if (index < 0 || index >= state.snapshots.length) return null;
		store.set({ ...state, currentIndex: index });
		return state.snapshots[index].entries;
	}

	function createBranchFromCurrent(entries: TimeEntry[], label: string): TimeEntry[] | null {
		const state = get(store);
		if (state.currentIndex < 0) return null;

		// Add new snapshot after current index (creating a branch)
		const newSnapshots = [...state.snapshots.slice(0, state.currentIndex + 1)];
		newSnapshots.push({
			entries: JSON.parse(JSON.stringify(entries)),
			timestamp: Date.now(),
			label: `${label} (branch)`
		});

		const oldSnapshots = state.snapshots.slice(state.currentIndex + 1);

		store.set({
			snapshots: newSnapshots,
			currentIndex: newSnapshots.length - 1,
			branches: [...state.branches, ...oldSnapshots]
		});

		return entries;
	}

	function selectBranch(index: number): TimeEntry[] | null {
		const state = get(store);
		if (index < 0 || index >= state.branches.length) return null;

		const selected = state.branches[index];
		const current = state.currentIndex >= 0 ? state.snapshots[state.currentIndex] : null;
		const remainingBranches = state.branches.filter((_, i) => i !== index);
		if (current) {
			remainingBranches.push({
				entries: JSON.parse(JSON.stringify(current.entries)),
				timestamp: Date.now(),
				label: `Alternate: ${current.label}`
			});
		}

		const newSnapshots = [
			...state.snapshots.slice(0, state.currentIndex + 1),
			{
				entries: JSON.parse(JSON.stringify(selected.entries)),
				timestamp: Date.now(),
				label: selected.label
			}
		];
		store.set({
			snapshots: newSnapshots,
			currentIndex: newSnapshots.length - 1,
			branches: remainingBranches
		});
		return JSON.parse(JSON.stringify(selected.entries));
	}

	function startExternalUpdate() {
		_isUpdating = true;
	}

	function endExternalUpdate() {
		_isUpdating = false;
	}

	function replaceWithSnapshot(entries: TimeEntry[], label: string) {
		store.set({
			snapshots: [{ entries: JSON.parse(JSON.stringify(entries)), timestamp: Date.now(), label }],
			currentIndex: 0,
			branches: []
		});
	}

	return {
		subscribe: store.subscribe,
		pushSnapshot,
		undo,
		redo,
		goToSnapshot,
		createBranchFromCurrent,
		selectBranch,
		startExternalUpdate,
		endExternalUpdate,
		replaceWithSnapshot,
		history: store,
		derivedCurrent: derived(store, (s) => {
			if (s.currentIndex >= 0 && s.currentIndex < s.snapshots.length) {
				return s.snapshots[s.currentIndex];
			}
			return null;
		})
	};
}

export const historyStore = createHistoryStore();
