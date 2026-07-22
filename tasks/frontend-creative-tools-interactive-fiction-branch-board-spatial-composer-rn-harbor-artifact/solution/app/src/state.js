import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Let's install uuid first

const INITIAL_NODES = [
  { id: 'node-1', title: 'The Awakening', content: 'You wake up in a dark room.', capacity_weight: 10, status: 'ready', x: null, y: null },
  { id: 'node-2', title: 'Explore the hallway', content: 'The hallway is long and echoing.', capacity_weight: 20, status: 'empty', x: null, y: null },
  { id: 'node-3', title: 'Inspect the window', content: 'It is boarded up.', capacity_weight: 5, status: 'draft', x: null, y: null },
];

export function useBranchBoardState() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [spatialNodes, setSpatialNodes] = useState([]);

  const pushHistory = useCallback((newNodes, newSpatialNodes) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes, spatialNodes });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setNodes(newNodes);
    setSpatialNodes(newSpatialNodes);
  }, [history, historyIndex, nodes, spatialNodes]);

  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      const prevState = history[historyIndex];
      setNodes(prevState.nodes);
      setSpatialNodes(prevState.spatialNodes);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const placeNode = useCallback((nodeId, x, y) => {
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    // Reject conflict
    if (spatialNodes.some(n => Math.abs(n.x - x) < 50 && Math.abs(n.y - y) < 50)) {
      return false; // Collision
    }

    const newNodes = nodes.map(n =>
      n.id === nodeId ? { ...n, status: 'changed' } : n
    );

    const newSpatialNodes = [...spatialNodes.filter(n => n.id !== nodeId), { ...targetNode, x, y }];
    pushHistory(newNodes, newSpatialNodes);
    return true;
  }, [nodes, spatialNodes, pushHistory]);

  const rebalanceCapacity = useCallback(() => {
    const totalWeight = spatialNodes.reduce((sum, n) => sum + Number(n.capacity_weight), 0);
    const rebalancedNodes = spatialNodes.map(n => ({
      ...n,
      capacity_balance: (Number(n.capacity_weight) / totalWeight) * 100
    }));
    pushHistory(nodes, rebalancedNodes);
  }, [spatialNodes, nodes, pushHistory]);

  const saveNode = useCallback((node) => {
    const newNodes = nodes.map(n => n.id === node.id ? node : n);
    if (!nodes.find(n => n.id === node.id)) {
      newNodes.push({ ...node, id: uuidv4() });
    }
    pushHistory(newNodes, spatialNodes);
  }, [nodes, spatialNodes, pushHistory]);

  const derivedState = useMemo(() => {
    const totalPlaced = spatialNodes.length;
    const totalCapacity = spatialNodes.reduce((sum, n) => sum + Number(n.capacity_weight), 0);
    return { summary: { totalPlaced, totalCapacity } };
  }, [spatialNodes]);

  return {
    nodes,
    spatialNodes,
    derivedState,
    history: history.slice(0, historyIndex + 1),
    placeNode,
    rebalanceCapacity,
    saveNode,
    undo,
    setNodes: (newNodes) => pushHistory(newNodes, spatialNodes),
    setSpatialNodes: (newSpatialNodes) => pushHistory(nodes, newSpatialNodes),
    exportState: () => ({
      schemaVersion: "fiction-branches-v1",
      exportedAt: new Date().toISOString(),
      records: nodes,
      derived: derivedState,
      history: history.slice(0, historyIndex + 1)
    }),
    importState: (data) => {
      try {
        if (data.schemaVersion !== "fiction-branches-v1") return false;
        if (!Array.isArray(data.records)) return false;
        // Basic validation
        const uniqueIds = new Set(data.records.map(r => r.id));
        if (uniqueIds.size !== data.records.length) return false;

        const validStatuses = ['empty', 'draft', 'ready', 'changed', 'archived'];
        const allValid = data.records.every(r => validStatuses.includes(r.status));
        if (!allValid) return false;

        setNodes(data.records);
        setSpatialNodes(data.records.filter(r => r.x !== null && r.x !== undefined));
        setHistory([]);
        setHistoryIndex(-1);
        return true;
      } catch (e) {
        return false;
      }
    }
  };
}
