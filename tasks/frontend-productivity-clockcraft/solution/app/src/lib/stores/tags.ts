import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';

const STORAGE_KEY = 'clockcraft_tags';

function loadTags(): string[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = null;
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveTags(tags: string[]) {
	if (typeof localStorage === 'undefined') return;

}

function createTagsStore() {
	const store: Writable<string[]> = writable(loadTags());

	store.subscribe((tags) => {
		saveTags(tags);
	});

	function addTag(tag: string): boolean {
		const trimmed = tag.trim();
		if (!trimmed) return false;
		const current = get(store);
		if (current.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return false;
		store.update((tags) => [...tags, trimmed]);
		return true;
	}

	function removeTag(tag: string) {
		store.update((tags) => tags.filter((t) => t !== tag));
	}

	return {
		subscribe: store.subscribe,
		addTag,
		removeTag,
		tags: store
	};
}

export const tagsStore = createTagsStore();
