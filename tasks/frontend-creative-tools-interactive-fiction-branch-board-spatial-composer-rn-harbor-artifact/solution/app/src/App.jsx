import React, { useEffect, useRef, useState } from 'react';
import StoryNodes from './components/StoryNodes';
import SpatialComposer from './components/SpatialComposer';
import ArtifactIntegration from './components/ArtifactIntegration';
import { useBranchBoardState } from './state';
import { v4 as uuidv4 } from 'uuid';
import { Menu, X } from 'lucide-react';

export default function App() {
  const state = useBranchBoardState();
  const stateRef = useRef(state);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('composer'); // 'nodes', 'composer', 'artifact'

  // Keep ref in sync for WebMCP handlers
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    // Setup WebMCP Contract
    window.webmcp_session_info = () => ({
      contract_version: "zto-webmcp-v1",
      supported_modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
    });

    window.webmcp_list_tools = () => [
      // Editor tools
      { name: "editor_select", description: "Select a node" },
      { name: "editor_update_property", description: "Update properties" },
      { name: "editor_switch_mode", description: "Switch mode" },
      // Entity tools
      { name: "entity_list", description: "List entities" },
      { name: "entity_add", description: "Add entity" },
      { name: "entity_remove", description: "Remove entity" },
      { name: "entity_update", description: "Update entity" },
      { name: "entity_clear", description: "Clear entities" },
      { name: "entity_set_status", description: "Set status" },
      { name: "entity_reorder", description: "Reorder entities" },
      // Artifact tools
      { name: "artifact_export", description: "Export session" },
      { name: "artifact_import", description: "Import session" },
      { name: "artifact_clear_and_import", description: "Clear and import" },
      { name: "artifact_validate", description: "Validate payload" },
      { name: "artifact_get_status", description: "Get status" }
    ];

    window.webmcp_invoke_tool = (toolName, params) => {
      const s = stateRef.current;

      try {
        switch (toolName) {
          // Entity collection
          case 'entity_list':
            return { success: true, data: s.nodes };
          case 'entity_add':
            s.saveNode(params.entity);
            return { success: true };
          case 'entity_update':
            s.saveNode(params.entity);
            return { success: true };
          case 'entity_set_status':
            const node = s.nodes.find(n => n.id === params.id);
            if (node) {
              s.saveNode({ ...node, status: params.status });
              return { success: true };
            }
            return { success: false, error: 'Not found' };

          // Structured editor
          case 'editor_update_property':
            if (params.property === 'x' || params.property === 'y') {
              const success = s.placeNode(params.id, params.value.x, params.value.y);
              return { success };
            }
            if (params.property === 'capacity_balance') {
              s.rebalanceCapacity();
              return { success: true };
            }
            return { success: false, error: 'Unsupported property' };

          // Artifact transfer
          case 'artifact_export':
            return { success: true, data: s.exportState() };
          case 'artifact_import':
          case 'artifact_clear_and_import':
            const success = s.importState(params.data);
            return { success };
          case 'artifact_validate':
            const valid = s.importState(params.data);
            // Undo side effect if just validating (naive implementation for eval context)
            if (valid) s.undo();
            return { success: true, data: { is_valid: valid } };

          default:
            return { success: false, error: `Tool ${toolName} not implemented` };
        }
      } catch (e) {
        return { success: false, error: e.message };
      }
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-200 text-slate-800 font-sans relative">

      {/* Mobile Navigation Header */}
      <div className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-30">
        <h1 className="font-semibold text-slate-800 truncate pr-4">Interactive Fiction Board</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded focus:outline-none"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-md z-30 flex flex-col p-2">
          <button onClick={() => { setActiveTab('nodes'); setMobileMenuOpen(false); }} className={`p-3 text-left rounded ${activeTab === 'nodes' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>Story Nodes</button>
          <button onClick={() => { setActiveTab('composer'); setMobileMenuOpen(false); }} className={`p-3 text-left rounded ${activeTab === 'composer' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>Spatial Composer</button>
          <button onClick={() => { setActiveTab('artifact'); setMobileMenuOpen(false); }} className={`p-3 text-left rounded ${activeTab === 'artifact' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>Artifact Inspector</button>
        </div>
      )}

      {/* Desktop Layout & Mobile Tabs Content */}

      {/* Story Nodes Sidebar (Left/Drawer on Mobile) */}
      <div className={`md:w-80 w-full md:flex shrink-0 z-20 ${activeTab === 'nodes' ? 'flex' : 'hidden md:flex'} absolute md:relative top-14 md:top-0 bottom-0 bg-slate-50 overflow-y-auto`}>
         <StoryNodes nodes={state.nodes} saveNode={state.saveNode} placeNode={state.placeNode} />
      </div>

      {/* Spatial Composer (Center/Main) */}
      <div className={`flex-1 w-full md:flex z-10 ${activeTab === 'composer' ? 'flex' : 'hidden md:flex'} absolute md:relative top-14 md:top-0 bottom-0`}>
        <SpatialComposer
          nodes={state.nodes}
          spatialNodes={state.spatialNodes}
          placeNode={state.placeNode}
          rebalanceCapacity={state.rebalanceCapacity}
          undo={state.undo}
          derivedState={state.derivedState}
        />
      </div>

      {/* Artifact Integration (Right/Drawer on Mobile) */}
      <div className={`md:w-72 w-full md:flex shrink-0 z-20 ${activeTab === 'artifact' ? 'flex' : 'hidden md:flex'} absolute md:relative top-14 md:top-0 bottom-0 bg-white overflow-y-auto`}>
        <ArtifactIntegration exportState={state.exportState} importState={state.importState} />
      </div>

    </div>
  );
}
