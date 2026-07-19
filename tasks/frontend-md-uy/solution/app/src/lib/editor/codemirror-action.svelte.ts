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
			if (options.isVisible) editorView.focus();
		},
		destroy: () => {
			editorView.destroy();
		}
	};
};
