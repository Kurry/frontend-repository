import { useGlobalStore } from "./store";
import { generateExports, downloadFile } from "./export";

export function EvidenceLedger() {
  const { state, dispatch } = useGlobalStore();

  const handleReveal = () => {
    dispatch({ type: "REVEAL_LATE_FRAGMENT" });
  };

  const handleExport = () => {
    const exports = generateExports(state);
    downloadFile(exports.json, "kiln-lot-reconstruction.json", "application/json");
    downloadFile(exports.svg, "reconstruction-layout.svg", "image/svg+xml");
    downloadFile(exports.csv, "edge-decisions.csv", "text/csv");
    downloadFile(exports.profileSvg, "vessel-profile.svg", "image/svg+xml");
    downloadFile(exports.md, "evidence-plate.md", "text/markdown");
  };

  return (
    <div className="p-4 bg-slate-50 border rounded flex flex-col gap-3">
      <h3 className="font-bold">Evidence Ledger</h3>
      <div className="text-sm">
        <div>Logical Clock: {state.logicalClock}</div>
        <div>Revisions: {Object.keys(state.revisions).length}</div>
        <div>Events: {Object.keys(state.events).length}</div>
        <div>Late Fragment SH-29: {state.lateFragmentRevealed ? "Revealed" : "Hidden"}</div>
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={handleReveal} disabled={state.lateFragmentRevealed} className="px-3 py-1 bg-purple-600 text-white rounded text-sm disabled:opacity-50">Reveal SH-29</button>
        <button onClick={handleExport} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Export Artifacts</button>
      </div>
    </div>
  );
}
