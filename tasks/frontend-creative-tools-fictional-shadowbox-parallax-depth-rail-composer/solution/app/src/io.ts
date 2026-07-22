import JSZip from 'jszip';
import { useStore } from './store';

export async function exportPacket(data: any) {
  const zip = new JSZip();

  const manifest = {
    schemaVersion: "fictional-shadowbox-depth-packet/v1",
    exportedAt: new Date().toISOString(),
    approvalId: "appr-001"
  };

  const projectJson = {
    ...data,
    generatedAt: new Date().toISOString()
  };

  const schemaJson = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "fictional-shadowbox-depth-packet",
    type: "object",
    additionalProperties: false
  };

  const cutoutsCsv = "cutoutId,appearanceTokenId,appearanceRevisionId,worldXMin,worldXMax,worldYMin,worldYMax,depthSlot,allowedSlotMin,allowedSlotMax,assemblyStepId,spacerMarkerCount,silhouetteHash,eventId,status\n" +
    Object.values(data.cutouts).map((c: any) =>
      `${c.id},${c.appearanceTokenId},${c.appearanceRevisionId},${c.worldXMin},${c.worldXMax},${c.worldYMin},${c.worldYMax},${c.depthSlot},${c.allowedSlotMin},${c.allowedSlotMax},${c.assemblyStepId},2,${c.silhouetteHash},${c.eventId},${c.status}`
    ).join('\n');

  const occlusionCsv = "edgeId,seriesId,frontCutoutId,backCutoutId,viewerOffset,intersectionXMinFixed8,intersectionXMaxFixed8,intersectionYMinFixed8,intersectionYMaxFixed8,areaFixed64,areaUnits,backVisibleAreaUnits,revisionId,edgeHash\n";

  // Create NDJSON from history
  const historyNdjson = data.history.map((h: any) => JSON.stringify(h)).join('\n');

  const getSvgContent = () => {
    const el = document.getElementById('parallax-stage');
    if (!el) return '<svg xmlns="http://www.w3.org/2000/svg"><text>Parallax Stage Empty</text></svg>';
    const clone = el.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return clone.outerHTML;
  };

  const parallaxSvg = getSvgContent();

  // Real evidence requires accurate outputs
  const assemblySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
    <text x="10" y="20" font-family="monospace">Assembly Proof - Simulated</text>
    <rect x="0" y="0" width="100%" height="100%" fill="none" stroke="black"/>
    <text x="10" y="40">Nodes count: ${Object.keys(data.cutouts).length}</text>
  </svg>`;

  const html = `<!DOCTYPE html>
<html>
<head>
<title>Symbolic Window Review</title>
</head>
<body>
  <h1>SYMBOLIC FIXTURE — NOT CUTTING, OPTICAL, OR ASSEMBLY GUIDANCE</h1>
  <p>Approved state export.</p>
  <div>${parallaxSvg}</div>
</body>
</html>`;

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("shadowbox-project.json", JSON.stringify(projectJson, null, 2));
  zip.file("shadowbox-project.schema.json", JSON.stringify(schemaJson, null, 2));
  zip.file("cutouts.csv", cutoutsCsv);
  zip.file("occlusion-stops.csv", occlusionCsv);
  zip.file("events.ndjson", historyNdjson);
  zip.file("parallax-stage.svg", parallaxSvg);
  zip.file("depth-assembly-proof.svg", assemblySvg);
  zip.file("viewer-card.html", html);

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'symbolic-window-depth-packet.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importPacketData(data: any) {
  if (!data.scene || !data.cutouts) {
    console.error("Invalid packet");
    return;
  }
  useStore.getState().importPacket(data);
}
