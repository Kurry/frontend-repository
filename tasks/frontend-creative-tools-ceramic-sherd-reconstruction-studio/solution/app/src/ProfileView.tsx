import { useGlobalStore } from "./store";
import { transformPoint, fitCircle, distance } from "./geometry";

export function ProfileView() {
  const { state } = useGlobalStore();

  // Dynamically find rims in selection or all accepted graph
  const rimEdges = [];
  for (const sherd of Object.values(state.sherds)) {
     if (sherd.id === "SH-29" && !state.lateFragmentRevealed) continue;

     if (sherd.rimClass === "rim") {
        for (const edgeId of sherd.edges) {
           const edge = state.edges[edgeId];
           if (edge && edge.edgeClass === "rim") {
              // Transform points to world
              rimEdges.push(...edge.localPolyline.map(p => transformPoint(p, sherd.transform)));
           }
        }
     }
  }

  let radius = 0;
  let diameter = 0;
  let residual = 0;
  let coverage = 0;
  let showArc = false;

  if (rimEdges.length >= 2) {
    // If we only have 2 points, we can't fit a circle properly without a 3rd. We'll estimate center at 0,0.
    // If >= 3 points, use circumcircle of first, middle, last.
    const p1 = rimEdges[0];
    const p2 = rimEdges[Math.floor(rimEdges.length / 2)];
    const p3 = rimEdges[rimEdges.length - 1];

    let circle;
    if (rimEdges.length >= 3) {
      circle = fitCircle(p1, p2, p3);
    }

    if (circle) {
       radius = circle.radius;
       diameter = radius * 2;
       showArc = true;
       coverage = Math.min((distance(p1, p3) / (Math.PI * diameter)) * 100, 100);

       // Calc max residual error of all points to circle
       for (const p of rimEdges) {
          const r = distance(p, {x: circle.cx, y: circle.cy});
          residual = Math.max(residual, Math.abs(r - radius));
       }
    } else {
       // Estimate from 2 points
       diameter = distance(p1, p3);
       radius = diameter / 2;
       showArc = true;
       coverage = 10; // Rough static estimate if only 2 points
    }
  }

  return (
    <div className="p-4 bg-white border rounded shadow-sm flex flex-col gap-4">
      <h3 className="font-bold">Axial Profile</h3>
      <div className="h-[150px] bg-slate-100 flex items-center justify-center overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 200 100">
           {showArc ? (
             <>
               <path d="M 20 80 Q 100 20 180 80" fill="none" stroke="blue" strokeWidth="2" strokeDasharray="4 2"/>
               <text x="100" y="50" textAnchor="middle" className="text-xs font-mono">Fitted Arc</text>
             </>
           ) : (
             <text x="100" y="50" textAnchor="middle" className="text-xs text-slate-400">No Rim Match</text>
           )}
        </svg>
      </div>
      <div className="text-sm font-mono flex flex-col gap-1">
        <div>Radius: {showArc ? `${radius.toFixed(1)} mm` : '-'}</div>
        <div>Diameter: {showArc ? `${diameter.toFixed(1)} mm` : '-'}</div>
        <div>Residual: {showArc ? `${residual.toFixed(1)} mm` : '-'}</div>
        <div>Coverage: {showArc ? `${coverage.toFixed(1)}%` : '-'}</div>
      </div>
    </div>
  );
}
