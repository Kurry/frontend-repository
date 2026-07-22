import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function StoryNodes({ nodes, saveNode, placeNode }) {
  const [filter, setFilter] = useState('all');
  const [editingNode, setEditingNode] = useState(null);

  const filteredNodes = nodes.filter(n => filter === 'all' || n.status === filter);

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const capacityWeight = formData.get('capacity_weight');

    // Bounds check rejection
    if (capacityWeight < 0 || capacityWeight > 100) {
      alert("Capacity weight must be between 0 and 100.");
      return;
    }

    saveNode({
      ...editingNode,
      id: editingNode.id || uuidv4(),
      title: formData.get('title'),
      content: formData.get('content'),
      capacity_weight: Number(capacityWeight),
      status: formData.get('status'),
    });
    setEditingNode(null);
  };

  return (
    <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col h-full overflow-y-auto shrink-0 z-10">
      <div className="p-4 border-b border-slate-200 sticky top-0 bg-slate-50 z-10">
        <h2 className="hidden md:block text-lg font-semibold mb-2 text-slate-800">Story Nodes</h2>
        <div className="flex gap-2 mb-2 flex-wrap">
          {['all', 'empty', 'draft', 'ready', 'changed', 'archived'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-2 py-1 text-xs rounded-full cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setEditingNode({ title: '', content: '', capacity_weight: 10, status: 'draft', x: null, y: null })}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm cursor-pointer transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:outline-none"
        >
          + New Node
        </button>
      </div>

      <div className="p-4 flex-1">
        {editingNode ? (
          <form onSubmit={handleSave} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-3">
            <h3 className="font-medium text-sm text-slate-800">Edit Node</h3>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Title</label>
              <input name="title" required defaultValue={editingNode.title} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Content</label>
              <textarea name="content" required defaultValue={editingNode.content} className="w-full border border-slate-300 rounded p-1.5 text-sm min-h-[60px]" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Capacity Weight (0-100)</label>
              <input type="number" name="capacity_weight" required defaultValue={editingNode.capacity_weight} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Status</label>
              <select name="status" defaultValue={editingNode.status} className="w-full border border-slate-300 rounded p-1.5 text-sm">
                {['empty', 'draft', 'ready', 'changed', 'archived'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded py-1.5 text-sm cursor-pointer">Save</button>
              <button type="button" onClick={() => setEditingNode(null)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded py-1.5 text-sm cursor-pointer">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredNodes.map(node => (
              <div key={node.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-sm text-slate-800 truncate pr-4">{node.title}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider ${node.status === 'ready' ? 'bg-green-100 text-green-700' : node.status === 'changed' ? 'bg-yellow-100 text-yellow-700' : node.status === 'archived' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                    {node.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{node.content}</p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-mono text-slate-400">W:{node.capacity_weight}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingNode(node)} className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:underline">Edit</button>
                  </div>
                </div>
              </div>
            ))}
            {filteredNodes.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">No nodes found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
