import { writable, get, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { Category } from './entries';

interface UIState {
	filter: Category | 'all';
	search: string;
	showManualForm: boolean;
	showTagManager: boolean;
	showEditDialog: boolean;
	editEntryId: string | null;
	showDeleteConfirm: boolean;
	deleteEntryId: string | null;
	showHistoryPanel: boolean;
}

const store: Writable<UIState> = writable({
	filter: 'all',
	search: '',
	showManualForm: false,
	showTagManager: false,
	showEditDialog: false,
	editEntryId: null,
	showDeleteConfirm: false,
	deleteEntryId: null,
	showHistoryPanel: false
});

export const uiStore = {
	subscribe: store.subscribe,
	setFilter: (filter: Category | 'all') => store.update((s) => ({ ...s, filter })),
	setSearch: (search: string) => store.update((s) => ({ ...s, search })),
	toggleManualForm: () => store.update((s) => ({ ...s, showManualForm: !s.showManualForm })),
	closeManualForm: () => store.update((s) => ({ ...s, showManualForm: false })),
	toggleTagManager: () => store.update((s) => ({ ...s, showTagManager: !s.showTagManager })),
	closeTagManager: () => store.update((s) => ({ ...s, showTagManager: false })),
	openEditDialog: (id: string) => store.update((s) => ({ ...s, showEditDialog: true, editEntryId: id })),
	closeEditDialog: () => store.update((s) => ({ ...s, showEditDialog: false, editEntryId: null })),
	openDeleteConfirm: (id: string) => store.update((s) => ({ ...s, showDeleteConfirm: true, deleteEntryId: id })),
	closeDeleteConfirm: () => store.update((s) => ({ ...s, showDeleteConfirm: false, deleteEntryId: null })),
	toggleHistoryPanel: () => store.update((s) => ({ ...s, showHistoryPanel: !s.showHistoryPanel })),
	closeHistoryPanel: () => store.update((s) => ({ ...s, showHistoryPanel: false })),
	ui: store
};

export const filterStore = derived(store, (s) => s.filter);
export const searchStore = derived(store, (s) => s.search);
