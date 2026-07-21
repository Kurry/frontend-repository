import { useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { scenesStore } from '@/store';
import { isExportDrawerOpenStore, exportFormatStore, showToast } from '@/store/ui';
import { compileArtifact, artifactFilename, EXPORT_FORMATS, type ExportFormat } from '@/lib/exporters';
import { useDialogFocus } from '../common/useDialogFocus';
import { Ri } from '../common/Ri';
import { clsx } from 'clsx';

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function ExportDrawer() {
  const isOpen = useStore(isExportDrawerOpenStore);
  const format = useStore(exportFormatStore);
  const scenes = useStore(scenesStore);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = () => isExportDrawerOpenStore.set(false);
  useDialogFocus(isOpen, close, panelRef, { initialFocus: closeRef });

  const content = isOpen ? compileArtifact(scenes, format) : '';

  const handleCopy = async (fmt: ExportFormat = format) => {
    const ok = await copyTextToClipboard(compileArtifact(scenesStore.get(), fmt));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    showToast(ok ? 'Copied to Clipboard' : 'Copy Failed');
  };

  const handleDownload = () => {
    const text = compileArtifact(scenesStore.get(), format);
    const blob = new Blob([text], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifactFilename(format);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Download Started');
  };

  const TAB_LABELS: Record<ExportFormat, string> = { markdown: 'Markdown', json: 'JSON', outline: 'Outline' };

  return (
    <div className={clsx('fixed inset-0 z-50 overflow-hidden', !isOpen && 'pointer-events-none')} aria-hidden={!isOpen}>
      <div
        className={clsx(
          'absolute inset-0 bg-gray-900/40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={close}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Export storyboard"
        tabIndex={-1}
        className={clsx(
          'absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-white shadow-2xl',
          isOpen ? 'panel-open translate-x-0' : 'panel-closed translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-200/70">
              <Ri name="download-2-line" size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight text-gray-900">Export Storyboard</h2>
              <p className="text-xs text-gray-500">Live artifacts — regenerated from the current board</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close export drawer"
            onClick={close}
            className="grid h-11 w-11 place-items-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <Ri name="close-line" size={20} />
          </button>
        </div>

        <div className="border-b border-gray-200 bg-[#fafaf8]" role="tablist" aria-label="Export format">
          {EXPORT_FORMATS.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={format === tab}
              onClick={() => exportFormatStore.set(tab)}
              className={clsx(
                '-mb-px inline-flex h-12 items-center gap-1.5 border-b-2 px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
                format === tab
                  ? 'border-yellow-500 text-yellow-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
              )}
            >
              <Ri name={tab === 'json' ? 'file-text-line' : tab === 'markdown' ? 'file-copy-line' : 'list-unordered'} size={15} />
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f7f7f4] p-4">
          <pre
            aria-label={`${format} preview`}
            className="h-full min-h-64 overflow-x-auto whitespace-pre-wrap rounded-xl border border-gray-200 bg-white p-4 font-mono text-[12.5px] leading-relaxed text-gray-800 shadow-inner"
          >
            {content}
          </pre>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-gray-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={() => handleCopy()}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <Ri name={copied ? 'check-line' : 'file-copy-line'} size={16} className={copied ? 'text-emerald-600' : undefined} />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-yellow-950 shadow-sm shadow-yellow-400/40 transition-all hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
          >
            <Ri name="download-2-line" size={16} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
