import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
  },
});

const saveState = () => {
  try {
    if (typeof localStorage === 'undefined') return;
    const state = store.getState().app;
    const toSave = {
      boards: state.boards,
      activeBoardId: state.activeBoardId,
      canvasView: state.canvasView,
      viewMode: state.viewMode,
      stream: state.stream,
    };
    localStorage.setItem('scribblespace_state', JSON.stringify(toSave));
  } catch {
    // Persistence is best-effort; the app keeps working without it
  }
};

store.subscribe(saveState);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
