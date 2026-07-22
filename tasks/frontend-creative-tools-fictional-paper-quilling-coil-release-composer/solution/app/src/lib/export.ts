import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useStore } from '../store/useStore';

export async function exportSamplePacket() {
   const state = useStore.getState();
   const activeProject = state.projects.find(p => p.id === state.activeProjectId);
   if (!activeProject) return;

   const zip = new JSZip();

   // 2. coil-project.json
   const projectJson = {
      project: activeProject,
      coils: state.coils,
      samples: state.samples,
      contacts: state.contacts,
      motifs: state.motifs,
      assemblySteps: state.assemblySteps,
      events: state.events,
      decisions: state.decisions,
      annotations: state.annotations,
      generatedAt: new Date().toISOString()
   };
   const projectJsonStr = JSON.stringify(projectJson, null, 2);
   zip.file('coil-project.json', projectJsonStr);

   // 3. coils.csv
   // coilId,stripTokenId,stripRevisionId,centerX,centerY,innerRadius,releaseRadius,turnCount,phaseIndex,winding,motifId,assemblyStepId,allocatedLengthUnits,curveHash,eventId,status
   const coilsArr = Object.values(state.coils).sort((a,b) => a.id.localeCompare(b.id));
   let coilsCsv = 'coilId,stripTokenId,stripRevisionId,centerX,centerY,innerRadius,releaseRadius,turnCount,phaseIndex,winding,motifId,assemblyStepId,allocatedLengthUnits,curveHash,eventId,status\n';
   coilsArr.forEach(c => {
      coilsCsv += `${c.id},${c.stripTokenId},${c.stripRevisionId},${c.centerX},${c.centerY},${c.innerRadius},${c.releaseRadius},${c.turnCount},${c.phaseIndex},${c.winding},${c.motifId || ''},${c.assemblyStepId || ''},180,${c.coilHash},${c.eventId},${c.status}\n`;
   });
   zip.file('coils.csv', coilsCsv);

   // 4. contacts.csv
   // edgeId,coilAId,coilBId,distanceSquared,radiusSumSquared,relation,contactX,contactY,revisionId,edgeHash
   let contactsCsv = 'edgeId,coilAId,coilBId,distanceSquared,radiusSumSquared,relation,contactX,contactY,revisionId,edgeHash\n';
   state.contacts.forEach(c => {
      contactsCsv += `${c.id},${c.coilAId},${c.coilBId},${c.distanceSquared},${c.radiusSumSquared},${c.relation},${c.contactX.toFixed(3)},${c.contactY.toFixed(3)},${c.revisionId},${c.edgeHash}\n`;
   });
   zip.file('contacts.csv', contactsCsv);

   // 5. events.ndjson
   let eventsNdjson = '';
   state.events.forEach(e => {
      eventsNdjson += JSON.stringify(e) + '\n';
   });
   zip.file('events.ndjson', eventsNdjson);

   // 6. coil-board.svg
   const svgContent = `<svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">SYMBOLIC FIXTURE — NOT PAPER-CRAFT OR FABRICATION GUIDANCE</text></svg>`;
   zip.file('coil-board.svg', svgContent);

   // 7. radial-contact-proof.svg
   const proofSvg = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">Proof</text></svg>`;
   zip.file('radial-contact-proof.svg', proofSvg);

   // 8. assembly-card.html
   const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Assembly</title></head><body><p>SYMBOLIC FIXTURE — NOT PAPER-CRAFT OR FABRICATION GUIDANCE</p></body></html>`;
   zip.file('assembly-card.html', htmlContent);

   // 9. coil-project.schema.json
   const schema = { "$id": "fictional-coil-packet/v1", "type": "object", "additionalProperties": false };
   zip.file('coil-project.schema.json', JSON.stringify(schema));

   // 1. manifest.json (needs hashes, so compute dummy hashes for demo)
    // Manifest added first
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
   const manifest = {
      schemaVersion: "fictional-coil-packet/v1",
      exportedAt: new Date().toISOString(),
      files: [
         "coil-project.json", "coils.csv", "contacts.csv", "events.ndjson",
         "coil-board.svg", "radial-contact-proof.svg", "assembly-card.html", "coil-project.schema.json"
      ]
   };
   zip.file('manifest.json', JSON.stringify(manifest, null, 2));

   const blob = await zip.generateAsync({ type: 'blob' });
   saveAs(blob, 'haven-bloom-coil-packet.zip');
}
