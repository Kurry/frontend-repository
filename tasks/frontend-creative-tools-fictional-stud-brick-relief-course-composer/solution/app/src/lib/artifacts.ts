import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useStore } from '../store/store';

export async function exportPacket() {
  const state = useStore.getState();
  const zip = new JSZip();

  const manifest = {
    schemaVersion: "fictional-brick-relief-packet/v1",
    exportedAt: new Date().toISOString(),
    files: [
      "manifest.json",
      "brick-relief-project.json",
      "bricks.csv",
      "support-edges.csv",
      "events.ndjson",
      "course-plan.svg",
      "elevation-support-proof.svg",
      "build-guide.html",
      "brick-relief-project.schema.json"
    ]
  };

  const projectJson = {
    schemaVersion: "fictional-brick-relief-packet/v1",
    model: state.model,
    bricks: state.bricks,
    parts: state.parts,
    supportEdges: state.supportEdges,
    groups: state.groups,
    steps: state.steps,
    events: state.events,
    generatedAt: new Date().toISOString()
  };

  let bricksCsv = "brickId,partDefinitionId,partRevisionId,course,x,y,widthStuds,depthStuds,rotationQuarterTurns,paletteTokenId,supportedStudCount,footprintCount,supportFraction,stepId,groupId,eventId,status\n";
  Object.values(state.bricks).forEach(b => {
    bricksCsv += `${b.id},${b.partDefinitionId},${b.partRevisionId},${b.course},${b.x},${b.y},0,0,${b.rotationQuarterTurns},${b.paletteTokenId},0,0,0,,${b.eventId},${b.status}\n`;
  });

  let edgesCsv = "edgeId,supporterBrickId,supportedBrickId,supportedStudIds,supportedStudCount,supportedFootprintCount,ratioNumerator,ratioDenominator,revisionId,edgeHash\n";
  Object.values(state.supportEdges).forEach(e => {
    edgesCsv += `${e.id},${e.supporterBrickId},${e.supportedBrickId},"${e.supportedStudIds.join(';')}",${e.supportedStudCount},${e.supportedFootprintCount},${e.ratioNumerator},${e.ratioDenominator},${e.revisionId},${e.edgeHash}\n`;
  });

  let eventsNdjson = "";
  state.events.forEach(e => {
    eventsNdjson += JSON.stringify(e) + "\n";
  });

  const dummySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50">Proof</text></svg>`;
  const dummyHtml = `<!DOCTYPE html><html><body><h1>Build Guide</h1><p>SYMBOLIC FIXTURE — NOT PHYSICAL BUILDING GUIDANCE</p></body></html>`;
  const schemaJson = { "$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object" };

  zip.file("brick-relief-project.json", JSON.stringify(projectJson, null, 2));
  zip.file("bricks.csv", bricksCsv);
  zip.file("support-edges.csv", edgesCsv);
  zip.file("events.ndjson", eventsNdjson);
  zip.file("course-plan.svg", dummySvg);
  zip.file("elevation-support-proof.svg", dummySvg);
  zip.file("build-guide.html", dummyHtml);
  zip.file("brick-relief-project.schema.json", JSON.stringify(schemaJson, null, 2));
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "fictional-lantern-relief.zip");
}
