import { initialReducerState } from './fixture';

export function reducer(state, action) {
  // Push to history for mutations
  const pushHistory = (newState) => {
    const history = state.history.slice(0, state.historyIndex + 1);
    return { ...newState, history: [...history, newState], historyIndex: history.length };
  };

  switch (action.type) {
    case 'RESET':
      return { ...initialReducerState };

    case 'UPDATE_TASK_PRIORITY': {
      const newTasks = state.tasks.map(t =>
        t.id === action.taskId ? { ...t, urgency: action.urgency, importance: action.importance } : t
      );
      return pushHistory({ ...state, tasks: newTasks });
    }

    case 'PLACE_BLOCK': {
      const newBlocks = [...state.blocks, action.block];
      return pushHistory({ ...state, blocks: newBlocks });
    }

    case 'UPDATE_BLOCK': {
      const { blockId, updates, propagate } = action;
      let newBlocks = state.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b);

      if (propagate && state.propagationMode) {
        // Simple cascade handled outside
      }

      return pushHistory({ ...state, blocks: newBlocks });
    }

    case 'SET_BLOCKS': {
        return pushHistory({ ...state, blocks: action.blocks });
    }

    case 'REMOVE_BLOCK': {
      const newBlocks = state.blocks.filter(b => b.id !== action.blockId);
      return pushHistory({ ...state, blocks: newBlocks });
    }

    case 'SET_PROPAGATION_MODE':
      return { ...state, propagationMode: action.mode };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode };

    case 'LOG_INTERRUPTION': {
      const { blockId, category, lostMinutes, recovery } = action;
      const newInterruptions = [...state.focusState.interruptions, { blockId, category, lostMinutes, recovery }];
      let newBlocks = [...state.blocks];
      return pushHistory({
        ...state,
        focusState: { ...state.focusState, interruptions: newInterruptions },
        blocks: newBlocks
      });
    }

    case 'TICK_TIMER': {
      return {
        ...state,
        focusState: {
          ...state.focusState,
          elapsedMinutes: state.focusState.elapsedMinutes + action.minutes
        }
      };
    }

    case 'TOGGLE_TIMER': {
      return {
        ...state,
        focusState: {
          ...state.focusState,
          timerRunning: !state.focusState.timerRunning
        }
      };
    }

    case 'SET_FOCUS_BLOCK': {
        return {
            ...state,
            focusState: {
                ...state.focusState,
                activeBlockId: action.blockId,
                elapsedMinutes: 0,
                timerRunning: false
            }
        }
    }

    case 'ROLLOVER_ACTION': {
      const { taskId, decision } = action;
      let newRollover = state.rolloverTasks.filter(t => t.id !== taskId);
      let newTasks = [...state.tasks];
      if (decision === 'escalate') {
        const t = state.rolloverTasks.find(t => t.id === taskId);
        newTasks.push({ ...t, urgency: true, importance: true, splittable: false, deps: [], children: [] });
      }
      return pushHistory({ ...state, rolloverTasks: newRollover, tasks: newTasks });
    }

    case 'CREATE_CHECKPOINT': {
      const cp = { id: Date.now(), blocks: state.blocks, name: `Checkpoint ${state.checkpoints.length + 1}` };
      return { ...state, checkpoints: [...state.checkpoints, cp] };
    }

    case 'UNDO': {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        const previousState = state.history[newIndex];
        return { ...previousState, history: state.history, historyIndex: newIndex };
      }
      return state;
    }

    case 'REDO': {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        const nextState = state.history[newIndex];
        return { ...nextState, history: state.history, historyIndex: newIndex };
      }
      return state;
    }

    case 'IMPORT_STATE': {
      return pushHistory({ ...action.state });
    }

    case 'BULK_UPDATE': {
        return pushHistory({...state, ...action.updates});
    }

    default:
      return state;
  }
}
