import React, { useState, useEffect, useCallback, useRef } from 'react';
import ClozeCards from './components/ClozeCards';
import AuditLens from './components/AuditLens';
import { setupWebMCP } from './webmcp';

export default function App() {
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [derived, setDerived] = useState({ resolvedCount: 0 });
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('cards');

  const recordsRef = useRef(records);
  const derivedRef = useRef(derived);
  const selectedIdRef = useRef(selectedId);
  const historyRef = useRef(history);

  useEffect(() => { recordsRef.current = records; }, [records]);
  useEffect(() => { derivedRef.current = derived; }, [derived]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { historyRef.current = history; }, [history]);

  useEffect(() => {
    setupWebMCP(
      () => recordsRef.current,
      (val) => { setRecords(val); recordsRef.current = (typeof val === 'function' ? val(recordsRef.current) : val); },
      () => derivedRef.current,
      (val) => { setDerived(val); derivedRef.current = val; },
      (val) => { setHistory(val); historyRef.current = (typeof val === 'function' ? val(historyRef.current) : val); },
      () => selectedIdRef.current,
      (val) => { setSelectedId(val); selectedIdRef.current = val; }
    );
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;

    const lastAction = historyRef.current[historyRef.current.length - 1];
    setHistory(prev => prev.slice(0, -1));

    if (lastAction.type === 'CREATE') {
      setRecords(prev => prev.filter(r => r.id !== lastAction.record.id));
      if (selectedIdRef.current === lastAction.record.id) setSelectedId(null);
    } else if (lastAction.type === 'UPDATE' || lastAction.type === 'ARCHIVE') {
      setRecords(prev => prev.map(r => r.id === lastAction.record.id ? lastAction.previousRecord : r));
    } else if (lastAction.type === 'DELETE') {
      setRecords(prev => [...prev, lastAction.record]);
    } else if (lastAction.type === 'AUDIT_RESOLVE') {
      setRecords(prev => prev.map(r => r.id === lastAction.previousRecord.id ? lastAction.previousRecord : r));
      setDerived(lastAction.previousDerived);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans overflow-hidden md:flex-row">
      <div className="md:hidden flex bg-white border-b border-gray-200">
         <button
           className={`flex-1 p-3 text-center text-sm font-semibold ${activeTab === 'cards' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
           onClick={() => setActiveTab('cards')}
         >
           Cards
         </button>
         <button
           className={`flex-1 p-3 text-center text-sm font-semibold ${activeTab === 'audit' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
           onClick={() => setActiveTab('audit')}
         >
           Audit Lens
         </button>
      </div>

      <div className={`w-full md:w-1/3 lg:w-1/4 h-full md:block ${activeTab === 'cards' ? 'block' : 'hidden'}`}>
        <ClozeCards
          records={records}
          setRecords={setRecords}
          onSelect={(id) => { setSelectedId(id); setActiveTab('audit'); }}
          selectedId={selectedId}
          setHistory={setHistory}
        />
      </div>

      <div className={`flex-1 h-full w-full md:block ${activeTab === 'audit' ? 'block' : 'hidden'}`}>
        <AuditLens
          records={records}
          setRecords={setRecords}
          selectedId={selectedId}
          derived={derived}
          setDerived={setDerived}
          history={history}
          setHistory={setHistory}
          onUndo={handleUndo}
        />
      </div>
    </div>
  );
}
