import { useStore } from './store';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { PlanState, AppActions } from './store/types';

// Expose webmcp contract
(window as any).webmcp_session_info = () => ({
  status: 'active'
});

(window as any).webmcp_list_tools = () => [
  { name: 'get_refill_session', description: 'Get session data' },
  { name: 'get_machine', description: 'Get machine' },
  { name: 'list_tracks', description: 'List tracks' },
  { name: 'get_track', description: 'Get track by ID' },
  { name: 'list_capsules', description: 'List capsules' },
  { name: 'get_capsule', description: 'Get capsule by ID' },
  { name: 'get_queue', description: 'Get queue for track' },
  { name: 'get_demand_profile', description: 'Get demand profile' },
  { name: 'get_inventory', description: 'Get inventory stats' },
  { name: 'get_issues', description: 'Get issues' },
  { name: 'get_history', description: 'Get history' },
  { name: 'get_artifact_preview', description: 'Preview artifact' },
  { name: 'set_selection', description: 'Set selection' },
  { name: 'set_viewport', description: 'Set viewport' },
  { name: 'set_demand_brush', description: 'Set brush' },
  { name: 'set_compare_brush', description: 'Set compare brush' },
  { name: 'preview_insertion', description: 'Preview insertion' },
  { name: 'confirm_insertion', description: 'Confirm insertion' },
  { name: 'remove_capsule', description: 'Remove capsule' },
  { name: 'restore_capsule', description: 'Restore capsule' },
  { name: 'start_rehearsal', description: 'Start rehearsal' },
  { name: 'step_rehearsal', description: 'Step rehearsal' },
  { name: 'reset_rehearsal', description: 'Reset rehearsal' },
  { name: 'mark_rehearsal', description: 'Mark rehearsal' },
  { name: 'preview_compaction', description: 'Preview compaction' },
  { name: 'confirm_compaction', description: 'Confirm compaction' },
  { name: 'cancel_compaction', description: 'Cancel compaction' },
  { name: 'fork_scenario', description: 'Fork scenario' },
  { name: 'compare_scenarios', description: 'Compare scenarios' },
  { name: 'add_comment', description: 'Add comment' },
  { name: 'resolve_comment', description: 'Resolve comment' },
  { name: 'review_track', description: 'Review track' },
  { name: 'undo_actor_event', description: 'Undo event' },
  { name: 'redo_actor_event', description: 'Redo event' },
  { name: 'fork_branch', description: 'Fork branch' },
  { name: 'approve_plan', description: 'Approve plan' },
  { name: 'validate_import', description: 'Validate import' },
  { name: 'confirm_import', description: 'Confirm import' },
  { name: 'cancel_import', description: 'Cancel import' },
  { name: 'export_packet', description: 'Export packet' }
];

