import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useDialog } from './useDialog';

const INK = '#0052A3';

const ExportDialog: React.FC = () => {
  const preview = useGameStore((s) => s.exportPreview);
  const closeExport = useGameStore((s) => s.closeExport);
  const copyExport = useGameStore((s) => s.copyExport);

  const dialogRef = useDialog(Boolean(preview), closeExport);

  const handleDownload = () => {
    if (!preview) return;
    try {
      const blob = new Blob([preview.json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = preview.title === 'Export History' ? 'history' : 'run';
      a.download = `letterdrop-${slug}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      /* download is best-effort; the copy + preview paths still work */
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="export-title"
      style={{
        border: 'none',
        borderRadius: '12px',
        padding: 0,
        width: 'min(94vw, 520px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
        color: '#1D1D1E',
      }}
    >
      <div style={{ padding: '20px 22px 22px' }}>
        <h2 id="export-title" style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px' }}>
          {preview?.title ?? 'Export'}
        </h2>
        <pre
          aria-label="Export JSON preview"
          style={{
            backgroundColor: '#0F1722',
            color: '#E6EEF7',
            padding: '14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            lineHeight: 1.5,
            overflowX: 'auto',
            maxHeight: '46vh',
            margin: '0 0 16px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
          }}
        >
          {preview?.json ?? ''}
        </pre>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={closeExport}
            className="ld-btn-secondary"
            style={{ color: INK, border: 'none', borderRadius: '1000px', padding: '10px 18px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', minHeight: '44px' }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void copyExport()}
            className="ld-btn-secondary"
            style={{ color: INK, border: 'none', borderRadius: '1000px', padding: '10px 18px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', minHeight: '44px' }}
          >
            Copy
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="ld-btn-primary"
            style={{ color: '#FEFEFE', border: 'none', borderRadius: '1000px', padding: '10px 22px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', minHeight: '44px' }}
          >
            Download
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ExportDialog;
