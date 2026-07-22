import { useState, useEffect } from 'react';
import type { HomeLibraryLendingLedgerSession, BookRecord, RecordStatus, AuditState } from './types';
import { Download, Upload, Undo2, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 9);

const INITIAL_RECORDS: BookRecord[] = Array.from({ length: 100 }, (_, i) => ({
  id: `book-${i}`,
  title: `Sample Book ${i + 1}`,
  author: `Author ${i % 10}`,
  status: ['draft', 'ready', 'changed', 'archived'][i % 4] as RecordStatus,
  auditState: ['idle', 'conflict', 'resolved'][i % 3] as AuditState,
  evidence: i % 3 === 1 ? 'Conflicting evidence found' : ''
}));

function App() {
  const [records, setRecords] = useState<BookRecord[]>(INITIAL_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [history, setHistory] = useState<BookRecord[][]>([INITIAL_RECORDS]);
  const [filter, setFilter] = useState<RecordStatus | 'all'>('all');

  const [evidenceText, setEvidenceText] = useState('');

  // Setup WebMCP
  useEffect(() => {
    (window as any).webmcp_session_info = () => ({
      version: 'zto-webmcp-v1',
      supported_modules: ['entity-collection-v1', 'artifact-transfer-v1']
    });

    (window as any).webmcp_list_tools = () => [
      { name: 'entity-create', description: 'Create a book' },
      { name: 'entity-select', description: 'Select a book' },
      { name: 'entity-update', description: 'Update a book' },
      { name: 'entity-delete', description: 'Delete a book' },
      { name: 'artifact-export', description: 'Export session' },
      { name: 'artifact-import', description: 'Import session' },
      { name: 'artifact-copy', description: 'Copy session' }
    ];

    (window as any).webmcp_invoke_tool = (name: string, args: any) => {
      switch (name) {
        case 'entity-create': {
          const newRecord = { ...args.entity, id: generateId() };
          const next = [...records, newRecord];
          setRecords(next);
          setHistory([...history, next]);
          return { success: true, result: newRecord };
        }
        case 'entity-select': {
          setSelectedRecordId(args.id);
          return { success: true };
        }
        case 'entity-update': {
          const next = records.map(r => r.id === args.id ? { ...r, ...args.entity } : r);
          setRecords(next);
          setHistory([...history, next]);
          return { success: true };
        }
        case 'entity-delete': {
          if (!args.confirm) return { success: false, error: 'confirm=true required' };
          const next = records.filter(r => r.id !== args.id);
          setRecords(next);
          setHistory([...history, next]);
          return { success: true };
        }
        case 'artifact-export': {
          return { success: true, result: generateExport() };
        }
        case 'artifact-import': {
          const valid = validateImport(args.content);
          if (valid) {
            setRecords(valid.records);
            setHistory([...history, valid.records]);
            return { success: true };
          }
          return { success: false, error: 'Invalid schema' };
        }
        case 'artifact-copy': {
           return { success: true, result: generateExport() };
        }
        default:
          return { success: false, error: 'Unknown tool' };
      }
    };
  }, [records, history]);

  const generateExport = (): HomeLibraryLendingLedgerSession => ({
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    records,
    derived: {
      summary: `${records.length} records, ${records.filter(r => r.auditState === 'resolved').length} resolved.`
    },
    history: []
  });

  const validateImport = (data: any): HomeLibraryLendingLedgerSession | null => {
    try {
      if (data.schemaVersion !== 'v1') return null;
      if (!Array.isArray(data.records)) return null;
      // Basic validation
      for (const r of data.records) {
        if (!r.id || !r.title || !r.status) return null;
      }
      return data;
    } catch {
      return null;
    }
  };

  const handleExport = () => {
    const data = generateExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library-lending-v1-audit-lens.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const valid = validateImport(data);
        if (valid) {
          setRecords(valid.records);
          setHistory([...history, valid.records]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const undo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setRecords(newHistory[newHistory.length - 1]);
    }
  };

  const resolveAudit = (record: BookRecord) => {
    if (!evidenceText.trim()) return;
    const next = records.map(r =>
      r.id === record.id
        ? { ...r, auditState: 'resolved' as AuditState, status: 'changed' as RecordStatus, evidence: evidenceText }
        : r
    );
    setRecords(next);
    setHistory([...history, next]);
    setSelectedRecordId(null);
    setEvidenceText('');
  };

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);
  const selectedRecord = records.find(r => r.id === selectedRecordId);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 text-slate-900 w-full text-left">
      {/* Sidebar / List */}
      <div className="w-full md:w-1/3 border-r border-slate-200 flex flex-col bg-white">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-100">
          <h1 className="font-bold text-lg">Lending Ledger</h1>
          <div className="flex gap-2">
            <button onClick={undo} disabled={history.length <= 1} className="p-2 hover:bg-slate-200 rounded disabled:opacity-50" title="Undo (Ctrl+Z)">
              <Undo2 size={16} />
            </button>
          </div>
        </div>

        <div className="p-2 flex gap-2 border-b border-slate-200 overflow-x-auto text-sm">
          {['all', 'draft', 'ready', 'changed', 'archived'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 rounded-full whitespace-nowrap capitalize ${filter === f ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-slate-100'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredRecords.map(r => (
            <div
              key={r.id}
              onClick={() => setSelectedRecordId(r.id)}
              className={`p-3 mb-2 rounded border cursor-pointer transition-colors ${selectedRecordId === r.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'} ${r.auditState === 'conflict' ? 'border-red-300 bg-red-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium">{r.title}</span>
                {r.auditState === 'conflict' && <AlertCircle size={16} className="text-red-500" />}
                {r.auditState === 'resolved' && <CheckCircle2 size={16} className="text-green-500" />}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex gap-2">
                <span className="capitalize">{r.status}</span> • <span>{r.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content / Audit Lens */}
      <div className="w-full md:w-2/3 flex flex-col bg-slate-50 relative">
         <div className="p-4 border-b border-slate-200 flex justify-end gap-2 bg-white">
           <label className="cursor-pointer px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 text-sm font-medium flex items-center gap-2">
             <Upload size={16} /> Import
             <input type="file" accept=".json" className="hidden" onChange={handleImport} />
           </label>
           <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
             <Download size={16} /> Export
           </button>
         </div>

         <div className="flex-1 p-6 overflow-y-auto">
            {selectedRecord ? (
              <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedRecord.title}</h2>
                    <p className="text-slate-500">{selectedRecord.author}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    selectedRecord.status === 'changed' ? 'bg-purple-100 text-purple-700' :
                    selectedRecord.status === 'archived' ? 'bg-slate-100 text-slate-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedRecord.status}
                  </span>
                </div>

                <div className="mb-6 p-4 rounded bg-slate-50 border border-slate-100 text-sm">
                  <h3 className="font-semibold mb-2 text-slate-700">Derived Status</h3>
                  <div className="flex gap-4">
                     <div>
                       <span className="text-slate-500 block text-xs">Audit State</span>
                       <span className="font-medium capitalize">{selectedRecord.auditState}</span>
                     </div>
                     <div>
                       <span className="text-slate-500 block text-xs">Evidence</span>
                       <span className="font-medium">{selectedRecord.evidence || 'None attached'}</span>
                     </div>
                  </div>
                </div>

                {selectedRecord.auditState === 'conflict' ? (
                  <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
                    <h3 className="font-bold text-red-700 flex items-center gap-2 mb-3">
                      <AlertCircle size={18} /> Audit Discrepancy Found
                    </h3>
                    <p className="text-sm text-red-600 mb-4">Evidence must be attached to resolve this record's conflict.</p>

                    <textarea
                      value={evidenceText}
                      onChange={e => setEvidenceText(e.target.value)}
                      placeholder="Attach explanation or evidence here..."
                      className="w-full p-3 border border-red-200 rounded mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                    />
                    <button
                      onClick={() => resolveAudit(selectedRecord)}
                      disabled={!evidenceText.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Resolve Audit Discrepancy
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No active audit conflicts for this record.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-center">
                <div>
                  <Filter size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Select a record to view details or resolve discrepancies.</p>
                </div>
              </div>
            )}
         </div>

         <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between">
           <span>{generateExport().derived.summary}</span>
           <span>Schema: v1</span>
         </div>
      </div>
    </div>
  );
}

export default App;
