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
			ydoc.destroy();
			persistence.destroy();
		};

		// Wait for IndexedDB to sync before resolving so a reload restores the doc.
		persistence.on('synced', () => {
			resolve({ ydoc, persistence, ytext, cleanup });
		});
	});
};
