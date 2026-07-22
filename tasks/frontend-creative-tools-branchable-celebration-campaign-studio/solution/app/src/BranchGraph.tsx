import { useState } from 'react';
import { BranchNode, VariantNodeStatus } from './types';

export default function BranchGraph({ nodes, setNodes }: { nodes: BranchNode[], setNodes: React.Dispatch<React.SetStateAction<BranchNode[]>> }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const addBranch = () => {
    const parent = nodes.find(n => n.id === selectedNodeId) || nodes[nodes.length - 1];
    const newNode: BranchNode = {
      id: `branch-${Date.now()}`,
      parentId: parent ? parent.id : null,
      status: 'active',
      changes: [],
      name: `Variant ${nodes.length + 1}`,
      lineage: parent ? parent.lineage + 1 : 0
    };
    setNodes(prev => prev.map(n => n.status === 'active' ? { ...n, status: 'superseded' as VariantNodeStatus } : n).concat(newNode));
    setSelectedNodeId(newNode.id);
  };

  const acceptBranch = (id: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, status: 'accepted' as VariantNodeStatus } : n));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      <div className="p-2 border-b flex justify-between items-center bg-gray-50">
        <span className="font-medium text-gray-700">Branch Graph</span>
        <button onClick={addBranch} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">New Variant</button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {nodes.length === 0 && <div className="text-gray-400 text-center italic mt-10">No branches yet. Create one to start diverging.</div>}
        {nodes.map(node => (
          <div
            key={node.id}
            onClick={() => setSelectedNodeId(node.id)}
            className={`p-3 rounded-lg border-l-4 shadow-sm cursor-pointer transition-all ${
              selectedNodeId === node.id ? 'ring-2 ring-blue-300' : ''
            } ${
              node.status === 'active' ? 'border-l-blue-500 bg-blue-50' :
              node.status === 'accepted' ? 'border-l-green-500 bg-green-50' :
              node.status === 'rejected' ? 'border-l-red-500 bg-red-50' : 'border-l-gray-400 bg-gray-100'
            }`}
            style={{ marginLeft: `${node.lineage * 16}px` }}
          >
            <div className="flex justify-between items-center">
              <div className="font-semibold text-sm">{node.name}</div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                  node.status === 'active' ? 'bg-blue-200 text-blue-800' :
                  node.status === 'accepted' ? 'bg-green-200 text-green-800' :
                  node.status === 'rejected' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'
              }`}>{node.status}</span>
            </div>
            {node.status === 'active' && (
              <div className="mt-2 flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); acceptBranch(node.id); }} className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded border border-green-300">Accept</button>
                <button onClick={(e) => { e.stopPropagation(); setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'rejected' as VariantNodeStatus } : n)); }} className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded border border-red-300">Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
