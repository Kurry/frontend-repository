import React, { useEffect, useState, useRef } from 'react';
import { usePantryStore } from './store';
import { RecoveryBoard } from './components/RecoveryBoard';
import { LivePreview } from './components/LivePreview';
import { ChartsPanel } from './components/ChartsPanel';
import { Download, Upload, Undo, Link as LinkIcon, Search, Plus, Trash2, Archive, Edit2 } from 'lucide-react';
import { setupWebMCP } from './utils/webmcp';
import type { Ingredient } from './types';

function App() {
  const store = usePantryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sortCol, setSortCol] = useState<'name' | 'status' | 'quantity' | 'calories'>('status');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});

  useEffect(() => {
    setupWebMCP(store);
  }, [store]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        store.undo();
      }
      if (e.code === 'Space' && e.target === document.body) {
         e.preventDefault();
         document.body.style.cursor = 'grab';
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
         document.body.style.cursor = 'default';
         setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [store]);

  const handlePointerDown = (e: React.PointerEvent) => {
     if (e.button === 1 || e.shiftKey || (document.body.style.cursor === 'grab')) {
         setIsPanning(true);
         startPanRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
         document.body.style.cursor = 'grabbing';
     }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isPanning) return;
      setPanOffset({
          x: e.clientX - startPanRef.current.x,
          y: e.clientY - startPanRef.current.y
      });
  };

  const handlePointerUp = () => {
      setIsPanning(false);
      document.body.style.cursor = 'default';
  };

  const handleExport = () => {
    const data = store.exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nutrition-stock-v1-recovery-board.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = store.importSession(json);
        if (!success) {
           alert("Invalid artifact structure. Schema must be v1 and contain records array.");
        }
      } catch (err) {
        alert("Failed to parse JSON.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm.name && editForm.quantity !== undefined && editForm.quantity >= 0) {
      const newRecord: Ingredient = {
        id: `ing-${Date.now()}`,
        name: editForm.name,
        quantity: editForm.quantity,
        unit: editForm.unit || 'g',
        caloriesPerUnit: editForm.caloriesPerUnit || 0,
        proteinPerUnit: editForm.proteinPerUnit || 0,
        carbsPerUnit: editForm.carbsPerUnit || 0,
        fatPerUnit: editForm.fatPerUnit || 0,
        status: editForm.status || 'draft'
      };
      store.addRecord(newRecord);
      setShowCreateForm(false);
      setEditForm({});
    } else {
       alert("Invalid boundaries: Name is required and Quantity must be >= 0");
    }
  };

  const handleSaveEdit = () => {
      if (editingId && editForm) {
          if (editForm.quantity !== undefined && editForm.quantity < 0) {
              alert("Quantity must be >= 0");
              return;
          }
          store.updateRecord(editingId, editForm);
          setEditingId(null);
          setEditForm({});
      }
  };

  const startEdit = (r: Ingredient) => {
     setEditingId(r.id);
     setEditForm(r);
  };

  const handleSort = (col: typeof sortCol) => {
      if (sortCol === col) setSortAsc(!sortAsc);
      else { setSortCol(col); setSortAsc(true); }
  };

  const sortedAndFiltered = [...store.records]
    .filter(r => filter === 'all' ? true : r.status === filter)
    .sort((a, b) => {
       let valA, valB;
       if (sortCol === 'name') { valA = a.name; valB = b.name; }
       else if (sortCol === 'status') { valA = a.status; valB = b.status; }
       else if (sortCol === 'quantity') { valA = a.quantity; valB = b.quantity; }
       else { valA = a.caloriesPerUnit * a.quantity; valB = b.caloriesPerUnit * b.quantity; }

       if (valA < valB) return sortAsc ? -1 : 1;
       if (valA > valB) return sortAsc ? 1 : -1;
       return 0;
    });

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-gray-100 flex flex-col font-sans select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center space-x-4">
           <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">P</div>
           <h1 className="text-xl font-bold text-gray-800">Pantry Nutrition Ledger</h1>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={store.undo} className="p-2 hover:bg-gray-100 rounded text-gray-600 flex items-center transition-colors" title="Undo (Ctrl+Z)">
               <Undo size={18} className="mr-1" /> Undo
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <button className="px-3 py-1.5 hover:bg-gray-100 rounded border flex items-center text-sm font-medium transition-colors">
               <LinkIcon size={16} className="mr-1.5" /> Copy Link
            </button>
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
            <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-800 flex items-center text-sm font-medium transition-colors">
               <Upload size={16} className="mr-1.5" /> Import
            </button>
            <button onClick={handleExport} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center text-sm font-medium shadow-sm transition-colors">
               <Download size={16} className="mr-1.5" /> Export Artifact
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative" style={{ cursor: isPanning ? 'grabbing' : 'default' }}>
        <div
           className="absolute flex p-6 gap-6 transition-transform duration-75"
           style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
        >
            <div className="w-[700px] flex flex-col gap-6" onPointerDown={e => e.stopPropagation()}>
                <RecoveryBoard records={store.records} onRepair={store.updateRecord} />

                <div className="bg-white border rounded shadow-sm flex-1 flex flex-col min-h-[500px]">
                   <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t">
                      <h2 className="font-bold text-gray-800 flex items-center">
                         <Search size={18} className="mr-2 text-gray-500" /> Collection
                      </h2>
                      <div className="flex space-x-2">
                        <select
                          className="border rounded px-2 py-1 text-sm bg-white"
                          value={filter}
                          onChange={e => setFilter(e.target.value)}
                        >
                          <option value="all">All Statuses</option>
                          <option value="ready">Ready</option>
                          <option value="draft">Draft</option>
                          <option value="changed">Changed</option>
                          <option value="conflict">Conflict</option>
                          <option value="archived">Archived</option>
                        </select>
                        <button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded flex items-center text-sm transition-colors">
                           <Plus size={16} className="mr-1" /> New
                        </button>
                      </div>
                   </div>

                   {showCreateForm && (
                     <form onSubmit={handleCreate} className="p-4 border-b bg-blue-50 grid grid-cols-4 gap-2 text-sm">
                        <input placeholder="Name" required className="border p-1 rounded" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                        <input type="number" placeholder="Qty" required className="border p-1 rounded" value={editForm.quantity || ''} onChange={e => setEditForm({...editForm, quantity: Number(e.target.value)})} />
                        <select className="border p-1 rounded bg-white" value={editForm.status || 'draft'} onChange={e => setEditForm({...editForm, status: e.target.value as any})}>
                            <option value="draft">Draft</option><option value="ready">Ready</option><option value="changed">Changed</option><option value="conflict">Conflict</option>
                        </select>
                        <div className="flex gap-2">
                          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded flex-1">Add</button>
                          <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-300 px-2 py-1 rounded text-gray-700">Cancel</button>
                        </div>
                     </form>
                   )}

                   <div className="p-0 overflow-y-auto max-h-[600px]">
                      <table className="w-full text-left text-sm relative">
                          <thead className="bg-gray-50 sticky top-0 border-b shadow-sm z-10 cursor-pointer">
                             <tr>
                               <th className="p-3 font-semibold text-gray-600 hover:bg-gray-100" onClick={() => handleSort('name')}>Ingredient {sortCol==='name' && (sortAsc ? '↑' : '↓')}</th>
                               <th className="p-3 font-semibold text-gray-600 hover:bg-gray-100" onClick={() => handleSort('status')}>Status {sortCol==='status' && (sortAsc ? '↑' : '↓')}</th>
                               <th className="p-3 font-semibold text-gray-600 hover:bg-gray-100 text-right" onClick={() => handleSort('quantity')}>Qty {sortCol==='quantity' && (sortAsc ? '↑' : '↓')}</th>
                               <th className="p-3 font-semibold text-gray-600 hover:bg-gray-100 text-right" onClick={() => handleSort('calories')}>Cal {sortCol==='calories' && (sortAsc ? '↑' : '↓')}</th>
                               <th className="p-3 font-semibold text-gray-600 w-24">Actions</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y">
                             {sortedAndFiltered.map(record => (
                               <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                                  {editingId === record.id ? (
                                    <td colSpan={5} className="p-2">
                                       <div className="flex gap-2 items-center bg-white p-2 rounded shadow-inner border border-blue-200">
                                         <input className="border p-1 rounded flex-1" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                                         <input type="number" className="border p-1 rounded w-20" value={editForm.quantity || 0} onChange={e => setEditForm({...editForm, quantity: Number(e.target.value)})} />
                                         <select className="border p-1 rounded bg-white w-24" value={editForm.status || 'draft'} onChange={e => setEditForm({...editForm, status: e.target.value as any})}>
                                            <option value="draft">Draft</option><option value="ready">Ready</option><option value="changed">Changed</option><option value="conflict">Conflict</option><option value="archived">Archived</option>
                                         </select>
                                         <button onClick={handleSaveEdit} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
                                         <button onClick={() => setEditingId(null)} className="bg-gray-300 px-3 py-1 rounded">Cancel</button>
                                       </div>
                                    </td>
                                  ) : (
                                    <>
                                      <td className="p-3 font-medium text-gray-800">{record.name}</td>
                                      <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs border ${
                                            record.status === 'ready' ? 'bg-green-50 text-green-700 border-green-200' :
                                            record.status === 'conflict' ? 'bg-red-50 text-red-700 border-red-200 font-bold' :
                                            record.status === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                            record.status === 'archived' ? 'bg-gray-200 text-gray-500 border-gray-300 border-dashed' :
                                            'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                            {record.status}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right">{record.quantity}{record.unit}</td>
                                      <td className="p-3 text-right text-gray-500">{record.caloriesPerUnit * record.quantity}</td>
                                      <td className="p-3">
                                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => startEdit(record)} className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Edit"><Edit2 size={14}/></button>
                                          {record.status !== 'archived' && (
                                              <button onClick={() => store.updateRecord(record.id, { status: 'archived' })} className="text-gray-500 hover:bg-gray-100 p-1 rounded" title="Archive"><Archive size={14}/></button>
                                          )}
                                          <button onClick={() => store.deleteRecord(record.id)} className="text-red-500 hover:bg-red-50 p-1 rounded" title="Delete"><Trash2 size={14}/></button>
                                        </div>
                                      </td>
                                    </>
                                  )}
                               </tr>
                             ))}
                             {sortedAndFiltered.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-gray-500">No records found.</td>
                                </tr>
                             )}
                          </tbody>
                      </table>
                   </div>
                </div>
            </div>

            <div className="w-[320px] flex flex-col gap-6" onPointerDown={e => e.stopPropagation()}>
                <ChartsPanel stats={store.derivedStats} />
                <div className="flex-1 flex justify-center items-start mt-4">
                   <LivePreview stats={store.derivedStats} />
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
