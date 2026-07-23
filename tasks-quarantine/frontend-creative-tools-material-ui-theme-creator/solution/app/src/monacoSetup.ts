// Self-host Monaco Editor — no CDN. @monaco-editor/react defaults to loading
// the editor from jsdelivr; loader.config({ monaco }) forces the locally
// bundled copy, and MonacoEnvironment wires the bundled web workers.
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  }
};

loader.config({ monaco });

export { monaco };
