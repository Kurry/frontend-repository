import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    return true;
  },
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    localStorage.setItem('themeStudio_themes', JSON.stringify(state.theme.themes));
    localStorage.setItem('themeStudio_activeId', state.theme.activeId);
  }
});

export const store = configureStore({
  reducer: {
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
