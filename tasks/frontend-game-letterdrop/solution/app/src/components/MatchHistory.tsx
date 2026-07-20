import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { MatchRecord } from '../game/types';

const MatchHistory: React.FC = () => {
  const matchHistory = useGameStore(state => state.matchHistory);
  const addToast = useGameStore(state => state.addToast);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  useEffect(() => {
    if (previewData && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    } else if (!previewData && dialogRef.current && dialogRef.current.open) {
      dialogRef.current.close();
    }
  }, [previewData]);

  const handleExportHistory = () => {
    const historyExport = {
      format: 'letterdrop-history-v1',
      schemaVersion: 1,
      runs: matchHistory
    };
    setPreviewData(JSON.stringify(historyExport, null, 2));
  };

  const handleExportRun = (run: MatchRecord) => {
    setPreviewData(JSON.stringify(run, null, 2));
  };

  const copyToClipboard = () => {
    if (previewData) {
      navigator.clipboard.writeText(previewData);
      addToast('Copied', 'success');
    }
  };

  const downloadFile = () => {
    if (!previewData) return;
    const blob = new Blob([previewData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `letterdrop-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        
        if (json.format === 'letterdrop-game-v1' && json.schemaVersion === 1) {
           useGameStore.getState().importHistory([json]);
           addToast('Run imported successfully', 'success');
        } else if (json.format === 'letterdrop-history-v1' && json.schemaVersion === 1 && Array.isArray(json.runs)) {
           useGameStore.getState().importHistory(json.runs);
           addToast('History imported successfully', 'success');
        } else {
           setImportError('File is invalid. format or schemaVersion does not match.');
        }
      } catch (err) {
        setImportError('File is invalid JSON.');
      }
      
      // Reset input
      if (fileInputRef.current) {
         fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  if (matchHistory.length === 0) {
    return (
      <div
        style={{
          padding: '32px 20px',
          textAlign: 'center',
          color: '#86868B',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
        <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#1D1D1E', marginBottom: '4px' }}>
          No games yet
        </h2>
        <div style={{ fontSize: '15px', color: '#4F4F55' }}>
          Complete a game to see your match history here
        </div>
        
        <div style={{ marginTop: '24px' }}>
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <button 
              className="ld-btn-secondary" 
              onClick={() => fileInputRef.current?.click()}
              style={{
                color: '#007AFF',
                border: '1px solid #66798B',
                borderRadius: '1000px',
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              Import
            </button>
            {importError && (
              <div style={{ color: '#FF3B30', fontSize: '13px', marginTop: '8px', fontWeight: 600 }}>
                {importError}
              </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2
          style={{
            fontSize: '17px',
            fontWeight: 600,
            color: '#1D1D1E',
          }}
        >
          Match history
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="ld-btn-secondary" 
            onClick={handleExportHistory}
            style={{
              color: '#007AFF',
              border: '1px solid #66798B',
              borderRadius: '1000px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Export History
          </button>
          
          <input 
            type="file" 
            accept=".json" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <button 
            className="ld-btn-secondary" 
            onClick={() => fileInputRef.current?.click()}
            style={{
              color: '#007AFF',
              border: '1px solid #66798B',
              borderRadius: '1000px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Import
          </button>
        </div>
      </div>
      
      {importError && (
        <div style={{ color: '#FF3B30', fontSize: '13px', marginBottom: '12px', fontWeight: 600 }}>
          {importError}
        </div>
      )}
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none' }}>
        {matchHistory.map((record, index) => {
          const minutes = Math.floor(record.durationSec / 60);
          const seconds = record.durationSec % 60;
          const date = new Date(record.endedAt);
          const dateStr = date.toLocaleDateString();

          return (
            <li
              key={index}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '20px', color: '#007AFF' }}>
                  {record.score}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '13px', color: '#4F4F55' }}>
                    {record.tilesCleared} tiles
                  </div>
                  <div style={{ fontSize: '11px', color: '#5F5F65' }}>
                    {record.playerName}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', color: '#4F4F55' }}>
                    {minutes}m {seconds}s
                  </div>
                  <div style={{ fontSize: '11px', color: '#5F5F65' }}>
                    {dateStr}
                  </div>
                </div>
                <button
                  className="ld-btn-secondary"
                  onClick={() => handleExportRun(record)}
                  aria-label="Export Run"
                  style={{
                    color: '#007AFF',
                    border: '1px solid #66798B',
                    borderRadius: '1000px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Export
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      
      <dialog 
        ref={dialogRef}
        onClose={() => setPreviewData(null)}
        style={{
          border: 'none',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '16px' }}>Export Preview</h3>
        <pre style={{
          backgroundColor: '#F5F5F7',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '13px',
          overflowX: 'auto',
          maxHeight: '300px',
          marginBottom: '16px',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}>
          {previewData}
        </pre>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button 
            className="ld-btn-secondary"
            onClick={() => dialogRef.current?.close()}
            style={{
              color: '#4F4F55',
              backgroundColor: '#E6EEF7',
              border: 'none',
              borderRadius: '1000px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button 
            className="ld-btn-secondary"
            onClick={copyToClipboard}
            style={{
              color: '#007AFF',
              border: '1px solid #66798B',
              borderRadius: '1000px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Copy
          </button>
          <button 
            className="ld-btn-primary"
            onClick={downloadFile}
            style={{
              color: '#FEFEFE',
              backgroundColor: '#007AFF',
              border: 'none',
              borderRadius: '1000px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Download
          </button>
        </div>
      </dialog>
    </div>
  );
};

export default MatchHistory;
