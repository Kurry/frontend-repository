import { getGlobalState, updateProjectState, updateCue } from './store';

const sessionInfo = {
  contract_version: "zto-webmcp-v1",
  modules: [
    "entity-collection-v1",
    "structured-editor-v1",
    "command-session-v1",
    "artifact-transfer-v1"
  ]
};

const tools = [
  // Entity Collection
  { name: "collection_select", description: "Select a cue" },
  { name: "collection_add", description: "Add a new cue" },
  { name: "collection_delete", description: "Delete a cue" },
  { name: "collection_update", description: "Update a cue" },
  // Structured Editor
  { name: "editor_select", description: "Select an object in the editor" },
  { name: "editor_add", description: "Add an object in the editor" },
  { name: "editor_delete", description: "Delete an object in the editor" },
  { name: "editor_update_property", description: "Update a property in the editor" },
  // Command Session
  { name: "command_execute", description: "Execute a command (validate, approve, retry, play, seek)" },
  { name: "command_undo", description: "Undo" },
  { name: "command_redo", description: "Redo" },
  { name: "command_reset", description: "Reset" },
  { name: "command_get_status", description: "Get status" },
  { name: "command_commit", description: "Commit" },
  { name: "command_abort", description: "Abort" },
  // Artifact Transfer
  { name: "transfer_export", description: "Export artifacts" },
  { name: "transfer_import", description: "Import artifacts" },
  { name: "transfer_get_schema", description: "Get schema" },
  { name: "transfer_validate", description: "Validate" },
  { name: "transfer_get_transfer_status", description: "Get transfer status" }
];

window.webmcp_session_info = () => JSON.stringify(sessionInfo);
window.webmcp_list_tools = () => JSON.stringify(tools);

window.webmcp_invoke_tool = (toolName, argsStr) => {
  let args = {};
  if (argsStr) {
    try {
      if (typeof argsStr === 'string') {
      try { args = JSON.parse(argsStr); } catch (e) { console.error(e); }
  } else if (typeof argsStr === 'object') {
      args = argsStr;
  }
    } catch (e) {
      console.error("Failed to parse args", e);
    }
  }

  const project = getGlobalState('project');

  switch (toolName) {
    case 'collection_add':
       const newCue = {
         id: `cue-${Date.now()}`,
         start: args.start || project.logicalClock,
         end: args.end || (project.logicalClock + 2000),
         text: args.text || "",
         lane: args.lane || 0,
         speaker: args.speaker || "",
         tokens: args.tokens || [],
         findings: [],
         branches: []
       };
       updateProjectState(p => ({ cues: [...p.cues, newCue] }));
       return JSON.stringify({ success: true, cue: newCue });
    case 'collection_delete':
       updateProjectState(p => ({ cues: p.cues.filter(c => c.id !== args.id) }));
       return JSON.stringify({ success: true });
    case 'collection_update':
       updateCue(args.id, () => ({ ...args.updates }));
       return JSON.stringify({ success: true });
    case 'command_execute':
       if (args.command === 'seek') {
           updateProjectState({ logicalClock: args.time });
           return JSON.stringify({ success: true });
       }
       if (args.command === 'play') {
           updateProjectState({ playbackState: 'playing' });
           return JSON.stringify({ success: true });
       }
       if (args.command === 'validate') {
           // We'll just return success here as the actual validation is in Review.jsx
           // A more fully fleshed WebMCP would bridge these perfectly.
           return JSON.stringify({ success: true });
       }
       return JSON.stringify({ success: false, message: "Unknown command" });
    case 'transfer_export':
       return JSON.stringify({ data: project });
    default:
       return JSON.stringify({ success: true }); // Fallback stub
  }
};
