import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Zipper } from './components/Zipper';
import { Grid } from './components/Grid';
import { Quadtree } from './components/Quadtree';
import { IntervalRail } from './components/IntervalRail';
import { exportProof } from './lib/export';
import JSZip from 'jszip';

export default function App() {
  const state = useStore();

  useEffect(() => {
    // Bind WebMCP
    (window as any).webmcp_session_info = {
      name: "frontend-creative-tools-fictional-morton-cell-address-bit-interleave-repair-proof-studio"
    };

    (window as any).webmcp_list_tools = () => [
      { name: "undo" },
      { name: "redo" },
      { name: "selective_undo" },
      { name: "branch_restore" },
      { name: "repair_swap" },
      { name: "add_note" },
      { name: "review" },
      { name: "approve" },
      { name: "export_proof" },
      { name: "import_proof" },
      { name: "reset" }
    ];

    (window as any).webmcp_invoke_tool = async (toolName: string, args: any) => {
      switch (toolName) {
        case 'undo':
          state.undo();
          return { success: true };
        case 'redo':
          state.redo();
          return { success: true };
        case 'selective_undo':
          state.selectiveUndo(args.eventId);
          return { success: true };
        case 'branch_restore':
          state.branchRestore(args.branchId);
          return { success: true };
        case 'repair_swap':
          state.repairSwap(args.tokenId, args.beforeTokenId, args.policy);
          return { success: true };
        case 'add_note':
          state.addNote(args.targetId, args.actor, args.text);
          return { success: true };
        case 'review':
          state.review(args.verdict, args.actor, args.note);
          return { success: true };
        case 'approve':
          state.approve();
          return { success: true };
        case 'export_proof':
          // In a real WebMCP context, we'd probably return base64, but this works for basic testing.
          const blob = await exportProof(state);
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          return { success: true, base64 };
        case 'import_proof':
          try {
            const zip = new JSZip();
            await zip.loadAsync(args.zipBase64, { base64: true });
            const projectStr = await zip.file("morton-project.json")?.async("string");
            if (projectStr) {
              const project = JSON.parse(projectStr);
              state.importState(project);
            }
            return { success: true };
          } catch (e) {
            return { success: false, error: String(e) };
          }
        case 'reset':
          state.reset();
          return { success: true };
        default:
          return { success: false, error: "Unknown tool" };
      }
    };
  }, [state]);

  const handleExport = async () => {
    const blob = await exportProof(state);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cedar-tile-morton-address-proof.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 font-sans selection:bg-blue-200">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fictional Morton Cell-Address Bit-Interleave Repair Proof Studio</h1>
        <p className="text-sm text-gray-600">Archivist tools: fix spatial address bit provenance</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="flex flex-col gap-8">
          <Zipper />
          <IntervalRail />

          <div className="p-4 bg-white border border-gray-300 rounded space-y-4">
            <h2 className="text-xl font-bold">Actions</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold" onClick={() => state.repairSwap('X1', 'Y1', 'adjacent-stable-swap')}>Confirm Swap (Simulated)</button>
              <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300" onClick={state.undo}>Undo</button>
              <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300" onClick={() => state.addNote(state.currentEventId || 'draft', 'Zia', 'Anchor source remains immutable to PIN-A')}>Add Note (Zia)</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={() => { state.review('interleave-repair-exact', 'Zia'); state.approve(); }}>Approve</button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" onClick={handleExport}>Export ZIP</button>
            </div>
            {state.isApproved && <div className="text-green-700 font-bold">Status: APPROVED</div>}
          </div>
        </section>

        <section className="flex flex-col gap-8">
          <Grid />
          <Quadtree />
        </section>
      </main>
    </div>
  );
}
