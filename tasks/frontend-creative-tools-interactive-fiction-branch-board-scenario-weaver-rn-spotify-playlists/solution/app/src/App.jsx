import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Download, Upload, Plus, Trash2, GitBranch, FolderOpen, AlertCircle, Edit2, Check, X, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const DEFAULT_NODES = [
  { id: '1', title: 'The Awakening', content: 'You wake up in a strange forest.', status: 'ready', scenario: null, outcomes: [] },
  { id: '2', title: 'The Crossroads', content: 'There are two paths ahead.', status: 'draft', scenario: null, outcomes: [] },
  { id: '3', title: 'The Cave', content: 'A dark cave looms before you.', status: 'empty', scenario: null, outcomes: [] },
  { id: '4', title: 'The Goblin Encounter', content: 'A goblin jumps out!', status: 'changed', scenario: null, outcomes: [] },
  { id: '5', title: 'The Old Bridge', content: 'The bridge looks rickety.', status: 'archived', scenario: null, outcomes: [] },
];

function App() {
  const [nodes, setNodes] = useState(DEFAULT_NODES);
  const [selectedIds, setSelectedIds] = useState([]);
  const [history, setHistory] = useState([]);
  const [scenarioMode, setScenarioMode] = useState(false);
  const [activeScenarioRecord, setActiveScenarioRecord] = useState(null);
  const [scenarioDerivedSummary, setScenarioDerivedSummary] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [filter, setFilter] = useState('all');
  const [errorMsg, setErrorMsg] = useState('');

  const saveHistory = () => {
    setHistory((prev) => [...prev, { nodes: JSON.parse(JSON.stringify(nodes)) }]);
  };

  const undo = () => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setNodes(lastState.nodes);
      setHistory((prev) => prev.slice(0, prev.length - 1));
      setScenarioMode(false);
      setActiveScenarioRecord(null);
      setScenarioDerivedSummary(null);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const startEdit = (node) => {
    setEditingId(node.id);
    setEditForm({ ...node });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      alert("Title and content are required.");
      return;
    }
    saveHistory();
    setNodes(prev => prev.map(n => n.id === editingId ? { ...editForm } : n));
    setEditingId(null);
    setEditForm(null);
  };

  const createNode = () => {
    saveHistory();
    const newNode = {
      id: Date.now().toString(),
      title: 'New Story Node',
      content: '',
      status: 'empty',
      scenario: null,
      outcomes: []
    };
    setNodes(prev => [newNode, ...prev]);
    startEdit(newNode);
  };

  const deleteNode = (id) => {
    if (confirm("Are you sure you want to delete this node?")) {
      saveHistory();
      setNodes(prev => prev.filter(n => n.id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));
    }
  };

  const moveUp = (index) => {
    if (index === 0) return;
    saveHistory();
    setNodes(prev => {
        const arr = [...prev];
        const temp = arr[index];
        arr[index] = arr[index - 1];
        arr[index - 1] = temp;
        return arr;
    });
  }

  const moveDown = (index) => {
    if (index === nodes.length - 1) return;
    saveHistory();
    setNodes(prev => {
        const arr = [...prev];
        const temp = arr[index];
        arr[index] = arr[index + 1];
        arr[index + 1] = temp;
        return arr;
    });
  }

  const branchIntoScenario = (record) => {
    saveHistory();
    setScenarioMode(true);
    setActiveScenarioRecord(record);

    // Derived outcome for comparison
    const newSummary = {
      baseConsequence: `If they stay on "${record.title}", the story stalls.`,
      scenarioConsequence: `Branching "${record.title}" creates an immediate conflict.`
    };
    setScenarioDerivedSummary(newSummary);

    setNodes((prev) => prev.map(n =>
      n.id === record.id
        ? { ...n, status: 'changed', scenario: 'Active Branch', outcomes: [newSummary.baseConsequence, newSummary.scenarioConsequence] }
        : n
    ));
  };

  const resolveScenario = () => {
    saveHistory();
    setNodes((prev) => prev.map(n =>
      n.id === activeScenarioRecord.id ? { ...n, status: 'ready' } : n
    ));
    setScenarioMode(false);
    setActiveScenarioRecord(null);
    setScenarioDerivedSummary(null);
  };

  const exportState = () => {
    const data = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: nodes,
      derived: scenarioDerivedSummary ? { summary: scenarioDerivedSummary } : {},
      history: history
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fiction-branches-v1-scenario-weaver.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importState = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.schemaVersion !== 'v1') {
            setErrorMsg("Invalid schemaVersion. Only v1 is supported.");
            return;
        }
        if (!Array.isArray(data.records)) {
             setErrorMsg("Invalid import file. Records must be an array.");
             return;
        }

        // Field-level schema validation
        const isValid = data.records.every(r =>
           r.id && typeof r.title === 'string' && typeof r.content === 'string' &&
           ['ready', 'draft', 'empty', 'changed', 'archived'].includes(r.status)
        );

        if (!isValid) {
            setErrorMsg("Invalid import file. Field bounds or required properties violated.");
            return;
        }

        setNodes(data.records);
        setHistory(data.history || []);
        if (data.derived && data.derived.summary) {
          setScenarioDerivedSummary(data.derived.summary);
          const activeNode = data.records.find(r => r.scenario === 'Active Branch');
          if (activeNode) {
              setScenarioMode(true);
              setActiveScenarioRecord(activeNode);
          }
        }
      } catch (err) {
        setErrorMsg("Invalid import file structure");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // WebMCP Integration
  useEffect(() => {
    window.webmcp_session_info = () => ({
      version: "1.0",
      capabilities: ["entity-collection-v1", "artifact-transfer-v1"]
    });

    window.webmcp_list_tools = () => [
      { name: "entity_select", description: "Select a story node." },
      { name: "entity_update", description: "Update a story node." },
      { name: "artifact_export", description: "Export session." },
      { name: "artifact_import", description: "Import session." },
      { name: "entity_create", description: "Create a story node." },
      { name: "entity_delete", description: "Delete a story node." }
    ];

    window.webmcp_invoke_tool = async (name, args) => {
      if (name === 'artifact_export') {
        return {
          schemaVersion: 'v1',
          exportedAt: new Date().toISOString(),
          records: nodes,
        };
      }
      if (name === 'entity_select') {
         if (args.id) toggleSelect(args.id);
         return { success: true };
      }
      if (name === 'entity_update') {
          saveHistory();
          setNodes(prev => prev.map(n => n.id === args.id ? { ...n, ...args.fields } : n));
          return { success: true };
      }
      if (name === 'entity_create') {
          saveHistory();
          const newNode = {
              id: Date.now().toString(),
              title: args.fields.title || 'New',
              content: args.fields.content || '',
              status: args.fields.status || 'empty',
              scenario: null,
              outcomes: []
          };
          setNodes(prev => [newNode, ...prev]);
          return { success: true, id: newNode.id };
      }
      if (name === 'entity_delete') {
          if (!args.confirm) return { success: false, error: "confirm=true required" };
          saveHistory();
          setNodes(prev => prev.filter(n => n.id !== args.id));
          return { success: true };
      }
      if (name === 'artifact_import') {
          try {
              if (args.data.schemaVersion === 'v1' && Array.isArray(args.data.records)) {
                setNodes(args.data.records);
                return { success: true };
              }
          } catch(e) {}
          return { success: false, error: "invalid format" };
      }
      return { success: false, error: "Tool not implemented or arguments invalid." };
    };
  }, [nodes]);

  const filteredNodes = nodes.filter(n => filter === 'all' || n.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col md:flex-row">

      {/* Sidebar / Tools */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
        <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-700">
          <FolderOpen size={24} />
          Story Nodes
        </h1>

        {errorMsg && (
            <div className="bg-red-50 text-red-600 text-sm p-2 rounded border border-red-200">
                {errorMsg}
            </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          <button onClick={createNode} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md font-medium text-sm transition-colors w-full">
            <Plus size={16} /> New Node
          </button>

          <div className="my-2 border-t border-gray-200"></div>

          <label className="text-sm font-semibold text-gray-600 uppercase">Filter Status</label>
          <select
             value={filter}
             onChange={(e) => setFilter(e.target.value)}
             className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          >
             <option value="all">All</option>
             <option value="ready">Ready</option>
             <option value="draft">Draft</option>
             <option value="changed">Changed</option>
             <option value="empty">Empty</option>
             <option value="archived">Archived</option>
          </select>

          <div className="my-2 border-t border-gray-200"></div>

          <button onClick={exportState} className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-md font-medium text-sm transition-colors w-full">
            <Download size={16} /> Export Session
          </button>

          <label className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md font-medium text-sm transition-colors w-full cursor-pointer">
            <Upload size={16} /> Import JSON
            <input type="file" accept=".json" onChange={importState} className="hidden" />
          </label>

          <button onClick={undo} disabled={history.length === 0} className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 px-3 py-2 rounded-md font-medium text-sm transition-colors w-full mt-4">
            <RotateCcw size={16} /> Undo Mutation
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Collection Editor</h2>
            <div className="text-sm text-gray-500">{filteredNodes.length} nodes visible ({selectedIds.length} selected)</div>
          </div>

          {/* Collection Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                  <th className="p-3 w-10"></th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 w-48">Actions</th>
                  <th className="p-3 w-24">Order</th>
                </tr>
              </thead>
              <tbody>
                {filteredNodes.length === 0 ? (
                  <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                          No nodes match the criteria.
                      </td>
                  </tr>
                ) : filteredNodes.map((node, i) => (
                  <tr key={node.id} className={cn(
                    "border-b border-gray-100 transition-colors hover:bg-gray-50",
                    selectedIds.includes(node.id) && "bg-indigo-50/50"
                  )}>
                    <td className="p-3 text-center align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(node.id)}
                        onChange={() => toggleSelect(node.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 align-top">
                        {editingId === node.id ? (
                            <div className="flex flex-col gap-2">
                                <input
                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full font-medium"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                    placeholder="Title"
                                />
                                <textarea
                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                    value={editForm.content}
                                    onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                                    placeholder="Content..."
                                    rows={2}
                                />
                            </div>
                        ) : (
                            <div>
                                <div className="font-medium text-gray-900">{node.title}</div>
                                <div className="text-sm text-gray-500 mt-1 line-clamp-1">{node.content}</div>
                            </div>
                        )}
                    </td>
                    <td className="p-3 align-top">
                       {editingId === node.id ? (
                           <select
                             className="border border-gray-300 rounded px-2 py-1 text-sm"
                             value={editForm.status}
                             onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                           >
                               <option value="ready">ready</option>
                               <option value="draft">draft</option>
                               <option value="changed">changed</option>
                               <option value="empty">empty</option>
                               <option value="archived">archived</option>
                           </select>
                       ) : (
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider",
                            node.status === 'ready' && "bg-green-100 text-green-800",
                            node.status === 'draft' && "bg-yellow-100 text-yellow-800",
                            node.status === 'changed' && "bg-blue-100 text-blue-800",
                            node.status === 'empty' && "bg-gray-100 text-gray-800",
                            node.status === 'archived' && "bg-red-100 text-red-800",
                          )}>
                            {node.status}
                          </span>
                       )}
                    </td>
                    <td className="p-3 align-top">
                       <div className="flex items-center gap-3">
                        {editingId === node.id ? (
                             <>
                               <button onClick={saveEdit} className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm font-medium"><Check size={14}/> Save</button>
                               <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm font-medium"><X size={14}/> Cancel</button>
                             </>
                        ) : (
                             <>
                                <button
                                  onClick={() => branchIntoScenario(node)}
                                  className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                  <GitBranch size={14} /> Branch
                                </button>
                                <button onClick={() => startEdit(node)} className="text-gray-500 hover:text-gray-700">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => deleteNode(node.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 size={14} />
                                </button>
                             </>
                        )}
                       </div>
                    </td>
                    <td className="p-3 align-top">
                        {filter === 'all' && (
                            <div className="flex items-center gap-1">
                                <button disabled={i === 0} onClick={() => moveUp(i)} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">▲</button>
                                <button disabled={i === filteredNodes.length - 1} onClick={() => moveDown(i)} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">▼</button>
                            </div>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scenario Weaver Linked View */}
          {scenarioMode && activeScenarioRecord && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-sm relative overflow-hidden transition-all duration-300 ease-in-out motion-reduce:transition-none">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                <AlertCircle size={20} />
                Scenario Weaver: {activeScenarioRecord.title}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="bg-white p-4 rounded-md border border-blue-100 shadow-sm transition-all duration-300 transform translate-y-0 motion-reduce:transition-none">
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Base Consequence</h4>
                  <p className="text-gray-600">{scenarioDerivedSummary?.baseConsequence}</p>
                </div>
                <div className="bg-white p-4 rounded-md border border-indigo-200 shadow-sm ring-1 ring-indigo-500/20 transition-all duration-300 transform translate-y-0 motion-reduce:transition-none">
                  <h4 className="font-semibold text-indigo-700 mb-2 text-sm uppercase tracking-wide">Scenario Consequence</h4>
                  <p className="text-gray-600">{scenarioDerivedSummary?.scenarioConsequence}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={resolveScenario}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
                >
                  Resolve Scenario to Ready
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;
