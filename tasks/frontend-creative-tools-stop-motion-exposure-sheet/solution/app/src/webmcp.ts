import { useStore } from './store/useStore';

export function registerWebMCP() {
  if (typeof window === 'undefined') return;

  (window as any).webmcp_session_info = {
    name: "stop-motion-exposure-sheet",
    version: "1.0.0"
  };

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: "get_state",
        description: "Returns the complete deterministic project state including ranges, objects, cues, continuity facts, takes, captures, and approvals.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "set_frame",
        description: "Sets the current logical frame.",
        parameters: {
          type: "object",
          properties: {
            frame: { type: "number" }
          },
          required: ["frame"]
        }
      },
      {
        name: "update_range",
        description: "Updates an exposure range start/end frames.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            startFrame: { type: "number" },
            endFrame: { type: "number" },
            mode: { type: "string", enum: ["ripple", "overwrite"] }
          },
          required: ["id", "startFrame", "endFrame", "mode"]
        }
      },
      {
        name: "record_event",
        description: "Records a capture event on the logical clock.",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["capture", "retake", "mark-missing", "invalidate", "restore"] },
            frame: { type: "number" },
            takeId: { type: "string" }
          },
          required: ["type", "frame", "takeId"]
        }
      },
      {
        name: "approve_cut",
        description: "Approves the current cut revision.",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "reset_fixture",
        description: "Resets the project back to the initial deterministic fixture.",
        parameters: { type: "object", properties: {} }
      }
    ];
  };

  (window as any).webmcp_invoke_tool = async (tool_name: string, args: any) => {
    const store = useStore.getState();

    switch (tool_name) {
      case "get_state": {
        const { currentFrame, activeTakeId, onionSkinPrev, onionSkinNext, selectedRangeIds, selectedObjectIds, ...projectData } = store;
        return JSON.stringify(projectData);
      }
      case "set_frame": {
        store.setCurrentFrame(args.frame);
        return JSON.stringify({ success: true, frame: args.frame });
      }
      case "update_range": {
        store.updateRangeBounds(args.id, args.startFrame, args.endFrame, args.mode);
        return JSON.stringify({ success: true });
      }
      case "record_event": {
        store.recordEvent(args.type, args.frame, args.takeId);
        return JSON.stringify({ success: true });
      }
      case "approve_cut": {
        store.approveCut();
        return JSON.stringify({ success: true });
      }
      case "reset_fixture": {
        store.resetToFixture();
        return JSON.stringify({ success: true });
      }
      default:
        throw new Error(`Unknown tool: ${tool_name}`);
    }
  };
}
