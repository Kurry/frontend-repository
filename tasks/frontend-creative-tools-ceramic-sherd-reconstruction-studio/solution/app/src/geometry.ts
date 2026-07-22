import type { Point, Transform, Edge, } from "./types";

export function transformPoint(p: Point, transform: Transform): Point {
  const rad = (transform.rotationDeg * Math.PI) / 180;
  const cx = p.x;
  const cy = p.y;
  return {
    x: cx * Math.cos(rad) - cy * Math.sin(rad) + transform.txMm,
    y: cx * Math.sin(rad) + cy * Math.cos(rad) + transform.tyMm,
  };
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// Basic SAT implementation for polygon intersection (convex only)
function getAxes(poly: Point[]): Point[] {
  const axes: Point[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
    const normal = { x: -edge.y, y: edge.x };
    const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    axes.push({ x: normal.x / len, y: normal.y / len });
  }
  return axes;
}

function project(poly: Point[], axis: Point): { min: number, max: number } {
  let min = (poly[0].x * axis.x + poly[0].y * axis.y);
  let max = min;
  for (let i = 1; i < poly.length; i++) {
    const p = (poly[i].x * axis.x + poly[i].y * axis.y);
    if (p < min) min = p;
    else if (p > max) max = p;
  }
  return { min, max };
}

export function calculateOverlap(poly1: Point[], poly2: Point[]): number {
  const axes = [...getAxes(poly1), ...getAxes(poly2)];
  let minOverlap = Infinity;

  for (const axis of axes) {
    const proj1 = project(poly1, axis);
    const proj2 = project(poly2, axis);

    if (proj1.max < proj2.min || proj2.max < proj1.min) {
      return 0; // Separating axis found
    }

    const overlap = Math.min(proj1.max - proj2.min, proj2.max - proj1.min);
    if (overlap < minOverlap) {
      minOverlap = overlap;
    }
  }

  // Approximate overlap area (rough bounding logic for Oracle)
  // Real intersection area of two arbitrary polygons requires clipping (Sutherland-Hodgman)
  // We approximate it dynamically using the minimum separating axis overlap squared if they intersect.
  return minOverlap * minOverlap * 0.1;
}

export function evaluateCandidateMatch(sherdATransform: Transform, sherdBTransform: Transform, edgeA: Edge, edgeB: Edge): {
    endpointResidualMm: number,
    meanResidualMm: number,
    tangentMismatchDeg: number,
    lengthRatio: number
} {
  const a1 = transformPoint(edgeA.localPolyline[0], sherdATransform);
  const a2 = transformPoint(edgeA.localPolyline[1], sherdATransform);

  const b1 = transformPoint(edgeB.localPolyline[0], sherdBTransform);
  const b2 = transformPoint(edgeB.localPolyline[1], sherdBTransform);

  // Try opposite direction match logic first
  let e1Dist = distance(a1, b2);
  let e2Dist = distance(a2, b1);

  // Try same direction logic
  const e1DistSame = distance(a1, b1);
  const e2DistSame = distance(a2, b2);

  // Find the closest orientation
  let isOpposite = true;
  if (e1DistSame + e2DistSame < e1Dist + e2Dist) {
     e1Dist = e1DistSame;
     e2Dist = e2DistSame;
     isOpposite = false;
  }

  const endpointResidualMm = Math.max(e1Dist, e2Dist);
  const meanResidualMm = (e1Dist + e2Dist) / 2;

  // Basic tangent vector comparison
  const vecA = { x: a2.x - a1.x, y: a2.y - a1.y };
  const vecB = isOpposite ? { x: b1.x - b2.x, y: b1.y - b2.y } : { x: b2.x - b1.x, y: b2.y - b1.y };

  const angleA = Math.atan2(vecA.y, vecA.x);
  const angleB = Math.atan2(vecB.y, vecB.x);

  let tangentMismatchDeg = Math.abs((angleA - angleB) * 180 / Math.PI);
  if (tangentMismatchDeg > 180) tangentMismatchDeg = 360 - tangentMismatchDeg;

  const lenA = distance(edgeA.localPolyline[0], edgeA.localPolyline[1]);
  const lenB = distance(edgeB.localPolyline[0], edgeB.localPolyline[1]);
  const lengthRatio = lenA / lenB;

  return { endpointResidualMm, meanResidualMm, tangentMismatchDeg, lengthRatio };
}

// Circle fitting using circumcircle of 3 points
export function fitCircle(p1: Point, p2: Point, p3: Point): { cx: number, cy: number, radius: number } | null {
   const A = p1.x * (p2.y - p3.y) - p1.y * (p2.x - p3.x) + p2.x * p3.y - p3.x * p2.y;
   if (Math.abs(A) < 0.001) return null; // Collinear

   const p1Sq = p1.x * p1.x + p1.y * p1.y;
   const p2Sq = p2.x * p2.x + p2.y * p2.y;
   const p3Sq = p3.x * p3.x + p3.y * p3.y;

   const cx = (p1Sq * (p2.y - p3.y) + p2Sq * (p3.y - p1.y) + p3Sq * (p1.y - p2.y)) / (2 * A);
   const cy = (p1Sq * (p3.x - p2.x) + p2Sq * (p1.x - p3.x) + p3Sq * (p2.x - p1.x)) / (2 * A);

   const radius = distance({x: cx, y: cy}, p1);
   return { cx, cy, radius };
}
