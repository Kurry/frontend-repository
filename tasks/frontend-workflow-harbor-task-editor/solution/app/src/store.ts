import { create } from 'zustand';
import { z } from 'zod';

export const WorkflowTaskEditorStateSchema = z.object({
  schemaVersion: z.literal("1.0"),
  exportedAt: z.string().optional(),
  taskSlug: z.string().min(1, "Task slug is required"),
  task: z.object({
    taskToml: z.string(),
    instructionMd: z.string(),
    rubricFiles: z.record(z.string()),
    solutionDescriptors: z.object({
      goldenPrompt: z.string().optional(),
      foils: z.string().optional()
    })
  }),
  editor: z.object({
    activeView: z.string(),
    validationReport: z.array(z.object({
      level: z.enum(["error", "warn", "info"]),
      message: z.string(),
      path: z.string()
    })),
    dirty: z.boolean(),
    generatedAt: z.string().optional()
  }),
  runs: z.array(z.any()).optional()
});

export type WorkflowTaskEditorState = z.infer<typeof WorkflowTaskEditorStateSchema>;

export type RunPhase = 'dispatch' | 'validation' | 'execution' | 'review' | 'finalized';
export type RunStatus = 'queued' | 'starting' | 'running' | 'awaiting_approval' | 'retrying' | 'streaming' | 'completed' | 'failed' | 'cancelled';

export type ToolEvent = {
  id: string;
  name: string;
  args: any;
  state: string;
  result?: any;
  error?: string;
  duration?: number;
  timestamp: string;
  requiresApproval?: boolean;
};

export type RunState = {
  runId: string;
  phase: RunPhase;
  status: RunStatus;
  attempt: number;
  toolEvents: ToolEvent[];
  checkpoints: { cursor: number; hash: string }[];
  streamText: string;
  finalOutput?: any;
  pendingApprovalEventId?: string | null;
};

export type GlobalState = {
  activeTaskId: string | null;
  editor: WorkflowTaskEditorState;
  runs: Record<string, RunState>;
  dispatchAction: (action: Action) => void;
};

export type Action =
  | { type: 'EDIT_FIELD'; path: string[]; value: any }
  | { type: 'RUN_VALIDATION' }
  | { type: 'IMPORT_STATE'; payload: WorkflowTaskEditorState }
  | { type: 'DISPATCH_RUN'; runId: string }
  | { type: 'ADD_TOOL_EVENT'; runId: string; event: ToolEvent }
  | { type: 'UPDATE_RUN_STATUS'; runId: string; status: RunStatus }
  | { type: 'APPROVE_EVENT'; runId: string; eventId: string }
  | { type: 'DENY_EVENT'; runId: string; eventId: string; reason: string }
  | { type: 'CANCEL_RUN'; runId: string }
  | { type: 'RETRY_RUN'; runId: string }
  | { type: 'RESUME_RUN'; runId: string };

const defaultEditorState: WorkflowTaskEditorState = {
  schemaVersion: "1.0",
  taskSlug: "frontend-workflow-workflow-task-editor",
  task: {
    taskToml: "",
    instructionMd: "",
    rubricFiles: {},
    solutionDescriptors: {}
  },
  editor: {
    activeView: "metadata",
    validationReport: [],
    dirty: false
  }
};