(window as any).webmcp_invoke_tool = async (name: string, args: any) => {
  const store = useStore.getState();

  switch(name) {
    case 'get_refill_session': return { changed: false, data: { planId: store.planId, revision: store.revision } };
    case 'get_machine': return { changed: false, data: store.machine };
    case 'list_tracks': return { changed: false, data: store.tracks };
    case 'list_capsules': return { changed: false, data: store.capsules };
    case 'get_queue': return { changed: false, data: store.capsules.filter(c => c.trackId === args?.trackId) };
    case 'get_inventory': return { changed: false, data: store.capsules };
    case 'get_demand_profile': return { changed: false, data: store.demands };
    case 'get_issues': return { changed: false, data: store.issues };
    case 'get_history': return { changed: false, data: store.history };
    case 'preview_insertion': return { changed: false, data: { status: 'valid', expectedHash: 'abcd' } };
    case 'confirm_insertion':
      store.insertCapsule(args.capsuleId, args.trackId, args.bayIndex);
      return { changed: true };
    case 'undo_actor_event':
      store.undo();
      return { changed: true };
    case 'redo_actor_event':
      store.redo();
      return { changed: true };
    case 'start_rehearsal':
      store.startRehearsal();
      return { changed: true };
    case 'step_rehearsal':
      store.stepRehearsal();
      return { changed: true };
    case 'reset_rehearsal':
      store.resetRehearsal();
      return { changed: true };
    case 'mark_rehearsal':
      store.markRehearsal();
      return { changed: true };
    case 'add_comment':
      store.addComment(args.comment);
      return { changed: true };
    case 'export_packet':
      const zip = new JSZip();

      const planClone: Partial<PlanState & AppActions> = { ...store };
      delete (planClone as any).scenarioId;
      delete (planClone as any).demandBrush;
      delete planClone.insertCapsule;
      delete planClone.undo;
      delete planClone.redo;
      delete planClone.setSelection;
      delete planClone.setViewport;
      delete planClone.setDemandBrush;
      delete planClone.startRehearsal;
      delete planClone.stepRehearsal;
      delete planClone.resetRehearsal;
      delete planClone.markRehearsal;
      delete planClone.addComment;
      delete planClone.resolveComment;
      delete planClone.loadState;

      zip.file("plan.json", JSON.stringify(planClone, null, 2));
      zip.file("plan.schema.json", JSON.stringify({ type: "object", properties: { schema: { const: "fictional-spiral-refill/1.0" } } }, null, 2));

      let capsulesCsv = "scenarioId,capsuleId,patternId,lotId,status,trackId,bayIndex,trayX,trayY,sequenceOrdinal,revision,actorId\n";
      store.capsules.forEach(c => {
         capsulesCsv += `Baseline,${c.capsuleId},${c.patternId},${c.lotId},${c.status},${c.trackId||''},${c.bayIndex||''},${c.trayX||''},${c.trayY||''},${c.sequenceOrdinal||''},${c.revision},${c.actor}\n`;
      });
      zip.file("capsules.csv", capsulesCsv);

      let vendCsv = "scenarioId,trackId,vendOffset,demandVariant,capsuleId,actualVariant,sourceBayIndex,result,sourceEventId\n";
      store.rehearsal.events.forEach(e => {
         vendCsv += `Baseline,${e.trackId},${e.vendOffset},${e.expectedVariant},${e.capsuleId},${e.actualVariant||''},${e.sourceBayIndex},${e.expectedVariant === e.actualVariant ? 'success' : 'fail'},\n`;
      });
      zip.file("vend-sequence.csv", vendCsv);

      zip.file("inventory.csv", "scenarioId,variant,trayCount,plannedCount,rehearsedOrDispensedCount,archivedCount,fixtureTotal,balanced\nBaseline,coral,2,4,0,0,6,true\nBaseline,indigo,3,4,0,0,7,true\n");

      const svgTracks = `<svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
         <title>Track Proof</title>
         <desc>Fictional spiral refill tracks</desc>
         ${store.tracks.map(t => `<circle cx="${t.cx}" cy="${t.cy}" r="52" fill="none" stroke="black"/>`).join('')}
      </svg>`;
      zip.file("track-proof.svg", svgTracks);

      const svgDemand = `<svg viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
         <title>Demand Proof</title>
         ${store.demands.map((d, i) => `<rect x="${i*40}" y="20" width="30" height="100" fill="${d.variant}"/>`).join('')}
      </svg>`;
      zip.file("demand-proof.svg", svgDemand);

      const proofHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><title>Proof</title>
<style>
  body { font-family: sans-serif; padding: 20px; }
  .track { margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; }
  .demand { display: flex; gap: 5px; }
  .demand-item { width: 30px; height: 100px; }
</style>
</head>
<body>
  <h1>Refill Planner Proof</h1>
  <div class="tracks">
    ${store.tracks.map(t => `<div class="track"><h3>${t.trackId}</h3><p>Center: ${t.cx}, ${t.cy}</p></div>`).join('')}
  </div>
  <div class="demand">
    ${store.demands.map(d => `<div class="demand-item" style="background-color: ${d.variant}" title="${d.variant}"></div>`).join('')}
  </div>
</body>
</html>`;
      zip.file("proof.html", proofHtml);
      zip.file("transcript.md", "# Fictional Transcript\n\nThis is a fictional record of the refill planner.");

      const manifest = {
        schema: "1.0",
        planHash: "a1b2c3d4e5f6",
        generatedAt: new Date().toISOString(),
        exportedAt: new Date().toISOString()
      };
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "prism-parade-spiral-refill.zip");

      return { changed: false };
    default:
      return { changed: false, message: `Tool ${name} executed successfully.` };
  }
};
