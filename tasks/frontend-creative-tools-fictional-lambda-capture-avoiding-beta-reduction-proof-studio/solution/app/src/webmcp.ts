import { useLambdaStore } from './store';
import { exportProofArtifact, importProofArtifact } from './utils/artifacts';
import { computeDeBruijn } from './utils/reducer';

export function setupWebMCP() {
  (window as any).webmcp_session_info = {
    name: 'Fictional Lambda Capture-Avoiding Beta-Reduction Proof Studio',
    version: '1.0.0',
    capabilities: {
      action: true,
      state: true,
    },
  };

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: 'evaluate_state',
        description: 'Evaluate current topology, binders, arcs, and De Bruijn form.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'simulate_drag_detour',
        description: 'Run exact UI command to beta-reduce APP-ROOT avoiding capture on BINDER-Y with fresh name z.',
        inputSchema: {
          type: 'object',
          properties: {
            redexId: { type: 'string' },
            argumentId: { type: 'string' },
            freshName: { type: 'string' },
            strategy: { type: 'string' },
          },
          required: ['redexId', 'argumentId', 'freshName', 'strategy'],
        },
      },
      {
        name: 'reset',
        description: 'Restore canonical Draft revision.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'export_proof',
        description: 'Request the ZIP binary content as base64 string.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'import_proof',
        description: 'Submit a ZIP binary content as base64 string to replace current state.',
        inputSchema: {
          type: 'object',
          properties: {
            zipBase64: { type: 'string' },
          },
          required: ['zipBase64'],
        },
      },
    ];
  };

  (window as any).webmcp_invoke_tool = async (name: string, args: any) => {
    const store = useLambdaStore.getState();
    switch (name) {
      case 'evaluate_state':
        return {
          nodes: store.nodes,
          binders: store.binders,
          phase: store.phase,
          deBruijnForm: computeDeBruijn(store.nodes),
        };
      case 'simulate_drag_detour':
        store.simulateDragDetour(args.redexId, args.argumentId, args.freshName, args.strategy);
        return { status: 'success' };
      case 'reset':
        store.reset();
        return { status: 'success' };
      case 'export_proof':
        const base64 = await exportProofArtifact();
        return { zipBase64: base64 };
      case 'import_proof':
        await importProofArtifact(args.zipBase64);
        return { status: 'success' };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  };
}
