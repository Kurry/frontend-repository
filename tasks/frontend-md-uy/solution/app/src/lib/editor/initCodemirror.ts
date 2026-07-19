import * as Y from 'yjs';
import { yCollab } from 'y-codemirror.next';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';

export const initCodemirror = (node: HTMLElement, ytext: Y.Text) => {
	const undoManager = new Y.UndoManager(ytext);

	const extensions = [
		basicSetup,
		markdown(),
		theme,
		EditorView.lineWrapping,
		yCollab(ytext, null, { undoManager })
	];

	const editorState = EditorState.create({
		doc: ytext.toString(),
		extensions
	});

	const editorView = new EditorView({
		state: editorState,
		parent: node
	});

	return { editorView };
};

const theme = EditorView.theme({
	'&': {
		height: '100%',
		fontSize: '0.92rem',
		backgroundColor: 'var(--card)',
		color: 'var(--foreground)'
	},
	'&.cm-focused': {
		outline: 'none'
	},
	'&.cm-focused .cm-cursor': {
		borderLeftColor: 'var(--foreground)'
	},
	'.cm-content': {
		fontFamily: 'var(--font-mono)',
		'padding-inline': '2rem',
		'padding-block': '1.5rem',
		'line-height': '1.6'
	},
	'.cm-gutters': {
		display: 'none'
	},
	'.cm-activeLine': {
		backgroundColor: 'transparent'
	},
	'.cm-activeLineGutter': {
		backgroundColor: 'transparent'
	}
});
