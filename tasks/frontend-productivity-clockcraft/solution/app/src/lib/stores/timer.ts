import { writable, get, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { Category } from './entries';

export interface TimerState {
	running: boolean;
	name: string;
	category: Category;
	tag: string;
	startTime: number | null;
	elapsed: number; // seconds
}

const STORAGE_KEY = 'clockcraft_timer';

function loadTimer(): TimerState {
	if (typeof localStorage === 'undefined') {
		return { running: false, name: '', category: 'neutral', tag: '', startTime: null, elapsed: 0 };
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const state = JSON.parse(raw);
			// If timer was running, recalc elapsed
			if (state.running && state.startTime) {
				state.elapsed = Math.floor((Date.now() - state.startTime) / 1000);
			}
			return state;
		}
	} catch { /* ignore */ }
	return { running: false, name: '', category: 'neutral', tag: '', startTime: null, elapsed: 0 };
}

function saveTimer(state: TimerState) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createTimerStore() {
	const store: Writable<TimerState> = writable(loadTimer());

	store.subscribe(saveTimer);

	let intervalId: ReturnType<typeof setInterval> | null = null;

	function beginTicker() {
		if (intervalId) clearInterval(intervalId);
		intervalId = setInterval(() => {
			store.update((state) => state.running && state.startTime
				? { ...state, elapsed: Math.floor((Date.now() - state.startTime) / 1000) }
				: state
			);
		}, 1000);
	}

	if (get(store).running) beginTicker();

	function startTimer(name: string, category: Category, tag: string) {
		const now = Date.now();
		const state: TimerState = {
			running: true,
			name: name.trim(),
			category,
			tag,
			startTime: now,
			elapsed: 0
		};
		store.set(state);

		beginTicker();
	}

	function stopTimer(): { name: string; category: Category; tag: string; startTime: number; duration: number } | null {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
		const state = get(store);
		if (!state.running || !state.startTime) {
			store.set({ running: false, name: '', category: 'neutral', tag: '', startTime: null, elapsed: 0 });
			return null;
		}
		const durationMinutes = Math.max(1, Math.round(state.elapsed / 60));
		const result = {
			name: state.name,
			category: state.category,
			tag: state.tag,
			startTime: state.startTime,
			duration: durationMinutes
		};
		store.set({ running: false, name: '', category: 'neutral', tag: '', startTime: null, elapsed: 0 });
		return result;
	}

	function reset() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
		store.set({ running: false, name: '', category: 'neutral', tag: '', startTime: null, elapsed: 0 });
	}

	return {
		subscribe: store.subscribe,
		startTimer,
		stopTimer,
		reset,
		timer: store
	};
}

export const timerStore = createTimerStore();
