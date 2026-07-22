import { createStore } from './store-utils';
import type { WorkTask, TimelineEvent, SessionArtifact, RecordStatus } from './types';
import { formatISO, subDays, subHours } from 'date-fns';

const generateSeedData = () => {
  const records: WorkTask[] = [];
  const history: TimelineEvent[] = [];
  const now = new Date();

  // Create 100+ records
  for (let i = 1; i <= 105; i++) {
    const status: RecordStatus =
      i % 4 === 0 ? 'draft' : i % 4 === 1 ? 'ready' : i % 4 === 2 ? 'changed' : 'archived';

    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (i % 3 === 0) priority = 'low';
    if (i % 5 === 0) priority = 'high';

    const record: WorkTask = {
      id: `task-${i}`,
      title: `Garden Task ${i}`,
      status,
      description: `Description for task ${i}. Needs attention in the community garden.`,
      estimatedHours: (i % 8) + 1,
      priority,
    };

    records.push(record);

    // Initial creation history
    history.push({
      id: `evt-${i}-create`,
      taskId: record.id,
      timestamp: formatISO(subDays(now, (i % 30) + 1)),
      mutationType: 'create',
      previousState: null,
      newState: { ...record, status: 'draft' }, // Assuming everything started as draft
    });

    // If it's not draft, add an update event
    if (status !== 'draft') {
      history.push({
        id: `evt-${i}-update`,
        taskId: record.id,
        timestamp: formatISO(subHours(now, i)),
        mutationType: 'update',
        previousState: { ...record, status: 'draft' },
        newState: { ...record },
      });
    }
  }

  // Include some boundary and empty states
  records.push({
    id: `task-106-empty-desc`,
    title: `Task with empty description`,
    status: 'draft',
    description: ``,
    estimatedHours: 0.5,
    priority: 'low',
  });

  // Conflict state representation (e.g. status changed but not properly updated in UI - resolved via scrub)
  records.push({
    id: `task-107-conflict`,
    title: `Conflicting Task`,
    status: 'changed',
    description: `This task has conflicting state.`,
    estimatedHours: 4,
    priority: 'high',
  });

  return { records, history };
};

const initialData = generateSeedData();

export interface AppState {
  records: WorkTask[];
  history: TimelineEvent[];
  selectedTaskId: string | null;
  activeTimelineEventId: string | null;
  filterStatus: RecordStatus | 'all';
}

export const initialState: AppState = {
  records: initialData.records,
  history: initialData.history,
  selectedTaskId: null,
  activeTimelineEventId: null,
  filterStatus: 'all',
};

// Simple global state using custom hook pattern
let state = { ...initialState };
const listeners = new Set<() => void>();

export const getSnapshot = () => state;

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const updateState = (updater: (prev: AppState) => AppState) => {
  state = updater(state);
  listeners.forEach(l => l());
};

export const setStateDirectly = (newState: AppState) => {
  state = newState;
  listeners.forEach(l => l());
}
