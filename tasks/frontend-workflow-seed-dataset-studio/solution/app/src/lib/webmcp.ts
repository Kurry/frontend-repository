import { studio } from './studio.svelte';

export function initWebMCP() {
  if (typeof window === 'undefined') return;

  (window as any).webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "form-workflow-v1", "command-session-v1", "artifact-transfer-v1"]
  });

  (window as any).webmcp_list_tools = () => Object.keys(window).filter(k => k.startsWith('webmcp_'));

  // structured-editor-v1
  (window as any).webmcp_editor_select = (id: string, type: string) => {
    if (!studio.activeSeed) throw new Error("No active seed");
    if (type === 'question') studio.activePane = 'question';
    else if (type === 'under-specification-checklist-item') studio.activePane = 'question';
    else if (type === 'positive-criterion') studio.activePane = 'positive';
    else if (type === 'negative-criterion') studio.activePane = 'negative';
    else if (type === 'foil') studio.activePane = 'foils';
    else if (type === 'golden-answer') studio.activePane = 'golden';
    return true;
  };

  (window as any).webmcp_editor_add = (id: string, type: string, content: any) => {
     if (!studio.activeSeed) throw new Error("No active seed");
     if (type === 'positive-criterion') { studio.addCriterion('positive'); return true; }
     if (type === 'negative-criterion') { studio.addCriterion('negative'); return true; }
     if (type === 'foil') { studio.activeSeed.authoring.foils.push(content); return true; }
     throw new Error(`Unsupported add for ${type}`);
  };

  (window as any).webmcp_editor_delete = (id: string, type: string, objectId: string) => {
    if (!studio.activeSeed) throw new Error("No active seed");
    if (type === 'positive-criterion' || type === 'negative-criterion') {
       studio.deleteCriterion(objectId);
       return true;
    }
    if (type === 'foil') {
       const index = parseInt(objectId);
       if (!isNaN(index) && index >= 0 && index < studio.activeSeed.authoring.foils.length) {
           studio.activeSeed.authoring.foils.splice(index, 1);
           return true;
       }
    }
    throw new Error(`Unsupported delete for ${type} or invalid objectId`);
  };

  (window as any).webmcp_editor_update_property = (id: string, type: string, objectId: string, property: string, value: any) => {
     if (!studio.activeSeed) throw new Error("No active seed");
     if (type === 'question') {
         if (property === 'question-text') studio.activeSeed.authoring.questionText = value;
         else if (property === 'seed-title') studio.activeSeed.title = value;
         return true;
     } else if (type === 'under-specification-checklist-item') {
         const index = parseInt(objectId);
         if (property === 'checklist-item-checked' && !isNaN(index) && index >= 0 && index < studio.activeSeed.authoring.checklist.length) {
             studio.activeSeed.authoring.checklist[index] = value;
             return true;
         }
     } else if (type === 'positive-criterion' || type === 'negative-criterion') {
         const criteria = type === 'positive-criterion' ? studio.activeSeed.authoring.positiveCriteria : studio.activeSeed.authoring.negativeCriteria;
         const criterion = criteria.find(c => c.id === objectId);
         if (criterion) {
             if (property === 'criterion-name') criterion.name = value;
             else if (property === 'criterion-weight') criterion.weight = value;
             else if (property === 'criterion-description') criterion.description = value;
             else if (property === 'negative-criterion-class') (criterion as any).class = value;
             return true;
         }
     } else if (type === 'foil') {
         const index = parseInt(objectId);
         if (!isNaN(index) && index >= 0 && index < studio.activeSeed.authoring.foils.length) {
             const foil = studio.activeSeed.authoring.foils[index];
             if (property === 'foil-answer-text') foil.answerText = value;
             else if (property === 'foil-failure-mode') foil.failureMode = value;
             else if (property === 'foil-expects-fail-ids') foil.expectsFailIds = value;
             else if (property === 'foil-correctness-cap') foil.correctnessCap = value;
             return true;
         }
     } else if (type === 'golden-answer') {
         if (property === 'golden-answer-text') studio.activeSeed.authoring.golden.value = value;
         return true;
     }
     throw new Error(`Unsupported update_property for ${type} ${property}`);
  };

  (window as any).webmcp_editor_set_content = (id: string, type: string, objectId: string, content: any) => {
     throw new Error("set_content not mapped");
  };

  // form-workflow-v1
  (window as any).webmcp_form_validate = (id: string, data: any) => {
      return true;
  };

  (window as any).webmcp_form_submit = (id: string, data: any) => {
      if (id === 'reject-seed') { studio.reject(studio.rejectTargetIds, data); studio.rejectOpen = false; return true; }
      else if (id === 'batch-reject') { studio.reject(studio.selectedIds, data); studio.rejectOpen = false; return true; }
      throw new Error(`Unsupported form_submit for ${id}`);
  };

  (window as any).webmcp_form_cancel = (id: string) => {
     if (id === 'reject-seed' || id === 'batch-reject') { studio.rejectOpen = false; return true; }
     return false;
  };

  (window as any).webmcp_form_advance = (id: string, to: string) => {
     if (id === 'accept-for-authoring') { studio.accept(studio.activeSeed!.id); return true; }
     else if (id === 'undo-triage') { studio.undo(); return true; }
     else if (id === 'mark-authored') { studio.markAuthored(studio.activeSeed!.id); return true; }
     throw new Error(`Unsupported form_advance for ${id}`);
  };

  (window as any).webmcp_form_return = (id: string, to: string) => {
     return true;
  };

  // command-session-v1
  (window as any).webmcp_session_start = (id: string) => {
    if (id === 'harvest-run') {
       studio.runHarvest(studio.activeSeed!.id); return true;
    }
    return false;
  };

  (window as any).webmcp_session_pause = (id: string) => {
    return studio.pauseHarvest(studio.activeSeed!);
  };

  (window as any).webmcp_session_resume = (id: string) => {
    return studio.resumeHarvest(studio.activeSeed!);
  };

  // artifact-transfer-v1
  (window as any).webmcp_artifact_export = (id: string, format: string) => {
     studio.openExport(studio.activeSeed?.id);
     return true;
  };

  (window as any).webmcp_artifact_copy = (id: string, artifact: string) => {
     studio.stampExport(artifact);
     return true;
  };

  (window as any).webmcp_artifact_import = (id: string, content: string) => {
     return studio.importPackage(content);
  };
}
