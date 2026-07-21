// Right region: Schema text / Example / Format Prompt tabs, each derived
// live from the shared tree. Copy controls confirm visibly; the Format
// tab feeds the in-app prompt draft drawer.
import React, { useMemo } from 'react';
import { Copy, Renew, ArrowDown } from '@carbon/icons-react';
import { useStore, activeSchema, displayedTree, compiledText, formatText } from './store.js';
import { generateExample } from './lib.js';
import { Tabs, TabPanel, CodeSurface, Modal } from './ui.jsx';

export default function OutputPanes() {
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const sc = useStore(activeSchema);
  const tree = useStore(displayedTree);
  const text = useStore(compiledText);
  const format = useStore(formatText);
  const nonce = useStore((s) => s.exampleNonce);
  const example = useMemo(
    () => (sc && sc.exampleOverride ? sc.exampleOverride : generateExample(tree || { children: [] })),
    [sc?.exampleOverride, tree, nonce],
  );
  const copyText = useStore((s) => s.copyText);
  const regenerateExample = useStore((s) => s.regenerateExample);
  const insertIntoPromptDraft = useStore((s) => s.insertIntoPromptDraft);
  const promptDrawerOpen = useStore((s) => s.promptDrawerOpen);
  const setPromptDrawerOpen = useStore((s) => s.setPromptDrawerOpen);
  const promptDraft = useStore((s) => s.promptDraft);
  const setPromptDraft = useStore((s) => s.setPromptDraft);

  const exampleText = sc ? JSON.stringify(example, null, 2) : '';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Tabs
        id="output"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'schema', label: 'Schema text' },
          { id: 'example', label: 'Example' },
          { id: 'format', label: 'Format Prompt' },
        ]}
      />
      <div className="relative min-h-0 flex-1">
        {tab === 'schema' && (
          <TabPanel id="output" tab="schema" className="flex flex-col">
            <div className="pane-toolbar">
              <span className="muted text-xs">draft-07 · updates live with every edit</span>
              <span className="ml-auto flex gap-1.5">
                <button type="button" className="btn btn-ghost tap" onClick={() => copyText(text, 'compiled schema')}>
                  <Copy size={13} aria-hidden="true" /> Copy
                </button>
              </span>
            </div>
            <CodeSurface text={text} label="Compiled draft-07 JSON Schema" emptyHint="Add a field to compile the schema." />
          </TabPanel>
        )}
        {tab === 'example' && (
          <TabPanel id="output" tab="example" className="flex flex-col">
            <div className="pane-toolbar">
              <span className="muted text-xs">satisfies the current schema</span>
              <span className="ml-auto flex gap-1.5">
                <button type="button" className="btn btn-ghost tap" onClick={regenerateExample}>
                  <Renew size={13} aria-hidden="true" /> Regenerate
                </button>
                <button type="button" className="btn btn-ghost tap" onClick={() => copyText(exampleText, 'example payload')}>
                  <Copy size={13} aria-hidden="true" /> Copy
                </button>
              </span>
            </div>
            <CodeSurface text={exampleText} label="Generated example payload" emptyHint="The example for an empty schema is {}." />
          </TabPanel>
        )}
        {tab === 'format' && (
          <TabPanel id="output" tab="format" className="flex flex-col gap-2">
            <div className="pane-toolbar">
              <span className="muted text-xs">paste-ready prompt instruction</span>
              <span className="ml-auto flex gap-1.5">
                <button type="button" className="btn btn-ghost tap" onClick={() => copyText(format, 'format instruction')}>
                  <Copy size={13} aria-hidden="true" /> Copy
                </button>
                <button type="button" className="btn btn-primary tap" onClick={insertIntoPromptDraft}>
                  <ArrowDown size={13} aria-hidden="true" /> Insert into prompt draft
                </button>
              </span>
            </div>
            <p className="format-text" aria-label="Format instruction">
              {format || 'Add fields to generate the instruction.'}
            </p>
            <button type="button" className="btn btn-ghost tap self-start" onClick={() => setPromptDrawerOpen(true)}>
              Open prompt draft
            </button>
          </TabPanel>
        )}
      </div>

      <Modal open={promptDrawerOpen} onClose={() => setPromptDrawerOpen(false)} title="Prompt draft" wide>
        <label className="field-label" htmlFor="prompt-draft">
          Prompt draft — the inserted format instruction lands here and stays editable
        </label>
        <textarea
          id="prompt-draft"
          className="input input-area mono min-h-40"
          value={promptDraft}
          onChange={(e) => setPromptDraft(e.target.value)}
        />
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost tap" onClick={() => copyText(promptDraft, 'prompt draft')}>
            <Copy size={13} aria-hidden="true" /> Copy draft
          </button>
          <button type="button" className="btn btn-primary tap" onClick={() => setPromptDrawerOpen(false)}>
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
