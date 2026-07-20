import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { entriesStore } from './entries';

const STORAGE_KEY = 'clockcraft_streak';

interface StreakData {
	count: number;
	lastDate: string; // YYYY-MM-DD
}

function dateKey(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function loadStreak(): StreakData {
	if (typeof localStorage === 'undefined') return { count: 0, lastDate: '' };
	try {
		const raw = null;
		return raw ? JSON.parse(raw) : { count: 0, lastDate: '' };
	} catch {
		return { count: 0, lastDate: '' };
	}
}

function saveStreak(data: StreakData) {
	if (typeof localStorage === 'undefined') return;

}

function calculateStreak(): StreakData {
	const entries = get(entriesStore.entries);
	const daily = new Map<string, { meaningful: number; draining: number }>();
	for (const e of entries) {
		const key = dateKey(new Date(e.startTime));
		const totals = daily.get(key) ?? { meaningful: 0, draining: 0 };
		if (e.category === 'meaningful') totals.meaningful += e.duration;
		if (e.category === 'draining') totals.draining += e.duration;
		daily.set(key, totals);
	}

	let count = 0;
	const cursor = new Date();
	const todayTotals = daily.get(dateKey(cursor));
	if (!todayTotals || todayTotals.meaningful + todayTotals.draining === 0) {
		cursor.setDate(cursor.getDate() - 1);
	}
	const lastDate = dateKey(cursor);
	while (true) {
		const totals = daily.get(dateKey(cursor));
		if (!totals || totals.meaningful <= totals.draining) break;
		count += 1;
		cursor.setDate(cursor.getDate() - 1);
	}
	return { count, lastDate: count > 0 ? lastDate : '' };
}

function createStreakStore() {
	const store: Writable<StreakData> = writable(loadStreak());

	store.subscribe(saveStreak);

	function updateStreak() {
		store.set(calculateStreak());
	}

	function reset() {
		store.set({ count: 0, lastDate: '' });
	}

	return {
		subscribe: store.subscribe,
		updateStreak,
		reset,
		streak: store
	};
}

export const streakStore = createStreakStore();
