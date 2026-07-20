import React, { useState } from 'react';
import { useStore } from '../store';
import { Icon, Modal } from './primitives';

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ArtifactPane({ label, text, mime, filename }: { label: string; text: string; mime: string; filename: string }) {
  const copyText = useStore((s) => s.copyText);
  const pushToast = useStore((s) => s.pushToast);
  const announce = useStore((s) => s.announce);
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-sm font-medium">{label}</h3>
        <div className="ml-auto flex gap-1.5">
          <button type="button" onClick={() => copyText(text, label)} className="lift bg-shell-2 text-shell-text text-xs px-2.5 py-1 rounded flex items-center gap-1">
            <Icon name="content_copy" style={{ fontSize: 14 }} />
            Copy
          </button>
          <button
            type="button"
            onClick={() => {
              download(filename, text, mime);
              pushToast(`${label} downloaded`);
              announce(`${label} file downloaded`);
            }}
            className="lift bg-shell-2 text-shell-text text-xs px-2.5 py-1 rounded flex items-center gap-1"
          >
            <Icon name="download" style={{ fontSize: 14 }} />
            Download
          </button>
        </div>
      </div>
      <pre
        data-testid={`artifact-${label.toLowerCase()}`}
        className="flex-1 bg-shell text-xs text-shell-text font-mono p-3 rounded-lg border border-shell-border overflow-auto scrollbar-thin whitespace-pre"
        style={{ maxHeight: 300, fontFamily: '"Roboto Mono", ui-monospace, monospace' }}
      >
        {text}
      </pre>
    </div>
  );
}

export function ThemeFilesDrawer() {
  const open = useStore((s) => s.exportOpen);
  const setOpen = useStore((s) => s.setExportOpen);
  const json = useStore((s) => s.jsonArtifact());
  const css = useStore((s) => s.cssArtifact());

  return (
    <Modal open={open} onClose={() => setOpen(false)} labelledBy="theme-files-title" width={620} variant="drawer">
      <div className="p-5 flex flex-col gap-4 h-full">
        <div className="flex items-center gap-2">
          <Icon name="folder_zip" className="text-accent" />
          <h2 id="theme-files-title" className="text-lg font-semibold">
            Theme Files
          </h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close Theme Files" className="lift ml-auto bg-shell-2 rounded p-1.5">
            <Icon name="close" style={{ fontSize: 18 }} />
          </button>
        </div>
        <p className="text-xs text-shell-muted">
          Both artifacts regenerate from the live theme options. The JSON package is a single re-importable object
          conforming to the name / paletteType / themeOptions field contract.
        </p>
        <ArtifactPane label="JSON" text={json} mime="application/json" filename="theme.json" />
        <ArtifactPane label="CSS" text={css} mime="text/css" filename="theme.css" />
      </div>
    </Modal>
  );
}

export function ImportDialog() {
  const open = useStore((s) => s.importOpen);
  const setOpen = useStore((s) => s.setImportOpen);
  const importPackage = useStore((s) => s.importPackage);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const res = importPackage(text);
    if (!res.ok) {
      setError(res.error ?? 'Import failed');
    } else {
      setError(null);
      setText('');
      setOpen(false);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => setText(t));
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} labelledBy="import-title" width={560}>
      <div className="p-5">
        <h2 id="import-title" className="text-lg font-semibold mb-2">
          Import Theme Package
        </h2>
        <p className="text-xs text-shell-muted mb-3">
          Paste or choose a declared-theme JSON package. It must conform to the name / paletteType / themeOptions field
          contract (palette.type equal to paletteType, #RRGGBB mains, fontSize 10–24 when present, shape.borderRadius
          0–24).
        </p>
        <input type="file" accept="application/json,.json" onChange={onFile} aria-label="Choose theme JSON file" className="text-xs mb-2 block" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Theme package JSON"
          placeholder='{ "name": "My Theme", "paletteType": "light", "themeOptions": { ... } }'
          rows={8}
          className="w-full bg-shell-2 text-shell-text text-xs font-mono px-3 py-2 rounded-md border border-shell-border"
        />
        <div className="min-h-[20px] mt-1" aria-live="polite">
          {error && (
            <span className="text-xs text-red-300" role="alert">
              {error}
            </span>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={() => setOpen(false)} className="lift bg-shell-2 text-shell-text px-4 py-2 rounded-md text-sm">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={!text.trim()} className="lift bg-accent text-white px-4 py-2 rounded-md text-sm disabled:opacity-40">
            Import Theme
          </button>
        </div>
      </div>
    </Modal>
  );
}
