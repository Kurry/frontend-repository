import * as Y from 'yjs';
import { initCodemirror } from './initCodemirror';

interface CodeMirrorOptions {
	ytext: Y.Text;
	isVisible: boolean;
}

export const codemirror = (node: HTMLElement, { ytext, isVisible }: CodeMirrorOptions) => {
	const { editorView } = initCodemirror(node, ytext);

	if (isVisible) editorView.focus();

	return {
		update(options: CodeMirrorOptions) {
			// Only focus when becoming visible — never steal focus while Present/Preview.
			if (options.isVisible && !isVisible) {
				editorView.focus();
			}
			isVisible = options.isVisible;
			if (!options.isVisible) {
				editorView.contentDOM.blur();
			}
		},
		destroy: () => {
			editorView.destroy();
		}
	};
};
