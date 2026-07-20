import { studio } from './studio.svelte';
import { RejectSeedSchema } from './schemas';

// Maps each registered webmcp_* tool name to the positional argument order its
// handler expects, so webmcp_invoke_tool can dispatch a named-arguments object
// (the shape the bundled stdio MCP bridge sends) onto the right handler.
const TOOL_ARG_KEYS: Record<string, string[]> = {
  webmcp_editor_select: ['id', 'type'],
  webmcp_editor_add: ['id', 'type', 'content'],
  webmcp_editor_delete: ['id', 'type', 'objectId'],
  webmcp_editor_update_property: ['id', 'type', 'objectId', 'property', 'value'],
  webmcp_editor_set_content: ['id', 'type', 'objectId', 'content'],
  webmcp_form_validate: ['id', 'data'],
  webmcp_form_submit: ['id', 'data'],
  webmcp_form_cancel: ['id'],
  webmcp_form_advance: ['id', 'to'],
  webmcp_form_return: ['id', 'to'],
  webmcp_session_start: ['id'],
  webmcp_session_pause: ['id'],
  webmcp_session_resume: ['id'],
  webmcp_artifact_export: ['id', 'format'],
  webmcp_artifact_copy: ['id', 'artifact'],
};

export function initWebMCP() {
  if (typeof window === 'undefined') return;

  (window as any).webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "form-workflow-v1", "command-session-v1", "artifact-transfer-v1"]
  });

  (window as any).webmcp_list_tools = () => Object.keys(TOOL_ARG_KEYS);

  // structured-editor-v1
  (window as any).webmcp_editor_select = (id: string, type: string) => {
    if (!studio.seeds.some((seed) => seed.id === id)) throw new Error("Seed not found");
    studio.openSeed(id);
    if (type === 'question') studio.activePane = 'question';
    else if (type === 'under-specification-checklist-item') studio.activePane = 'question';
    else if (type === 'positive-criterion') studio.activePane = 'positive';
    else if (type === 'negative-criterion') studio.activePane = 'negative';
    else if (type === 'foil') studio.activePane = 'foils';
    else if (type === 'golden-answer') studio.activePane = 'golden';
    return true;
  };

  (window as any).webmcp_editor_add = (id: string, type: string, content: any) => {
     if (!studio.seeds.some((seed) => seed.id === id)) throw new Error("Seed not found");
     studio.openSeed(id);
     if (type === 'positive-criterion') { studio.addPositive(studio.activeSeed); return true; }
     if (type === 'negative-criterion') { studio.addNegative(studio.activeSeed); return true; }
     if (type === 'foil') {
       const issues = studio.upsertFoil(studio.activeSeed, content, null);
       if (issues.length) throw new Error(issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join('; '));
       return true;
     }
     throw new Error(`Unsupported add for ${type}`);
  };

  (window as any).webmcp_editor_delete = (id: string, type: string, objectId: string) => {
    if (!studio.seeds.some((seed) => seed.id === id)) throw new Error("Seed not found");
    studio.openSeed(id);
    if (type === 'positive-criterion') {
       return studio.deletePositive(studio.activeSeed, objectId);
    }
    if (type === 'negative-criterion') {
       studio.deleteNegative(studio.activeSeed, objectId);
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
     if (!studio.seeds.some((seed) => seed.id === id)) throw new Error("Seed not found");
     studio.openSeed(id);
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
         if (property === 'golden-answer-text') studio.activeSeed.authoring.golden = { status: 'present', value };
         return true;
     }
     throw new Error(`Unsupported update_property for ${type} ${property}`);
  };

  (window as any).webmcp_editor_set_content = (id: string, type: string, objectId: string, content: any) => {
     if (!studio.seeds.some((seed) => seed.id === id)) throw new Error("Seed not found");
     studio.openSeed(id);
     if (type === 'question') { studio.activeSeed.authoring.questionText = content; return true; }
     if (type === 'golden-answer') { studio.activeSeed.authoring.golden = { status: 'present', value: content }; return true; }
     throw new Error(`Unsupported set_content for ${type}`);
  };

  // form-workflow-v1
  (window as any).webmcp_form_validate = (id: string, data: any) => {
      if (id === 'reject-seed' || id === 'batch-reject') {
        return RejectSeedSchema.safeParse(data).success;
      }
      return true;
  };

  (window as any).webmcp_form_submit = (id: string, data: any) => {
      if (id === 'reject-seed' || id === 'batch-reject') {
        const { ids: explicitIds, ...payload } = data ?? {};
        const targetIds = Array.isArray(explicitIds) && explicitIds.length
          ? explicitIds
          : (studio.rejectTargetIds.length ? studio.rejectTargetIds : studio.selectedIds);
        const error = studio.reject(targetIds, payload);
        if (error) throw new Error(error);
        studio.rejectOpen = false;
        return true;
      }
      throw new Error(`Unsupported form_submit for ${id}`);
  };

  (window as any).webmcp_form_cancel = (id: string) => {
     if (id === 'reject-seed' || id === 'batch-reject') { studio.rejectOpen = false; return true; }
     return false;
  };

  (window as any).webmcp_form_advance = (id: string, to: string) => {
     if (id === 'accept-for-authoring') {
       const ids = studio.selectedIds.length ? studio.selectedIds : (studio.activeSeed ? [studio.activeSeed.id] : []);
       return studio.accept(ids, ids.length === 1);
     }
     else if (id === 'undo-triage') { studio.undoTriage(); return true; }
     else if (id === 'mark-authored') { return studio.markAuthored(studio.activeSeed!); }
     throw new Error(`Unsupported form_advance for ${id}`);
  };

  (window as any).webmcp_form_return = (id: string, to: string) => {
     return true;
  };

  // command-session-v1
  (window as any).webmcp_session_start = (id: string) => {
    if (id === 'harvest-run') {
       studio.startHarvest(studio.activeSeed!); return true;
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
     if (format === 'package-manifest-json') studio.exportTab = 'manifest';
     else if (format === 'dataset-snapshot-json') studio.exportTab = 'snapshot';
     return true;
  };

  (window as any).webmcp_artifact_copy = async (id: string, artifact: string) => {
     if (!studio.activeSeed) throw new Error("No active seed");
     const text = artifact === 'commit-hash'
       ? studio.activeSeed.pinnedCommit
       : studio.preview(artifact === 'package-manifest-json' ? 'manifest' : 'snapshot');
     try {
       await navigator.clipboard.writeText(text);
     } catch {
       const area = document.createElement('textarea');
       area.value = text;
       area.style.position = 'fixed';
       area.style.opacity = '0';
       document.body.append(area);
       area.select();
       document.execCommand('copy');
       area.remove();
     }
     studio.showToast(artifact === 'commit-hash' ? 'Commit hash copied' : 'Artifact copied');
     studio.stampExport(artifact);
     return true;
  };

  (window as any).webmcp_artifact_import = (id: string, content: string) => {
     return studio.importPackage(content);
  };

  // The bundled stdio MCP bridge invokes tools exclusively through this entry
  // point (window.webmcp_invoke_tool(name, arguments)); it fans the named
  // arguments object out to the matching handler's positional parameters.
  (window as any).webmcp_invoke_tool = (name: string, args: Record<string, any> = {}) => {
    const argKeys = TOOL_ARG_KEYS[name];
    const handler = (window as any)[name];
    if (!argKeys || typeof handler !== 'function') throw new Error(`Unknown WebMCP tool: ${name}`);
    return handler(...argKeys.map((key) => args?.[key]));
  };
}