const reducer = (state: GlobalState, action: Action): GlobalState => {
  switch (action.type) {
    case 'EDIT_FIELD': {
      const newState = structuredClone(state);
      let current: any = newState.editor;
      for (let i = 0; i < action.path.length - 1; i++) {
        if (!current[action.path[i]]) current[action.path[i]] = {};
        current = current[action.path[i]];
      }
      current[action.path[action.path.length - 1]] = action.value;
      newState.editor.dirty = true;
      return newState;
    }
    case 'RUN_VALIDATION': {
      const report = [];
      if (!state.editor.taskSlug) report.push({ level: "error" as const, message: "Task slug is required", path: "taskSlug" });
      if (!state.editor.task.taskToml) report.push({ level: "error" as const, message: "task.toml is empty", path: "task.taskToml" });

      return {
        ...state,
        editor: {
          ...state.editor,
          validationReport: report
        }
      };
    }
    case 'IMPORT_STATE': {
      return {
        ...state,
        editor: action.payload,
        runs: action.payload.runs ? Object.fromEntries(action.payload.runs.map((r: any) => [r.runId, r])) : {}
      };
    }
    case 'DISPATCH_RUN': {
      return {
        ...state,
        runs: {
          ...state.runs,
          [action.runId]: {
            runId: action.runId,
            phase: 'execution',
            status: 'starting',
            attempt: 1,
            toolEvents: [],
            checkpoints: [],
            streamText: '',
            pendingApprovalEventId: null
          }
        }
      };
    }
    case 'ADD_TOOL_EVENT': {
      const run = state.runs[action.runId];
      if (!run) return state;
      if (run.toolEvents.some(e => e.id === action.event.id)) return state;

      const newEvents = [...run.toolEvents, action.event];
      let newStatus = run.status;
      let pendingId = run.pendingApprovalEventId;
      if (action.event.requiresApproval) {
        newStatus = 'awaiting_approval';
        pendingId = action.event.id;
      } else if (run.status === 'starting' || run.status === 'queued') {
        newStatus = 'running';
      }

      return {
        ...state,
        runs: {
          ...state.runs,
          [action.runId]: {
            ...run,
            toolEvents: newEvents,
            status: newStatus,
            pendingApprovalEventId: pendingId
          }
        }
      };
    }
    case 'UPDATE_RUN_STATUS': {
       const run = state.runs[action.runId];
       if (!run) return state;
       return {
         ...state,
         runs: { ...state.runs, [action.runId]: { ...run, status: action.status } }
       }
    }
    case 'APPROVE_EVENT': {
      const run = state.runs[action.runId];
      if (!run || run.pendingApprovalEventId !== action.eventId) return state;
      return {
        ...state,
        runs: {
          ...state.runs,
          [action.runId]: {
            ...run,
            status: 'running',
            pendingApprovalEventId: null,
            toolEvents: run.toolEvents.map(e => e.id === action.eventId ? { ...e, state: 'approved' } : e)
          }
        }
      };
    }
    case 'DENY_EVENT': {
      const run = state.runs[action.runId];
      if (!run || run.pendingApprovalEventId !== action.eventId) return state;
      return {
        ...state,
        runs: {
          ...state.runs,
          [action.runId]: {
            ...run,
            status: 'failed',
            pendingApprovalEventId: null,
            toolEvents: run.toolEvents.map(e => e.id === action.eventId ? { ...e, state: 'denied', error: action.reason } : e)
          }
        }
      };
    }
    case 'CANCEL_RUN': {
       const run = state.runs[action.runId];
       if (!run || ['completed', 'failed', 'cancelled', 'finalized'].includes(run.status)) return state;
       return {
         ...state,
         runs: {
           ...state.runs,
           [action.runId]: { ...run, status: 'cancelled' }
         }
       }
    }
    case 'RETRY_RUN': {
      const run = state.runs[action.runId];
      if (!run || run.status !== 'failed') return state;
      return {
        ...state,
        runs: {
          ...state.runs,
          [action.runId]: {
             ...run,
             attempt: run.attempt + 1,
             status: 'retrying',
             toolEvents: run.toolEvents.filter(e => e.state === 'completed' || e.state === 'approved')
          }
        }
      }
    }
    case 'RESUME_RUN': {
      const run = state.runs[action.runId];
      if (!run || run.status !== 'cancelled') return state;
      return {
        ...state,
        runs: {
          ...state.runs,
          [action.runId]: {
             ...run,
             status: 'running',
             toolEvents: run.toolEvents.filter(e => e.state === 'completed' || e.state === 'approved')
          }
        }
      }
    }
    default:
      return state;
  }
};

export const useStore = create<GlobalState>((set) => ({
  activeTaskId: null,
  editor: defaultEditorState,
  runs: {},
  dispatchAction: (action) => set((state) => reducer(state, action))
}));
