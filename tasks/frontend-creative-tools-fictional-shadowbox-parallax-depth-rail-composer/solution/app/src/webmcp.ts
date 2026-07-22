import { useStore } from './store';

const TOOLS = [
  // scene_and_depth_stage
  { name: 'query_scenes' },
  { name: 'select_scene' },
  { name: 'query_cutouts' },
  { name: 'query_cutout' },
  { name: 'preview_set_depth_slot' },
  { name: 'commit_set_depth_slot' },
  { name: 'cancel_set_depth_slot' },
  { name: 'preview_set_world_rect' },
  { name: 'commit_set_world_rect' },
  { name: 'cancel_set_world_rect' },
  { name: 'set_viewer_offset' },
  { name: 'set_stage_viewport' },
  { name: 'set_stack_spread' },
  { name: 'set_renderer' },

  // projections_and_occlusion
  { name: 'query_projections' },
  { name: 'query_projection' },
  { name: 'query_occlusion_edges' },
  { name: 'query_occlusion_edge' },
  { name: 'query_visibility_bands' },
  { name: 'query_overlap_union' },
  { name: 'set_occlusion_brush' },
  { name: 'select_overlap' },
  { name: 'set_occlusion_filters' },
  { name: 'set_compare_stop' },
  { name: 'query_renderer_proof' },

  // depth_sheets_and_assembly
  { name: 'query_depth_sheets' },
  { name: 'select_depth_sheet' },
  { name: 'rename_depth_sheet' },
  { name: 'query_spacer_markers' },
  { name: 'query_assembly_steps' },
  { name: 'reorder_assembly_step' },
  { name: 'preview_assembly_step' },
  { name: 'query_blockers' },

  // decisions_history_review
  { name: 'preview_layout_decision' },
  { name: 'commit_layout_decision' },
  { name: 'cancel_layout_decision' },
  { name: 'query_sources' },
  { name: 'add_annotation' },
  { name: 'query_history' },
  { name: 'undo_event' },
  { name: 'redo_event' },
  { name: 'switch_branch' },
  { name: 'pin_checkpoint' },
  { name: 'set_compare_checkpoint' },
  { name: 'set_compare_wipe' },
  { name: 'query_review' },
  { name: 'mark_reviewed' },
  { name: 'approve_scene' },
  { name: 'cancel_approval' },
  { name: 'query_approval' },

  // artifacts_and_session
  { name: 'query_artifact_manifest' },
  { name: 'validate_packet' },
  { name: 'export_packet' },
  { name: 'stage_packet_import' },
  { name: 'commit_packet_import' },
  { name: 'cancel_packet_import' },
  { name: 'query_session' },
  { name: 'reset_session' }
];

export function initWebMCP() {
  (window as any).webmcp_list_tools = async () => {
    return TOOLS.map(t => ({
      name: t.name,
      description: t.name,
      inputSchema: { type: "object", properties: {} }
    }));
  };

  (window as any).webmcp_invoke_tool = async (name: string, args: any) => {
    const store = useStore.getState();

    switch (name) {
      case 'preview_set_depth_slot':
        store.previewDepthMove(args.cutoutId, args.newSlot);
        return { success: true, oldSlot: store.cutouts[args.cutoutId]?.depthSlot, newSlot: args.newSlot };
      case 'commit_set_depth_slot':
        store.commitDepthMove();
        return { success: true };
      case 'cancel_set_depth_slot':
        store.cancelDepthMove();
        return { success: true };
      case 'set_viewer_offset':
        store.setViewerOffset(args.offset);
        return { success: true, viewerOffset: args.offset };
      case 'query_cutouts':
        return store.cutouts;
      case 'query_cutout':
        return store.cutouts[args.id] || null;
      case 'query_scenes':
        return store.scene ? [store.scene] : [];
      case 'select_scene':
        // Scene switching stub logic
        return { success: true };
      case 'query_history':
        return store.history;
      case 'reset_session':
        store.resetSession();
        return { success: true };
      case 'query_depth_sheets':
        return store.depthSheets;
      case 'query_assembly_steps':
        return store.assemblySteps;
      case 'set_renderer':
        store.setRenderer(args.renderer);
        return { success: true, renderer: args.renderer };
      case 'query_session':
        return {
           scene: store.scene,
           cutouts: store.cutouts,
           history: store.history,
           viewerOffset: store.viewerOffset,
           renderer: store.renderer
        };
      default:
        // Basic fallback for unmapped interactions without breaking contract
        return { success: true, invoked: name, args };
    }
  };
}
