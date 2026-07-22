import { state, moveCue, resizeCue, assignResource, connectTrigger, triggerContingencyBranch, saveCheckpoint, undo, redo } from './store';
import { startRehearsal, stopRehearsal, injectRehearsalDelay, startLiveShow, liveCallGo, liveCallHold, liveCallSkip, liveCallComplete } from './clock';
import { computeTimeline, deriveConflicts, computeProjectedEnd } from './analyzer';
import { generateRunSheetArtifact } from './export';

window.webmcp_session_info = () => ({ name: "Live Cue Run-Sheet Director", version: "1.0.0" });
window.webmcp_list_tools = () => ([
  { name: "get_state", description: "Gets the current planner state." },
  { name: "move_cue", description: "Moves a cue.", schema: { cueId: "string", newTime: "number", newLane: "string?" } },
  { name: "resize_cue", description: "Resizes a cue.", schema: { cueId: "string", newDuration: "number" } },
  { name: "assign_resource", description: "Assigns owner and resources to a cue.", schema: { cueId: "string", ownerId: "string", resourceIds: ["string"] } },
  { name: "connect_trigger", description: "Connects a dependency.", schema: { cueId: "string", type: "string", sourceCueId: "string", offset: "number" } },
  { name: "trigger_branch", description: "Activates a contingency branch.", schema: { groupId: "string", choice: "string" } },
  { name: "start_rehearsal", description: "Starts rehearsal.", schema: {} },
  { name: "inject_delay", description: "Injects delay in rehearsal.", schema: { seconds: "number" } },
  { name: "start_live", description: "Starts the live show.", schema: {} },
  { name: "call_go", description: "Issues GO for a cue in live mode.", schema: { cueId: "string" } },
  { name: "export_artifact", description: "Exports the JSON run-sheet artifact.", schema: {} },
  { name: "undo", description: "Undo last planning action.", schema: {} },
  { name: "redo", description: "Redo last undone planning action.", schema: {} }
]);
window.webmcp_invoke_tool = async (tool, args) => {
  try {
    switch (tool) {
      case "get_state": {
        const timeline = computeTimeline(state.cues, state.branchState);
        const conflicts = deriveConflicts(state.cues, state.resources, state.branchState);
        const projectedEnd = computeProjectedEnd(state.cues, state.branchState);
        return JSON.stringify({ cues: state.cues, branchState: state.branchState, timeline, conflicts, projectedEnd });
      }
      case "move_cue": moveCue(args.cueId, args.newTime, args.newLane); return JSON.stringify({ status: "success" });
      case "resize_cue": resizeCue(args.cueId, args.newDuration); return JSON.stringify({ status: "success" });
      case "assign_resource": assignResource(args.cueId, args.ownerId, args.resourceIds); return JSON.stringify({ status: "success" });
      case "connect_trigger": connectTrigger(args.cueId, args.type, args.sourceCueId, args.offset || 0); return JSON.stringify({ status: "success" });
      case "trigger_branch": triggerContingencyBranch(args.groupId, args.choice); return JSON.stringify({ status: "success" });
      case "start_rehearsal": startRehearsal(); return JSON.stringify({ status: "success" });
      case "inject_delay": injectRehearsalDelay(args.seconds); return JSON.stringify({ status: "success" });
      case "start_live": startLiveShow(); return JSON.stringify({ status: "success" });
      case "call_go": liveCallGo(args.cueId); return JSON.stringify({ status: "success" });
      case "export_artifact": return JSON.stringify(generateRunSheetArtifact());
      case "undo": undo(); return JSON.stringify({ status: "success" });
      case "redo": redo(); return JSON.stringify({ status: "success" });
      default: return JSON.stringify({ error: "Unknown tool" });
    }
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
};
