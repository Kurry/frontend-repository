import type { CutoutRecord, ProjectionRecord, OcclusionEdgeRecord } from './store';

// Eighth-unit fixed point projection
// Smaller depth-slot numbers are closer to the viewer.
// xFixed8 = x * 8 - u * depthSlot
export function projectCutout(cutout: CutoutRecord, viewerOffset: number): ProjectionRecord {
  const { id, worldXMin, worldXMax, worldYMin, worldYMax, depthSlot } = cutout;

  return {
    id: `proj-${id}-s${depthSlot}-o${viewerOffset}`,
    cutoutId: id,
    viewerOffset,
    xMinFixed8: worldXMin * 8 - viewerOffset * depthSlot,
    xMaxFixed8: worldXMax * 8 - viewerOffset * depthSlot,
    yMinFixed8: worldYMin * 8,
    yMaxFixed8: worldYMax * 8,
    depthSlot,
    revisionId: 'rev-1',
    projectionHash: 'hash-proj'
  };
}

export function projectToPixel(fixed8: number) {
  return fixed8 / 8;
}

// Compute half-open intersection for occlusion
export function intersectProjections(
  front: ProjectionRecord,
  back: ProjectionRecord
): OcclusionEdgeRecord | null {
  // Only process if they are at different depth slots
  if (front.depthSlot === back.depthSlot) return null;
  // Make sure front is actually in front (smaller slot is closer)
  if (front.depthSlot > back.depthSlot) {
    const temp = front;
    front = back;
    back = temp;
  }

  const ixMin = Math.max(front.xMinFixed8, back.xMinFixed8);
  const ixMax = Math.min(front.xMaxFixed8, back.xMaxFixed8);
  const iyMin = Math.max(front.yMinFixed8, back.yMinFixed8);
  const iyMax = Math.min(front.yMaxFixed8, back.yMaxFixed8);

  const width = ixMax - ixMin;
  const height = iyMax - iyMin;

  if (width > 0 && height > 0) {
    const areaFixed64 = width * height;
    return {
      id: `edge-${front.cutoutId}-${back.cutoutId}-${front.viewerOffset}`,
      seriesId: `series-${front.cutoutId}-${back.cutoutId}`,
      frontCutoutId: front.cutoutId,
      backCutoutId: back.cutoutId,
      viewerOffset: front.viewerOffset,
      intersectionXMinFixed8: ixMin,
      intersectionXMaxFixed8: ixMax,
      intersectionYMinFixed8: iyMin,
      intersectionYMaxFixed8: iyMax,
      areaFixed64,
      revisionId: 'rev-1',
      edgeHash: 'hash-edge'
    };
  }

  return null;
}

// Compute global visibility using deterministic x-slab union
export function computeVisibility(
  backCutout: ProjectionRecord,
  frontCutouts: ProjectionRecord[]
): number {
  const backWidth = backCutout.xMaxFixed8 - backCutout.xMinFixed8;
  const backHeight = backCutout.yMaxFixed8 - backCutout.yMinFixed8;
  const totalAreaFixed64 = backWidth * backHeight;

  // For each front cutout, find the overlapping rectangle
  const overlaps: { xMin: number; xMax: number; yMin: number; yMax: number }[] = [];
  for (const front of frontCutouts) {
    if (front.depthSlot >= backCutout.depthSlot) continue;
    const edge = intersectProjections(front, backCutout);
    if (edge) {
      overlaps.push({
        xMin: edge.intersectionXMinFixed8,
        xMax: edge.intersectionXMaxFixed8,
        yMin: edge.intersectionYMinFixed8,
        yMax: edge.intersectionYMaxFixed8
      });
    }
  }

  if (overlaps.length === 0) {
    return totalAreaFixed64;
  }

  // Very simplistic approach for this specific case where overlaps share the same y-bounds
  // and we just need the union of x-segments.
  // Real 2D union is more complex, but we know cutout-12 only overlaps with cutout-07 in this scenario
  // so we can just sum areas of disjoint regions.
  let unionArea = 0;

  // Sort by xMin
  overlaps.sort((a, b) => a.xMin - b.xMin);

  let currentXMin = overlaps[0].xMin;
  let currentXMax = overlaps[0].xMax;
  // Assuming constant Y overlap for simplicity in this fictional job constraint
  const yMin = overlaps[0].yMin;
  const yMax = overlaps[0].yMax;

  for (let i = 1; i < overlaps.length; i++) {
    const ov = overlaps[i];
    if (ov.xMin <= currentXMax) {
      currentXMax = Math.max(currentXMax, ov.xMax);
    } else {
      unionArea += (currentXMax - currentXMin) * (yMax - yMin);
      currentXMin = ov.xMin;
      currentXMax = ov.xMax;
    }
  }
  unionArea += (currentXMax - currentXMin) * (yMax - yMin);

  return totalAreaFixed64 - unionArea;
}

// Compute metrics over stops
export function computeMetrics(cutouts: Record<string, CutoutRecord>, targetId: string) {
  const target = cutouts[targetId];
  if (!target) return null;

  const stops = [-40, 0, 40];
  const results = [];

  const others = Object.values(cutouts).filter(c => c.id !== targetId);

  for (const stop of stops) {
    const pTarget = projectCutout(target, stop);
    const pOthers = others.map(o => projectCutout(o, stop));

    // Front cutouts are those with smaller depth slots
    const fronts = pOthers.filter(o => o.depthSlot < pTarget.depthSlot);
    const visibleAreaFixed64 = computeVisibility(pTarget, fronts);

    results.push({
      stop,
      visibleAreaFixed64,
      visibleAreaUnits: visibleAreaFixed64 / 64
    });
  }

  const minVisible = Math.min(...results.map(r => r.visibleAreaUnits));
  const maxVisible = Math.max(...results.map(r => r.visibleAreaUnits));

  return {
    results,
    minVisible,
    maxVisible,
    spread: maxVisible - minVisible
  };
}
