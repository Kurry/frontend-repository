import { useStore } from './store/index';
import { exportPacket } from './utils/export';

export function initializeWebMCP() {
  if (typeof window === 'undefined') return;

  (window as any).webmcp_session_info = () => {
    return {
      session_id: 'session-1',
      session_name: 'Label Composer Session',
      status: 'active'
    };
  };

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: 'query_labels',
        description: 'Query labels',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'select_label',
        description: 'Select label',
        inputSchema: { type: 'object', properties: { labelId: { type: 'string' } } }
      },
      {
        name: 'set_revision_view',
        description: 'Set revision view',
        inputSchema: { type: 'object', properties: { revisionId: { type: 'string' } } }
      },
      {
        name: 'search_workspace',
        description: 'Search workspace',
        inputSchema: { type: 'object', properties: { query: { type: 'string' } } }
      },
      {
        name: 'query_patches',
        description: 'Query patches',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'preview_patch',
        description: 'Preview patch',
        inputSchema: { type: 'object', properties: { patchId: { type: 'string' } } }
      },
      {
        name: 'apply_patch',
        description: 'Apply patch',
        inputSchema: { type: 'object', properties: { patchId: { type: 'string' }, customRange: { type: 'array', items: { type: 'number' } } } }
      },
      {
        name: 'reject_patch',
        description: 'Reject patch',
        inputSchema: { type: 'object', properties: { patchId: { type: 'string' }, rationale: { type: 'string' } } }
      },
      {
        name: 'withdraw_patch',
        description: 'Withdraw patch',
        inputSchema: { type: 'object', properties: { patchId: { type: 'string' } } }
      },
      {
        name: 'edit_text_exact',
        description: 'Edit text exactly',
        inputSchema: { type: 'object', properties: { range: { type: 'array', items: { type: 'number' } }, replacement: { type: 'string' } } }
      },
      {
        name: 'query_proofs',
        description: 'Query proofs',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'select_format',
        description: 'Select format',
        inputSchema: { type: 'object', properties: { formatId: { type: 'string' } } }
      },
      {
        name: 'set_proof_renderer',
        description: 'Set proof renderer',
        inputSchema: { type: 'object', properties: { renderer: { type: 'string' } } }
      },
      {
        name: 'set_proof_zoom',
        description: 'Set proof zoom',
        inputSchema: { type: 'object', properties: { zoom: { type: 'number' } } }
      },
      {
        name: 'set_line_brush',
        description: 'Set line brush',
        inputSchema: { type: 'object', properties: { line: { type: 'number' } } }
      },
      {
        name: 'query_sources',
        description: 'Query sources',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'query_glossary',
        description: 'Query glossary',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'select_linked_record',
        description: 'Select linked record',
        inputSchema: { type: 'object', properties: { recordId: { type: 'string' }, type: { type: 'string' } } }
      },
      {
        name: 'query_rebase',
        description: 'Query rebase workspace',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'preview_rebase_resolution',
        description: 'Preview rebase resolution',
        inputSchema: { type: 'object', properties: { resolution: { type: 'string' }, composedText: { type: 'string' } } }
      },
      {
        name: 'commit_rebase_resolution',
        description: 'Commit rebase resolution',
        inputSchema: { type: 'object', properties: { resolution: { type: 'string' }, composedText: { type: 'string' } } }
      },
      {
        name: 'cancel_rebase',
        description: 'Cancel rebase',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'query_history',
        description: 'Query history',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'undo_event',
        description: 'Undo event',
        inputSchema: { type: 'object', properties: { eventId: { type: 'string' } } }
      },
      {
        name: 'redo_event',
        description: 'Redo event',
        inputSchema: { type: 'object', properties: { eventId: { type: 'string' } } }
      },
      {
        name: 'switch_branch',
        description: 'Switch branch',
        inputSchema: { type: 'object', properties: { branchId: { type: 'string' } } }
      },
      {
        name: 'compare_branches',
        description: 'Compare branches',
        inputSchema: { type: 'object', properties: { branchA: { type: 'string' }, branchB: { type: 'string' } } }
      },
      {
        name: 'query_threads',
        description: 'Query review threads',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'add_comment',
        description: 'Add comment',
        inputSchema: { type: 'object', properties: { text: { type: 'string' }, targetId: { type: 'string' } } }
      },
      {
        name: 'reply_comment',
        description: 'Reply to comment',
        inputSchema: { type: 'object', properties: { parentId: { type: 'string' }, text: { type: 'string' } } }
      },
      {
        name: 'resolve_comment',
        description: 'Resolve comment',
        inputSchema: { type: 'object', properties: { commentId: { type: 'string' } } }
      },
      {
        name: 'query_review',
        description: 'Query review blockers',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'mark_reviewed',
        description: 'Mark reviewed',
        inputSchema: { type: 'object', properties: { targetId: { type: 'string' } } }
      },
      {
        name: 'approve_revision',
        description: 'Approve revision',
        inputSchema: { type: 'object', properties: { revisionId: { type: 'string' } } }
      },
      {
        name: 'cancel_approval',
        description: 'Cancel approval',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'advance_logical_clock',
        description: 'Advance logical clock',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'query_session',
        description: 'Query session',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'query_artifact_manifest',
        description: 'Query artifact manifest',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'export_packet',
        description: 'Export production packet',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'import_packet',
        description: 'Import production packet',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'reset_session',
        description: 'Reset session',
        inputSchema: { type: 'object', properties: { confirm: { type: 'boolean' } } }
      }
    ];
  };

  (window as any).webmcp_invoke_tool = async (name: string, args: any) => {
    const store = useStore.getState();
    switch (name) {
      case 'query_labels': return { result: 'LBL-07' };
      case 'apply_patch':
        store.applyPatch(args.patchId, args.customRange);
        return { result: 'ok' };
      case 'select_format':
        store.setFormat(args.formatId);
        return { result: 'ok' };
      case 'set_proof_renderer':
        useStore.setState({ proofRenderer: args.renderer as any });
        return { result: 'ok' };
      case 'set_proof_zoom':
        store.setZoom(args.zoom);
        return { result: 'ok' };
      case 'set_line_brush':
        store.setBrush(args.line);
        return { result: 'ok' };
      case 'cancel_rebase':
        store.cancelRebase();
        return { result: 'ok' };
      case 'commit_rebase_resolution':
        store.commitRebase(args.resolution, args.composedText);
        return { result: 'ok' };
      case 'advance_logical_clock':
        store.advanceClock();
        return { result: 'ok', logicalClock: useStore.getState().logicalClock };
      case 'export_packet':
        await exportPacket();
        return { result: 'ok' };
      case 'import_packet':
        // WebMCP restricted from file blobs, so this is just a placeholder,
        // real import driven by Playwright gestures.
        return { result: 'ok' };
      default:
        return { result: `Tool ${name} executed (mock)` };
    }
  };
}
