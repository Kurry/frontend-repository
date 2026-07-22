import { useBacklogStore } from '../store';

import { useState } from 'react';
import type { EdgeType } from '../types';

export function DependencyGraph() {
  const { edges, tasks, addEdge, removeEdge } = useBacklogStore();
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [type, setType] = useState<EdgeType>('blocks');

  const handleAdd = () => {
    if (!source || !target || source === target) return;

    // Cycle check BFS
    const isCycle = (start: string, end: string) => {
      const visited = new Set<string>();
      const queue = [end];
      while(queue.length > 0) {
        const curr = queue.shift()!;
        if (curr === start) return true;
        if (!visited.has(curr)) {
          visited.add(curr);
          const nexts = edges.filter(e => e.sourceId === curr).map(e => e.targetId);
          queue.push(...nexts);
        }
      }
      return false;
    };

    if (isCycle(source, target)) {
      alert("Cycle detected! Edge rejected.");
      return;
    }

    addEdge({ id: `edge-${Date.now()}`, sourceId: source, targetId: target, type });
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <h2 className="text-xl font-bold">Dependency & Waiting Graph</h2>

      <div className="flex flex-col md:flex-row gap-2 items-center bg-muted p-2 rounded-md">
        <select value={source} onChange={e => setSource(e.target.value)} className="border p-1 text-sm rounded">
          <option value="">Source...</option>
          {tasks.slice(0, 15).map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value as EdgeType)} className="border p-1 text-sm rounded">
          <option value="blocks">blocks</option>
          <option value="requires">requires</option>
          <option value="contributes">contributes</option>
          <option value="duplicate-of">duplicate-of</option>
          <option value="waiting-on">waiting-on</option>
          <option value="follow-up-after">follow-up-after</option>
        </select>
        <select value={target} onChange={e => setTarget(e.target.value)} className="border p-1 text-sm rounded">
          <option value="">Target...</option>
          {tasks.slice(0, 15).map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
        </select>
        <button onClick={handleAdd} className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:opacity-90">Link</button>
      </div>

      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
        {edges.map(edge => (
          <div key={edge.id} className="flex items-center justify-between bg-card border p-2 rounded text-sm">
            <div className="flex items-center gap-2">
              <span className="font-mono">{edge.sourceId}</span>
              <span className="px-2 py-0.5 bg-secondary rounded-full text-xs">{edge.type}</span>
              <span className="font-mono">{edge.targetId}</span>
            </div>
            <button onClick={() => removeEdge(edge.id)} className="text-destructive hover:underline text-xs">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
