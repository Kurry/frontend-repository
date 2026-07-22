import React, { useState } from 'react';
import { ShieldAlert, Check, RefreshCcw, Undo2, FileDown, FileUp, XCircle } from 'lucide-react';
import { exportArtifact, importArtifact } from '../utils/artifact';

export default function AuditLens({
  records,
  setRecords,
  selectedId,
  derived,
  setDerived,
  history,
  setHistory,
  onUndo
}) {
  const [evidenceInput, setEvidenceInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [importContent, setImportContent] = useState('');
  const [showImport, setShowImport] = useState(false);

  const selectedRecord = records.find(r => r.id === selectedId);

  const handleResolve = () => {
    if (!selectedRecord) return;

    // Conflict/Incomplete check
    if (!evidenceInput.trim() || evidenceInput.length < 5) {
      setErrorMsg('A conflicting or incomplete mutation is rejected without partial updates. Provide valid evidence.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const updatedRecord = {
      ...selectedRecord,
      status: 'resolved',
      evidence: evidenceInput,
      auditDiscrepancy: false
    };

    setRecords(records.map(r => r.id === selectedId ? updatedRecord : r));

    // Update derived state
    const newDerived = {
      ...derived,
      resolvedCount: (derived.resolvedCount || 0) + 1,
      lastAuditTime: Date.now()
    };
    setDerived(newDerived);

    // Save history for undo
    setHistory(prev => [...prev, {
      type: 'AUDIT_RESOLVE',
      previousRecord: selectedRecord,
      previousDerived: derived,
      timestamp: Date.now()
    }]);

    setEvidenceInput('');
  };

  const handleExport = () => {
    exportArtifact({ records, derived, history });
  };

  const handleImport = () => {
    if (!importContent.trim()) return;
    const result = importArtifact(importContent);
    if (result) {
      setRecords(result.records);
      setDerived(result.derived);
      setHistory(result.history);
      setShowImport(false);
      setImportContent('');
    } else {
      setErrorMsg('Malformed schema, duplicate IDs, unknown references, or invalid bounds make no state change. Invalid import is a no-op.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleClear = () => {
    setRecords([]);
    setDerived({});
    setHistory([]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
        <h1 className="text-xl font-bold text-gray-800">Audit Lens Workbench</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={onUndo}
            disabled={history.length === 0}
            className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </button>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <button
            onClick={handleClear}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Clear all state"
          >
            <RefreshCcw size={18} />
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Import artifact"
          >
            <FileUp size={18} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Export artifact"
          >
            <FileDown size={18} />
          </button>
        </div>
      </div>

      {showImport && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <textarea
            className="w-full h-32 p-2 text-xs font-mono border rounded mb-2"
            placeholder="Paste cloze-deck-v1.json content here..."
            value={importContent}
            onChange={e => setImportContent(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowImport(false)}
              className="px-3 py-1 text-sm bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-3 py-1 text-sm text-white bg-blue-600 rounded"
            >
              Import
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-100 text-red-700 flex items-center shadow-inner">
          <XCircle size={18} className="mr-2" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      <div className="flex-1 p-6 overflow-y-auto">
        {selectedRecord ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className={`p-6 rounded-xl border shadow-sm transition-all duration-300 transform ${
              selectedRecord.status === 'resolved' ? 'bg-green-50 border-green-200 translate-y-0' :
              selectedRecord.status === 'conflict' ? 'bg-red-50 border-red-200 -translate-y-1' :
              'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Primary Record</h3>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  selectedRecord.status === 'resolved' ? 'bg-green-200 text-green-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {selectedRecord.status}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Front</div>
                  <div className="text-lg font-medium">{selectedRecord.front || <span className="text-gray-400 italic">Empty</span>}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Back (Cloze)</div>
                  <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm">{selectedRecord.back || <span className="text-gray-400 italic">Empty</span>}</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <ShieldAlert className="mr-2 text-blue-600" size={20} />
                Audit Discrepancy
              </h3>

              {selectedRecord.status === 'resolved' ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex flex-col items-center justify-center space-y-2">
                  <Check size={32} className="text-green-600" />
                  <div className="font-semibold">Discrepancy Resolved</div>
                  <div className="text-sm">Evidence: {selectedRecord.evidence}</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Attach evidence to this selected record to resolve the audit discrepancy.
                  </p>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    rows="3"
                    placeholder="Enter evidence URL or details here (min 5 chars)..."
                    value={evidenceInput}
                    onChange={e => setEvidenceInput(e.target.value)}
                  />
                  <button
                    onClick={handleResolve}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex justify-center items-center"
                  >
                    Attach Evidence & Resolve
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
               <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Derived Summary</h3>
               <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-gray-50 rounded border">
                   <div className="text-xs text-gray-500">Total Records</div>
                   <div className="text-xl font-bold">{records.length}</div>
                 </div>
                 <div className="p-3 bg-gray-50 rounded border">
                   <div className="text-xs text-gray-500">Resolved Audit</div>
                   <div className="text-xl font-bold">{derived.resolvedCount || 0}</div>
                 </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <ShieldAlert size={48} className="mb-4 text-gray-300" />
            <p className="text-lg">Select a record from the collection to view in Audit Lens</p>
          </div>
        )}
      </div>
    </div>
  );
}
