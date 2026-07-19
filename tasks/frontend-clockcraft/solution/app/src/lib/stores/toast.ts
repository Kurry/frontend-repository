import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface Toast {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info';
}

function createToastStore() {
	const store: Writable<Toast[]> = writable([]);

	function addToast(message: string, type: Toast['type'] = 'success') {
		const id = `${Date.now()}-${Math.random()}`;
		store.update((toasts) => [...toasts, { id, message, type }]);
		setTimeout(() => {
			store.update((toasts) => toasts.filter((t) => t.id !== id));
		}, 3000);
	}

	function removeToast(id: string) {
		store.update((toasts) => toasts.filter((t) => t.id !== id));
	}

	return {
		subscribe: store.subscribe,
		addToast,
		removeToast
	};
}

export const toastStore = createToastStore();
