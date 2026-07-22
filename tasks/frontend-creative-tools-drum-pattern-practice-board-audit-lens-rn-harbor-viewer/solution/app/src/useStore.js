import { useSyncExternalStore } from 'react';
import { store } from './store.js';

export const useStore = () => {
  const state = useSyncExternalStore(store.subscribe, store.get);
  return { state, set: store.set, reset: store.reset, pushHistory: store.pushHistory, undo: store.undo };
};
