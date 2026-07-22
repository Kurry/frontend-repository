import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { formatGaussian } from '../lib/math';
import { BinId } from '../lib/schema';

export function PhasorPlane() {
  const store = useStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // SVG Coordinates setup
  // Domain: -4 to 4. Let's make SVG 400x400.
  // Origin at 200, 200.
  // 1 unit = 40 pixels. Quarter unit = 10 pixels.
  const UNIT = 40;
  const ORIGIN = 200;

  const toPx = (q: number) => ORIGIN + (q / 4) * UNIT;
  const toPxY = (q: number) => ORIGIN - (q / 4) * UNIT; // Y axis is inverted in SVG

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (id !== "BIN-K3") return; // Only K3 is unlocked
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    store.selectBin("BIN-K3");
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());

    // Map cursor to quarters
    // (x - ORIGIN) / UNIT = value
    // value * 4 = quarters
    let qX = Math.round(((cursorPt.x - ORIGIN) / UNIT) * 4);

    // Lock to domain
    qX = Math.max(-16, Math.min(16, qX));

    // K3 imaginary is locked to -2 -> -8 quarters
    store.moveBinK3(qX, -8, true); // Preview
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      // Valid release logic check
      const p = store.previewBinK3;
      if (p) {
        if (p.r === 8 && p.i === -8) { // Target 2-2i
           // If they hit the target, we don't auto confirm based on PRD, they must confirm manually
           // Or we show confirmation dialog/controls. For now we just keep the preview active.
        } else {
           // Invalid drop (like 2+2i or outside)
           store.cancelMove();
        }
      }
    }
  };

  // K1 is the partner (2+2i)
  const b1 = store.bins["BIN-K1"];
  const b3 = store.previewBinK3 || store.bins["BIN-K3"];
  const target = { r: b1.r, i: -b1.i }; // Conjugate of k=1

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border rounded shadow">
      <h2 className="font-bold text-lg">Phasor Plane</h2>
      <svg
        ref={svgRef}
        width={400}
        height={400}
        className="bg-gray-50 touch-none outline-none focus:ring-2"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        tabIndex={0}
        onKeyDown={(e) => {
          if (store.selectedBin === "BIN-K3") {
            const currentR = b3.r;
            if (e.key === "ArrowLeft") store.moveBinK3(currentR - (e.shiftKey ? 4 : 1), b3.i, true);
            if (e.key === "ArrowRight") store.moveBinK3(currentR + (e.shiftKey ? 4 : 1), b3.i, true);
            if (e.key === "Escape") store.cancelMove();
            if (e.key === "Enter") store.confirmMove("KeyboardUser");
          }
        }}
      >
        {/* Grid */}
        <g stroke="#e5e7eb" strokeWidth="1">
          {Array.from({length: 33}).map((_, i) => (
             <line key={`v${i}`} x1={i * 10 + 40} y1={0} x2={i * 10 + 40} y2={400} opacity={i%4===0 ? 1 : 0.5} />
          ))}
          {Array.from({length: 33}).map((_, i) => (
             <line key={`h${i}`} y1={i * 10 + 40} x1={0} y2={i * 10 + 40} x2={400} opacity={i%4===0 ? 1 : 0.5} />
          ))}
        </g>

        {/* Axes */}
        <line x1={0} y1={ORIGIN} x2={400} y2={ORIGIN} stroke="black" strokeWidth="2" />
        <line x1={ORIGIN} y1={0} x2={ORIGIN} y2={400} stroke="black" strokeWidth="2" />

        {/* Residual Arrow */}
        <line
          x1={toPx(target.r)} y1={toPxY(target.i)}
          x2={toPx(b3.r)} y2={toPxY(b3.i)}
          stroke="red" strokeWidth="2" strokeDasharray="4"
        />

        {/* Bins */}
        {["BIN-K0", "BIN-K1", "BIN-K2"].map(id => {
           const b = store.bins[id as BinId];
           return (
             <g key={id} onClick={() => store.selectBin(id as any)}>
               <line x1={ORIGIN} y1={ORIGIN} x2={toPx(b.r)} y2={toPxY(b.i)} stroke="gray" strokeWidth="2" />
               <circle cx={toPx(b.r)} cy={toPxY(b.i)} r={6} fill="gray" />
               <text x={toPx(b.r) + 10} y={toPxY(b.i)} fontSize="12">{id}</text>
             </g>
           )
        })}

        {/* K3 (Interactive) */}
        <g>
          {/* Rail */}
          <line x1={0} y1={toPxY(-8)} x2={400} y2={toPxY(-8)} stroke="blue" strokeWidth="20" strokeOpacity="0.1" />

          {/* Conjugate Target Ghost */}
          <circle cx={toPx(target.r)} cy={toPxY(target.i)} r={8} fill="none" stroke="green" strokeWidth="2" strokeDasharray="2" />

          <line x1={ORIGIN} y1={ORIGIN} x2={toPx(b3.r)} y2={toPxY(b3.i)} stroke="blue" strokeWidth="2" />
          <circle
            cx={toPx(b3.r)}
            cy={toPxY(b3.i)}
            r={10}
            fill={store.selectedBin === "BIN-K3" ? "blue" : "lightblue"}
            onPointerDown={(e) => handlePointerDown(e, "BIN-K3")}
            className="cursor-pointer"
          />
          <text x={toPx(b3.r) + 12} y={toPxY(b3.i)} fontSize="12" fill="blue">BIN-K3 {formatGaussian(b3, true)}</text>
        </g>
      </svg>

      {/* Exact UI & Controls */}
      <div className="flex gap-2 items-center">
        {store.previewBinK3 && (
          <>
            <span className="text-sm font-mono text-blue-600">Preview: {formatGaussian(store.previewBinK3, true)}</span>
            <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => store.confirmMove("System")}>Confirm</button>
            <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => store.cancelMove()}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}
