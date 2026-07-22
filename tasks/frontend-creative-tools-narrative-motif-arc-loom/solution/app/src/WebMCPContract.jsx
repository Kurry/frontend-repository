import { useEffect } from 'react';
import { useStore } from './store.js';

export function WebMCPContract() {
  const classifySpan = useStore(state => state.classifySpan);
  const addRelation = useStore(state => state.addRelation);
  const moveStage = useStore(state => state.moveStage);
  const loadAtlas = useStore(state => state.loadAtlas);
  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);

  useEffect(() => {
    // Expose store for testing easily
    window.__store = useStore;

    window.webmcp_session_info = {
      name: "Narrative Motif Arc Loom",
      version: "1.0.0"
    };

    window.webmcp_list_tools = () => {
      return [
        { name: "classifySpan", description: "Classify a span to a motif", parameters: { spanId: "string", motifId: "string", isCounterexample: "boolean" } },
        { name: "addRelation", description: "Add a relation between stages" },
        { name: "moveStage", description: "Move a motif stage node vertically" },
        { name: "undo", description: "Undo last action" },
        { name: "redo", description: "Redo last action" },
        { name: "loadAtlas", description: "Load an exported atlas" }
      ];
    };

    window.webmcp_invoke_tool = (toolName, params) => {
      if (toolName === "classifySpan") {
        classifySpan(params.spanId, params.motifId, params.isCounterexample);
        return { success: true };
      }
      if (toolName === "addRelation") {
        addRelation(params);
        return { success: true };
      }
      if (toolName === "moveStage") {
        moveStage(params.motifId, params.collectionId, params.y);
        return { success: true };
      }
      if (toolName === "undo") {
        undo();
        return { success: true };
      }
      if (toolName === "redo") {
        redo();
        return { success: true };
      }
      if (toolName === "loadAtlas") {
        loadAtlas(params.atlasData);
        return { success: true };
      }
      return { success: false, error: "Tool not found" };
    };

  }, [classifySpan, addRelation, moveStage, loadAtlas, undo, redo]);

  return null;
}
