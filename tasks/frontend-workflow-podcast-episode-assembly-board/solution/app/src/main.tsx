import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useStore, LaneType, ApprovalCat, APPROVAL_CATS, Mode, LANES, cutChecksum, episodeEnd } from './store';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ---------------------------------------------------------------------------
// WebMCP contract (zto-webmcp-v1). Handlers call the same store actions as the
// visible UI controls.
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined') {
  (window as any).webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: ['entity-collection-v1', 'structured-editor-v1', 'command-session-v1', 'artifact-transfer-v1'],
  });

  const tools: [string, string, string][] = [
    ['entity.create', 'entity-collection-v1', 'Create a timeline clip instance from a bounded source in/out range (clip/timeline area).'],
    ['entity.select', 'entity-collection-v1', 'Select a timeline instance; the UI highlights its transcript, rights, waveform, and sibling instances.'],
    ['entity.update', 'entity-collection-v1', 'Update bounded instance fields: source-range, lane, episode-time, gain, fades (clip/timeline area).'],
    ['entity.delete', 'entity-collection-v1', 'Delete a timeline instance with explicit confirm=true; orphaned citations then block approval.'],
    ['entity.toggle', 'entity-collection-v1', 'Toggle transcript-inclusion for a token, citation binding, mute, or an approval-state category (transcript/citation and rights/approval areas).'],
    ['entity.reorder', 'entity-collection-v1', 'Ripple-move an instance by a bounded integer millisecond offset (episode times shift, source times stay).'],
    ['editor.select', 'structured-editor-v1', 'Select an editor object: timeline-instance, transcript-token, citation, narrative-block, automation-point, or branch-cut.'],
    ['editor.add', 'structured-editor-v1', 'Add a timeline instance, bound citation from the selected span, automation-point, or branch-cut (fork).'],
    ['editor.delete', 'structured-editor-v1', 'Delete a timeline instance or automation point (confirm=true required).'],
    ['editor.update_property', 'structured-editor-v1', 'Update declared properties: source-in, source-out, start-ms, duration-ms, lane, gain, fade, included, title, summary, approval — covering clip, transcript/citation, chapter (narrative-block), mix (automation-point), and rights/approval areas.'],
    ['editor.switch_mode', 'structured-editor-v1', 'Switch the workspace between sources, timeline, transcript, chapters, mix, rights, branches, and render modes.'],
    ['editor.preview', 'structured-editor-v1', 'Preview the current cut: checksum, episode duration, approval states, render outputs, and the recent history log (history area).'],
    ['session.start', 'command-session-v1', 'Start a declared demo: validation-run, render-run, or retry-failed-render.'],
    ['session.pause', 'command-session-v1', 'Pause is not available — deterministic fixture runs complete atomically.'],
    ['session.resume', 'command-session-v1', 'Resume is not available — deterministic fixture runs complete atomically.'],
    ['session.stop', 'command-session-v1', 'Stop is not available — deterministic fixture runs complete atomically.'],
    ['session.restart', 'command-session-v1', 'Restart / reset: return the whole workspace to its deterministic starter fixtures (reset area).'],
    ['session.advance', 'command-session-v1', 'Advance the render workflow: run the batch, or retry failed-only after a failed batch.'],
    ['artifact.export', 'artifact-transfer-v1', 'Export the episode package: canonical-json, edl-csv, transcript-csv, webvtt, rss-xml, show-notes-markdown, timeline-svg (transfer area).'],
    ['artifact.import', 'artifact-transfer-v1', 'Import canonical-json; invalid artifacts are rejected with offending fields named (transfer area).'],
    ['artifact.copy', 'artifact-transfer-v1', 'Regenerate artifacts for the visible copy workflow and report their sizes (transfer area).'],
  ];
  (window as any).webmcp_list_tools = () => tools.map(([name, module, description]) => ({ name, module, description }));

  const summary = () => {
    const s = useStore.getState();
    return {
      branch: s.branch,
      instances: s.instances.length,
      selected: s.selectedInstance,
      approvals: Object.fromEntries(APPROVAL_CATS.map(c => [c, s.approvals[c].status])),
      renderStatus: s.renderPipeline.status,
    };
  };

  (window as any).webmcp_invoke_tool = async (toolName: string, args: any = {}) => {
    const store = useStore.getState();
    try {
      switch (toolName) {
        case 'entity.create': {
          if (args.sourceId && Number.isInteger(args.sourceIn) && Number.isInteger(args.sourceOut)) {
            store.setSourceRange(String(args.sourceId), args.sourceIn, args.sourceOut);
          }
          const r = useStore.getState().insertInstance(String(args.sourceId), args.lane as LaneType | undefined, args.start !== undefined ? Number(args.start) : undefined);
          return r.ok ? { ok: true, operation: toolName, id: r.id, ...summary() } : { ok: false, error: r.error };
        }
        case 'entity.select':
        case 'editor.select': {
          if (args.object_type === 'transcript-token' || args.object_type === 'citation' || args.object_type === 'narrative-block' || args.object_type === 'automation-point' || args.object_type === 'branch-cut') {
            return { ok: true, operation: toolName, object_type: args.object_type, id: args.id };
          }
          const found = store.instances.some(i => i.id === args.id);
          if (found) store.selectInstance(String(args.id));
          return { ok: found, operation: toolName, id: args.id, error: found ? undefined : 'instance not found' };
        }
        case 'entity.update': {
          const inst = store.instances.find(i => i.id === args.id);
          if (!inst) return { ok: false, error: 'instance not found' };
          const patch: any = {};
          const u = args.updates ?? args;
          ['start', 'end', 'sourceStart', 'sourceEnd', 'gain', 'fadeIn', 'fadeOut'].forEach(f => {
            if (typeof u[f] === 'number') patch[f] = u[f];
          });
          if (typeof u.lane === 'string' && LANES.includes(u.lane)) patch.lane = u.lane;
          if (typeof u.mute === 'boolean') patch.mute = u.mute;
          if (typeof u.crossfade === 'boolean') patch.crossfade = u.crossfade;
          store.updateInstance(String(args.id), patch, 'webmcp-update');
          return { ok: true, operation: toolName, id: args.id };
        }
        case 'entity.delete':
        case 'editor.delete':
          if (args.confirm !== true) return { ok: false, error: 'confirm=true is required' };
          if (args.object_type === 'automation-point' && args.lane) {
            store.deleteAutomationPoint(args.lane, String(args.id));
            return { ok: true, operation: toolName, id: args.id };
          }
          if (!store.instances.some(i => i.id === args.id)) return { ok: false, error: 'instance not found' };
          store.deleteInstance(String(args.id));
          return { ok: true, operation: toolName, id: args.id };
        case 'entity.reorder': {
          if (!store.instances.some(i => i.id === args.id)) return { ok: false, error: 'instance not found' };
          const off = Math.max(-60000, Math.min(60000, Math.round(Number(args.offset) || 0)));
          store.rippleMove(String(args.id), off);
          return { ok: true, operation: toolName, id: args.id, offset: off };
        }
        case 'entity.toggle':
          if (args.field === 'transcript-inclusion' || args.field === 'included') {
            if (!useStore.getState().tokenState[String(args.id)]) return { ok: false, error: 'token not found' };
            store.toggleToken(String(args.id));
            return { ok: true, operation: toolName, field: 'transcript-inclusion', included: useStore.getState().tokenState[String(args.id)]?.included };
          }
          if (args.field === 'citation') { store.fixCitation(String(args.id)); return { ok: true, operation: toolName, field: 'citation' }; }
          if (args.field === 'mute') { store.toggleMuteInstance(String(args.id)); return { ok: true, operation: toolName, field: 'mute' }; }
          if (args.field === 'approval-state' || args.field === 'approval') {
            const cat = (args.category ?? 'master') as ApprovalCat;
            if (!APPROVAL_CATS.includes(cat)) return { ok: false, error: `unknown approval category ${args.category}` };
            const r = store.approveCategory(cat);
            return { ok: r.ok, operation: toolName, field: 'approval-state', category: cat, blockers: r.blockers };
          }
          return { ok: false, error: 'field must be transcript-inclusion, citation, mute, or approval-state' };
        case 'editor.add':
          if (args.object_type === 'branch-cut') { store.branchCut(typeof args.name === 'string' ? args.name : undefined); return { ok: true, operation: toolName, branch: useStore.getState().branch }; }
          if (args.object_type === 'automation-point') { store.addAutomationPoint((args.lane ?? 'dialogue') as LaneType); return { ok: true, operation: toolName }; }
          if (args.object_type === 'citation') { const r = store.bindSpan(); return { ok: r.ok, operation: toolName, error: r.error }; }
          {
            const r = store.insertInstance(String(args.sourceId), args.lane as LaneType | undefined, args.start !== undefined ? Number(args.start) : undefined);
            return r.ok ? { ok: true, operation: toolName, id: r.id } : { ok: false, error: r.error };
          }
        case 'editor.update_property': {
          const prop = String(args.property ?? '');
          const id = String(args.id ?? '');
          if (args.object_type === 'narrative-block' || prop === 'title' || prop === 'summary') {
            if (!store.chapters.some(c => c.id === id)) return { ok: false, error: 'narrative block not found' };
            if (prop !== 'title' && prop !== 'summary') return { ok: false, error: 'chapter properties are title and summary' };
            store.updateChapter(id, { [prop]: String(args.value) } as any);
            return { ok: true, operation: toolName, id, property: prop };
          }
          if (args.object_type === 'automation-point') {
            store.setAutomationPoint((args.lane ?? 'dialogue') as LaneType, id, Number(args.t ?? args.value?.t ?? 0), Number(args.v ?? args.value?.v ?? -16));
            return { ok: true, operation: toolName, id, property: prop };
          }
          if (args.object_type === 'transcript-token' || prop === 'included') {
            const st = useStore.getState().tokenState[id];
            if (!st) return { ok: false, error: 'token not found' };
            if (Boolean(args.value) !== st.included) store.toggleToken(id);
            return { ok: true, operation: toolName, id, property: 'included' };
          }
          if (prop === 'approval') {
            const r = store.approveCategory(String(args.value) as ApprovalCat);
            return { ok: r.ok, operation: toolName, blockers: r.blockers };
          }
          const map: Record<string, string> = { 'source-in': 'sourceStart', 'source-out': 'sourceEnd', 'start-ms': 'start', lane: 'lane', gain: 'gain', fade: 'fadeIn' };
          const inst = store.instances.find(i => i.id === id);
          if (!inst) return { ok: false, error: 'instance not found' };
          if (prop === 'duration-ms') { store.updateInstance(id, { end: inst.start + Math.max(10, Math.round(Number(args.value))) }, 'webmcp-duration'); return { ok: true, operation: toolName, id, property: prop }; }
          const field = map[prop];
          if (!field) return { ok: false, error: `unknown property ${prop}` };
          store.updateInstance(id, { [field]: field === 'lane' ? args.value : Number(args.value) } as any, 'webmcp-property');
          return { ok: true, operation: toolName, id, property: prop };
        }
        case 'editor.switch_mode': {
          const mode = String(args.mode ?? '') as Mode;
          const valid: Mode[] = ['sources', 'timeline', 'transcript', 'chapters', 'mix', 'rights', 'branches', 'render', 'export'];
          if (!valid.includes(mode)) return { ok: false, error: `mode must be one of ${valid.join(', ')}` };
          store.setMode(mode);
          return { ok: true, operation: toolName, mode };
        }
        case 'editor.preview': {
          const s = useStore.getState();
          return {
            ok: true,
            operation: toolName,
            checksum: cutChecksum(s),
            durationMs: episodeEnd(s.instances),
            history: s.history.slice(0, 10),
            ...summary(),
          };
        }
        case 'session.start': {
          const demo = String(args.demo ?? 'validation-run');
          if (demo === 'render-run') { const r = store.startRender(); return { ok: r.ok, operation: toolName, demo, error: r.error, renderStatus: useStore.getState().renderPipeline.status }; }
          if (demo === 'retry-failed-render') { const r = store.retryFailed(); return { ok: r.ok, operation: toolName, demo, error: r.error, renderStatus: useStore.getState().renderPipeline.status }; }
          store.setMode('mix');
          store.log('validation-run', 'Validation run opened via WebMCP — findings recompute from live state');
          return { ok: true, operation: toolName, demo: 'validation-run' };
        }
        case 'session.restart':
          store.resetAll();
          return { ok: true, operation: toolName, ...summary() };
        case 'session.advance': {
          const s2 = useStore.getState();
          const r = s2.renderPipeline.status === 'failed' ? s2.retryFailed() : s2.startRender();
          return { ok: r.ok, operation: toolName, error: r.error, renderStatus: useStore.getState().renderPipeline.status };
        }
        case 'session.pause':
        case 'session.resume':
        case 'session.stop':
          return { ok: false, operation: toolName, error: 'Deterministic fixture runs complete atomically' };
        case 'artifact.export':
        case 'artifact.copy': {
          store.setMode('export');
          store.generateExport();
          const outs = useStore.getState().exportOutputs;
          const format = String(args.format ?? 'canonical-json');
          if (!outs[format]) return { ok: false, error: `unknown format ${format}; formats: ${Object.keys(outs).join(', ')}` };
          return { ok: true, operation: toolName, format, bytes: outs[format].length, formats: Object.fromEntries(Object.entries(outs).map(([k, v]) => [k, v.length])) };
        }
        case 'artifact.import': {
          if ((args.mode ?? 'canonical-json') !== 'canonical-json' || typeof args.data !== 'string') {
            return { ok: false, error: 'mode canonical-json and string data are required' };
          }
          store.setMode('export');
          const r = store.importData(args.data);
          return { ok: r.ok, operation: toolName, errors: r.errors };
        }
        default:
          return { ok: false, error: `Tool not found: ${toolName}` };
      }
    } catch (e: any) {
      return { ok: false, error: e?.message ?? String(e) };
    }
  };
}
