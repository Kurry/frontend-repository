import { useGlobalStore } from "./store";
import type { Candidate } from "./types";

export function EdgeMicroscope() {
  const { state, dispatch } = useGlobalStore();

  // Find an active candidate based on selection, or just the first unreviewed one for demo
  let activeCandidate: Candidate | undefined;

  // Priority 1: Unreviewed candidate involving a selected sherd
  for (const c of Object.values(state.candidates)) {
    if (c.status === "unreviewed") {
       const sherdAId = state.edges[c.edgeAId]?.sherdId;
       const sherdBId = state.edges[c.edgeBId]?.sherdId;
       if (state.selection.includes(sherdAId) || state.selection.includes(sherdBId)) {
          activeCandidate = c;
          break;
       }
    }
  }

  // Priority 2: Any accepted candidate involving selection
  if (!activeCandidate) {
    for (const c of Object.values(state.candidates)) {
       const sherdAId = state.edges[c.edgeAId]?.sherdId;
       const sherdBId = state.edges[c.edgeBId]?.sherdId;
       if (state.selection.includes(sherdAId) || state.selection.includes(sherdBId)) {
          activeCandidate = c;
          break;
       }
    }
  }

  // Priority 3: Fallback to first available
  if (!activeCandidate) {
     activeCandidate = Object.values(state.candidates)[0];
  }

  if (!activeCandidate) {
    return (
      <div className="p-4 bg-white border rounded shadow-sm">
        <h3 className="font-bold">Edge Microscope</h3>
        <p className="text-sm text-slate-500">No candidates available.</p>
      </div>
    );
  }

  const handleAccept = () => {
    if (activeCandidate!.metrics.endpointResidualMm > 1.5 || activeCandidate!.metrics.meanResidualMm > 1.0) {
      alert("Invalid: Residuals exceed tolerance");
      return;
    }

    dispatch({
      type: "UPDATE_CANDIDATE",
      id: activeCandidate!.id,
      update: { status: "accepted", confidence: "supported", rationale: "Edge profiles match within 1.0mm tolerance." }
    });
  };

  const handleReject = () => {
    dispatch({
      type: "UPDATE_CANDIDATE",
      id: activeCandidate!.id,
      update: { status: "rejected", confidence: "rejected", rationale: "Edge tangent exceeds 4.0deg tolerance." }
    });
  };

  return (
    <div className="p-4 bg-white border rounded shadow-sm flex flex-col gap-4">
      <h3 className="font-bold">Edge Microscope</h3>
      <div className="text-sm font-mono flex flex-col gap-1">
        <div>Candidate: {activeCandidate.id}</div>
        <div>Status: <span className={`font-bold ${activeCandidate.status === 'accepted' ? 'text-green-600' : 'text-slate-600'}`}>{activeCandidate.status}</span></div>
        <div>Mean Residual: {activeCandidate.metrics.meanResidualMm.toFixed(2)} mm (Tolerance: 1.0mm)</div>
        <div>Endpoint Residual: {activeCandidate.metrics.endpointResidualMm.toFixed(2)} mm (Tolerance: 1.5mm)</div>
        <div>Tangent Mismatch: {activeCandidate.metrics.tangentMismatchDeg.toFixed(1)}° (Tolerance: 4.0°)</div>
      </div>

      {activeCandidate.status === "unreviewed" && (
        <div className="flex gap-2">
          <button
             onClick={handleAccept}
             disabled={activeCandidate.metrics.endpointResidualMm > 1.5}
             className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">
             Accept Match
          </button>
          <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">Reject</button>
        </div>
      )}
      {activeCandidate.rationale && (
        <div className="text-sm text-slate-600 italic mt-2">"{activeCandidate.rationale}"</div>
      )}
    </div>
  );
}
