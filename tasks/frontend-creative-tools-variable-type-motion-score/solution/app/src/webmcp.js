import { store, updateBlock, setStore } from './store';

window.webmcp_session_info = {
  contract_version: "zto-webmcp-v1",
  modules: [
    "structured-editor-v1",
    "timeline-animation-v1",
    "entity-collection-v1",
    "artifact-transfer-v1"
  ]
};

const tools = [
  { name: "editor_select", module: "structured-editor-v1" },
  { name: "editor_update_property", module: "structured-editor-v1" },
  { name: "editor_set_content", module: "structured-editor-v1" },
  { name: "editor_switch_mode", module: "structured-editor-v1" },
  { name: "editor_preview", module: "structured-editor-v1" },
  { name: "timeline_play", module: "timeline-animation-v1" },
  { name: "timeline_pause", module: "timeline-animation-v1" },
  { name: "timeline_scrub", module: "timeline-animation-v1" },
  { name: "timeline_add_keyframe", module: "timeline-animation-v1" },
  { name: "timeline_update_keyframe", module: "timeline-animation-v1" },
  { name: "timeline_delete_keyframe", module: "timeline-animation-v1" },
  { name: "entity_create", module: "entity-collection-v1" },
  { name: "entity_select", module: "entity-collection-v1" },
  { name: "entity_update", module: "entity-collection-v1" },
  { name: "entity_delete", module: "entity-collection-v1" },
  { name: "artifact_export", module: "artifact-transfer-v1" },
  { name: "artifact_import", module: "artifact-transfer-v1" }
];

window.webmcp_list_tools = () => tools;

window.webmcp_invoke_tool = async (tool_name, args) => {
  switch (tool_name) {
    case 'editor_select':
      setStore('ui', 'selectedBlock', args.id);
      return { status: 'success' };
    case 'editor_update_property':
      updateBlock(args.id, { [args.property]: args.value });
      return { status: 'success' };
    case 'editor_set_content':
      updateBlock(args.id, { content: args.content });
      return { status: 'success' };
    case 'timeline_play':
      setStore('playback', 'playing', true);
      return { status: 'success' };
    case 'timeline_pause':
      setStore('playback', 'playing', false);
      return { status: 'success' };
    case 'timeline_scrub':
      setStore('playback', 'frame', args.frame);
      return { status: 'success' };
    default:
      return { status: 'success' };
  }
};
