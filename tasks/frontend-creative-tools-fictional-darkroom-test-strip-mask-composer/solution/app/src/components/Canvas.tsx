import { useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import type { MaskGeometry } from '../lib/models';
import { motion } from 'framer-motion';

export function Canvas() {
  const store = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    store.initFixture();
  }, []);

  if (!store.strip) return null;

  const mmToPx = (mm: number) => mm * 4; // Scale 4px = 1mm

  const handlePointerDown = (e: React.PointerEvent, edge: 'left' | 'right' | 'body', passId: string, mask: MaskGeometry) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const startX = e.clientX;
    const startMaskX = mask.xMm;
    const startMaskW = mask.widthMm;

    store.selectPass(passId);

    const onPointerMove = (ev: PointerEvent) => {
      const dxPx = ev.clientX - startX;
      const dxMm = Math.round(dxPx / 4);

      let newX = startMaskX;
      let newW = startMaskW;

      if (edge === 'left') {
        newX = Math.max(0, startMaskX + dxMm);
        newW = startMaskW - (newX - startMaskX);
        if(newW < 5) {
          newX = startMaskX + startMaskW - 5;
          newW = 5;
        }
      } else if (edge === 'right') {
        newW = Math.max(5, startMaskW + dxMm);
        if(newX + newW > store.strip!.widthMm) {
          newW = store.strip!.widthMm - newX;
        }
      } else if (edge === 'body') {
        newX = Math.max(0, Math.min(store.strip!.widthMm - newW, startMaskX + dxMm));
      }

      store.previewMaskEdit(passId, { ...mask, xMm: newX, widthMm: newW });
    };

    const onPointerUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      const dxPx = ev.clientX - startX;
      const dxMm = Math.round(dxPx / 4);

      if(dxMm !== 0) {
        const preview = useStore.getState().dragPreviewPass;
        if(preview) {
           store.commitMaskEdit(passId, preview.mask);
        }
      } else {
        store.cancelMaskEdit();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent, passId: string, mask: MaskGeometry) => {
    if(!e.altKey) return;

    let newX = mask.xMm;
    let newW = mask.widthMm;

    if (e.shiftKey) {
      if (e.key === 'ArrowRight') newW = Math.min(store.strip!.widthMm - newX, newW + 1);
      if (e.key === 'ArrowLeft') newW = Math.max(5, newW - 1);
    } else {
      if (e.key === 'ArrowRight') newX = Math.min(store.strip!.widthMm - newW, newX + 1);
      if (e.key === 'ArrowLeft') newX = Math.max(0, newX - 1);
    }

    if (newX !== mask.xMm || newW !== mask.widthMm) {
      e.preventDefault();
      store.commitMaskEdit(passId, { ...mask, xMm: newX, widthMm: newW });
    }
  };

  return (
    <div className="flex-1 bg-neutral-800 border border-neutral-700 p-4 relative overflow-auto" ref={containerRef}>
      <h2 className="text-sm font-semibold mb-2">Millimeter Mask Canvas</h2>

      <div
        className="relative bg-neutral-900 border border-neutral-600"
        style={{ width: mmToPx(store.strip.widthMm), height: mmToPx(store.strip.heightMm) }}
      >
        {/* Render grid / zones */}
        {store.strip.zoneIds.map((zId, i) => {
           const zoneW = store.strip!.widthMm / 8;
           return (
             <div
               key={zId}
               className="absolute top-0 bottom-0 border-r border-neutral-700/50 flex items-end p-1 text-[10px] text-neutral-500"
               style={{ left: mmToPx(i * zoneW), width: mmToPx(zoneW) }}
             >
               {zId}
             </div>
           );
        })}

        {/* Render Cells */}
        {Array.from(store.cellExposures.entries()).map(([cellId, data]) => {
          const r = parseInt(cellId.split('-')[1].substring(1));
          const c = parseInt(cellId.split('-')[2].substring(1));

          const cellWMm = store.strip!.widthMm / store.strip!.columns;
          const cellHMm = store.strip!.heightMm / store.strip!.rows;

          return (
            <div
              key={cellId}
              className="absolute pointer-events-none"
              style={{
                left: mmToPx(c * cellWMm),
                top: mmToPx(r * cellHMm),
                width: mmToPx(cellWMm),
                height: mmToPx(cellHMm),
                backgroundColor: `rgb(${data.responseValue}, ${data.responseValue}, ${data.responseValue})`,
                opacity: 0.8
              }}
            />
          )
        })}

        {/* Render Masks */}
        {store.passes.filter(p => p.status === 'active').map(pass => {
          const isSelected = pass.id === store.selectedPassId;
          const isPreviewing = store.dragPreviewPass?.id === pass.id;
          const mask = isPreviewing ? store.dragPreviewPass!.mask : pass.mask;

          return (
            <motion.div
              key={pass.id}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, pass.id, mask)}
              className={`absolute top-0 bottom-0 border-2 cursor-grab outline-none focus:ring-2 focus:ring-blue-500
                ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-emerald-500/50'}
              `}
              style={{
                left: mmToPx(mask.xMm),
                width: mmToPx(mask.widthMm)
              }}
              onPointerDown={(e) => handlePointerDown(e, 'body', pass.id, pass.mask)}
            >
              {isSelected && (
                <>
                  <div
                    className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-blue-400 cursor-ew-resize rounded-full"
                    onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'left', pass.id, pass.mask); }}
                  />
                  <div
                    className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-blue-400 cursor-ew-resize rounded-full"
                    onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'right', pass.id, pass.mask); }}
                  />
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
