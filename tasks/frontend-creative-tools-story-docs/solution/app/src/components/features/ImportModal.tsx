import { useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { importScenes } from '@/store';
import { isImportModalOpenStore, showToast } from '@/store/ui';
import { parseStoryboardPackage } from '@/lib/schema';
import { useDialogFocus } from '../common/useDialogFocus';
import { Ri } from '../common/Ri';
import { clsx } from 'clsx';

export function ImportModal() {
  const isOpen = useStore(isImportModalOpenStore);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const currentValidation = jsonInput.trim() ? parseStoryboardPackage(jsonInput) : null;
  const canImport = currentValidation?.ok === true;

  const close = () => {
    isImportModalOpenStore.set(false);
    setError(null);
  };
  useDialogFocus(isOpen, close, panelRef, { initialFocus: textareaRef });

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const contents = String(reader.result ?? '');
      const parsed = contents.trim() ? parseStoryboardPackage(contents) : null;
      setJsonInput(contents);
      setError(parsed && !parsed.ok ? parsed.error : null);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!jsonInput.trim()) {
      setError('Paste a StoryboardPackage JSON (or choose a file) before importing.');
      return;
    }
    const parsed = parseStoryboardPackage(jsonInput);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const count = importScenes(parsed.pkg.scenes);
    showToast(`Storyboard Imported — ${count} Scenes`);
    setJsonInput('');
    setError(null);
    isImportModalOpenStore.set(false);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" role="presentation">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" aria-hidden="true" onClick={close} />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-modal-title"
          tabIndex={-1}
          className="form-enter relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-200/70">
                <Ri name="upload-2-line" size={18} />
              </span>
              <div>
                <h2 id="import-modal-title" className="text-base font-bold tracking-tight text-gray-900">
                  Import StoryboardPackage
                </h2>
                <p className="text-xs text-gray-500">Paste a previously exported JSON package, or choose a file</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close import dialog"
              onClick={close}
              className="grid h-11 w-11 place-items-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              <Ri name="close-line" size={20} />
            </button>
          </div>

          <div className="px-5 py-4">
            <label htmlFor="import-json" className="sr-only">
              StoryboardPackage JSON
            </label>
            <textarea
              id="import-json"
              ref={textareaRef}
              rows={9}
              spellCheck={false}
              placeholder={'{\n  "schemaVersion": 1,\n  "project": "Demo Projects",\n  "storyboard": "1. Getting Started",\n  "scenes": [ … ]\n}'}
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setError(null);
              }}
              onBlur={(event) => {
                const value = event.currentTarget.value;
                if (!value.trim()) {
                  setError(null);
                  return;
                }
                const validation = parseStoryboardPackage(value);
                setError(!validation.ok ? validation.error : null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'import-error' : undefined}
              className={clsx(
                'w-full resize-y rounded-xl border bg-[#fafaf8] p-3 font-mono text-xs leading-relaxed text-gray-800 shadow-inner transition-colors placeholder:text-gray-400',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
                error ? 'border-red-400 bg-red-50/40' : 'border-gray-300'
              )}
            />
            {error && (
              <p id="import-error" role="alert" className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-red-600">
                <Ri name="alert-line" size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              aria-label="Choose a StoryboardPackage JSON file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-[#fafaf8] px-5 py-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              <Ri name="file-text-line" size={16} />
              Choose File
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={close}
                className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!canImport}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-yellow-950 shadow-sm shadow-yellow-400/40 transition-all hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <Ri name="upload-2-line" size={16} />
                Import
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
