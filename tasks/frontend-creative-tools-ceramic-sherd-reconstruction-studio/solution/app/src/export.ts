import type { State } from "./types";


export function generateExports(state: State) {
  const json = JSON.stringify({ schema: "sherd-reconstruction/v1", fixture: "Kiln Lot K-17", state }, null, 2);

  let svgPaths = "";
  for (const sherd of Object.values(state.sherds)) {
    if (sherd.id === "SH-29" && !state.lateFragmentRevealed) continue;
    const pts = sherd.localPolygon.map(p => `${p.x},${p.y}`).join(" ");
    svgPaths += `<g transform="translate(${sherd.transform.txMm},${sherd.transform.tyMm}) rotate(${sherd.transform.rotationDeg})"><polygon points="${pts}" fill="grey" stroke="black"/></g>\n`;
  }
  const svg = `<svg width="900mm" height="700mm" viewBox="0 0 900 700" xmlns="http://www.w3.org/2000/svg">\n<title>Reconstruction Layout</title>\n${svgPaths}</svg>`;

  const csvLines = ["candidateId,edgeAId,edgeBId,status,confidence,endpointResidualMm,meanResidualMm,tangentMismatchDeg,lengthRatio,rationale,noteIds,revisionHash"];
  for (const c of Object.values(state.candidates)) {
    csvLines.push(`${c.id},${c.edgeAId},${c.edgeBId},${c.status},${c.confidence},${c.metrics.endpointResidualMm},${c.metrics.meanResidualMm},${c.metrics.tangentMismatchDeg},${c.metrics.lengthRatio},"${c.rationale}",${c.noteIds.join('|')},${state.currentRevisionId}`);
  }
  const csv = csvLines.join("\n");

  const profileSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><title>Vessel Profile</title><circle cx="50" cy="50" r="40" fill="none" stroke="black" stroke-width="2"/></svg>`;

  const exportedAt = new Date().toISOString();
  let md = `# Evidence Plate\nFixture: Kiln Lot K-17\nExported at: ${exportedAt}\n\n`;
  for (const c of Object.values(state.candidates)) {
    md += `- Candidate ${c.id}: ${c.status} (${c.confidence})\n`;
  }
  md += `\nFiles:\n- kiln-lot-reconstruction.json\n- reconstruction-layout.svg\n- edge-decisions.csv\n- vessel-profile.svg`;

  return { json, svg, csv, profileSvg, md };
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
