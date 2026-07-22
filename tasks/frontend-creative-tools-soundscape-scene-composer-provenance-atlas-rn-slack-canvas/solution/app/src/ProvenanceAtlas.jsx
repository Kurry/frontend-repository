import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, AlertOctagon, Activity } from "lucide-react";

export default function ProvenanceAtlas({ record, onQuarantine }) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const nodes = record.provenanceAtlasState.nodes;

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-[var(--border)] bg-white shrink-0">
        <h2 className="text-2xl font-bold mb-2">Provenance Atlas</h2>
        <div className="text-sm text-[var(--text-muted)] flex items-center gap-4">
          <span>Tracing: <strong className="text-[var(--text-main)]">{record.name}</strong></span>
          <span className="flex items-center gap-1"><Activity size={14} /> {nodes.length} Lineage Nodes</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)] border-2 border-dashed border-gray-300 rounded-lg">
            No lineage data available for this layer.
          </div>
        ) : (
          <AnimatePresence>
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg border-2 shadow-sm overflow-hidden transition-colors ${
                  node.status === "quarantined" ? "border-[var(--danger)]" :
                  selectedNodeId === node.id ? "border-[var(--accent)]" : "border-[var(--border)]"
                }`}
              >
                <div
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedNodeId(selectedNodeId === node.id ? null : node.id)}
                >
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {node.name}
                      {node.status === "quarantined" && <AlertOctagon size={16} className="text-[var(--danger)]" />}
                    </h3>
                    <div className="text-sm text-[var(--text-muted)] mt-1">Source: {node.source}</div>
                  </div>
                  <div className="text-sm font-medium uppercase px-2 py-1 bg-gray-100 rounded">
                    {node.status}
                  </div>
                </div>

                {selectedNodeId === node.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-[var(--border)] p-4 bg-gray-50 flex justify-end gap-3"
                  >
                    <button
                      className="px-4 py-2 bg-white border border-[var(--border)] hover:bg-gray-100 rounded text-sm transition-colors flex items-center gap-2"
                      onClick={() => alert(`Tracing source evidence for ${node.source}...`)}
                    >
                      <Search size={16} /> Trace to Source Evidence
                    </button>
                    {node.status !== "quarantined" && (
                      <button
                        className="px-4 py-2 bg-[var(--danger)] hover:bg-red-700 text-white rounded text-sm transition-colors flex items-center gap-2"
                        onClick={() => onQuarantine(node.id)}
                      >
                        <AlertOctagon size={16} /> Quarantine Bad Lineage
                      </button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
