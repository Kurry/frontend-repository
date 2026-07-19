import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';

export type Category = 'meaningful' | 'neutral' | 'draining';

export interface TimeEntry {
	id: string;
	name: string;
	category: Category;
	tag: string;
	startTime: number; // epoch ms
	duration: number; // minutes
	isLive?: boolean;
}

export interface EntriesState {
	entries: TimeEntry[];
}

const STORAGE_KEY = 'clockcraft_entries';

function loadEntries(): TimeEntry[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveEntries(entries: TimeEntry[]) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function createEntriesStore() {
	const store: Writable<TimeEntry[]> = writable(loadEntries());

	store.subscribe((entries) => {
		saveEntries(entries);
	});

	function addEntry(entry: Omit<TimeEntry, 'id'>): TimeEntry {
		const newEntry: TimeEntry = {
			...entry,
			id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
		};
		store.update((entries) => [newEntry, ...entries]);
		return newEntry;
	}

	function updateEntry(id: string, updates: Partial<TimeEntry>) {
		store.update((entries) =>
			entries.map((e) => (e.id === id ? { ...e, ...updates } : e))
		);
	}

	function deleteEntry(id: string) {
		store.update((entries) => entries.filter((e) => e.id !== id));
	}

	function getTodayEntries(): TimeEntry[] {
		const entries = get(store);
		const today = new Date();
		const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
		const endOfDay = startOfDay + 86400000;
		return entries.filter((e) => e.startTime >= startOfDay && e.startTime < endOfDay);
	}

	function getEntriesForRange(startMs: number, endMs: number): TimeEntry[] {
		const entries = get(store);
		return entries.filter((e) => e.startTime >= startMs && e.startTime < endMs);
	}

	function setEntries(entries: TimeEntry[]) {
		store.set(entries);
	}

	return {
		subscribe: store.subscribe,
		addEntry,
		updateEntry,
		deleteEntry,
		getTodayEntries,
		getEntriesForRange,
		setEntries,
		entries: store
	};
}

export const entriesStore = createEntriesStore();
