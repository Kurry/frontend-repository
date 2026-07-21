import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameResult } from '../game/types';
import { parseImport, formatDuration, formatEndedAt } from '../game/io';

const INK = '#0052A3';
const ERROR = '#B42318';

const btnSecondary: React.CSSProperties = {
  color: INK,
  border: 'none',
  borderRadius: '1000px',
  padding: '10px 16px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  minHeight: '44px',
};

const MatchHistory: React.FC = () => {
  const matchHistory = useGameStore((s) => s.matchHistory);
  const addToast = useGameStore((s) => s.addToast);
  const importRuns = useGameStore((s) => s.importRuns);
  const openExportHistory = useGameStore((s) => s.openExportHistory);
  const openExportRun = useGameStore((s) => s.openExportRun);
  const importSurfaceVisible = useGameStore((s) => s.importSurfaceVisible);

  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importBtnRef = useRef<HTMLButtonElement>(null);
  const errorId = 'history-import-error';

  // The WebMCP import handler cannot pass file bytes (contract restriction), so
  // it makes the import surface visible and hands control back to Playwright;
  // reflect that by focusing the Import control so the surface is operable.
  useEffect(() => {
    if (importSurfaceVisible && importBtnRef.current) {
      importBtnRef.current.focus();
    }
  }, [importSurfaceVisible]);

  const triggerImport = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => setImportError('File is invalid: the file could not be read.');
    reader.onload = (event) => {
      const text = typeof event.target?.result === 'string' ? event.target.result : '';
      const decision = parseImport(text);
      if (!decision.ok || !decision.runs || !decision.mode) {
        setImportError(decision.error || 'File is invalid.');
        return;
      }
      importRuns(decision.runs, decision.mode);
      addToast(
        decision.mode === 'history'
          ? `History imported (${decision.runs.length} ${decision.runs.length === 1 ? 'run' : 'runs'})`
          : 'Run imported',
        'success',
      );
    };
    reader.readAsText(file);
  };

  // The hidden file input is rendered once per visible branch (only one branch
  // is mounted at a time) so `fileInputRef` always points at a live node — both
  // the empty-state Import button and the populated-header Import button call
  // `triggerImport`, which clicks this input. Mounting it only in the empty
  // state previously left the populated header's Import button pointing at a
  // null ref, so its file picker never opened.
  const hiddenInput = (
    <input
      type="file"
      accept=".json,application/json"
      style={{ display: 'none' }}
      ref={fileInputRef}
      onChange={handleFileChange}
      aria-hidden="true"
      tabIndex={-1}
    />
  );

  const importControl = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <button
        ref={importBtnRef}
        className="ld-btn-secondary"
        onClick={triggerImport}
        aria-label="Import run or history JSON"
        aria-describedby={importError ? errorId : undefined}
        style={btnSecondary}
      >
        Import
      </button>
      {importError && (
        <p id={errorId} role="alert" style={{ color: ERROR, fontSize: '13px', fontWeight: 600, margin: 0, textAlign: 'center' }}>
          {importError}
        </p>
      )}
    </div>
  );

  if (matchHistory.length === 0) {
    return (
      <div style={{ padding: '32px 20px', textAlign: 'center', color: '#6B6B70' }}>
        {hiddenInput}
        <div aria-hidden="true" style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
        <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#1D1D1E', marginBottom: '6px' }}>
          No games yet
        </h2>
        <p style={{ fontSize: '15px', color: '#4F4F55', margin: '0 0 20px' }}>
          Finish a run and it will appear here, most recent first. Or import a previously exported
          LetterDrop JSON to restore it.
        </p>
        {importControl}
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 18px' }}>
      {hiddenInput}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1D1D1E', margin: 0 }}>Match history</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="ld-btn-secondary" onClick={() => openExportHistory()} aria-label="Export History" style={{ ...btnSecondary, padding: '10px 14px' }}>
            Export History
          </button>
          <button ref={importBtnRef} className="ld-btn-secondary" onClick={triggerImport} aria-label="Import run or history JSON" aria-describedby={importError ? errorId : undefined} style={{ ...btnSecondary, padding: '10px 14px' }}>
            Import
          </button>
        </div>
      </div>

      {importError && (
        <p id={errorId} role="alert" style={{ color: ERROR, fontSize: '13px', fontWeight: 600, margin: '0 0 12px' }}>
          {importError}
        </p>
      )}

      <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none', margin: 0, padding: 0 }}>
        {matchHistory.map((record, index) => (
          <HistoryRow key={`${record.endedAt}-${record.score}-${index}`} record={record} index={index} onExport={openExportRun} />
        ))}
      </ul>
    </div>
  );
};

const HistoryRow: React.FC<{ record: GameResult; index: number; onExport: (r: GameResult) => void }> = ({ record, index, onExport }) => (
  <li
    className={index === 0 ? 'ld-row-in' : undefined}
    style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '10px',
      padding: '12px 14px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #EAEEF3',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '24px', color: INK, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {record.score}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
          <span style={{ fontSize: '13px', color: '#1D1D1E', fontWeight: 600 }}>
            {record.tilesCleared} tiles cleared
          </span>
          <span style={{ fontSize: '13px', color: '#4F4F55' }}>
            Tier {record.tierReached} • {formatDuration(record.durationSec)}
          </span>
          <span style={{ fontSize: '12px', color: '#6B6B70', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.playerName} • {formatEndedAt(record.endedAt)}
          </span>
        </div>
      </div>
      <button
        className="ld-btn-secondary"
        onClick={() => onExport(record)}
        aria-label={`Export run scoring ${record.score}`}
        style={{ ...btnSecondary, padding: '9px 14px', fontSize: '13px', flexShrink: 0 }}
      >
        Export
      </button>
    </div>
    {record.words.length > 0 && (
      <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {record.words.map((w, i) => (
          <span
            key={i}
            style={{
              backgroundColor: '#E6EEF7',
              color: INK,
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {w.word} +{w.points}
          </span>
        ))}
      </div>
    )}
  </li>
);

export default MatchHistory;
