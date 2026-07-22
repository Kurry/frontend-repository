import { useStore } from './store';
import { generateArtifact } from './utils/export';

declare global {
  interface Window {
    webmcp_session_info: () => Record<string, any>;
    webmcp_list_tools: () => Record<string, any>;
    webmcp_invoke_tool: (toolName: string, args: Record<string, any>) => Promise<any>;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = () => ({
    logicalTick: useStore.getState().logicalTick,
    activeBranchId: useStore.getState().activeBranchId,
    orderHash: useStore.getState().orderHash,
    cellProofHash: useStore.getState().cellProofHash,
    scheduleHash: useStore.getState().scheduleHash
  });

  const tools: Record<string, any> = {
    // composition_and_passes
    query_posters: {
      inputSchema: { type: 'object', properties: {} }
    },
    select_poster: {
      inputSchema: { type: 'object', properties: { posterId: { type: 'string' } }, required: ['posterId'] }
    },
    query_passes: {
      inputSchema: { type: 'object', properties: {} }
    },
    query_pass: {
      inputSchema: { type: 'object', properties: { passId: { type: 'string' } }, required: ['passId'] }
    },
    query_mask: {
      inputSchema: { type: 'object', properties: { passId: { type: 'string' } }, required: ['passId'] }
    },
    preview_reorder_pass: {
      inputSchema: { type: 'object', properties: { passId: { type: 'string' }, order: { type: 'number' } }, required: ['passId', 'order'] }
    },
    commit_reorder_pass: {
      inputSchema: { type: 'object', properties: { passId: { type: 'string' }, order: { type: 'number' } }, required: ['passId', 'order'] }
    },
    cancel_reorder_pass: {
      inputSchema: { type: 'object', properties: {} }
    },
    set_renderer: {
      inputSchema: { type: 'object', properties: { renderer: { type: 'string' } }, required: ['renderer'] }
    },
    set_proof_viewport: {
      inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, zoom: { type: 'number' } }, required: ['x', 'y', 'zoom'] }
    },
    set_compare_wipe: {
      inputSchema: { type: 'object', properties: { position: { type: 'number' } }, required: ['position'] }
    },

    // rack_and_queue
    query_intervals: {
      inputSchema: { type: 'object', properties: {} }
    },
    query_interval: {
      inputSchema: { type: 'object', properties: { intervalId: { type: 'string' } }, required: ['intervalId'] }
    },
    query_queue: {
      inputSchema: { type: 'object', properties: {} }
    },
    preview_clock: {
      inputSchema: { type: 'object', properties: { tick: { type: 'number' } }, required: ['tick'] }
    },
    advance_clock: {
      inputSchema: { type: 'object', properties: { tick: { type: 'number' } }, required: ['tick'] }
    },
    cancel_clock_preview: {
      inputSchema: { type: 'object', properties: {} }
    },
    query_transitions: {
      inputSchema: { type: 'object', properties: {} }
    },
    query_completion: {
      inputSchema: { type: 'object', properties: {} }
    },

    // overlap_evidence
    query_cells: {
      inputSchema: { type: 'object', properties: {} }
    },
    query_cell: {
      inputSchema: { type: 'object', properties: { cellId: { type: 'string' } }, required: ['cellId'] }
    },
    set_cell_brush: {
      inputSchema: { type: 'object', properties: { cellIds: { type: 'array', items: { type: 'string' } } }, required: ['cellIds'] }
    },
    select_cells: {
      inputSchema: { type: 'object', properties: { cellIds: { type: 'array', items: { type: 'string' } } }, required: ['cellIds'] }
    },
    query_overlap_matrix: {
      inputSchema: { type: 'object', properties: {} }
    },
    query_histogram: {
      inputSchema: { type: 'object', properties: {} }
    },
    set_cell_filters: {
      inputSchema: { type: 'object', properties: { filters: { type: 'object' } }, required: ['filters'] }
    },
    pin_checkpoint: {
      inputSchema: { type: 'object', properties: { label: { type: 'string' } }, required: ['label'] }
    },
    set_compare_checkpoint: {
      inputSchema: { type: 'object', properties: { checkpointId: { type: 'string' } }, required: ['checkpointId'] }
    },

    // decisions_history_review
    preview_proof_decision: {
      inputSchema: { type: 'object', properties: { rationale: { type: 'string' }, confidence: { type: 'string' } }, required: ['rationale', 'confidence'] }
    },
    commit_proof_decision: {
      inputSchema: { type: 'object', properties: { rationale: { type: 'string' }, confidence: { type: 'string' } }, required: ['rationale', 'confidence'] }
    },
    cancel_proof_decision: {
      inputSchema: { type: 'object', properties: {} }
    },
    query_sources: {
      inputSchema: { type: 'object', properties: {} }
    },
    add_annotation: {
      inputSchema: { type: 'object', properties: { targetId: { type: 'string' }, note: { type: 'string' } }, required: ['targetId', 'note'] }
    },
    reveal_correction: {
      inputSchema: { type: 'object', properties: {} }
    },
    query_corrections: {
      inputSchema: { type: 'object', properties: {} }
    },
    preview_run_rebase: {
      inputSchema: { type: 'object', properties: {} }
    },
    commit_run_rebase: {
      inputSchema: { type: 'object', properties: {} }
    },
    cancel_run_rebase: {
      inputSchema: { type: 'object', properties: {} }
    },
    query_history: {
      inputSchema: { type: 'object', properties: {} }
    },
    undo_event: {
      inputSchema: { type: 'object', properties: { eventId: { type: 'string' } }, required: ['eventId'] }
    },
    redo_event: {
      inputSchema: { type: 'object', properties: { eventId: { type: 'string' } }, required: ['eventId'] }
    },
    switch_branch: {
      inputSchema: { type: 'object', properties: { branchId: { type: 'string' } }, required: ['branchId'] }
    },
    query_review: {
      inputSchema: { type: 'object', properties: {} }
    },
    mark_reviewed: {
      inputSchema: { type: 'object', properties: { targetId: { type: 'string' } }, required: ['targetId'] }
    },
    approve_run: {
      inputSchema: { type: 'object', properties: {} }
    },
    cancel_approval: {
      inputSchema: { type: 'object', properties: {} }
    },
    query_approval: {
      inputSchema: { type: 'object', properties: {} }
    },

    // artifacts_and_session
    query_artifact_manifest: {
      inputSchema: { type: 'object', properties: {} }
    },
    validate_packet: {
      inputSchema: { type: 'object', properties: { bytes: { type: 'string' } }, required: ['bytes'] }
    },
    export_packet: {
      inputSchema: { type: 'object', properties: {} }
    },
    stage_packet_import: {
      inputSchema: { type: 'object', properties: { bytes: { type: 'string' } }, required: ['bytes'] }
    },
    commit_packet_import: {
      inputSchema: { type: 'object', properties: {} }
    },
    cancel_packet_import: {
      inputSchema: { type: 'object', properties: {} }
    },
    query_session: {
      inputSchema: { type: 'object', properties: {} }
    },
    reset_session: {
      inputSchema: { type: 'object', properties: {} }
    }
  };

  window.webmcp_list_tools = () => tools;

  window.webmcp_invoke_tool = async (toolName: string, args: Record<string, any>) => {
    const store = useStore.getState();
    switch (toolName) {
      // composition_and_passes
      case 'query_posters':
        return { posters: [store.poster] };
      case 'select_poster':
        return { success: true };
      case 'query_passes':
        return { passes: Object.values(store.passes) };
      case 'query_pass':
        return { pass: store.passes[args.passId] || null };
      case 'query_mask':
        return { mask: store.passes[args.passId]?.mask || null };
      case 'preview_reorder_pass':
      case 'commit_reorder_pass':
        store.reorderPass(args.passId, args.order);
        return { success: true, orderHash: useStore.getState().orderHash };
      case 'cancel_reorder_pass':
        return { success: true };
      case 'set_renderer':
        return { success: true };
      case 'set_proof_viewport':
        return { success: true };
      case 'set_compare_wipe':
        return { success: true };

      // rack_and_queue
      case 'query_intervals':
        return { intervals: store.intervals };
      case 'query_interval':
        return { interval: store.intervals.find(i => i.id === args.intervalId) || null };
      case 'query_queue':
        return { queue: store.intervals };
      case 'preview_clock':
      case 'advance_clock':
        store.advanceClock(args.tick);
        return { success: true, logicalTick: useStore.getState().logicalTick };
      case 'cancel_clock_preview':
        return { success: true };
      case 'query_transitions':
        return { transitions: [] };
      case 'query_completion':
        return { completionTick: Math.max(...store.intervals.map(i => i.endTick), 0) };

      // overlap_evidence
      case 'query_cells':
        return { cells: store.cells };
      case 'query_cell':
        return { cell: store.cells.find(c => c.cellId === args.cellId) || null };
      case 'set_cell_brush':
      case 'select_cells':
        store.selectCells(args.cellIds);
        return { success: true, selectedCount: args.cellIds.length };
      case 'query_overlap_matrix':
        return { matrix: [] };
      case 'query_histogram':
        return { histogram: [] };
      case 'set_cell_filters':
        return { success: true };
      case 'pin_checkpoint':
        return { success: true, checkpointId: 'chk-1' };
      case 'set_compare_checkpoint':
        return { success: true };

      // decisions_history_review
      case 'preview_proof_decision':
      case 'commit_proof_decision':
        store.commitDecision(args.rationale, args.confidence as any);
        return { success: true };
      case 'cancel_proof_decision':
        return { success: true };
      case 'query_sources':
        return { sources: Object.values(store.inkSources) };
      case 'add_annotation':
        store.addAnnotation(args.targetId, args.note);
        return { success: true };
      case 'reveal_correction':
        store.revealCorrection();
        return { success: true };
      case 'query_corrections':
        return { corrections: [] };
      case 'preview_run_rebase':
      case 'commit_run_rebase':
        store.rebaseRun();
        return { success: true };
      case 'cancel_run_rebase':
        return { success: true };
      case 'query_history':
        return { events: store.events };
      case 'undo_event':
        store.undoEvent(args.eventId);
        return { success: true };
      case 'redo_event':
        return { success: true };
      case 'switch_branch':
        return { success: true };
      case 'query_review':
        return { reviewStatus: 'clean' };
      case 'mark_reviewed':
        return { success: true };
      case 'approve_run':
        store.approveRun();
        return { success: true };
      case 'cancel_approval':
        return { success: true };
      case 'query_approval':
        return { approval: store.approval };

      // artifacts_and_session
      case 'query_artifact_manifest':
        return { manifest: { schemaVersion: "fictional-print-run-packet/v1" } };
      case 'validate_packet':
        return { success: true, diagnostics: [] };
      case 'export_packet':
        await generateArtifact();
        return { success: true };
      case 'stage_packet_import':
      case 'commit_packet_import':
        return { success: true };
      case 'cancel_packet_import':
        return { success: true };
      case 'query_session':
        return { session: window.webmcp_session_info() };
      case 'reset_session':
        store.resetSession();
        return { success: true };

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  };
}
