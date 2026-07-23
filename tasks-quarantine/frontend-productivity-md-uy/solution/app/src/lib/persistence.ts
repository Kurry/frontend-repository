/** Dual-write localStorage mirror so reloads restore even if IndexedDB is flaky. */

const keyFor = (roomId: string) => `mduy-doc:${roomId}`;

export function loadDocument(roomId: string): string | null {
	try {
		return localStorage.getItem(keyFor(roomId));
	} catch {
		return null;
	}
}

export function saveDocument(roomId: string, markdown: string): void {
	try {
		localStorage.setItem(keyFor(roomId), markdown);
	} catch {
		/* storage optional */
	}
}
