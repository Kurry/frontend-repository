import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';
import { Y_TEXT_KEY } from '../constants';

export const initYjs = (
	id: string
): Promise<{
	ydoc: Y.Doc;
	persistence: IndexeddbPersistence;
	ytext: Y.Text;
	cleanup: () => void;
}> => {
	return new Promise((resolve) => {
		const ydoc = new Y.Doc();
		const persistence = new IndexeddbPersistence(id, ydoc);
		const ytext = ydoc.getText(Y_TEXT_KEY);

		const cleanup = () => {
			persistence.destroy();
			ydoc.destroy();
		};

		let settled = false;
		const finish = () => {
			if (settled) return;
			settled = true;
			resolve({ ydoc, persistence, ytext, cleanup });
		};

		// IndexedDB is authoritative. Do not resolve on a timer: doing so lets the
		// caller seed/mirror text before a late persisted update is applied to this
		// same Y.Doc, which can duplicate document content on reload.
		persistence.on('synced', finish);
	});
};
