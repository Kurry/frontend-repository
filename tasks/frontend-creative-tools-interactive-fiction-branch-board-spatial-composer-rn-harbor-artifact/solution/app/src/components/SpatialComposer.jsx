import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MousePointer2, Undo2, LayoutTemplate } from 'lucide-react';

export default function SpatialComposer({
  nodes,
  spatialNodes,
  placeNode,
  rebalanceCapacity,
  undo,
  derivedState
}) {
  const containerRef = useRef(null);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const prefersReducedMotion = useReducedMotion();

  // Clear error after 3s
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const handleCanvasClick = (e) => {
    if (!selectedNodeId || e.target !== containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 60; // offset for centering the node visually
    const y = e.clientY - rect.top - 40;

    const success = placeNode(selectedNodeId, x, y);
    if (success) {
      setSelectedNodeId('');
    } else {
      setErrorMsg('Conflict: Cannot place node here. Space is occupied.');
    }
  };

  const handleKeyboardPlace = () => {
    if (!selectedNodeId) return;
    // Default place in center or slightly offset
    const x = 200 + Math.random() * 100;
    const y = 200 + Math.random() * 100;
    const success = placeNode(selectedNodeId, x, y);
    if (success) {
      setSelectedNodeId('');
    } else {
      setErrorMsg('Conflict: Cannot place node here. Space is occupied.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 relative overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex text-sm font-medium text-slate-700 items-center gap-1">
              <MousePointer2 size={16} /> Place:
            </span>
            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="border border-slate-300 rounded p-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 w-32 sm:w-48"
              aria-label="Select node to place"
            >
              <option value="">-- Select Node --</option>
              {nodes.filter(n => !spatialNodes.find(sn => sn.id === n.id)).map(n => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          </div>

          {selectedNodeId && (
            <button
              onClick={handleKeyboardPlace}
              className="text-xs bg-slate-200 hover:bg-slate-300 px-2 sm:px-3 py-1.5 rounded transition-colors"
              title="Keyboard/Accessibility alternative to clicking"
            >
              <span className="hidden sm:inline">Place (Auto)</span>
              <span className="sm:hidden">Auto</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={rebalanceCapacity}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs sm:text-sm font-medium transition-colors"
          >
            <LayoutTemplate size={16} /> <span className="hidden sm:inline">Rebalance</span>
          </button>
          <div className="w-px h-6 bg-slate-300"></div>
          <button
            onClick={undo}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs sm:text-sm font-medium transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} /> <span className="hidden sm:inline">Undo</span>
          </button>
        </div>
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
            className="absolute top-18 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded shadow-md text-sm font-medium"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className={`flex-1 relative cursor-crosshair focus:outline-none focus:ring-inset focus:ring-2 focus:ring-blue-400 ${selectedNodeId ? 'bg-blue-50/50' : ''}`}
        onClick={handleCanvasClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleKeyboardPlace();
          } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            undo();
          }
        }}
      >
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #94a3b8 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>

        <AnimatePresence>
          {spatialNodes.map(node => (
            <motion.div
              key={node.id}
              layoutId={prefersReducedMotion ? undefined : `node-${node.id}`}
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1, x: node.x, y: node.y } : { scale: 1, opacity: 1, x: node.x, y: node.y }}
              exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
              className={`absolute w-32 p-3 bg-white rounded-lg shadow-sm border-2 flex flex-col gap-1
                ${node.status === 'changed' ? 'border-yellow-400' : 'border-slate-200'}
              `}
              style={{ left: 0, top: 0 }} // Position handled by transform
            >
              <div className="font-medium text-sm text-slate-800 truncate">{node.title}</div>
              {node.capacity_balance !== undefined && (
                <div className="text-[10px] font-mono text-indigo-600 bg-indigo-50 py-0.5 px-1 rounded inline-block mt-1 self-start">
                  Bal: {node.capacity_balance.toFixed(1)}%
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {spatialNodes.length === 0 && !selectedNodeId && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm p-4 text-center">
            Select a node from the toolbar and click here to place it.
          </div>
        )}
      </div>

      {/* Derived Summary Overlay */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-md border border-slate-200 text-sm z-20 w-48 pointer-events-none hidden sm:block">
        <h4 className="font-semibold text-slate-700 border-b border-slate-100 pb-1 mb-2">Derived Summary</h4>
        <div className="flex justify-between mb-1">
          <span className="text-slate-500">Placed Nodes:</span>
          <span className="font-mono">{derivedState.summary.totalPlaced}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Total Capacity:</span>
          <span className="font-mono">{derivedState.summary.totalCapacity}</span>
        </div>
      </div>
    </div>
  );
}
