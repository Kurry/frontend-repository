import { useState } from "react";
import { useGlobalStore } from "./store";
import type { Sherd, Candidate, Point } from "./types";

export function ReconstructionTable() {
  const { state, dispatch } = useGlobalStore();
  const [dragging, setDragging] = useState<{ id: string, startX: number, startY: number, initialTx: number, initialTy: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent, sherd: Sherd) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging({
      id: sherd.id,
      startX: e.clientX,
      startY: e.clientY,
      initialTx: sherd.transform.txMm,
      initialTy: sherd.transform.tyMm
    });
    dispatch({ type: "SET_SELECTION", ids: [sherd.id] });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const dy = e.clientY - dragging.startY;

    const tx = dragging.initialTx + dx;
    const ty = dragging.initialTy + dy;
    const newTransform = { ...state.sherds[dragging.id].transform, txMm: tx, tyMm: ty };

    // This single dispatch now triggers metric evaluation in the reducer for WebMCP parity!
    dispatch({
      type: "TRANSFORM_SHERDS",
      updates: [{ id: dragging.id, transform: newTransform }]
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, sherdId: string) => {
    const sherd = state.sherds[sherdId];
    if (!sherd) return;

    let tx = sherd.transform.txMm;
    let ty = sherd.transform.tyMm;
    let rot = sherd.transform.rotationDeg;

    const step = e.shiftKey ? 5.0 : 0.5;

    if (e.altKey) {
      if (e.key === "ArrowLeft") rot -= step;
      if (e.key === "ArrowRight") rot += step;
    } else {
      if (e.key === "ArrowLeft") tx -= step;
      if (e.key === "ArrowRight") tx += step;
      if (e.key === "ArrowUp") ty -= step;
      if (e.key === "ArrowDown") ty += step;
    }

    if (tx !== sherd.transform.txMm || ty !== sherd.transform.tyMm || rot !== sherd.transform.rotationDeg) {
       dispatch({
         type: "TRANSFORM_SHERDS",
         updates: [{ id: sherdId, transform: { txMm: tx, tyMm: ty, rotationDeg: rot } }]
       });
    }
  };

  return (
    <div className="relative w-full h-[700px] bg-slate-50 border overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 900 700">
        {Object.values(state.sherds).map((sherd: Sherd) => {
          if (sherd.id === "SH-29" && !state.lateFragmentRevealed) return null;

          return (
            <g
              key={sherd.id}
              tabIndex={0}
              transform={`translate(${sherd.transform.txMm}, ${sherd.transform.tyMm}) rotate(${sherd.transform.rotationDeg})`}
              className={`cursor-move outline-none ${state.selection.includes(sherd.id) ? 'drop-shadow-md' : ''}`}
              onPointerDown={(e) => handlePointerDown(e, sherd)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onKeyDown={(e) => handleKeyDown(e, sherd.id)}
            >
              <polygon
                points={sherd.localPolygon.map((p: Point) => `${p.x},${p.y}`).join(" ")}
                fill="currentColor"
                className={`${state.selection.includes(sherd.id) ? 'text-stone-400 stroke-blue-500' : 'text-stone-300 stroke-stone-500'} stroke-2 hover:text-stone-400 transition-colors`}
              />
              <text x="10" y="20" className="text-xs font-mono select-none pointer-events-none">{sherd.id}</text>
            </g>
          );
        })}
        {/* Draw match connectors */}
        {Object.values(state.candidates).filter((c: Candidate) => c.status === "accepted").map((candidate: Candidate) => {
          const edgeA = state.edges[candidate.edgeAId];
          const edgeB = state.edges[candidate.edgeBId];
          const sherdA = state.sherds[edgeA.sherdId];
          const sherdB = state.sherds[edgeB.sherdId];

          return (
            <line
              key={candidate.id}
              x1={sherdA.transform.txMm} y1={sherdA.transform.tyMm}
              x2={sherdB.transform.txMm} y2={sherdB.transform.tyMm}
              className="stroke-green-500 stroke-2"
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>
    </div>
  );
}
